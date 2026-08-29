import { XpUser } from "../api";
import Authent, { IAuthentication } from "./Authent";
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
export default class SystemKernel {
	private _fs: IFileSystem;
	private _reg: IRegistry;
	private _wm: null;
	private _auth: IAuthentication;

	constructor() {

		this._fs = new FileSystem();
		this._reg = new Registry(this._fs);
		this._wm = null;
		this._auth = new Authent(this._reg);

		const self = this;

		API = (() => {
			// EVENTUALLY

			return {
				hash(str) {
					return Utils.hash(str);
				},
				Auth: {
					login(username, password) {
						return self._auth.login(username, password);
					},
				},
			};
		})();
	}
}