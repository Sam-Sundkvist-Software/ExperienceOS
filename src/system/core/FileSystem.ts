import { IFileSystemAPI, ISystemComponent, ISystemComponentDetails } from "./ISystemAPI";

/**
 * The implementation for expFS.
 * @author Sam Sundkvist
 */
export default class FileSystem implements ISystemComponent<IFileSystemAPI>, IFileSystem {
	private static _componentDetails: Readonly<ISystemComponentDetails>;

	static {
		FileSystem._componentDetails = Object.freeze({
			id: "expfs",
			name: "File System",
			version: "2.0.0",
		} satisfies ISystemComponentDetails);
	}

	private _mounts: { [x: string]: IFileSystemMount };
	private _activeMount?: IFileSystemMount;

	public constructor() {
		const initialMount = this._createInitialMount();
		this._mounts = {
			[initialMount.name]: initialMount,
		};
		this._activeMount = initialMount;
	}

	private _createInitialMount(): IFileSystemMount {
		return {
			name: "c",
			storage: {
				nodes: {
					0: {
						type: FileSystemNodeType.DIRECTORY,
						id: 0,
						children: {},
					},
				},
				nextNodeIndex: 0,
				freeNodeIds: [],
			},
			rootNodeId: 0,
		};
	}

	private _resolveDirectoryNode(node?: FileSystemNode): IFileSystemDirectoryNode {
		if (node === undefined)
			throw new FileSystemError("Invalid node.");
		switch (node.type) {
			case FileSystemNodeType.LINK:
				return this._resolveDirectoryNode(this._resolvePath(node.targetPath));
			case FileSystemNodeType.DIRECTORY:
				return node;
			default:
				throw new FileSystemError("Cannot resolve directory node.");
		}
	}

	private _resolvePath(path: string): FileSystemNode {
		const parts = path.split("/");
		let currentMount: IFileSystemMount | undefined = this._activeMount;
		let currentNode: FileSystemNode | undefined = undefined;

		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];

			if (part === undefined)
				throw new FileSystemError(`Unexpected error during resolution of path "${path}".`);

			if (part === "")
				continue;

			if (part.endsWith(":")) {
				const wantedMountName = part.substring(0, part.length - 1);
				const mount = this._mounts[wantedMountName];

				if (mount == undefined)
					throw new FileSystemError(`Invalid mount "${wantedMountName}" encountered during resolution of path "${path}".`);

				currentMount = mount;
				currentNode = undefined;

				continue;
			}

			if (currentMount === undefined)
				throw new FileSystemError(`Active mount not defined, will not infer mount for path "${path}".`);

			if (currentNode === undefined) {
				const rootNode = currentMount.storage.nodes[currentMount.rootNodeId];

				if (rootNode === undefined)
					throw new FileSystemError(`Root not found for mount "${currentMount.name}" during resolution of path "${path}".`);

				try {
					currentNode = this._resolveDirectoryNode(rootNode);
				} catch (err) {
					throw new FileSystemError(
						`Root not valid directory for mount "${currentMount.name}" during resolution of path "${path}".`,
						{
							cause: err,
						}
					);
				}
			}

			switch (part) {
				case "":
				case ".":
					// Ignore
					break;
				case "..": {
					// Back
					try {
						const parentNodeId = currentNode.parentId;
						if (parentNodeId !== undefined)
							currentNode = this._resolveDirectoryNode(currentMount.storage.nodes[parentNodeId]);
					} catch (err) {
						throw new FileSystemError(
							`Encountered invalid parent node during resolution of path "${path}".`,
							{
								cause: err,
							}
						);
					}
				} break;
				default: {
					let currentDirectoryNode: IFileSystemDirectoryNode;
					try {
						currentDirectoryNode = this._resolveDirectoryNode(currentNode);
					} catch (err) {
						throw new FileSystemError(
							`Cannot obtain child of non-directory node for path "${path}".`,
							{
								cause: err,
							}
						);
					}
					const childNodeId = currentDirectoryNode.children[part];
					if (childNodeId === undefined)
						throw new FileSystemError(`Child node not found for path "${path}".`);
					currentNode = currentMount.storage.nodes[childNodeId];
				} break;
			}
		}

		if (currentNode === undefined)
			throw new FileSystemError(`Invalid node for path "${path}".`);

		return currentNode;
	}

	public createApi(): IFileSystemAPI {
		return {
			getComponentDetails() {
				return FileSystem._componentDetails;
			},
		};
	}

	public getNodeByIndex(nodeIndex: number, mountName?: string): FileSystemNode {
		if (mountName === undefined) {
			if (this._activeMount === undefined)
				throw new Error("No active mount.");
			mountName = this._activeMount.name;
		}
		const mount = this._mounts[mountName];
		if (mount === undefined)
			throw new Error("Invalid mount name specified.");
		const node = mount.storage.nodes[nodeIndex];
		if (node === undefined)
			throw new Error("Invalid node index.");
		return node;
	}

	public allocateNode(node: FileSystemNode, mountName?: string): FileSystemNode {
		if (mountName === undefined) {
			if (this._activeMount === undefined)
				throw new Error("No active mount.");
			mountName = this._activeMount.name;
		}
		const mount = this._mounts[mountName];
		if (mount === undefined)
			throw new Error("Invalid mount name specified.");
		if (mount.storage.freeNodeIds.length > 0) {
			// reuse freed node slot
			const nodeId = mount.storage.freeNodeIds.pop();
			if (nodeId === undefined)
				throw new Error("Unexpected invalid free node.");
			return mount.storage.nodes[nodeId] = node;
		}
		// create node
		return mount.storage.nodes[mount.storage.nextNodeIndex++] = node;
	}

	public releaseNode(nodeIndex: number, mountName?: string): void {
		if (mountName === undefined) {
			if (this._activeMount === undefined)
				throw new Error("No active mount.");
			mountName = this._activeMount.name;
		}
		const mount = this._mounts[mountName];
		if (mount === undefined)
			throw new Error("Invalid mount name specified.");
		mount.storage.freeNodeIds.push(nodeIndex);
	}

	public hasMount(name: string): boolean {
		return !!(this._mounts[name]);
	}

	public getMounts(): string[] {
		return Object.values(this._mounts).map(v => v.name);
	}

	public resolvePath(base: string, part: string): string {
		// TODO: implement
		return "";
	}

	public readFile(path: string): string {
		// TODO: implement
		return "";
	}

	public writeFile(path: string, text: string): void {
		// TODO: implement
	}

	public readDirectory(path: string): string[] {
		// TODO: implement
		return [];
	}

	public createDirectory(path: string, recurse: boolean): void {
		// TODO: implement
	}
}

