import { showContextMenu } from "../../compfwk";
import IWindowHost from "./IWindowHost";

export default class Window {
	public wh: IWindowHost;
	public id: number;
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
	public visible: boolean;

	constructor(options: WindowOptions) {
		if (!options.wh)
			throw new Error("Cannot create window without Window Mgr");
		this.wh = options.wh;
		this.id = Math.floor(Math.random() * 100000); // TODO: make work
		this.title = options.title || 'New Window';
		this.width = options.width || 400;
		this.height = options.height || 300;
		const cascadedPos = this.wh.getCascadedPosition();
		this.x = options.x || cascadedPos.x;
		this.y = options.y || cascadedPos.y;
		this.isDialog = !!options.isDialog;
		this.type = options.type || WindowType.NORMAL; // normal, modal, sub, topmodal
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
		this.visible = true;
		this.initEvents();
	}

	focus() { 
		this.wh.focusWindow(this);
	}

	minimize() {
		this.wh.minimizeWindow(this);
	}

	maximize() {
		this.wh.maximizeWindow(this);
	}

	restore() {
		this.wh.restoreWindow(this);
	}

	setContent(content: string | HTMLElement) {
		const contentArea = this.element.querySelector(".window-content");
		if (!contentArea)
			throw new Error("Can't set content");
		contentArea.innerHTML = "";
		if (typeof content === "string") {
			contentArea.innerHTML = content;
		} else {
			contentArea.appendChild(content);
		}
	}

	setTitle(title: string) {
		this.title = title;
		const wt = this.element.querySelector(".window-title") as HTMLElement | null;
		if (!wt)
			throw new Error("Cannot update window titlebar title");
		wt.innerText = title;
		this.wh.updateTaskbar();
	}

	close() {
		this.wh.closeWindow(this);
	}

	// THESE METHODS ARE J U N K:
	// TODO: exterminate these methods.

	private _createOverlay() {
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

	private _createModalOverlay() {
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

	private _createUI(content: string | Node) {
		const win = document.createElement("div");
		win.id = this.id.toString();
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

	private initEvents() {
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
	wh?: IWindowHost;
}

export enum WindowType {
	NORMAL = "normal",
	MODAL = "modal",
	SUB = "sub",
	TOPMODAL = "topmodal",
}