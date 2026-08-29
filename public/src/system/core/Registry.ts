import { IFileSystem } from "./FileSystem";

export const DEFAULT_REGISTRY_PATH = "C:/System/sysconf.json";

export default class Registry implements IRegistry {
	private _fs: IFileSystem;
	private _src: string;
	private _cache: RegistryNode | null;

	public constructor(fs: IFileSystem) {
		this._fs = fs;
		this._src = DEFAULT_REGISTRY_PATH;
		this._cache = null;
	}

	public load(): void {
		try {
			this._fs.readFile(this._src);
		} catch {
			throw new RegistryError("Cannot access source file.");
		}
	}

	public save(): void {
		try {
			this._fs.writeFile(this._src, JSON.stringify(this._cache));
		} catch {
			throw new RegistryError("Cannot access source file or unable to save corrupted cached registry.");
		}
	}

	public groupExists(path: string): boolean {
		if (!this._cache)
			throw new RegistryError("Registry not loaded.");
		if (this._cache.type !== RegistryNodeType.GROUP)
			throw new RegistryError("Invalid registry root.");
		const node = this.traverseReg(path);
		return !!node && node.type === RegistryNodeType.GROUP;
	}

	public createGroup(path: string, recurse: boolean): void {
		if (!this._cache)
			throw new RegistryError("Registry not loaded.");
		if (this._cache.type !== RegistryNodeType.GROUP)
			throw new RegistryError("Invalid registry root.");

		const parts = path.split("/");
		let current: RegistryNode = this._cache;

		for (let i = 0; i < parts.length; i++) {
			const nodeName = parts[i];
			const currentGrp = current as IRegistryGroup;
			const node = currentGrp.children[nodeName];

			if (!node) {
				if (!recurse) {
					throw new RegistryError("Cannot reach path.");
				}
				current = (currentGrp.children[nodeName] = {
					type: RegistryNodeType.GROUP,
					children: {},
				});
			} else {
				if (node.type !== RegistryNodeType.GROUP)
					throw new RegistryError("Conflicting value node.");
				current = node;
			}
		}
	}

	public getNodeValue<T>(path: string): T {
		if (!this._cache)
			throw new RegistryError("Registry not loaded.");
		if (this._cache.type !== RegistryNodeType.GROUP)
			throw new RegistryError("Invalid registry root.");
		const node = this.traverseReg(path);

		if (!node)
			throw new RegistryError("Cannot access node.");
		if (node.type !== RegistryNodeType.VALUE)
			throw new RegistryError("Node does not hold a value.");

		return node.value as T;
	}

	public setNodeValue<T>(path: string, value: T): void {
		if (!this._cache)
			throw new RegistryError("Registry not loaded.");
		if (this._cache.type !== RegistryNodeType.GROUP)
			throw new RegistryError("Invalid registry root.");

		const parts = path.split("/");
		let current: RegistryNode = this._cache;

		let i = 0;
		for (const part of parts) {
			const currentGrp = current as IRegistryGroup;
			const node = currentGrp.children[part];

			if (i >= parts.length - 1) {
				if (!node) {
					currentGrp.children[part] = {
						type: RegistryNodeType.VALUE,
						value,
					};
					return;
				} else if (node.type === RegistryNodeType.GROUP)
					throw new RegistryError("The specified path points to a group.");
				node.value = value;
			}

			if (!node || node.type !== RegistryNodeType.GROUP)
				throw new RegistryError("Cannot reach node.");

			current = node;
			i++;
		}
	}

	private traverseReg(path: string): RegistryNode | null {
		const parts = path.split("/");
		let current = this._cache;

		for (const part of parts) {
			if (!current)
				return null;

			if (current.type !== RegistryNodeType.GROUP)
				continue;

			current = current.children[part];
		}

		return current;
	}
}

export class RegistryError extends Error {
	public constructor(message?: string, errorOptions?: ErrorOptions) {
		super(message, errorOptions);
	}
}

export interface IRegistryGroup {
	type: RegistryNodeType.GROUP,
	children: Record<string, RegistryNode>,
}

export interface IRegistryNode<T = unknown> {
	type: RegistryNodeType.VALUE,
	value: T,
}

export type RegistryNode = IRegistryGroup | IRegistryNode;

export enum RegistryNodeType {
	GROUP,
	VALUE,
}

export interface IRegistry {

	/**
	 * Loads information from the FS to the SystemCT
	 * registry. Does not retain changes.
	 * @throws If the registry source is inaccessible.
	 */
	load(): void;

	/**
	 * Saves registry changes to disk.
	 * @throws If the registry source is inaccessible.
	 */
	save(): void;

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