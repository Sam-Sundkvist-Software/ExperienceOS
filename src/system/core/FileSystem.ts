import { IFileSystemAPI, ISystemComponent, ISystemComponentDetails } from "./ISystemAPI";

/**
 * The implementation for expFS.
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

	public constructor() {

	}

	public createApi(): IFileSystemAPI {
		return {
			getComponentDetails() {
				return FileSystem._componentDetails;
			},
		};
	}

	public hasMount(name: string): boolean {
		// TODO: implement
		return false;
	}

	public getMounts(): string[] {
		// TODO: implement
		return [];
	}
}

/**
 * The interface for a simple file management system.
 */
export interface IFileSystem {
	// Mount management
	hasMount(name: string): boolean;
	getMounts(): string[];
}

export interface IFileSystemNodeStorage {
	nodes: { [id: number]: FileSystemNode };
	nodeHead: number;
	freeNodeIds: number[];
	freeNodeIdHead: number;
}

export interface IFileSystemMount {
	name: string;
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
	READ =		1 << 0,
	WRITE = 	1 << 1,
	EXECUTE =	1 << 2,
	DELETE =	1 << 3,
}

export type FileSystemAccessEntry = [allow: boolean, permission: Permission];

export type FileSystemAccess = { [userId: string]: FileSystemAccessEntry[] };

export interface IFileSystemNode {
	type: FileSystemNodeType;
	id: number;
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