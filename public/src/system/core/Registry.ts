import { IFileSystem } from "./FileSystem";

export const DEFAULT_REGISTRY_PATH = "C:/System/sysconf.json";

export default class Registry implements IRegistry {
	private _fs: IFileSystem;
	private _src: string;
	private _cache: object;

	public constructor(fs: IFileSystem) {
		this._fs = fs;
		this._src = DEFAULT_REGISTRY_PATH;
		this._cache = {};
	}

	public load() {

	}
}

export class RegistryError extends Error {
	public constructor(message?: string, errorOptions?: ErrorOptions) {
		super(message, errorOptions);
	}
}

export enum RegistryNodeType {
	GROUP,
	VALUE,
}

export interface IRegistry {

	/**
	 * Returns a boolean indicating if the specified path points to a valid group.
	 */
	groupExists(path: string): boolean;

	/**
	 * Creates a registry group. If the group already exists, nothing is done.
	 * @param recurse Whether to allow creating several nested groups at once, instead of only the deepest one.
	 */
	createGroup(path: string, recurse: boolean): void;

	/**
	 * Returns the value of a registry node.
	 * @throws If the specified node is not a value or if it doesn't exist.
	 */
	getNodeValue<T>(path: string): T;
	
	/**
	 * Sets the value of a registry node, creating the node if necessary.
	 * @throws If the specified path is invalid.
	 */
	setNodeValue<T>(path: string, value: T): void;

	/*
	getKeys(key: string): string[];
	hasKey(key: string): boolean;
	getValue<T>(key: string): T;
	setValue<T>(key: string, value: T): void;
	createKey<T>(key: string, recurse: boolean): void;
	*/
}