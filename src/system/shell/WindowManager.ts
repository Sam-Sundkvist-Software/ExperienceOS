export default class WindowManager implements IWindowManager {
	private static _idCounter = 0;

	private _windows: Record<number, IWindowData>;
	private _windowOrder: number[];

	public constructor() {
		this._windows = {};
		this._windowOrder = [];
	}

	public createWindow(): IWindow {
		const id = this.getNewId();
		const wd = new WindowData(document.createElement("div"), -1, { x: 0, y: 0 }, { width: 0, height: 0 });
		this._windows[id] = wd;
		this._windowOrder.push(id);
		this.updateWindowOrder();
		return {
			get position() {
				return { 
					x: wd.position.x,
					y: wd.position.y,
				};
			},
			set position(value) {
				wd.position.x = value.x;
				wd.position.y = value.y;
			},
		};
	}

	public updateWindowOrder(): void {
		for (let i = 0; i < this._windowOrder.length; i++) {
			const window = this._windows[this._windowOrder[i]];
			window.zIndex = i;
			window.element.style.zIndex = i.toString();
		}
	}

	private getNewId(): number {
		return WindowManager._idCounter++;
	}
}

export class WindowManagerError extends Error {
	public constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "WindowManagerError";
	}
}

export interface IWindowManager {
	createWindow(): IWindow;
	destroyWindow(window: IWindow): boolean;
	updateWindowOrder(): void;
}

class WindowData implements IWindowData {
	private _element: HTMLElement;
	private _parentElement: HTMLElement;
	private _zIndex: number;
	private _position: Position;
	private _size: Size;
	private _state: WindowState;
	private _visible: boolean;

	private _prevRect: Rect;

	public get element(): HTMLElement {
		return this._element;
	}
	public set element(value: HTMLElement) {
		throw new WindowManagerError("Cannot exchange window element.");
	}
	public get zIndex(): number {
		return this._zIndex;
	}
	public set zIndex(value: number) {
		this._element.style.zIndex = (this._zIndex = value).toString();
	}
	public get position(): Position {
		return {
			x: this._position.x,
			y: this._position.y,
		};
	}
	public set position(value: Position) {
		this._element.style.left = (this._position.x = value.x) + "px";
		this._element.style.top = (this._position.y = value.y) + "px";
	}
	public get size(): Size {
		return {
			width: this._size.width,
			height: this._size.height,
		};
	}
	public set size(value: Size) {
		this._element.style.width = (this._size.width = value.width) + "px";
		this._element.style.height = (this._size.height = value.height) + "px";
	}
	public get state(): WindowState {
		return this._state;
	}
	public set state(value: WindowState) {
		// TODO: Make work
		this._state = value;
		switch (value) {
			case WindowState.NORMAL: {
				if (this._state === WindowState.NORMAL)
					return;
				this.position = this._prevRect.position;
				this.size = this._prevRect.size;
			} break;
		}
	}

	public constructor(element: HTMLElement, parent: HTMLElement) {
		this._element = element;
		this._parentElement = parent;
		this._zIndex = 0;
		this._position = { x: 0, y: 0 };
		this._size = { width: 0, height: 0 };
		this._state = WindowState.NORMAL;
		this._visible = true;

		this._prevRect = {
			position: this._position,
			size: this._size,
		};
	}
}

interface IWindowData {
	element: HTMLElement;
	zIndex: number;
	position: Position;
	size: Size;
	state: WindowState;
	visible: boolean;
}

export enum WindowState {
	NORMAL = 0,
	MINIMIZED,
	MAXIMIZED,
	FULLSCREEN,
}

export interface IWindow {
	get position(): Position;
	set position(value: Position);
	get clientPosition(): Position;
	set clientPosition(value: Position);
	get size(): Size;
	set size(value: Size);
	get clientSize(): Size;
	set clientSize(value: Size);
}

export type Position = { x: number; y: number; };
export type Size = { width: number; height: number; };
export type Rect = { position: Position, size: Size; };