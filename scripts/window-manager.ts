import { XP_API } from "./api";
import { showContextMenu } from "./compfwk";

export default class WindowManager {
    public windows: Window[];
    public activeWindowId: string | null;
    public baseZIndex: number;

    constructor() {
        this.windows = [];
        this.activeWindowId = null;
        this.baseZIndex = 100;

        // Disable default context menu
        document.oncontextmenu = (ev) => ev.preventDefault();
    }

    create(options: WindowOptions) {
        options.wm = this;
        const win = new Window(options);
        this.windows.push(win);
        win.focus();
        
        // Close start menu when a new window is created
        var startMenu = document.getElementById('start-menu');
        if (startMenu && startMenu.classList.contains('open')) {
            startMenu.classList.remove('open');
        }
        
        return win;
    }

    getById(id: string) {
        for (let i = 0; i < this.windows.length; i++) {
            if (this.windows[i].id === id)
                return this.windows[i];
        }

        return null;
    }
    
    public updateTaskbar() {
        const taskItems = document.getElementById('task-items');
        if (!taskItems)
            return;
        taskItems.innerHTML = "";
        this.windows.forEach((win) => {
            if (win.isDialog)
                return;
            const item = document.createElement('div');
            item.className = 'task-item';
            if (win.id === this.activeWindowId && !win.isMinimized)
                item.classList.add('active');
            item.innerText = win.title;
            
            XP_API.showTooltip(item, { text: win.title });

            item.oncontextmenu = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                showContextMenu(ev.clientX, ev.clientY, [
                    { text: "Restore", action: () => win.restore() },
                    { text: "Minimize", action: () => win.minimize() },
                    { text: "Maximize", action: () => win.maximize() },
                    { separator: true },
                    { text: "Close", action: () => win.close() },
                ]);
            };

            item.onclick = () => {
                if (win.isMinimized) {
                    win.restore();
                } else if (win.id === this.activeWindowId) {
                    win.minimize();
                } else {
                    win.focus();
                }
            };

            taskItems.appendChild(item);
        });
    }
}

export interface WindowOptions {
    title?: string;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    isDialog?: boolean;
    type?: WindowType;
    parent?: Window;
    resizable?: boolean;
    onClose?: Function;
    content?: string | Node;
    wm?: WindowManager;
}

export type WindowType = "normal" | "modal" | "sub" | "topmodal";

export class Window {
    public wm: WindowManager;
    public id: string;
    public title: string;
    public width: number;
    public height: number;
    public x: number;
    public y: number;
    public isDialog: boolean;
    public type: WindowType;
    public parent?: Window;
    public resizable: boolean;
    public isMinimized: boolean;
    public isMaximized: boolean;
    public onClose?: Function;//TODO: introduce proper cb type
    public prevRect: { x: number; y: number; width: number; height: number; } | null;
    public overlay?: HTMLDivElement;
    public modalOverlay?: HTMLDivElement;
    public element: HTMLDivElement;

    constructor(options: WindowOptions) {
        if (!options.wm)
            throw new Error("Cannot create window without Window Mgr");
        this.wm = options.wm;
        this.id = 'win-' + Math.random().toString(36).substr(2, 9);
        this.title = options.title || 'New Window';
        this.width = options.width || 400;
        this.height = options.height || 300;
        this.x = options.x || (50 + this.wm.windows.length * 20);
        this.y = options.y || (50 + this.wm.windows.length * 20);
        this.isDialog = !!options.isDialog;
        this.type = options.type || 'normal'; // normal, modal, sub, topmodal
        this.parent = options.parent;
        this.resizable = !!options.resizable;
        this.isMinimized = false;
        this.isMaximized = false;
        this.onClose = options.onClose;
        this.prevRect = null;

        if (this.type === 'topmodal') {
            this._createOverlay();
        } else if (this.type === 'modal' && this.parent) {
            this._createModalOverlay();
        }

        this.element = this._createUI(options.content || "");
        this._initEvents();
    }

