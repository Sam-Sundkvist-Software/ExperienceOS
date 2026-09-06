import { IFileSystem } from "./FileSystem";
import { IRegistryAPI, ISystemComponent } from "./ISystemAPI";

export const DEFAULT_REGISTRY_PATH = "/System/configuration.sct";

/*
 * Registry Path Format:
 * 
 * VALID:
 * System/Something/Garbage
 * VALID, when the path points to a group (key):
 * System/Something/Other/
 * VALID:
 * /System/Something/Other
 * NOT USEFUL:
 * ./Other
 * Since the registry doesn't use working "groups" or "keys".
 */

export default class Registry implements ISystemComponent<IRegistryAPI>, IRegistry {
	private _fs: IFileSystem;
	private _src: string;
	private _cache: RegistryObject | undefined;

	public constructor(fs: IFileSystem) {
		this._fs = fs;
		this._src = DEFAULT_REGISTRY_PATH;
		this._cache = undefined;
	}

	public createApi(): IRegistryAPI {
		const self = this;
		return Object.freeze({
			getComponentDetails() {
				return {
					id: "systemct",
					name: "SystemCT Registry",
					icon: "",
					version: "1.0.0",
				};
			},

			groupExists(path) {
				return self.groupExists(path)
			},
			valueExists(path) {
				return self.nodeExists(path);
			},
			createGroup(path, recurse = false) {
				self.createGroup(path, recurse);
			},
			getValue(path) {
				return self.getNodeValue(path);
			},
			setValue(path, value) {
				self.setNodeValue(path, value);
			},
			getGroupItems(path) {
				return self.getGroupItems(path);
			},
			deleteGroup(path, recurse = false) {
				self.deleteGroup(path, recurse);
			},
			deleteValue(path) {
				self.deleteNode(path);
			},
		} satisfies IRegistryAPI);
	}

	public load(): void {
		try {
			this._cache = JSON.parse(this._fs.readFile(this._src));
		} catch {
			throw new RegistryError("Cannot access source file or source file is malformed.");
		}
	}

	public save(): void {
		try {
			this._fs.writeFile(this._src, JSON.stringify(this._cache));
		} catch {
			throw new RegistryError("Unable to save corrupted cached registry. The cache may contain invalid items.");
		}
	}

	public groupExists(path: string): boolean {
		this._throwIfUnloaded();

		const { finalNode } = this._traversePath(path);

		return finalNode !== undefined && finalNode.type === RegistryNodeType.GROUP;
	}

	public nodeExists(path: string): boolean {
		this._throwIfUnloaded();

		const { finalNode } = this._traversePath(path);

		return finalNode !== undefined && finalNode.type === RegistryNodeType.VALUE;
	}

	public createGroup(path: string, recurse: boolean): void {
		this._throwIfUnloaded();
		this._createGroup(path, recurse);
	}

	public getNodeValue<T>(path: string): T {
		this._throwIfUnloaded();

		const { finalNode } = this._traversePath(path);

		if (!finalNode)
			throw new RegistryError("Cannot access node.");
		if (finalNode.type !== RegistryNodeType.VALUE)
			throw new RegistryError("Node does not hold a value.");

		return finalNode.value as T;
	}

	public setNodeValue<T>(path: string, value: T): void {
		this._throwIfUnloaded();

		const { keysAlongPath, finalNode } = this._traversePath(path);

		if (!finalNode) {
			// Create node
			const groupPath = keysAlongPath.slice(0, keysAlongPath.length - 1).join("/");
			const finalNode = this._createGroup(groupPath, true);
			const lastKey = keysAlongPath[keysAlongPath.length - 1]!;

			finalNode.children[lastKey] = {
				type: RegistryNodeType.VALUE,
				value,
			};

			return;
		}

		if (finalNode.type !== RegistryNodeType.VALUE)
			throw new RegistryError("The specified node cannot hold a value.");

		finalNode.value = value;
	}

	public getGroupItems(path: string): string[] {
		this._throwIfUnloaded();

		const { keysAlongPath: keys, finalNode: group } = this._traversePath(path);
		
		if (!group)
			throw new RegistryError("Invalid group.");

		if (group.type !== RegistryNodeType.GROUP)
			throw new RegistryError("The specified path does not point to a group.");

		const realPath = keys.join("/") + "/";

		return Object.keys(group.children).map(n => realPath + n);
	}

