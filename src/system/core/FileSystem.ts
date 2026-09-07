import { IFileSystemAPI, ISystemComponent } from "./ISystemAPI";
import fsImage from "@/data/fsImage.json";

export const DEFAULT_COMPACTION_THRESHOLD = 100;

/**
 * The primary ExperienceOS file system,
 * aka. the expFS.
 */
export default class FileSystem implements ISystemComponent<IFileSystemAPI>, IFileSystem {
	private _compactFreelistThreshold: number;
	private _nodeStore: INodeStore;
	private _root: IDirectoryNode | undefined;

	public constructor() {
		this._compactFreelistThreshold = DEFAULT_COMPACTION_THRESHOLD;
		this._nodeStore = {
			nodes: {},
			counter: 0,
			free: [],
			freeHead: 0,
		};
		this._root = this._allocateNode({
			type: FileSystemNodeType.DIRECTORY,
			id: 0,
			name: "",
			parentId: -1,
			children: {},
		} satisfies IDirectoryNode);

		// Configure FS image
		this._initializeImage();
	}

	private _initializeImage() {
		this.createDirectory("C:", false);
		this.createDirectory("C:/System", false);
		this.createFile("C:/System/configuration.sct");
		//this.writeFile("C:/System/configuration.sct", "{}");
	}

	private _getNodesAlong(path: string): (FileSystemNode | undefined)[] {
		const parts = path.split("/");
		
		if (!this._root)
			throw new FileSystemError("Cannot access root.");

		const nodes: (FileSystemNode | undefined)[] = [this._root];

		let current: FileSystemNode | undefined = this._root;

		for (const part of parts) {
			if (!current || current.type !== FileSystemNodeType.DIRECTORY) {
				return nodes;
			}

			let node: FileSystemNode | undefined;
			if (part === "" || part === ".") {
				continue;
			} else if (part === "..") {
				const parentNode: FileSystemNode | undefined = this._nodeStore.nodes[current.parentId];
				node = parentNode;
			} else {
				const childNodeId: number | undefined = current.children[part];
				if (childNodeId !== undefined) {
					const childNode: FileSystemNode | undefined = this._nodeStore.nodes[childNodeId];
					node = childNode;
				}
			}

			nodes.push(node);
			current = node;
		}

		return nodes;
	}

	private _allocateNode<T extends FileSystemNode>(node: T): T {
		if (this._nodeStore.freeHead < this._nodeStore.free.length) {
			const index = this._nodeStore.free[this._nodeStore.freeHead++]!;
			this._nodeStore.nodes[index] = node;
			node.id = index;

			if (this._nodeStore.freeHead === this._nodeStore.free.length) {
				this._nodeStore.free = [];
				this._nodeStore.freeHead = 0;
			}

			if (this._nodeStore.freeHead > this._compactFreelistThreshold) {
				this._nodeStore.free = this._nodeStore.free.slice(this._nodeStore.freeHead);
				this._nodeStore.freeHead = 0;
			}

			return node;
		}

		const index = this._nodeStore.counter++;
		this._nodeStore.nodes[index] = node;
		node.id = index;

		return node;
	}

	private _freeNode<T extends FileSystemNode>(node: T): boolean {
		if (this._nodeStore.nodes[node.id] !== node) {
			return false;
		}

		if (node.id === this._nodeStore.counter - 1) {
			return delete this._nodeStore.nodes[--this._nodeStore.counter];
		}

		if (!delete this._nodeStore.nodes[node.id])
			return false;

		this._nodeStore.free.push(node.id);

		return true;
	}

	private _assignNodeMetadata(
		node: IFileSystemNode,
		owner?: string,
		userPerm?: AccessString,
		groupPerm?: AccessString,
		othersPerm?: AccessString
	): void {
		const user: AccessString = userPerm ||
			(node.type === FileSystemNodeType.DIRECTORY ? "rwx" :
			node.type === FileSystemNodeType.FILE ? "rw-" : "rw-");
		const group: AccessString = groupPerm ||
			(node.type === FileSystemNodeType.DIRECTORY ? "r-x" :
			node.type === FileSystemNodeType.FILE ? "r--" : "r--");
		const others: AccessString = othersPerm ||
			(node.type === FileSystemNodeType.DIRECTORY ? "r-x" :
			node.type === FileSystemNodeType.FILE ? "r--" : "r--");

		const now = Date.now();

		node.meta = {
			created: now,
			modified: now,
			owner: owner || "",
			permissions: {
				user,
				group,
				others,
			},
		};
	}