    _createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = this.id + '-overlay';
        overlay.className = 'topmodal-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0,0,0,0.5)';
        overlay.style.zIndex = '15000';
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    _createModalOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(255,255,255,0.2)';
        overlay.style.zIndex = '1000';
        if (!this.parent) {
            console.warn("No parent", this);
            return;
        }
        if (!this.parent.element) {
            console.warn("No parent element", this);
            return;
        }
        const wc = this.parent.element.querySelector('.window-content')
        if (!wc) {
            console.warn("No parent window content");
            return;
        }
        wc.appendChild(overlay);
        this.modalOverlay = overlay;
    }

    _createUI(content: string | Node) {
        const win = document.createElement('div');
        win.id = this.id;
        win.className = 'window' + (this.isDialog ? ' dialog' : '');
        win.style.width = this.width + 'px';
        win.style.height = this.height + 'px';
        win.style.left = this.x + 'px';
        win.style.top = this.y + 'px';

        const titlebar = document.createElement('div');
        titlebar.className = 'window-titlebar';
        titlebar.oncontextmenu = (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            showContextMenu(ev.clientX, ev.clientY, [
                { text: 'Restore', action: () => { this.restore(); } },
                { text: 'Minimize', action: () => { this.minimize(); } },
                { text: 'Maximize', action: () => { this.maximize(); } },
                { separator: true },
                { text: 'Close', action: () => { this.close(); } }
            ]);
        }

        const title = document.createElement('div');
        title.className = 'window-title';
        title.innerText = this.title;
        
        const controls = document.createElement('div');
        controls.className = 'window-controls';

        if (!this.isDialog) {
            const minBtn = document.createElement('div');
            minBtn.className = 'window-btn';
            minBtn.innerText = '_';
            minBtn.onclick = (ev) => { ev.stopPropagation(); this.minimize(); };
            controls.appendChild(minBtn);

            const maxBtn = document.createElement('div');
            maxBtn.className = 'window-btn';
            maxBtn.innerText = '□';
            maxBtn.onclick = (ev) => { ev.stopPropagation(); this.maximize(); };
            controls.appendChild(maxBtn);
        }
        
        const closeBtn = document.createElement('div');
        closeBtn.className = 'window-btn close';
        closeBtn.innerText = 'X';
        closeBtn.onclick = (ev) => { ev.stopPropagation(); this.close(); };
        controls.appendChild(closeBtn);
        
        titlebar.appendChild(title);
        titlebar.appendChild(controls);
        
        const contentArea = document.createElement('div');
        contentArea.className = 'window-content';
        if (content) {
            if (typeof content === 'string') {
                contentArea.innerHTML = content;
            } else {
                contentArea.appendChild(content);
            }
        }

        win.appendChild(titlebar);
        win.appendChild(contentArea);
        
        if (this.resizable) {
            var resizeHandle = document.createElement('div');
            resizeHandle.className = 'window-resize-handle';
            resizeHandle.style.position = 'absolute';
            resizeHandle.style.right = '0';
            resizeHandle.style.bottom = '0';
            resizeHandle.style.width = '10px';
            resizeHandle.style.height = '10px';
            resizeHandle.style.cursor = 'nwse-resize';
            
            resizeHandle.onpointerdown = (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                const startWidth = this.width;
                const startHeight = this.height;
                const startX = ev.clientX;
                const startY = ev.clientY;
                
                const onMouseMove = (ev: PointerEvent) => {
                    this.width = startWidth + (ev.clientX - startX);
                    this.height = startHeight + (ev.clientY - startY);
                    this.element.style.width = this.width + 'px';
                    this.element.style.height = this.height + 'px';
                };
                
                var onMouseUp = function() {
                    document.removeEventListener("pointermove", onMouseMove);
                    document.removeEventListener("pointerup", onMouseUp);
                };
                
                document.addEventListener("pointermove", onMouseMove);
                document.addEventListener("pointerup", onMouseUp);
            };
            win.appendChild(resizeHandle);
        }

        // TODO: fix later
        document.getElementById("desktop")!.appendChild(win);
        return win;
    }

    _initEvents() {
        const titlebar = this.element.querySelector('.window-titlebar') as HTMLElement | null;
        if (!titlebar)
            throw new Error("Cannot find window titlebar");
        let isDragging = false;
        let offsetX = 0, offsetY = 0;

        titlebar.onpointerdown = (ev) => {
            this.focus();
            if (this.isMaximized) return;
            isDragging = true;
            offsetX = ev.clientX - this.element.offsetLeft;
            offsetY = ev.clientY - this.element.offsetTop;
        };

        document.addEventListener("pointermove", (e) => {
            if (isDragging) {
                this.x = e.clientX - offsetX;
                this.y = e.clientY - offsetY;
                this.element.style.left = this.x + 'px';
                this.element.style.top = this.y + 'px';
            }
        });

        document.addEventListener("pointerup", () => {
            isDragging = false;
        });
    }

    focus() { // TODO: MOVE TO WINDOW MANAGER?
        var self = this;
        // Move to end of array (top of stack)
        this.wm.windows = this.wm.windows.filter((w) => { return w.id !== self.id; });
        this.wm.windows.push(this);
        
        // Update Z-indices and active state
        this.wm.windows.forEach((w, idx) => {
            let z = this.wm.baseZIndex + (idx * 10); // Use step of 10 to allow overlays in between
            if (w.type === 'topmodal') z += 50000;
            w.element.style.zIndex = z + "";
            w.element.classList.remove('active');
            
            if (w.overlay) w.overlay.style.zIndex = z - 1 + "";
            if (w.modalOverlay) w.modalOverlay.style.zIndex = z - 1 + "";
        });

        this.element.classList.add('active');
        this.element.style.display = 'flex';
        this.isMinimized = false;
        this.wm.activeWindowId = this.id;
        this.wm.updateTaskbar();
    }

    minimize() {
        this.element.style.display = 'none';
        this.isMinimized = true;
        this.element.classList.remove('active');
        
        // Focus next window in stack if this was active
        if (this.wm.activeWindowId === this.id) {
            this.wm.activeWindowId = null;
            var visibleWindows = this.wm.windows.filter((w) => !w.isMinimized);
            if (visibleWindows.length > 0) {
                visibleWindows[visibleWindows.length - 1].focus();
            }
        }
        this.wm.updateTaskbar();
    }

    maximize() {
        if (this.isMaximized) {
            this.restore();
            return;
        }
        this.prevRect = {
            width: this.width,
            height: this.height,
            x: this.x,
            y: this.y
        };
        this.isMaximized = true;
        this.element.style.width = '100%';
        this.element.style.height = 'calc(100% - 30px)';
        this.element.style.left = '0';
        this.element.style.top = '0';
        this.element.classList.add('maximized');
    }

    restore() {
        if (this.isMinimized) {
            this.element.style.display = 'flex';
            this.isMinimized = false;
            this.focus();
        } else if (this.isMaximized) {
            this.isMaximized = false;
            if (!this.prevRect)
                throw new Error("Unable to restore window");
            this.width = this.prevRect.width;
            this.height = this.prevRect.height;
            this.x = this.prevRect.x;
            this.y = this.prevRect.y;
            this.element.style.width = this.width + 'px';
            this.element.style.height = this.height + 'px';
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
            this.element.classList.remove('maximized');
        }
        this.wm.updateTaskbar();
    }

    setContent(content: string | HTMLElement) {
        const contentArea = this.element.querySelector('.window-content');
        if (!contentArea)
            throw new Error("Can't set content");
        contentArea.innerHTML = '';
        if (typeof content === 'string') {
            contentArea.innerHTML = content;
        } else {
            contentArea.appendChild(content);
        }
    }

    setTitle(title: string) {
        this.title = title;
        const wt = this.element.querySelector('.window-title') as HTMLElement | null;
        if (!wt)
            throw new Error("Cannot update window titlebar title");
        wt.innerText = title;
        this.wm.updateTaskbar();
    }

    close() {
        if (this.onClose) this.onClose();
        if (this.overlay) this.overlay.remove();
        if (this.modalOverlay) this.modalOverlay.remove();
        this.element.remove();
        this.wm.windows = this.wm.windows.filter((w) => w.id !== this.id);
        
        if (this.wm.activeWindowId === this.id) {
            this.wm.activeWindowId = null;
            var visibleWindows = this.wm.windows.filter((w) => !w.isMinimized);
            if (visibleWindows.length > 0) {
                visibleWindows[visibleWindows.length - 1].focus();
            }
        }
        this.wm.updateTaskbar();
    }
}