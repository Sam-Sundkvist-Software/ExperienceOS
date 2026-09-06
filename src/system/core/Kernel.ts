import createLegacySystemApi, { ILegacySystemAPI, XpUser, XpUserPrivilege } from "../api";
import { CreateElementOptions } from "../compfwk";
import Window from "./wm/Window";
import Authentication, { IAuthentication } from "./Authentication";
import FileSystem, { IFileSystem } from "./FileSystem";
import ISystemAPI from "./ISystemAPI";
import Registry, { IRegistry } from "./Registry";
import Utils from "./Utils";
import WindowManager, { showLogonScreen } from "./wm/WindowManager";
import createAdr, { IADR } from "../adr";

export let API: ISystemAPI | undefined;

/**
 * The primary kernel for ExperienceOS.
 * Manages the entire system (mostly)
 * and initializes the API.
 */
export default class Kernel implements IKernel {
	private _rootElement: HTMLElement;
	private _fs: IFileSystem;
	private _reg: IRegistry;
	private _wm: WindowManager; // TODO: Use shell/something. An interface at least.
	private _auth: IAuthentication;

	private _adr: IADR;
	private _legacyApi: ILegacySystemAPI;

	constructor(rootElement: HTMLElement) {
		this._rootElement = rootElement;
		this._fs = new FileSystem();
		this._reg = new Registry(this._fs);
		this._wm = new WindowManager(rootElement);
		this._auth = new Authentication(this._reg, this._wm);
		this._adr = createAdr();
		this._legacyApi = createLegacySystemApi(this._wm, this._fs);
	}

	public launch(): void {
		const self = this;

		try {
			this._wm.setupShell();
		} catch (e) {
			const err = e as Error;
			console.log("=== (!) Kernel WMShellFault ===\n\n", err);
		}
		//showLogonScreen();

		try {
			API = (() => {
				// TODO:
				/*
				 * Fix API surface or
				 * create new API (easier)
				 */

				return {
					hash(str) {
						return Utils.hash(str);
					},
					Auth: this._auth.createApi(),
					FS: this._fs.createApi(),
					Registry: this._reg.createApi(),
					createElement<T extends keyof HTMLElementTagNameMap>(options: CreateElementOptions<T>) {
						// TODO: Port Window manager
						void options;
						return document.createElement("div") as HTMLElementTagNameMap[T];
					},
					exec(path, args) {
						void path, args;
						return false;
					},
					getSCT() {
						return null;
					},
					setSCT(data) {
						void data;
					},
					getIconCache() {
						return {};
					},
					setIconCache(data) {
						void data;
						return undefined;
					},
					getIcon(path) {
						void path;
						return "";
					},
					createWindow(options) {
						const win = self._wm.create(options);
						return win.id;
					},
					closeWindow(id) {
						void id;
					},
					focusWindow(id) {
						void id;
					},
					setWindowContent(id, content) {
						void id, content;
					},
					setWindowTitle(id, title) {
						void id, title;
					},
					updateTaskbar() {
					},
					addTrayIcon(options) {
						void options;
						return {
							showBalloon(options) {
								void options;
							},
						};
					},
					showBalloonTip(target, options) {
						void target, options;
					},
					showTooltip(target, options) {
						void target, options;
					},
					showDialog(options) {
						void options;
						return new Window({

						});
					},
					showContextMenu(x, y, items) {
						void x, y, items;
					},
					showInstaller(options) {
						void options;
						return "";
					},
				};
			})();
			(window as any)["expApi"] = API;
		} catch {
			throw new KernelError("Failed to initialize subsystems.");
		}
	}
}

export class KernelError extends Error {
	public constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "KernelError";
	}
}

export interface IKernel {
	/**
	 * Launches the kernel.
	 */
	launch(): void;
}