import { FSFileNode, VFS } from "./vfs";
import { createElement, CreateElementOptions, MenuItem, showContextMenu } from "./compfwk";
import WindowManager from "./core/wm/WindowManager"
import Window, { WindowOptions } from "./core/wm/Window";
import { ADR } from "./adr";
import { FCCF } from "./compfwk";
import ISystemAPI from "./core/ISystemAPI";

/* Desktop & Window API (ES5) */
export type XpUserPrivilege = "admin" | "user" | "guest";
export interface XpUser {
    username: string;
    passwordHash: string;
    privilege: XpUserPrivilege;
    avatar?: string;
}
export interface BalloonTipOptions {
    title?: string;
    message: string;
    timeout?: number;
}
export interface TooltipOptions {
    text: string;
    icon?: string;
    enabled?: boolean;
}
export interface ITrayIconOptions {
	icon: string;
	title: string;
	tooltip?: TooltipOptions;
	onClick?: () => void;
}
export interface IDialogOptions {
	icon?: string;
	message?: string;
	type?: "prompt" | "error" | "confirm" | "warning";
	defaultValue?: string;
	multiSelect?: string[];
	items?: (string | HTMLElement)[];
	dropdown?: string[];
	onDropdownChange?: (value: string) => void;
	showProgress?: boolean;
	progress?: number;
	setProgress?: (progress: number) => void;
	controls?: Node[];
	okText?: string;
	onOk?: (result: string | boolean) => void;
	showCancel?: boolean;
	cancelText?: string;
	onCancel?: () => void;
	title?: string;
	width?: number;
	height?: number;
	modal?: boolean;
	topmodal?: boolean;
	parent?: Window;
	resizable?: boolean;
}
export interface IInstallerOptions {
	steps: {
		title?: string;
		content?: string | Function | Node;
	}[];
	onFinish?: () => void;
	onCancel?: () => void;
	title?: string;
	width?: number;
	height?: number;
	modal?: boolean;
}

