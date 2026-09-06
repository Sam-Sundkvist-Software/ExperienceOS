import { legacySystemApi, XpUser, XpUserPrivilege } from "../../api";
import { showContextMenu } from "../../compfwk";
import { IRegistry } from "../Registry";
import IWindowHost, { WindowState } from "./IWindowHost";
import Window, { WindowOptions } from "./Window";

export default class WindowManager implements IWindowHost {
	private static _windowCounter: number = 0;

	private _rootElement: HTMLElement;
	private _reg: IRegistry;

	private _activeWindowId: number;

	public windows: Window[];
	public activeWindowId: string | null;
	public baseZIndex: number;

	public constructor(rootElement: HTMLElement, reg: IRegistry) {
		this._rootElement = rootElement;
		this._reg = reg;
		this._activeWindowId = -1;
		this.windows = [];
		this.activeWindowId = null;
		this.baseZIndex = 100;

		// Disable default context menu
		document.oncontextmenu = (ev) => ev.preventDefault();
	}

	public setupShell() {
		this._setupShell();
	}

	public openWindow(options: WindowOptions): Window {
		return this.create(options);
	}

	public setWindowPosition(window: Window, x: number, y: number): void {
		window.x = x;
		window.y = y;
		window.element.style.left = x + "px";
		window.element.style.top = y + "px";
	}

	public setWindowSize(window: Window, width: number, height: number): void {
		window.width = width;
		window.height = height;
		window.element.style.width = width + "px";
		window.element.style.height = height + "px";
	}

	public setWindowState(window: Window, state: WindowState): void {
		switch (state) {
			case WindowState.MINIMIZED:
				window.minimize();
				break;
			case WindowState.MAXIMIZED:
				window.maximize();
				break;
			case WindowState.NORMAL:
				window.restore();
				break;
			case WindowState.FULLSCREEN:
			default:
				break;
		}
	}

	public setWindowVisibility(window: Window, value: boolean): void {
		window.visible = value;
		if (value) {
			window.element.style.display = "flex";
		} else {
			window.element.style.display = "none";
		}
		// Hide taskbar button (if applicable right now)
		this.updateTaskbar();
	}

	public closeWindow(window: Window): void {
		if (typeof window.onClose === "function")
			window.onClose();
		if (window.overlay)
			window.overlay.remove();
		if (window.modalOverlay)
			window.modalOverlay.remove();
		window.element.remove();
		
		const idxOf = this.windows.indexOf(window);
		if (idxOf !== -1) {
			this.windows.splice(idxOf, 1);
		}

		if (this._activeWindowId === window.id && this.windows.length > 0)
			this._activeWindowId = this.windows[this.windows.length - 1]!.id; // always works, and correctly sets itself to -1 if no other windows present, which is never true unless the desktop is fecked.
		
		this.updateTaskbar();
	}

	public getCascadedPosition(): { x: number; y: number; } {
		const p = (50 + this.windows.length * 20);
		return {
			x: p,
			y: p,
		};
	}

	public focusWindow(window: Window): void {
		// Move to end of array (top of stack)
		const windowIndex = this.windows.indexOf(window);
		this.windows.splice(windowIndex, 1);
		this.windows.push(window);
		this._updateZIndices();
		window.element.classList.add("active");
		window.element.style.display = "flex";
		window.isMinimized = false;
		this._activeWindowId = window.id;
		this.updateTaskbar();
	}

	public minimizeWindow(window: Window): void {
		window.element.style.display = "none";
		window.isMinimized = true;
		window.element.classList.remove('active');
		
		// Focus next window in stack if this was active
		this._updateZIndices();
		this.updateTaskbar();
	}

	public maximizeWindow(window: Window): void {
		if (window.isMaximized) {
			this.restoreWindow(window);
			return;
		}

		window.prevRect = {
			width: window.width,
			height: window.height,
			x: window.x,
			y: window.y
		};

		window.isMaximized = true;
		window.element.style.width = "100%";
		window.element.style.height = "calc(100% - 30px)";
		window.element.style.left = "0";
		window.element.style.top = "0";
		window.element.classList.add("maximized");
	}

