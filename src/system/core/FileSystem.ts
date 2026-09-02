import { IFileSystemAPI } from "./ISystemAPI";

export const DEFAULT_COMPACTION_THRESHOLD = 100;

/**
 * The primary ExperienceOS file system,
 * aka. the expFS.
 */
export default class FileSystem implements IFileSystem {
	private _compactFreelistThreshold: number;
	private _nodeStore: INodeStore;
	private _root: IDirectoryNode | null;

	public constructor() {
		this._compactFreelistThreshold = DEFAULT_COMPACTION_THRESHOLD;
		this._nodeStore = {
			nodes: {},
			counter: 0,
			free: [],
			freeHead: 0,
		};
		this._root = this.allocateNode({
			type: "dir",
			id: 0,
			name: "",
			parentId: -1,
			children: {},
		} as IDirectoryNode);
	}

	public createApi(): IFileSystemAPI {
		const self = this;
		return Object.freeze({
			directoryExists(path) {
				const stat = self.stat(path);
				return !!stat && stat.type === "dir";
			},
			fileExists(path) {
				const stat = self.stat(path);
				return !!stat && stat.type === "file";
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
				if (!dir || dir.type !== "dir")
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
		} as IFileSystemAPI);
	}

	public traverse(path: string, cwd?: string): IFileSystemNode | null {
		const parts = path.split("/");
		let current = cwd ? this.traverse(cwd) : this._root;

		if (!current || current.type !== "dir") {
			return null;
		}

		for (const part of parts) {
			if (!current) {
				return null;
			}

			if (part === "" || part === ".") {
				continue;
			} else if (part === "..") {
				current = this._nodeStore.nodes[current?.parentId];
			} else {
				current = this._nodeStore.nodes[(current as IDirectoryNode).children[part]];
			}
		}

		return current;
	}

	public stat(path: string): IFileSystemNodeStatistics | null {
		const node = this.traverse(path);

		if (!node) {
			return null;
		}

		return {
			type: node.type,
		};
	}

	public readFile(path: string): string {
		const file = this.traverse(path);

		if (!file || file.type !== "file") {
			throw new FileSystemError("The specified path did not point to a valid file.");
		}

		return (file as IFileNode).content;
	}

	public writeFile(path: string, text: string): void {
		const nodes = this.getNodesAlong(path);
		const node = nodes[nodes.length - 1];

		if (!node) {
			throw new FileSystemError("Invalid path");
		}

		if (node.type === "dir") {

		}
	}

	public createDirectory(path: string, recurse: boolean): void {
		// TODO: implement 'recurse'

		const nodes = this.getNodesAlong(path);
		const node = nodes[nodes.length - 1];

		if (!node) {
			throw new FileSystemError("Invalid path");
		}

		if (node.type !== "dir")
			throw new FileSystemError("Target parent directory is invalid");

		const newNode = this.allocateNode({
			type: "dir",
			id: -1,
			parentId: node.id,
			children: {},
		} as IDirectoryNode);

		this.allocateNode(newNode);
	}

	public deleteDirectory(path: string, recurse: boolean): void {
		// TODO: implement
		throw new FileSystemError("Directory deletion not implemented.");
	}

	public deleteFile(path: string): void {
		// TODO: Implement
		throw new FileSystemError("File deletion not implemented.");
	}

	private getParentNodeOf(path: string): IFileSystemNode {
		// TODO: implement
		/*
		 * example:
		 * 
		 * a/b/c/d
		 * Return c's node.
		 * 
		 */
		throw new FileSystemError("NOT_IMPLEMENTED");
	}

	private getNodesAlong(path: string): IFileSystemNode[] {
		const parts = path.split("/");
		const nodes: IFileSystemNode[] = [];

		if (!this._root)
			throw new FileSystemError("Cannot access root!");

		let current: IFileSystemNode = this._root;

		for (const part of parts) {
			if (!current) {
				return nodes;
			}

			let node: IFileSystemNode;
			if (part === "" || part === ".") {
				continue;
			} else if (part === "..") {
				node = this._nodeStore.nodes[current?.parentId];
			} else {
				node = this._nodeStore.nodes[(current as IDirectoryNode).children[part]];
			}

			nodes.push(node);
			current = node;
		}

		return nodes;
	}

	private allocateNode<T extends IFileSystemNode>(node: T): T {
		if (this._nodeStore.freeHead < this._nodeStore.free.length) {
			const index = this._nodeStore.free[this._nodeStore.freeHead++];

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

	private freeNode<T extends IFileSystemNode>(node: T): boolean {
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

	private assignNodeMetadata(
		node: IFileSystemNode,
		owner?: string,
		userPerm?: AccessString,
		groupPerm?: AccessString,
		othersPerm?: AccessString
	): void {
		const user: AccessString = userPerm ||
			(node.type === "dir" ? "rwx" :
			node.type === "file" ? "rw-" : "rw-");
		const group: AccessString = groupPerm ||
			(node.type === "dir" ? "r-x" :
			node.type === "file" ? "r--" : "r--");
		const others: AccessString = othersPerm ||
			(node.type === "dir" ? "r-x" :
			node.type === "file" ? "r--" : "r--");

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
	traverse(path: string, cwd?: string): IFileSystemNode | null;

	/**
	 * Gets statistics of a file system node.
	 * @returns Node statistics, or if the path does not point to a valid node, `null` is returned instead.
	 */
	stat(path: string): IFileSystemNodeStatistics | null;

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

export type FileSystemNodeType = "file" | "dir" | "link";

/**
 * @deprecated
 * The IntelliSoft Web "HotLoad" FileSystem,
 * compatible with ExperienceOS.
 */
export const HLFileSystem = null;

export interface INodeStore {
	nodes: Record<number, IFileSystemNode>;
	free: number[];
	counter: number;
	freeHead: number;
};

export interface INodeMetadata {
	created: number;
	modified: number;
	owner: string;
	permissions: IAccess;
};

export interface IFileSystemNode {
	type: FileSystemNodeType;
	id: number;
	name: string;
	parentId: number;
	meta?: INodeMetadata;
};

export interface IFileNode extends IFileSystemNode {
	type: "file";
	content: string; // for simplicity, for now.
}

export interface IDirectoryNode extends IFileSystemNode {
	type: "dir";
	children: Record<string, number>;
}

export interface ILinkNode extends IFileSystemNode {
	type: "link";
	dest: string;
}

type ReadFlag = "r" | "-";
type WriteFlag = "w" | "-";
type ExecFlag = "x" | "-";

export type AccessString = `${ReadFlag}${WriteFlag}${ExecFlag}`;

export interface IAccess {
	user: AccessString;
	group: AccessString;
	others: AccessString;
};