export const XP_API: ISystemAPI = (function() {
    const trayIcons = [];
    const wm = new WindowManager();
    let currentUser: XpUser | null = null;

    return {
        hash: (str: string) => {
            var h = 0;
            for (var i = 0; i < str.length; i++) {
                h = ((h << 5) - h) + str.charCodeAt(i);
                h |= 0;
            }
            return (h >>> 0).toString(16);
        },
        Auth: {
            currentUser: null,
            login: (username: string, password: string) => {
                const users = XP_API.Registry.get("Security/Users") as Record<string, XpUser>;
                const user = users[username];
                if (!user)
                    return false;
                
                const pwdHash = password ? XP_API.hash(password) : '';
                // Special case for hardcoded hashes in VFS if I didn't update them correctly
                // Administrator: 12345678 -> 25d55ad283aa400af464c76d713c07ad (MD5)
                // User: 1234 -> 81dc9bdb52d04dc20036dbd8313ed055 (MD5)
                // My simple hash for 1234 is "1a0022", for 12345678 is "2f6a666"
                // I will allow both for now or just update VFS
                
                if (user.passwordHash === pwdHash || (username === "Guest" && user.passwordHash === '')) {
                    currentUser = user;
                    XP_API.Registry.set("Security/CurrentSession", username);
                    return true;
                }

                return false;
            },
            logout: () => {
                currentUser = null;
                XP_API.Registry.set("Security/CurrentSession", null);
                location.reload();
            },
            getCurrentUser: () => {
                if (!currentUser) {
                    const session = XP_API.Registry.get<string>("Security/CurrentSession");
                    if (session) {
                        const users = XP_API.Registry.get<Record<string, XpUser>>('Security/Users');
                        if (!users) {
                            throw new Error("Registry Corruption! Users could not be enumerated");
                        }
                        currentUser = users[session];
                    }
                }
                return currentUser;
            }
        },
        UAC: {
            checkPrivilege: (required: XpUserPrivilege) => {
                const user = XP_API.Auth.getCurrentUser();
                if (!user)
                    return false;
                if (user.privilege === "admin")
                    return true;
                if (required === "user" && user.privilege === "user") return true;
                return false;
            },
            requestEscalation: (callback: (result: boolean) => void) => {
                if (XP_API.UAC.checkPrivilege("admin")) {
                    callback(true);
                    return;
                }

                // Dim overlay
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.background = 'rgba(0,0,0,0.5)';
                overlay.style.zIndex = '9999';
                document.body.appendChild(overlay);

                const container = XP_API.createElement({
                    tag: "div",
                    style: {
                        padding: '20px',
                        background: '#f0f0f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '15px',
                        height: '100%',
                        boxSizing: 'border-box'
                    }
                });
                container.innerHTML = 
                    '<div style="display:flex;gap:15px;align-items:center;">' +
                        '<img src="https://img.icons8.com/color/48/000000/shield.png" style="width:48px;height:48px;" referrerPolicy="no-referrer">' +
                        '<div>' +
                            '<div style="font-weight:bold;font-size:14px;color:#003399;">User Account Control</div>' +
                            '<div style="font-size:12px;">An unidentified program wants access to your computer.</div>' +
                        '</div>' +
                    '</div>' +
                    '<div style="background:white;padding:10px;border:1px solid #ccc;font-size:11px;color:#333;">' +
                        'To continue, type an administrator password, and then click OK.' +
                    '</div>';

                const users = XP_API.Registry.get<Record<string, XpUser>>('Security/Users');
                if (!users)
                    throw new Error("Corrupted registry, no users present");
                const admins: XpUser[] = [];
                for (const u in users)
                    if (users[u].privilege === 'admin')
                        admins.push(users[u]);

                const select = XP_API.createElement({
                    tag: 'select',
                    style: {
                        width: '100%',
                        padding: '2px',
                        border: '1px solid #7f9db9'
                    }
                });
                admins.forEach((a) => {
                    const opt = document.createElement('option');
                    opt.value = a.username;
                    opt.innerText = a.username;
                    select.appendChild(opt);
                });
                container.appendChild(select);

                const pwdInput = XP_API.createElement({ tag: 'input', type: 'password', style: { width: '100%', padding: '2px', border: '1px solid #7f9db9' }, placeholder: 'Password' });
                container.appendChild(pwdInput);

                const btnGroup = XP_API.createElement({ tag: "div", style: { display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: 'auto' } });
                const okBtn = XP_API.createElement({ tag: 'button', innerText: 'OK', className: 'xp-button', style: { padding: '2px 20px' } });
                const cancelBtn = XP_API.createElement({ tag: 'button', innerText: 'Cancel', className: 'xp-button', style: { padding: '2px 20px' } });
                
                let winId: string;
                const cleanup = () => {
                    overlay.remove();
                    XP_API.closeWindow(winId);
                };

                okBtn.onclick = () => {
                    const admin = users[select.value];
                    if (admin.passwordHash === XP_API.hash(pwdInput.value)) {
                        cleanup();
                        callback(true);
                    } else {
                        XP_API.showDialog({
                            title: "UAC",
                            message: "Incorrect password.",
                            type: "error"
                        });
                    }
                };
                cancelBtn.onclick = () => {
                    cleanup();
                    callback(false);
                };

                btnGroup.appendChild(okBtn);
                btnGroup.appendChild(cancelBtn);
                container.appendChild(btnGroup);

                winId = XP_API.createWindow({
                    title: "User Account Control",
                    width: 400,
                    height: 320,
                    isDialog: true,
                    content: container
                });
                
                // Ensure UAC is above overlay
                const winEl = document.getElementById(winId);
                if (winEl)
                    winEl.style.zIndex = "10000";

                setTimeout(() => pwdInput.focus(), 100);
            }
        },
        FS: {
            checkAccess: (path: string, operation: "read" | "write"): boolean => {
                const user = XP_API.Auth.getCurrentUser();
                if (!user)
                    return false;
                if (user.privilege === "admin")
                    return true;

                const stat = VFS.stat(path);
                if (!stat) {
                    // Check parent for create
                    const parts = path.split('/').filter(function(p) { return p.length > 0; });
                    parts.pop();
                    const parentPath = parts.join('/');
                    return XP_API.FS.checkAccess(parentPath, "write");
                }

                const st = stat as FSFileNode;
                if (st.metadata && st.metadata.owner) {
                    if (st.metadata.owner === user.username) return true;
                    // Simple permission check: 600 (owner only), 644 (owner write, all read)
                    const perms = st.metadata.permissions || "644";

                    if (operation === "read") return !!(perms[1] >= "4" || perms[2] >= "4");
                    if (operation === "write") return !!(perms[1] >= "6" || perms[2] >= "6");
                }

                // System paths protection
                /*
                if (path.indexOf("C:/System") === 0 || path.indexOf("C:/Apps") === 0) {
                    return user.privilege === "admin";
                }
                */

                return true;
            },
            readFile: (path: string) => {
                if (XP_API.FS.checkAccess(path, "read"))
                    return VFS.readFile(path);
                XP_API.showDialog({
                    title: "Access Denied",
                    message: "You do not have permission to read this file."
                });
                return null;
            },
            writeFile: (path: string, content: string) => {
                if (XP_API.FS.checkAccess(path, "write"))
                    return VFS.writeFile(path, content);
                XP_API.showDialog({
                    title: "Access Denied",
                    message: "You do not have permission to write to this file."
                });
                return false;
            },
            delete: (path: string) => {
                if (XP_API.FS.checkAccess(path, "write"))
                    return VFS.delete(path);
                XP_API.showDialog({
                    title: "Access Denied",
                    message: "You do not have permission to delete this file."
                });
                return false;
            },
            ls: (path: string) => {
                if (XP_API.FS.checkAccess(path, "read"))
                    return VFS.ls(path);
                return null;
            }
        },
        createElement: <T extends keyof HTMLElementTagNameMap>(options: CreateElementOptions<T>) => {
            return createElement(options);
        },
        exec: (path: string, args?: unknown): boolean => {
            // Handle .lnk files explicitly
            if (path.endsWith(".lnk")) {
                const stat = VFS.stat(path);
                if (stat && (stat as FSFileNode).isLink) {
                    const st = stat as FSFileNode;
                    try {
                        const linkData = JSON.parse(st.content);
                        return XP_API.exec(linkData.app, [linkData.args]);
                    } catch (e) {
                        console.error("Failed to parse link:", path, e);
                    }
                }
            }

            const filename = path.slice(path.lastIndexOf("/") + 1);

            // Handle file associations
            handleExtension: if (filename.includes(".")) {
                const ext = filename.split(".").pop()?.toLowerCase();
                if (!ext)
                    break handleExtension;
                const associations = XP_API.Registry.get<Record<string, string>>("System/Associations");
                if (associations && associations[ext]) {
                    const app = associations[ext];
                    if (app === "ADR") {
                        ADR.load(path, args);
                    } else {
                        // If it's an app name, load it with the file as argument
                        /** @ts-ignore */
                        ADR.load(app, [path, ...(args || [])]);
                    }
                    return true;
                }
            }
            
            // Default: Use ADR for direct app execution
            ADR.load(path, args);
            return true;
        },
        getSCT: <T>() => {
            return XP_API.Registry.get<T>("System");
        },
        setSCT: <T>(data: T) => {
            return XP_API.Registry.set("System", data);
        },
        getIconCache: (): Record<string, string> => {
            const data = VFS.readFile("C:/System/icache.json");
            return data ? JSON.parse(data) : {};
        },
        setIconCache: (data: Record<string, string>) => {
            return VFS.writeFile("C:/System/icache.json", JSON.stringify(data));
        },
        getIcon: (path: string) => {
            const cache = XP_API.getIconCache();
            if (cache[path])
                return cache[path];
            
            const stat = VFS.stat(path);
            if (!stat)
                return 'https://img.icons8.com/color/48/000000/file.png';

            let iconUrl = 'https://img.icons8.com/color/48/000000/file.png';
            if (stat.type === "dir") {
                iconUrl = 'https://img.icons8.com/color/48/000000/folder-invoices.png';
            } else {
                const ext = path.split('.').pop()?.toLowerCase() || "";
                const associations = XP_API.Registry.get<Record<string, string>>("System/Associations");
                if (associations && associations[ext]) {
                    // Try to get icon from association
                    const app = associations[ext];
                    if (app === 'notepad') iconUrl = 'https://img.icons8.com/color/48/000000/notepad.png';
                    else if (app === 'calc') iconUrl = 'https://img.icons8.com/color/48/000000/calculator.png';
                    else if (app === 'paint') iconUrl = 'https://img.icons8.com/color/48/000000/paint-palette.png';
                    else if (app === 'cmd') iconUrl = 'https://img.icons8.com/color/48/000000/console.png';
                    else if (app === 'ADR') iconUrl = 'https://img.icons8.com/color/48/000000/shield.png';
                }
                
                // Specific overrides
                if (ext === "lnk") {
                    if (path.indexOf('My Computer') !== -1) iconUrl = 'https://img.icons8.com/color/48/000000/monitor.png';
                    else if (path.indexOf('Notepad') !== -1) iconUrl = 'https://img.icons8.com/color/48/000000/notepad.png';
                    else if (path.indexOf('Command Prompt') !== -1) iconUrl = 'https://img.icons8.com/color/48/000000/console.png';
                }
            }
            
            cache[path] = iconUrl;
            XP_API.setIconCache(cache);
            return iconUrl;
        },
        Registry: (() => {
            const registryPath = "C:/System/sysconf.json";
            
            const load = (): unknown => {
                const data = VFS.readFile(registryPath);
                if (!data) {
                    // Fallback if VFS initialization failed
                    const initial = {
                        System: { 
                            Version: '1.0.0', 
                            Owner: 'User', 
                            Theme: 'Luna', 
                            Wallpaper: 'https://picsum.photos/seed/xp/1920/1080',
                            Associations: {
                                'txt': 'notepad',
                                'js': 'ADR',
                                'lnk': 'shell',
                                'bmp': 'paint',
                                'png': 'paint',
                                'jpg': 'paint'
                            }
                        },
                        Apps: { Notepad: {}, Explorer: {} }
                    };
                    VFS.writeFile(registryPath, JSON.stringify(initial));
                    return initial;
                }

                return JSON.parse(data);
            };

            const save = (data: unknown) => {
                return VFS.writeFile(registryPath, JSON.stringify(data));
            };

            return {
                get: <T>(path: string) => {
                    const data = load();
                    const parts = path.split('/').filter(p => p.length > 0);
                    let current = data;
                    for (let i = 0; i < parts.length; i++) {
                        if (!current || typeof current !== "object")
                            return null;
                        const currObj = current as Record<string, unknown>;
                        if (currObj[parts[i]] !== undefined) {
                            current = currObj[parts[i]];
                        } else {
                            return null;
                        }
                    }
                    return current as T;
                },
                set: <T>(path: string, value: T) => {
                    const data = load();
                    const parts = path.split('/').filter(p => p.length > 0);
                    let current = data;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (!current || typeof current !== "object")
                            return;
                        const currObj = current as Record<string, unknown>;
                        currObj[parts[i]] = {};

                        current = currObj[parts[i]];
                    }
                    (current as Record<string, unknown>)[parts[parts.length - 1]] = value;
                    save(data);
                },
                delete: (path: string) => {
                    const data = load();
                    const parts = path.split('/').filter(p => p.length > 0);
                    let current = data;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (!current || typeof current !== "object")
                            return false;
                        const currObj = current as Record<string, unknown>;
                        if (currObj[parts[i]] === undefined)
                            return false;
                        current = currObj[parts[i]];
                    }
                    const res = delete (current as Record<string, unknown>)[parts[parts.length - 1]];
                    save(data);
                    return res;
                },
                getAll: () => {
                    return load();
                }
            };
        })(),
        createWindow: (options: WindowOptions) => {
            const win = wm.create(options);
            return win.id;
        },
        closeWindow: (id: string) => {
            const win = wm.getById(id);
            if (win)
                win.close();
        },
        focusWindow: (id: string) => {
            const win = wm.getById(id);
            if (win)
                win.focus();
        },
        setWindowContent: (id: string, content: string | HTMLElement) => {
            const win = wm.getById(id);
            if (win)
                win.setContent(content);
        },
        setWindowTitle: (id: string, title: string) => {
            const win = wm.getById(id);
            if (win)
                win.setTitle(title);
        },
        updateTaskbar: () => {
            wm.updateTaskbar();
        },
        addTrayIcon (options: ITrayIconOptions) {
            const tray = document.getElementById("system-tray");
            if (!tray)
                throw new Error("System tray not found");
            const clock = document.getElementById("clock");
            if (!clock)
                throw new Error("Systray Clock not found");
            const icon = document.createElement("img");
            icon.src = options.icon;
            icon.title = options.title;
            icon.className = 'tray-icon';
            icon.style.width = '16px';
            icon.style.height = '16px';
            icon.style.marginRight = '5px';
            icon.referrerPolicy = 'no-referrer';
            if (options.tooltip)
                this.showTooltip(icon, options.tooltip);
            if (options.onClick)
                icon.onclick = () => options.onClick?.();
            
            // Fix: Ensure we insert before the clock safely
            if (clock && clock.parentNode === tray) {
                tray.insertBefore(icon, clock);
            } else {
                tray.appendChild(icon);
            }
            trayIcons.push(options);

            return {
                showBalloon: (options: BalloonTipOptions) => {
                    XP_API.showBalloonTip(icon, options);
                },
            };
        },
        showBalloonTip: (target: HTMLImageElement, options: BalloonTipOptions) => {
            const tip = document.createElement('div');
            tip.className = 'balloon-tip';
            
            const close = document.createElement('div');
            close.className = 'balloon-close';
            close.innerText = 'X';
            close.onclick = () => tip.remove();
            
            const title = document.createElement('div');
            title.className = 'balloon-title';
            title.innerText = options.title || 'Notification';
            
            const content = document.createElement('div');
            content.className = 'balloon-content';
            content.innerText = options.message;
            
            tip.appendChild(close);
            tip.appendChild(title);
            tip.appendChild(content);
            
            document.body.appendChild(tip);
            
            const rect = target.getBoundingClientRect();
            tip.style.left = (rect.left - 200) + 'px';
            tip.style.top = (rect.top - 80) + 'px';
            
            if (options.timeout !== 0) {
                setTimeout(() => {
                    if (tip.parentNode)
                        tip.remove();
                    },
                    options.timeout || 5000
                );
            }
        },
        showTooltip: (target: HTMLElement, options: TooltipOptions) => {
            if (!options || !options.text || options.enabled === false) return;


            const removeTooltip = () => {
                const existing = document.querySelector('.xp-tooltip');
                if (existing)
                    existing.remove();
            }

            const move = (ev: PointerEvent) => {
                let tooltip = document.querySelector('.xp-tooltip') as HTMLElement;
                if (!tooltip) {
                    tooltip = document.createElement('div');
                    tooltip.className = 'xp-tooltip';
                    if (options.icon) {
                        var img = document.createElement('img');
                        img.src = options.icon;
                        img.style.width = '16px';
                        img.style.height = '16px';
                        img.referrerPolicy = 'no-referrer';
                        tooltip.appendChild(img);
                    }
                    var text = document.createElement('span');
                    text.innerText = options.text;
                    tooltip.appendChild(text);
                    document.body.appendChild(tooltip);
                }

                let left = (ev.clientX + 10);
                let top = (ev.clientY + 10);

                const clipRight = window.innerWidth - left - tooltip.offsetWidth < 0;
                const clipBottom = window.innerHeight - top - tooltip.offsetHeight < 0;

                if (clipRight) {
                    left -= 14 + tooltip.offsetWidth;
                }
                if (clipBottom) {
                    top -= 14 + tooltip.offsetHeight;
                }

                tooltip.style.left = left + "px";
                tooltip.style.top = top + "px";
            }
            
            target.addEventListener("pointerenter", removeTooltip);
            target.addEventListener("pointermove", move);
            target.addEventListener("mouseleave", removeTooltip);
            // Global cleanup on click
            document.addEventListener("pointerdown", removeTooltip);
        },

        showDialog: (options: IDialogOptions) => {
            const container = document.createElement('div');
            container.style.padding = '15px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '15px';
            container.style.background = '#f0f0f0';
            container.style.height = '100%';
            container.style.boxSizing = 'border-box';

            const topPart = document.createElement('div');
            topPart.style.display = 'flex';
            topPart.style.gap = '15px';
            topPart.style.alignItems = 'flex-start';
            
            let iconUrl = options.icon;
            if (!iconUrl) {
                iconUrl = 'https://img.icons8.com/color/48/000000/info.png';
                if (options.type === 'error') iconUrl = 'https://img.icons8.com/color/48/000000/error.png';
                if (options.type === 'confirm') iconUrl = 'https://img.icons8.com/color/48/000000/help.png';
                if (options.type === 'warning') iconUrl = 'https://img.icons8.com/color/48/000000/warning-shield.png';
            }
            
            const icon = document.createElement('img');
            icon.src = iconUrl;
            icon.style.width = '32px';
            icon.style.height = '32px';
            icon.referrerPolicy = 'no-referrer';
            topPart.appendChild(icon);

            const msg = document.createElement('div');
            msg.style.fontSize = '12px';
            msg.style.flex = '1';
            msg.style.color = '#333';
            msg.innerText = options.message || '';
            topPart.appendChild(msg);
            
            container.appendChild(topPart);

            let input: HTMLInputElement | null = null;
            if (options.type === "prompt") {
                input = FCCF.Controls.Input({
                    value: options.defaultValue || '',
                    style: { width: "100%" }
                });
                container.appendChild(input!);
            }

            if (options.multiSelect) {
                const list = FCCF.Controls.List({
                    items: options.items || [],
                    style: { height: '100px', background: 'white', border: '1px solid #7f9db9' },
                    onItemClick: (item) => {
                        // Handle multi-select logic if needed
                        void item;
                    }
                });
                container.appendChild(list.el);
            }

            if (options.dropdown) {
                const dropdown = FCCF.Controls.Dropdown({
                    items: options.items || [],
                    style: { width: '100%' },
                    onChange: options.onDropdownChange
                });
                container.appendChild(dropdown);
            }

            if (options.showProgress) {
                const progress = FCCF.Controls.ProgressBar({ value: options.progress || 0 });
                container.appendChild(progress.el);
                options.setProgress = progress.setProgress;
            }

            if (options.controls) {
                options.controls.forEach((ctrl) => {
                    container.appendChild(ctrl);
                });
            }

            const btnContainer = document.createElement('div');
            btnContainer.style.display = 'flex';
            btnContainer.style.gap = '10px';
            btnContainer.style.justifyContent = 'center';
            btnContainer.style.marginTop = 'auto';
            container.appendChild(btnContainer);

            let win: Window;

            const okBtn = document.createElement('button');
            okBtn.innerText = options.okText || 'OK';
            okBtn.className = 'xp-button';
            okBtn.style.minWidth = '75px';
            okBtn.onclick = () => {
                if (options.onOk)
                    options.onOk(options.type === 'prompt' ? input?.value || "" : true);
                win.close();
            };
            btnContainer.appendChild(okBtn);

            if (options.type === 'confirm' || options.type === 'prompt' || options.showCancel) {
                var cancelBtn = document.createElement('button');
                cancelBtn.innerText = options.cancelText || 'Cancel';
                cancelBtn.className = 'xp-button';
                cancelBtn.style.minWidth = '75px';
                cancelBtn.onclick = () => {
                    if (options.onCancel) options.onCancel();
                    win.close();
                };
                btnContainer.appendChild(cancelBtn);
            }

            win = wm.create({
                title: options.title || 'System Message',
                width: options.width || 350,
                height: options.height || (options.controls || options.multiSelect || options.dropdown ? 300 : (options.type === 'prompt' ? 180 : 150)),
                isDialog: true,
                content: container,
                type: options.modal ? 'modal' : (options.topmodal ? 'topmodal' : 'normal'),
                parent: options.parent,
                resizable: !!options.resizable
            });
            
            if (input)
                setTimeout(() => input.focus(), 100);
            return win;
        },
        showContextMenu: (x: number, y: number, items: MenuItem[]) => {
            showContextMenu(x, y, items);
        },
        showInstaller: (options: IInstallerOptions) => {
            let winId: string;
            const installer = FCCF.Controls.Installer({
                steps: options.steps,
                onFinish: () => {
                    if (options.onFinish) options.onFinish();
                    XP_API.closeWindow(winId);
                },
                onCancel: () => {
                    if (options.onCancel) options.onCancel();
                    XP_API.closeWindow(winId);
                }
            });
            
            winId = XP_API.createWindow({
                title: options.title || 'Setup',
                width: options.width || 500,
                height: options.height || 400,
                isDialog: true,
                content: installer,
                type: options.modal ? 'modal' : 'normal'
            });
            return winId;
        }
    };
})();