	public restoreWindow(window: Window): void {
		if (window.isMinimized) {
			window.element.style.display = "flex";
			window.isMinimized = false;
			this.focusWindow(window);
		} else if (window.isMaximized) {
			window.isMaximized = false;
			if (!window.prevRect)
				throw new Error("Unable to restore window");
			window.width = window.prevRect.width;
			window.height = window.prevRect.height;
			window.x = window.prevRect.x;
			window.y = window.prevRect.y;
			window.element.style.width = window.width + "px";
			window.element.style.height = window.height + "px";
			window.element.style.left = window.x + "px";
			window.element.style.top = window.y + "px";
			window.element.classList.remove("maximized");
		}
		this.updateTaskbar();
	}

	public create(options: WindowOptions) {
		options.wh = this;
		const win = new Window(options);
		win.id = this._generateWindowId();
		this.windows.push(win);
		this.focusWindow(win);
		
		// Close start menu when a new window is created
		// TODO: WHY???
		// LEGACY CODE
		// REMOVE WHEN POSSIBLE
		var startMenu = document.getElementById('start-menu');
		if (startMenu && startMenu.classList.contains('open')) {
			startMenu.classList.remove('open');
		}
		
		return win;
	}

	public getById(id: number) {
		for (let i = 0; i < this.windows.length; i++) {
			if (this.windows[i]!.id === id)
				return this.windows[i];
		}

		return null;
	}
	