	private _getParentNodeOf(path: string): IDirectoryNode {
		/*
		 * example:
		 * 
		 * a/b/c/d
		 * Return c's node.
		 * 
		 */
		
		const parts = path.split("/");

		if (!this._root)
			throw new FileSystemError("Cannot access root.");

		let current: FileSystemNode = this._root;

		// Ignore final component
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];

			if (!part || part === ".")
				continue;

			if (part === "..") {
				const parent: FileSystemNode | undefined = this._nodeStore.nodes[current.parentId];

				if (parent === undefined)
					throw new FileSystemError("Invalid path.");

				current = parent;
				continue;
			}

			if (current.type !== FileSystemNodeType.DIRECTORY)
				throw new FileSystemError("Path component is not a directory.");

			const childId: number | undefined = current.children[part];

			if (childId === undefined)
				throw new FileSystemError("Parent directory does not exist.");

			const child: FileSystemNode | undefined = this._nodeStore.nodes[childId];

			if (!child)
				throw new FileSystemError("Filesystem node is missing.");

			current = child;
		}

		if (current.type !== FileSystemNodeType.DIRECTORY)
			throw new FileSystemError("Parent is not a directory");

		return current;
	}

	public createApi(): IFileSystemAPI {
		const self = this;
		return Object.freeze({
			getComponentDetails() {
				return {
					id: "expfs",
					name: "ExperienceOS File System",
					icon: "",
					version: "1.0.0",
				};
			},

			directoryExists(path) {
				const stat = self.stat(path);
				return !!stat && stat.type === FileSystemNodeType.DIRECTORY;
			},
			fileExists(path) {
				const stat = self.stat(path);
				return !!stat && stat.type === FileSystemNodeType.FILE;
			},
			createDirectory(path, recurse = false) {
				self.createDirectory(path, recurse);
			},
			createFile(path, overwrite = false) {
				if (!overwrite && !!self.stat(path))
					throw new FileSystemError("File already exists.");
				self.writeFile(path, "");
			},
			readDirectory(path) {
				const dir = self.traverse(path);
				if (!dir || dir.type !== FileSystemNodeType.DIRECTORY)
					throw new FileSystemError("Directory does not exist.");
				return Object.keys((dir as IDirectoryNode).children);
			},
			readFile(path) {
				return self.readFile(path);
			},
			deleteDirectory(path, recurse = false) {
				self.deleteDirectory(path, recurse);
			},
			deleteFile(path) {
				self.deleteFile(path);
			},
		} satisfies IFileSystemAPI);
	}

	public traverse(path: string, cwd?: string): FileSystemNode | undefined {
		const parts = path.split("/");
		let current = cwd ? this.traverse(cwd) : this._root;

		if (!current || current.type !== FileSystemNodeType.DIRECTORY)
			return undefined;

		for (const part of parts) {
			if (!current)
				return undefined;

			if (part === "" || part === ".")
				continue;
			else if (part === "..")
				current = this._nodeStore.nodes[current?.parentId];
			else
				current = this._nodeStore.nodes[(current as IDirectoryNode).children[part]!];
		}

		return current;
	}

	public stat(path: string): IFileSystemNodeStatistics | undefined {
		const node = this.traverse(path);

		if (!node) {
			return undefined;
		}

		return {
			type: node.type,
		};
	}

	public readFile(path: string): string {
		const file = this.traverse(path);

		if (!file || file.type !== FileSystemNodeType.FILE) {
			throw new FileSystemError("The specified path did not point to a valid file.");
		}

		return (file as IFileNode).content;
	}

	public writeFile(path: string, text: string): void {
		const nodes = this._getNodesAlong(path);
		const node = nodes[nodes.length - 1];

		if (!node) {
			throw new FileSystemError("Invalid path.");
		}

		if (node.type !== FileSystemNodeType.FILE) {
			throw new FileSystemError("Cannot replace object of different type.");
		}

		node.content = text;
	}

	public createFile(path: string, overwrite = false): void {
		const parts = path.split("/");
		const name = parts[parts.length - 1];

		if (!name || name === ".")
			throw new FileSystemError("Invalid file name.");

		const parent = this._getParentNodeOf(path);
		const existingId = parent.children[name];

		if (existingId !== undefined) {
			const existing = this._nodeStore.nodes[existingId];

			if (!existing)
				throw new FileSystemError("Filesystem node is missing.");

			if (existing.type !== FileSystemNodeType.FILE)
				throw new FileSystemError("A non-file object already exists at the specified path.");

			if (!overwrite)
				throw new FileSystemError("File already exists.");

			existing.content = "";
			return;
		}

		const file = this._allocateNode({
			type: FileSystemNodeType.FILE,
			id: -1,
			name,
			parentId: parent.id,
			content: "",
		} satisfies IFileNode);

		parent.children[name] = file.id;
	}

	public createDirectory(path: string, recurse: boolean): void {
		// TODO: implement 'recurse'

		const parts = path.split("/");
		const name = parts[parts.length - 1];

		if (!name || name === ".")
			throw new FileSystemError("Invalid directory name.");

		const parent = this._getParentNodeOf(path);

		if (parent.children[name] !== undefined) {
			const existing = this._nodeStore.nodes[parent.children[name]];

			if (existing?.type === FileSystemNodeType.DIRECTORY)
				return;

			throw new FileSystemError("A non-directory object already exists at the specified path.");
		}

		const newNode = this._allocateNode({
			type: FileSystemNodeType.DIRECTORY,
			id: -1,
			name,
			parentId: parent.id,
			children: {},
		} satisfies IDirectoryNode);

		parent.children[name] = newNode.id;
	}

	public deleteDirectory(path: string, recurse: boolean): void {
		// TODO: implement
		throw new FileSystemError("Directory deletion not implemented.");
	}

	public deleteFile(path: string): void {
		// TODO: Implement
		throw new FileSystemError("File deletion not implemented.");
	}
}

