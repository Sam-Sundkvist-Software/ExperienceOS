import { BalloonTipOptions, IDialogOptions, IInstallerOptions, ITrayIconOptions, TooltipOptions, XpUser, XpUserPrivilege } from "../api";
import { CreateElementOptions, MenuItem } from "../compfwk";
import { Window, WindowOptions } from "../window-manager";

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
	FS: {
		checkAccess(path: string, operation: "read" | "write"): boolean;
		readFile(path: string): string | null;
		writeFile(path: string, content: string): boolean | undefined;
		delete(path: string): boolean;
		ls(path: string): string[] | null;
	};
	Registry: {
		get<T>(path: string): T | null;
		set<T>(path: string, value: T): void;
		delete(path: string): boolean;
		getAll(): unknown;
	};
	createElement<T extends keyof HTMLElementTagNameMap>(options: CreateElementOptions<T>): HTMLElementTagNameMap[T];
	exec(path: string, args?: unknown): boolean;
	getSCT<T>(): T | null;
	setSCT<T>(data: T): void;
	getIconCache(): Record<string, string>;
	setIconCache(data: Record<string, string>): boolean | undefined;
	getIcon(path: string): string;
	createWindow(options: WindowOptions): string;
	closeWindow(id: string): void;
	focusWindow(id: string): void;
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