	public updateTaskbar() {
		const taskItems = document.getElementById("task-items");
		if (!taskItems)
			return;
		taskItems.innerHTML = "";
		this.windows.forEach((win) => {
			if (win.isDialog)
				return;
			const item = document.createElement("div");
			item.className = 'task-item';
			if (win.id === this._activeWindowId && !win.isMinimized)
				item.classList.add("active");
			item.innerText = win.title;
			
			// TODO: Implement tooltips into WM
			// to remove the need for external dep.
			//XP_API.showTooltip(item, { text: win.title });

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
				} else if (win.id === this._activeWindowId) {
					win.minimize();
				} else {
					win.focus();
				}
			};

			taskItems.appendChild(item);
		});
	}

	private _shell: {
		desktopElement: HTMLElement;
		desktopIconsElement: HTMLElement;
		startMenuElement: HTMLElement;
		taskbarElement: HTMLElement;
	} | undefined;

	private _setupShell() {
		const desktopFragment = document.createDocumentFragment();

		const desktopElement = document.createElement("div");
		desktopElement.id = "desktop";
		desktopElement.className = "desktop";

		const desktopIconsElement = document.createElement("div");
		desktopIconsElement.id = "desktop-icons";
		desktopIconsElement.className = "desktop-icons";

		desktopElement.appendChild(desktopIconsElement);

		const startMenuElement = document.createElement("div");
		startMenuElement.id = "start-menu";
		startMenuElement.className = "start-menu";
		startMenuElement.innerHTML = `
			<div id="start-header">
				<img src="https://picsum.photos/seed/user/40/40" alt="User" referrerPolicy="no-referrer">
				<span>Administrator</span>
			</div>
			<div id="start-body">
				<div id="start-left">
					<!-- Pinned apps -->
				</div>
				<div id="start-right">
					<div class="start-item">My Documents</div>
					<div class="start-item">My Pictures</div>
					<div class="start-item">My Music</div>
					<hr>
					<div class="start-item">My Computer</div>
					<div class="start-item">Control Panel</div>
				</div>
			</div>
			<div id="start-footer">
				<div class="footer-btn">Log Off</div>
				<div class="footer-btn">Turn Off Computer</div>
			</div>
		`;

		desktopElement.appendChild(startMenuElement);

		const taskbarElement = document.createElement("div");
		taskbarElement.id = "taskbar"
		taskbarElement.className = "taskbar";
		taskbarElement.innerHTML = `
			<button id="start-button" class="start-button">start</button>
			<div id="task-items"></div>
			<div id="system-tray">
				<span id="clock">00:00 AM</span>
			</div>
		`;

		desktopElement.appendChild(taskbarElement);

		desktopFragment.appendChild(desktopElement);

		this._shell = {
			desktopElement,
			desktopIconsElement,
			startMenuElement,
			taskbarElement,
		};
		
		this._rootElement.appendChild(desktopFragment);
		this._initDesktop();
	}

	private _createStartMenu() {

	}

	private _initDesktop() {
		const shell = this._shell;

		if (!shell)
			throw new Error("Shell not initialized successfully.");

		// Load SCT Settings
		const sct = legacySystemApi.getSCT<Record<string, unknown>>();
		if (!sct)
			throw new Error("SCT not available");

		const wallpaperRegKey = "Shell/Wallpaper";
		let wallpaper: string;
		if (this._reg.nodeExists(wallpaperRegKey))
			wallpaper = this._reg.getNodeValue(wallpaperRegKey);
		else
			wallpaper = "about:blank";

		shell.desktopElement.style.backgroundImage = `url(${wallpaper})`;

		const taskbarHeightRegKey = "Shell/TaskbarHeight";
		let taskbarHeight: number;
		if (this._reg.nodeExists(taskbarHeightRegKey))
			taskbarHeight = this._reg.getNodeValue(taskbarHeightRegKey);
		else
			taskbarHeight = 30;
		
		shell.taskbarElement.style.height = `${taskbarHeight}px`;

		function applyTheme(themeName: string) {
			const themes: Record<string, { primary: string, light: string, dark: string, inactive: string }> = {
				"Luna": { primary: '#0054e3', light: '#0058e6', dark: '#00309c', inactive: '#9db9eb' },
				"Olive": { primary: '#738a5d', light: '#8ea375', dark: '#5a6b48', inactive: '#c5d0b9' },
				"Silver": { primary: '#a0a0a0', light: '#b0b0b0', dark: '#808080', inactive: '#d0d0d0' }
			};
			const t = themes[themeName] || themes['Luna']!;
			document.documentElement.style.setProperty("--xp-blue", t.primary);
			document.documentElement.style.setProperty("--xp-blue-light", t.light);
			document.documentElement.style.setProperty("--xp-blue-dark", t.dark);
			document.documentElement.style.setProperty("--xp-inactive", t.inactive);

			shell!.taskbarElement.style.backgroundImage = `linear-gradient(to bottom, ${t.light} 0%, ${t.primary} 100%)`;
			(shell!.taskbarElement.querySelector(".start-button") as HTMLElement).style.backgroundImage = `linear-gradient(to bottom, #388e3c 0%, #4caf50 100%)`;
		}

		const themeRegKey = "Shell/Theme";
		let theme: string;
		if (this._reg.nodeExists(themeRegKey))
			theme = this._reg.getNodeValue(themeRegKey);
		else
			theme = "Luna";

		applyTheme(theme);
	
		(window as any)["restartExplorer"] = () => {
			const sct = legacySystemApi.getSCT<Record<string, unknown>>();
			if (!sct)
				throw new Error("SCT not available");
			if (sct["Wallpaper"]) {
				document.getElementById('desktop')!.style.backgroundImage = 'url(' + sct["Wallpaper"] + ')';
			}
			if (sct["Theme"]) {
				(window as any)["applyTheme"]?.(sct["Theme"]);
			}
			if (sct["TaskbarSize"]) {
				document.getElementById('taskbar')!.style.height = sct["TaskbarSize"] + 'px';
			}
			updateClock(); // This will respect ShowClock
			(window as any)["renderDesktop"]?.(); // TODO: find method
			legacySystemApi.updateTaskbar();
			legacySystemApi.showDialog({ title: 'System', message: 'Explorer has been restarted.' });
		};
	
		// Clock update
		function updateClock() {
			//const showClock = legacySystemApi.Registry.get<boolean>('System/ShowClock');
			const showClock = true;
			const clockEl = document.getElementById('clock')!;

			if (!showClock) {
				clockEl.style.display = 'none';
				return;
			}
			
			clockEl.style.display = 'block';
			
			const now = new Date();
			let hours = now.getHours();
			let minutes: number | string = now.getMinutes();
			const ampm = hours >= 12 ? 'PM' : 'AM';
			hours = hours % 12;
			hours = hours ? hours : 12;
			minutes = minutes < 10 ? '0' + minutes : minutes;
			document.getElementById('clock')!.innerText = hours + ':' + minutes + ' ' + ampm;
		}
		setInterval(updateClock, 1000);
		updateClock();
	
		// Disable default context menu globally
		document.addEventListener('contextmenu', (e) => {
			if ((e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
				e.preventDefault();
			}
		});
	
		// Start Menu Toggle
		var startBtn = document.getElementById('start-button');
		var startMenu = document.getElementById('start-menu');
	
		startBtn!.onclick = (ev) => {
			ev.stopPropagation();
			startMenu!.classList.toggle('open');
		};
	
		document.onclick = () => {
			startMenu!.classList.remove('open');
		};
	
		startMenu!.onclick = (ev) => {
			ev.stopPropagation();
		};
	
		// Desktop Icons (Dynamic from VFS)
		(window as any)["renderDesktop"] = () => {
			legacySystemApi.exec('explorer', { mode: 'desktop' });
		};
		(window as any)["renderDesktop"]();

		const desktop = document.querySelector("#desktop");

		if (!desktop || !(desktop instanceof HTMLElement))
			throw new Error("Desktop could not be found or it was invalid.");
	
		// Desktop Context Menu
		desktop.oncontextmenu = (ev) => {
			if (ev.target !== desktop)
				return;
			ev.preventDefault();
			ev.stopPropagation();
			legacySystemApi.showContextMenu(ev.clientX, ev.clientY, [
				{ text: 'Arrange Icons By', menu: [
					{ text: 'Name' },
					{ text: 'Size' },
					{ text: 'Type' },
					{ text: 'Modified' }
				]},
				{ text: 'Refresh', action: function() { (window as any)["renderDesktop"](); } },
				{ separator: true },
				{ text: 'Paste', action: function() { legacySystemApi.showDialog({ message: 'Nothing to paste.' }); } },
				{ text: 'Paste Shortcut' },
				{ separator: true },
				{ text: 'New', menu: [
					{ text: 'Folder', action: function() { legacySystemApi.FS.mkdir('C:/Desktop/New Folder');(window as any)["renderDesktop"](); } },
					{ text: 'Shortcut' },
					{ text: 'Text Document', action: function() { legacySystemApi.FS.writeFile('C:/Desktop/New Text Document.txt', ''); (window as any)["renderDesktop"](); } }
				]},
				{ separator: true },
				{ text: 'Properties', action: function() { legacySystemApi.exec('displayProperties'); } }
			]);
		};
	
		// Antivirus Tray Icon
		var avIcon = legacySystemApi.addTrayIcon({
			title: 'CentralFirm Antivirus',
			icon: 'https://img.icons8.com/color/48/000000/shield.png',
			tooltip: {
				icon: "https://img.icons8.com/color/48/000000/shield.png",
				text: "CentralFirm Antivirus",
			},
			onClick: () => {
				legacySystemApi.exec('antivirus');
			}
		});
	
		setTimeout(() => {
			avIcon.showBalloon({
				title: 'CentralFirm Antivirus',
				message: 'Your computer is protected. No threats found.'
			});
		}, 2000);
		const currentUser: XpUser = {
			username: "__DEBUG",
			passwordHash: "",
			privilege: XpUserPrivilege.ADMIN,
		};
	
		// Start Menu Header
		const startHeader = document.getElementById('start-header')!;
		startHeader.innerHTML = '<img src="' + currentUser.avatar + '" referrerPolicy="no-referrer"><span>' + currentUser.username + '</span>';
	
		// Start Menu Items (from C:/StartMenu)
		const startLeft = document.getElementById('start-left')!;
		startLeft.innerHTML = '';
		var startMenuItems = legacySystemApi.FS.ls('C:/StartMenu');
		if (startMenuItems)
			startMenuItems.forEach(function(item) {
				var path = 'C:/StartMenu/' + item;
				var stat = legacySystemApi.FS.stat(path);
				var iconUrl = legacySystemApi.getIcon(path);
				
				var div = legacySystemApi.createElement({
					tag: "div",
					className: 'start-item',
					innerHTML: '<img src="' + iconUrl + '" referrerPolicy="no-referrer"><span>' + item.replace('.lnk', '') + '</span>',
					onClick: () => {
						legacySystemApi.exec(path);
						startMenu!.classList.remove('open');
					}
				});
				startLeft.appendChild(div);
			});
	
		// Right side items
		const startRight = document.getElementById('start-right')!;
		startRight.innerHTML = '';
		const rightItems = [
			{ name: 'My Documents', action: function() { legacySystemApi.exec('explorer', ['C:/Documents']); } },
			{ name: 'My Pictures', action: function() { legacySystemApi.showDialog({ message: 'My Pictures is empty.' }); } },
			{ name: 'My Music', action: function() { legacySystemApi.showDialog({ message: 'My Music is empty.' }); } },
			{ separator: true },
			{ name: 'My Computer', action: function() { legacySystemApi.exec('explorer', ['C:']); } },
			{ name: 'Control Panel', action: function() { legacySystemApi.exec('control'); } }
		];
	
		rightItems.forEach((item) => {
			if (item.separator) {
				startRight.appendChild(legacySystemApi.createElement({ tag: 'hr' }));
				return;
			}
			var div = legacySystemApi.createElement({
				tag: "div",
				className: 'start-item',
				innerText: item.name,
				onClick: function() {
					item.action?.();
					startMenu!.classList.remove('open');
				}
			});
			startRight.appendChild(div);
		});
	
		var runItem = legacySystemApi.createElement({
			tag: "div",
			className: 'start-item',
			innerHTML: '<img src="https://img.icons8.com/color/48/000000/run-command.png" style="width:24px;height:24px;" referrerPolicy="no-referrer"><span>Run...</span>',
			onClick: () => {
				startMenu!.classList.remove('open');
				legacySystemApi.showDialog({
					type: 'prompt',
					title: 'Run',
					message: 'Type the name of a program, folder, document, or Internet resource, and ExperienceOS will open it for you.',
					onOk: (cmd) => {
						if (cmd) {
							if ((cmd as string).indexOf('C:/') === 0) {
								legacySystemApi.exec(cmd as string);
							} else {
								legacySystemApi.exec('C:/Apps/' + cmd + '.js');
							}
						}
					}
				});
			}
		});
		startRight.appendChild(legacySystemApi.createElement({ tag: 'hr' }));
		startRight.appendChild(runItem);
	
		// Footer buttons
		var footerBtns = document.querySelectorAll('#start-footer .footer-btn') as NodeListOf<HTMLElement>;
		footerBtns[0]!.onclick = () => { 
			legacySystemApi.showDialog({ 
				type: 'confirm', 
				message: 'Are you sure you want to log off?', 
				onOk: function() { legacySystemApi.Auth.logout(); } 
			}); 
		};
		footerBtns[1]!.onclick = () => {
			legacySystemApi.showDialog({ 
				type: 'confirm', 
				message: 'Turn off computer?', 
				onOk: function() { document.body.innerHTML = '<div style="background:black;color:white;height:100vh;display:flex;align-items:center;justify-content:center;font-family:Tahoma;">It is now safe to turn off your computer.</div>'; } 
			}); 
		};
	
		console.log('XP Retro Desktop Initialized for ' + currentUser.username);
	}

	private _updateZIndices(): void {
		this.windows.forEach((w, idx) => {
			let z = 100 + idx;
			w.element.style.zIndex = z.toString();
			w.element.classList.remove("active");
			
			if (w.overlay)
				w.overlay.style.zIndex = z - 1 + "";
			if (w.modalOverlay)
				w.modalOverlay.style.zIndex = z - 1 + "";
		});
	}

	private _generateWindowId(): number {
		return WindowManager._windowCounter++;
	}
}