export class FileSystemError extends Error {
	public constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "FileSystemError";
	}
}

export interface IFileSystem {
	createApi(): IFileSystemAPI;

	/**
	 * Attempts to resolve the specified path to a file system node.
	 * @returns The resolved node, or `null` if no valid node was found.
	 */
	traverse(path: string, cwd?: string): FileSystemNode | undefined;

	/**
	 * Gets statistics of a file system node.
	 * @returns Node statistics, or if the path does not point to a valid node, `null` is returned instead.
	 */
	stat(path: string): IFileSystemNodeStatistics | undefined;

	/**
	 * Reads the contents of a valid file and returns them as a string.
	 * @throws If the file is inaccessible or does not exist.
	 */
	readFile(path: string): string;

	/**
	 * Creates or overwrites a file with the specified string contents.
	 * @throws If one or more of the directories in the path do not exist.
	 */
	writeFile(path: string, text: string): void;

	/**
	 * Creates a file at the specified path.
	 * @param overwrite Whether to overwrite an existing file at the specified path.
	 */
	createFile(path: string, overwrite?: boolean): void;

	/**
	 * Creates a directory, or does nothing if the directory already exists.
	 * @param recurse Creates all directories along a path to be able to create the deepest directory.
	 * @throws If the directory cannot be created.
	 */
	createDirectory(path: string, recurse: boolean): void;

	/**
	 * Deletes a directory.
	 * @param recurse Deletes all contents and subdirectories automatically.
	 * @throws If the directory cannot be deleted.
	 */
	deleteDirectory(path: string, recurse: boolean): void;

	/**
	 * Deletes a file.
	 * @throws If the file cannot be deleted.
	 */
	deleteFile(path: string): void;
}

export interface IMountable {
	/**
	 * The primary unique integer identifier.
	 */
	id: number;

	/**
	 * The drive root identifier, which comes before
	 * `:/...`, for example "C" for "C:/...".
	 */
	rootId: string;
}

export interface IFileSystemNodeStatistics {
	type: FileSystemNodeType;
	// Extend if necessary.
}

export enum FileSystemNodeType {
	FILE,
	DIRECTORY,
	LINK,
}

/**
 * @deprecated
 * The IntelliSoft Web "HotLoad" FileSystem,
 * compatible with ExperienceOS.
 */
export const HLFileSystem = null;

export interface INodeStore {
	nodes: Record<number, FileSystemNode>;
	free: number[];
	counter: number;
	freeHead: number;
}

export interface INodeMetadata {
	created: number;
	modified: number;
	owner: string;
	permissions: IAccess;
}

export interface IFileSystemNode {
	type: FileSystemNodeType;
	id: number;
	name: string;
	parentId: number;
	meta?: INodeMetadata;
}

export interface IFileNode extends IFileSystemNode {
	type: FileSystemNodeType.FILE;
	content: string; // for simplicity, for now.
}

export interface IDirectoryNode extends IFileSystemNode {
	type: FileSystemNodeType.DIRECTORY;
	children: Record<string, number>;
}

export interface ILinkNode extends IFileSystemNode {
	type: FileSystemNodeType.LINK;
	dest: string;
}

export type FileSystemNode = IFileNode | IDirectoryNode | ILinkNode;

type ReadFlag = "r" | "-";
type WriteFlag = "w" | "-";
type ExecFlag = "x" | "-";

export type AccessString = `${ReadFlag}${WriteFlag}${ExecFlag}`;

export interface IAccess {
	user: AccessString;
	group: AccessString;
	others: AccessString;
};