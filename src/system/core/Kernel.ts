import { XpUser, XpUserPrivilege } from "../api";
import { CreateElementOptions } from "../compfwk";
import Window from "./wm/Window";
import Authentication, { IAuthentication } from "./Authentication";
import FileSystem, { IFileSystem } from "./FileSystem";
import ISystemAPI from "./ISystemAPI";
import Registry, { IRegistry } from "./Registry";
import Utils from "./Utils";

export let API: ISystemAPI | undefined;

/**
 * The primary kernel for ExperienceOS.
 * Manages the entire system (mostly)
 * and initializes the API.
 */
export default class Kernel implements IKernel {
	private _fs: IFileSystem;
	private _reg: IRegistry;
	private _wm: null;
	private _auth: IAuthentication;

	constructor() {
		this._fs = new FileSystem();
		this._reg = new Registry(this._fs);
		this._wm = null;
		this._auth = new Authentication(this._reg);
	}

	public launch(): void {
		const self = this;

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
					Auth: {
						login(username, password) {
							return self._auth.login(username, password);
						},
						logout() {
							self._auth.logout();
						},
						getCurrentUser() {
							const userInfo = self._auth.getCurrentUserInfo();
							if (!userInfo)
								return null;
							return {
								username: userInfo.username,
								passwordHash: "",
								privilege: "admin",
							};
						},
					},
					UAC: {
						checkPrivilege(required) {
							void required;
							return true;
						},
						requestEscalation(callback) {
							callback(true);
						},
						requestEscalationAsync() {
							return Promise.resolve(true);
						},
					},
					FS: {
						checkAccess(path, operation) {
							return true;
						},
						readFile(path) {
							return self._fs.readFile(path);
						},
						writeFile(path, content) {
							self._fs.writeFile(path, content);
							return undefined;
						},
						delete(path) {
							// TODO: Add the bare minimum to FS API
							void path;
							return false;
						},
						ls(path) {
							// TODO: Add the bare minimum to FS API
							void path;
							return null;
						},
					},
					Registry: {
						get(path) {
							return self._reg.getNodeValue(path);
						},
						set(path, value) {
							self._reg.setNodeValue(path, value);
						},
						delete(path) {
							// TODO: Add the bare minimum to Reg API
							void path;
							return false;
						},
						getAll() {
							// TODO: Remove this from the API
							return null;
						},
					},
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
						void options;
						return "";
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