/*
<!doctype html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>XP Retro Desktop</title>
		
		<!-- UI Core Styles -->


		<script type="module" crossorigin src="/assets/index-CnnL00LZ.js"></script>
		<link rel="stylesheet" crossorigin href="/assets/index-BmIYs8Jb.css">
	</head>
	<body>
		<div id="desktop">
			<div id="desktop-icons"></div>
			
			<!-- Start Menu -->
			<div id="start-menu">
				<div id="start-header">
					<img src="https://picsum.photos/seed/user/40/40" alt="User" referrerPolicy="no-referrer">
					<span>Administrator</span>
				</div>
				<div id="start-body">
					<div id="start-left">
						<!-- Pinned apps -->
					</div>
					<div id="start-right">
						<div class="start-item">My Documents</div>
						<div class="start-item">My Pictures</div>
						<div class="start-item">My Music</div>
						<hr>
						<div class="start-item">My Computer</div>
						<div class="start-item">Control Panel</div>
					</div>
				</div>
				<div id="start-footer">
					<div class="footer-btn">Log Off</div>
					<div class="footer-btn">Turn Off Computer</div>
				</div>
			</div>

			<!-- Taskbar -->
			<div id="taskbar">
				<button id="start-button">start</button>
				<div id="task-items"></div>
				<div id="system-tray">
					<span id="clock">00:00 AM</span>
				</div>
			</div>
		</div>

		
	</body>
</html>
*/