/**
 * The interface for a simple file management system.
 */
export interface IFileSystem {
	createApi(): IFileSystemAPI;

	// Node management
	getNodeByIndex(nodeIndex: number, mountName?: string): FileSystemNode;
	allocateNode(node: FileSystemNode, mountName?: string): FileSystemNode;

	/**
	 * ***Do note,*** that the parent directory's node list must
	 * be adjusted on object removal.
	 */
	releaseNode(nodeIndex: number, mountName?: string): void;

	// Mount management
	hasMount(name: string): boolean;
	getMounts(): string[];

	/**
	 * Creates and resolves a valid path from a base and a part.
	 * @param base The base path.
	 * @param part The part to append.
	 * @returns A valid absolute path string.
	 * @throws If either the base or the part is invalid,
	 * or if the resulting path doesn't point to anything
	 * valid.
	 */
	resolvePath(base: string, part: string): string;

	/**
	 * Reads the contents of a file as a string.
	 * @param path The path to the relevant file.
	 * @throws If the specified path doesn't point to a valid file.
	 */
	readFile(path: string): string;

	/**
	 * Replaces the contents of a file with a string.
	 * @param path The path to the relevant file.
	 * @param text The text to replace the existing text with.
	 * @throws If the specified path doesn't point to a valid file.
	 */
	writeFile(path: string, text: string): void;

	/**
	 * Gets the contents of a directory.
	 * @param path The path to the relevant directory.
	 * @returns A list of names, each an item in the specified directory.
	 * @throws If the specified path doesn't point to a valid directory.
	 */
	readDirectory(path: string): string[];

	/**
	 * Creates a directory.
	 * @param path The path to create the directory at.
	 * @param recurse Whether to create missing directories along the path.
	 * If `false`, directory creation will fail if one of the necessary
	 * directories in the path doesn't exist.
	 */
	createDirectory(path: string, recurse: boolean): void;
}

export class FileSystemError extends Error {
	constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "FileSystemError";
	}
}

export interface IFileSystemNodeStorage {
	nodes: { [id: number]: FileSystemNode };
	nextNodeIndex: number;
	freeNodeIds: number[];
}

export interface IFileSystemMount {
	name: string;
	storage: IFileSystemNodeStorage;
	rootNodeId: number;
}

export enum FileSystemNodeType {
	FILE = "file",
	DIRECTORY = "dir",
	LINK = "link",
}

export interface IFileSystemNodeMetadata {
	createdAt: number;
	access?: FileSystemAccess;
}

export enum Permission {
	READ    = 1 << 0,
	WRITE   = 1 << 1,
	EXECUTE = 1 << 2,
	DELETE  = 1 << 3,
}

export type FileSystemAccessEntry = [allow: boolean, permission: Permission];

export type FileSystemAccess = { [userId: string]: FileSystemAccessEntry[] };

export interface IFileSystemNode {
	type: FileSystemNodeType;
	id: number;
	parentId?: number;
	meta?: IFileSystemNodeMetadata;
}

export interface IFileSystemFileNode extends IFileSystemNode {
	type: FileSystemNodeType.FILE;
	content: string;
}

export interface IFileSystemDirectoryNode extends IFileSystemNode {
	type: FileSystemNodeType.DIRECTORY;
	children: { [x: string]: number; };
}

export interface IFileSystemLinkNode extends IFileSystemNode {
	type: FileSystemNodeType.LINK;
	targetPath: string;
}

export type FileSystemNode =
	| IFileSystemFileNode
	| IFileSystemDirectoryNode
	| IFileSystemLinkNode
	;