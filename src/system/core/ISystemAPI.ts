import { BalloonTipOptions, IDialogOptions, IInstallerOptions, ITrayIconOptions, TooltipOptions, XpUser, XpUserPrivilege } from "../api";
import { CreateElementOptions, MenuItem } from "../compfwk";
import Window, { WindowOptions } from "./wm/Window";

export default interface ISystemAPI {
	hash(str: string): string;
	Auth: {
		login(username: string, password: string): boolean;
		logout(): void;
		getCurrentUser(): XpUser | null;
	};
	UAC: {
		checkPrivilege(required: XpUserPrivilege): boolean;
		requestEscalation(callback: (result: boolean) => void): void;
		requestEscalationAsync?(): Promise<boolean>;
	};
	FS: IFileSystemAPI;
	Registry: IRegistryAPI;
	createElement<T extends keyof HTMLElementTagNameMap>(options: CreateElementOptions<T>): HTMLElementTagNameMap[T];
	exec(path: string, args?: unknown): boolean;
	getSCT<T>(): T | null;
	setSCT<T>(data: T): void;
	getIconCache(): Record<string, string>;
	setIconCache(data: Record<string, string>): boolean | undefined;
	getIcon(path: string): string;
	createWindow(options: WindowOptions): number;
	closeWindow(id: number): void;
	focusWindow(id: number): void;
	setWindowContent(id: string, content: string | HTMLElement): void;
	setWindowTitle(id: string, title: string): void;
	updateTaskbar(): void;
	addTrayIcon(options: ITrayIconOptions): {
		showBalloon(options: unknown): void;
	};
	showBalloonTip(target: HTMLImageElement, options: BalloonTipOptions): void;
	showTooltip(target: HTMLElement, options: TooltipOptions): void;
	showDialog(options: IDialogOptions): Window;
	showContextMenu(x: number, y: number, items: MenuItem[]): void;
	showInstaller(options: IInstallerOptions): string;
}

export interface IAuthenticationAPI {
	getUsernames(): string[];
	getAdmins(): string[];
	requestEscalation(stage?: number): boolean;
}

export interface IFileSystemAPI {
	directoryExists(path: string): boolean;
	fileExists(path: string): boolean;
	createDirectory(path: string, recurse?: boolean): void;
	createFile(path: string, overwrite?: boolean): void;
	readDirectory(path: string): string[];
	readFile(path: string): string;
	deleteDirectory(path: string, recurse?: boolean): void;
	deleteFile(path: string): void;
}

export interface IRegistryAPI {
	groupExists(path: string): boolean;
	valueExists(path: string): boolean;
	createGroup(path: string, recurse?: boolean): void;
	getValue<T = unknown>(path: string): T;
	setValue<T = unknown>(path: string, value: T): void;
	deleteGroup(path: string, recurse?: boolean): void;
	deleteValue(path: string): void;
}