export function showLogonScreen() {
	var desktop = document.getElementById('desktop');
	var logon = document.createElement('div');
	logon.id = 'logon-screen';
	logon.style.position = 'absolute';
	logon.style.top = '0';
	logon.style.left = '0';
	logon.style.width = '100%';
	logon.style.height = '100%';
	logon.style.background = 'linear-gradient(to bottom, #5a7edc 0%, #4a6edc 100%)';
	logon.style.zIndex = '100000';
	logon.style.display = 'flex';
	logon.style.flexDirection = 'column';
	
	var top = document.createElement('div');
	top.style.height = '100px';
	top.style.borderBottom = '2px solid #fff';
	logon.appendChild(top);

	var middle = document.createElement('div');
	middle.style.flexGrow = '1';
	middle.style.display = 'flex';
	middle.style.alignItems = 'center';
	middle.style.justifyContent = 'center';
	middle.style.gap = '50px';
	logon.appendChild(middle);

	var left = document.createElement('div');
	left.style.textAlign = 'right';
	left.innerHTML = '<div style="font-size:36px;color:white;font-weight:bold;">Experience<span style="color:#ff9900;">OS</span></div>' +
						'<div style="color:white;font-size:14px;opacity:0.8;">To begin, click your user name</div>';
	middle.appendChild(left);

	var right = document.createElement('div');
	right.style.display = 'flex';
	right.style.flexDirection = 'column';
	right.style.gap = '10px';
	right.style.borderLeft = '1px solid rgba(255,255,255,0.3)';
	right.style.paddingLeft = '50px';
	middle.appendChild(right);

	// TODO: require IRegistry in constructor
	// instead of this crap.
	//var users = XP_API.Registry.get<Record<string, XpUser>>('Security/Users');
	const users = {};
	for (const u in users) {
		(function(user) {
			var userContainer = document.createElement('div');
			userContainer.style.display = 'flex';
			userContainer.style.flexDirection = 'column';
			userContainer.style.gap = '5px';
			userContainer.style.marginBottom = '10px';
			
			var userDiv = document.createElement('div');
			userDiv.style.display = 'flex';
			userDiv.style.alignItems = 'center';
			userDiv.style.gap = '10px';
			userDiv.style.cursor = 'pointer';
			userDiv.style.padding = '5px';
			userDiv.style.borderRadius = '5px';
			userDiv.onmouseover = function() { userDiv.style.background = 'rgba(255,255,255,0.1)'; };
			userDiv.onmouseout = function() { userDiv.style.background = 'transparent'; };
			
			var img = document.createElement('img');
			img.src = user.avatar || "";
			img.style.width = '48px';
			img.style.height = '48px';
			img.style.border = '2px solid #fff';
			img.style.borderRadius = '4px';
			img.referrerPolicy = 'no-referrer';
			
			var name = document.createElement('div');
			name.innerText = user.username;
			name.style.color = 'white';
			name.style.fontSize = '18px';
			name.style.fontWeight = 'bold';
			
			userDiv.appendChild(img);
			userDiv.appendChild(name);
			userContainer.appendChild(userDiv);

			var pwdArea = document.createElement('div');
			pwdArea.className = 'pwd-area';
			pwdArea.style.display = 'none';
			pwdArea.style.paddingLeft = '58px';
			pwdArea.style.flexDirection = 'column';
			pwdArea.style.gap = '5px';
			
			var pwdLabel = document.createElement('div');
			pwdLabel.innerText = 'Type your password:';
			pwdLabel.style.color = 'white';
			pwdLabel.style.fontSize = '12px';
			pwdArea.appendChild(pwdLabel);
			
			var pwdInputRow = document.createElement('div');
			pwdInputRow.style.display = 'flex';
			pwdInputRow.style.gap = '5px';
			pwdInputRow.style.alignItems = 'center';
			
			var pwdInput = document.createElement('input');
			pwdInput.type = 'password';
			pwdInput.style.width = '150px';
			pwdInput.style.border = '1px solid #fff';
			pwdInput.style.background = 'white';
			pwdInput.style.padding = '2px';
			pwdInput.style.borderRadius = '2px';
			pwdInputRow.appendChild(pwdInput);
			
			var goBtn = document.createElement('button');
			goBtn.innerHTML = '➜';
			goBtn.style.background = 'linear-gradient(to bottom, #76b054 0%, #3a7e1c 100%)';
			goBtn.style.color = 'white';
			goBtn.style.border = '1px solid #fff';
			goBtn.style.cursor = 'pointer';
			goBtn.style.width = '24px';
			goBtn.style.height = '24px';
			goBtn.style.borderRadius = '4px';
			goBtn.style.display = 'flex';
			goBtn.style.alignItems = 'center';
			goBtn.style.justifyContent = 'center';
			goBtn.style.fontSize = '14px';
			pwdInputRow.appendChild(goBtn);
			
			pwdArea.appendChild(pwdInputRow);

			var errorMsg = document.createElement('div');
			errorMsg.style.color = '#ffeb3b';
			errorMsg.style.fontSize = '11px';
			errorMsg.style.display = 'none';
			errorMsg.innerText = 'Incorrect password. Please try again.';
			pwdArea.appendChild(errorMsg);

			userContainer.appendChild(pwdArea);
			
			userDiv.onclick = function() {
				// Hide all other pwd areas
				var allPwdAreas = right.querySelectorAll('.pwd-area');
				allPwdAreas.forEach((area) => { (area as HTMLElement).style.display = 'none'; });
				
				if (user.username === 'Guest') {
					if (/*XP_API.Auth.login('Guest', '')*/1) {
						logon.remove();
						// TODO: Open desktop via WM
					}
				} else {
					pwdArea.style.display = 'flex';
					pwdInput.focus();
				}
			};
			
			goBtn.onclick = function() {
				if (/*XP_API.Auth.login(user.username, pwdInput.value)*/1) {
					logon.remove();
					// TODO: Open desktop via WM
				} else {
					errorMsg.style.display = 'block';
					pwdInput.value = '';
					pwdInput.focus();
				}
			};
			
			pwdInput.onkeydown = function(e) {
				errorMsg.style.display = 'none';
				if (e.key === 'Enter') goBtn.click();
			};
			
			right.appendChild(userContainer);
		})((users as any)[u]);
	}

	var bottom = document.createElement('div');
	bottom.style.height = '100px';
	bottom.style.borderTop = '2px solid #fff';
	bottom.style.display = 'flex';
	bottom.style.alignItems = 'center';
	bottom.style.padding = '0 50px';
	
	var turnOffBtn = document.createElement('div');
	turnOffBtn.style.color = 'white';
	turnOffBtn.style.cursor = 'pointer';
	turnOffBtn.style.display = 'flex';
	turnOffBtn.style.alignItems = 'center';
	turnOffBtn.style.gap = '10px';
	turnOffBtn.innerHTML = '<img src="https://img.icons8.com/color/48/000000/shutdown.png" style="width:24px;height:24px;" referrerPolicy="no-referrer"><span>Turn off computer</span>';
	turnOffBtn.onclick = function() {
		var overlay = document.createElement('div');
		overlay.style.position = 'fixed';
		overlay.style.top = '0';
		overlay.style.left = '0';
		overlay.style.width = '100%';
		overlay.style.height = '100%';
		overlay.style.background = 'rgba(0,0,0,0.8)';
		overlay.style.zIndex = '200000';
		overlay.style.display = 'flex';
		overlay.style.alignItems = 'center';
		overlay.style.justifyContent = 'center';
		
		var shutDownBox = document.createElement('div');
		shutDownBox.style.background = '#003399';
		shutDownBox.style.border = '1px solid #fff';
		shutDownBox.style.padding = '20px';
		shutDownBox.style.color = 'white';
		shutDownBox.style.textAlign = 'center';
		shutDownBox.innerHTML = '<div style="font-size:18px;margin-bottom:20px;">Turn off computer?</div>' +
								'<div style="display:flex;gap:20px;justify-content:center;">' +
									'<button id="btn-cancel" style="padding:5px 15px;">Cancel</button>' +
									'<button id="btn-off" style="padding:5px 15px;background:#cc0000;color:white;border:1px solid #fff;">Turn Off</button>' +
								'</div>';
		overlay.appendChild(shutDownBox);
		document.body.appendChild(overlay);
		
		(overlay.querySelector('#btn-cancel') as HTMLElement).onclick = () => { overlay.remove(); };
		(overlay.querySelector('#btn-off') as HTMLElement).onclick = () => {
			document.body.innerHTML = '<div style="background:black;color:white;height:100vh;display:flex;align-items:center;justify-content:center;font-family:Tahoma;">It is now safe to turn off your computer.</div>';
		};
	};
	bottom.appendChild(turnOffBtn);
	logon.appendChild(bottom);

	document.body.appendChild(logon);
}