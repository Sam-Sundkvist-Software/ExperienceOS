import Window, { WindowOptions } from "./Window";

export default interface IWindowHost {
	openWindow(options: WindowOptions): Window;
	setWindowPosition(window: Window, x: number, y: number): void;
	setWindowSize(window: Window, width: number, height: number): void;
	setWindowState(window: Window, state: WindowState): void;
	setWindowVisibility(window: Window, visibility: boolean): void;
	closeWindow(window: Window): void;
	getCascadedPosition(): { x: number; y: number; };
}

export enum WindowState {
	NORMAL,
	MINIMIZED,
	MAXIMIZED,
	FULLSCREEN,
}