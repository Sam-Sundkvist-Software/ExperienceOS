import { IFileSystem } from "./FileSystem";
import ISystemAPI from "./ISystemAPI";
import { ILog } from "./Log";

/**
 * The Application Dearchival Runtime (ADRT) for ExperienceOS.
 */
export default class AppDRT implements IADRT {
	private _fs: IFileSystem;
	private _log: ILog;
	private _cache: Record<string, Promise<IRTApp>>;

	private _api: ISystemAPI | undefined;

	public constructor(fs: IFileSystem, log: ILog) {
		this._fs = fs;
		this._log = log;
		this._cache = {};
		this._api = undefined;
	}

	public initApi(api: ISystemAPI) {
		this._api = api;
	}

	public exec(path: string, args: unknown[], requireApi = false): void {
		if (!this._api) {
			if (requireApi)
				throw new ADRTError(`Application ${path} cannot start without the API.`);
			this._log.writeWarning(`Application '${path}' may not function properly without the API.`);
		}

		this._load(new URL(path, window.location.origin)).then(app => {
			// TODO: Add APP/PROC mgr
			// and event log.
			console.log("APP Launch", app.information);
			app.start(this._api);
		});
	}

	private async _loadVfs(path: string): Promise<IRTApp> {
		const key = "APPDRTexpOS://" + path;

		if (this._cache[key])
			return this._cache[key];

		try {
			return this._cache[key] = (async() => {
				const textScript = this._fs.readFile(path);
				const blob = new Blob([textScript], { type: "text/javascript" });
				const url = URL.createObjectURL(blob);

				try {
					const module = await import(url);
					return module.default as IRTApp;
				} finally {
					URL.revokeObjectURL(url);
				}
			})();
		} catch {
			throw new ADRTError("Cannot retrieve executable information.");
		}
	}

	private async _load(externalUrl: URL): Promise<IRTApp> {
		const key = externalUrl.href;

		if (!this._cache[key]) {
			try {
				this._cache[key] = (async() => {
					const module = await import(
						/* @vite-ignore */
						key
					);
					return module.default as IRTApp;
				})();
			} catch (e) {
				delete this._cache[key];
				throw e;
			}
		}

		return this._cache[key];
	}
}

export class ADRTError extends Error {
	public constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "ADRTError";
	}
}

export interface IADRT {
	exec(path: string, args: unknown[], requireApi?: boolean): void;
}

export enum ProcState {
	NONE = 0,
	LOADED,
	RUNNING,
}