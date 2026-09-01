import { XP_API, XpUser } from "./api";
import Kernel, { IKernel } from "./core/Kernel";
import { showLogonScreen } from "./core/wm/WindowManager";

/**
 * The subsystem responsible of managing
 * the boot sequence of ExperienceOS.
 */
export default class Boot implements IBoot {
	private _rootElement: HTMLElement | null;
	private _kernel: IKernel | null;

	public constructor() {
		this._rootElement = null;
		this._kernel = null;
	}

	public boot(rootElement: HTMLElement): BootStatus | undefined {
		this._rootElement = rootElement;
		this._kernel = new Kernel(rootElement);

		this.setupSystemErrorHandler();

		const loadSettingsSucceeded = this.loadSettings();

		// PATCH
		showLogonScreen();

		return 0;
	}

	private loadSettings(): boolean {
		const users = XP_API.Registry.get<Record<string, XpUser>>("Security/Users");

		if (!users)
			return false;

		return true;
	}

	private setupSystemErrorHandler() {
		window.addEventListener("error", (ev) => {
			console.error("expOS ERROR: " + ev.message);

			if (XP_API !== undefined && XP_API.showDialog !== undefined) {
				XP_API.showDialog({
					title: "System Error",
					type: "error",
					message: `Message: '${ev.message}'`,
				});
			}

			ev.preventDefault();
		});

		window.addEventListener("unhandledrejection", (ev) => {
			console.error("expOS ASYNC ERROR: " + ev.reason);

			if (XP_API !== undefined && XP_API.showDialog !== undefined) {
				XP_API.showDialog({
					title: "System Warning",
					type: "warning",
					message: `Asynchronous process failed: '${ev.reason}'`,
				});
			}

			ev.preventDefault();
		});
	}
}

export interface IBoot {
	boot(rootElement: HTMLElement): BootStatus | undefined;
}

export type BootStatus = number;