	public deleteGroup(path: string, recurse: boolean): void {
		this._throwIfUnloaded();

		// TODO: Implement
		throw new RegistryError("Group deletion not implemented.");
	}

	public deleteNode(path: string): void {
		this._throwIfUnloaded();

		// TODO: Implement
		throw new RegistryError("Node deletion not implemented.");
	}

	private _throwIfUnloaded() {
		if (!this._cache)
			throw new RegistryError("Registry not loaded.");
		if (this._cache.type !== RegistryNodeType.GROUP)
			throw new RegistryError("Invalid registry root.");
	}

	private _createGroup(path: string, recurse: boolean): IRegistryGroup {
		const {
			keysAlongPath,
			nodesAlongPath,
		} = this._traversePath(path);

		for (let i = 0; i < nodesAlongPath.length; i++) {
			const node = nodesAlongPath[i];

			if (!node) {
				const prev = nodesAlongPath[i - 1];

				if (!prev || prev.type !== RegistryNodeType.GROUP)
					throw new RegistryError("Cannot create group inside non-group.");

				if (i < nodesAlongPath.length - 1 && !recurse)
					throw new RegistryError("Cannot reach target group.");

				nodesAlongPath[i] = prev.children[keysAlongPath[i]!] = {
					type: RegistryNodeType.GROUP,
					children: {},
				};
			}
		}

		return nodesAlongPath[nodesAlongPath.length - 1] as IRegistryGroup;
	}

	private _traversePath(path: string): {
		keysAlongPath: string[];
		nodesAlongPath: (RegistryObject | undefined)[];
		finalNode: RegistryObject | undefined;
	} {
		const keys: string[] = [""];
		const nodes: (RegistryObject | undefined)[] = [this._cache];
		const segments = path.split("/");

		let current = this._cache;

		loop: for (let i = 0; i < segments.length; i++) {
			const segment = segments[i]!;

			switch (segment) {
				case "":
				case ".":
					break;
				case "..": {
					if (nodes.length > 1)
						current = nodes[nodes.length - 2];
				} break;
				default: {
					if (current && current.type === RegistryNodeType.GROUP) {
						const child = current.children[segment];
						current = child;
					}
				} break;
			}

			if (segment !== "") {
				keys.push(segment);
				nodes.push(current);
			}
		}

		return {
			keysAlongPath: keys,
			nodesAlongPath: nodes,
			finalNode: nodes[nodes.length - 1],
		};
	}
}

export class RegistryError extends Error {
	public constructor(message?: string, errorOptions?: ErrorOptions) {
		super(message, errorOptions);
		this.name = "RegistryError";
	}
}

export interface IRegistryObject {
	type: RegistryNodeType;
}

export interface IRegistryGroup extends IRegistryObject {
	type: RegistryNodeType.GROUP,
	children: Record<string, RegistryObject>,
}

export interface IRegistryValue<T = unknown> extends IRegistryObject {
	type: RegistryNodeType.VALUE,
	value: T,
	valueType?: string;
}

export type RegistryObject = IRegistryGroup | IRegistryValue;

export enum RegistryNodeType {
	GROUP,
	VALUE,
}

export interface IRegistry {
	createApi(): IRegistryAPI;

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
	 * Returns a boolean indicating if the specified path points to a valid value node.
	 */
	nodeExists(path: string): boolean;

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

	/**
	 * Gets all item keys in a group.
	 */
	getGroupItems(path: string): string[];

	/**
	 * Deletes a group.
	 * @param recurse Deletes all sub-groups and sub-items.
	 * @throws If the group cannot be deleted.
	 */
	deleteGroup(path: string, recurse: boolean): void;

	/**
	 * Deletes a node.
	 * @throws If the node cannot be deleted.
	 */
	deleteNode(path: string): void;

	/*
	getKeys(key: string): string[];
	hasKey(key: string): boolean;
	getValue<T>(key: string): T;
	setValue<T>(key: string, value: T): void;
	createKey<T>(key: string, recurse: boolean): void;
	*/
}