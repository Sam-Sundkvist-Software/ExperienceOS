import { IFileSystem } from "./FileSystem";
import ISystemAPI from "./ISystemAPI";

/**
 * The Application Dearchival Runtime (ADRT) for ExperienceOS.
 */
export default class AppDRT implements IADRT {
	private _fs: IFileSystem;
	private _cache: Record<string, Promise<IAppProc>>;

	public constructor(fs: IFileSystem) {
		this._fs = fs;
		this._cache = {};
	}

	public exec(path: string, args: unknown[]): unknown {
		return this.load(new URL(window.location.origin))
	}

	private async load(externalUrl: URL): Promise<unknown> {
		const key = externalUrl.href;

		if (!this._cache[key]) {
			this._cache[key] = (async() => {
				const module = await import(
					/* @vite-ignore */
					key
				);
				return module.default as IAppProc;
			})();
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
	exec(path: string, args: unknown[]): void;
}

export enum ProcState {
	NONE = 0,
	LOADED,
	RUNNING,
}

export interface IAppProc {
	onStart(api: ISystemAPI): void;
	onQueryState(): IStateQueryResult;
	onStop(): void;
}

export interface IStateQueryResult {
	// TODO: Make useful
}