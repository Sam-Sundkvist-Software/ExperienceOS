import { XP_API, XpUser } from "./api";
import { showContextMenu } from "./compfwk";
import { initDesktop } from "./main";

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

	var users = XP_API.Registry.get<Record<string, XpUser>>('Security/Users');
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
					if (XP_API.Auth.login('Guest', '')) {
						logon.remove();
						initDesktop();
					}
				} else {
					pwdArea.style.display = 'flex';
					pwdInput.focus();
				}
			};
			
			goBtn.onclick = function() {
				if (XP_API.Auth.login(user.username, pwdInput.value)) {
					logon.remove();
					initDesktop();
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
		})(users[u]);
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

export default class WindowManager {
	public windows: Window[];
	public activeWindowId: string | null;
	public baseZIndex: number;

	constructor() {
		this.windows = [];
		this.activeWindowId = null;
		this.baseZIndex = 100;

		// setup shell (workaround)
		// make better later, for now
		// patch to make dynamic instead
		// of hardcoded to index.html.
		const desktop = document.createElement("div");
		desktop.id = "desktop";
		desktop.innerHTML = `
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
		</div>`;

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