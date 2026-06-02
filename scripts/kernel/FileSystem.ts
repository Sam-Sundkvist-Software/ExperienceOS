/**
 * The API interface for a file system supported by ExperienceOS.
 */
export interface IFileSystem {
    traverse(path: string, cwd?: string): FileSystemNode | undefined;

    readFile(path: string): string | undefined;
    writeFile(path: string, text: string): boolean;
}

/**
 * The IntelliSoft Web "HotLoad" FileSystem,
 * compatible with ExperienceOS.
 */
export const HLFileSystem = (): IFileSystem => {
    const compactFreelistThreshold = 100;
    const nodeStore: NodeStore = {
        nodes: {},
        counter: 0,
        free: [],
        freeHead: 0,
    };

    let root: DirectoryNode | null = null;

    const helpers = {
        allocateNode: <T extends FileSystemNode>(node: T) => {
            if (nodeStore.freeHead < nodeStore.free.length) {
                const index = nodeStore.free[nodeStore.freeHead++];

                nodeStore.nodes[index] = node;
                node.id = index;

                if (nodeStore.freeHead === nodeStore.free.length) {
                    nodeStore.free = [];
                    nodeStore.freeHead = 0;
                }

                if (nodeStore.freeHead > compactFreelistThreshold) {
                    nodeStore.free = nodeStore.free.slice(nodeStore.freeHead);
                    nodeStore.freeHead = 0;
                }

                return node;
            }

            const index = nodeStore.counter++;
            nodeStore.nodes[index] = node;
            node.id = index;

            return node;
        },
        freeNode: <T extends FileSystemNode>(node: T) => {
            if (nodeStore.nodes[node.id] !== node) {
                return false;
            }

            if (node.id === nodeStore.counter - 1) {
                return delete nodeStore.nodes[--nodeStore.counter];
            }

            if (!delete nodeStore.nodes[node.id])
                return false;

            nodeStore.free.push(node.id);

            return true;
        },
        assignNodeMetadata: (
            node: FileSystemNode,
            owner?: string,
            userPerm?: AccessString,
            groupPerm?: AccessString,
            othersPerm?: AccessString
        ) => {
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
        },
        createRoot: () => {
            root = helpers.allocateNode({
                type: "dir",
                id: -1,
                name: "",
                children: {},
            });
        },
    };

    helpers.createRoot();

    return {
        traverse(path: string, cwd?: string): FileSystemNode | undefined {
            const parts = path.split("/");

            if (!root)
                throw new Error("Root not mounted");

            let current: FileSystemNode | undefined = root;

            if (path.startsWith("/"))
                current = root;

            for (let i = 0; i < parts.length; i++) {
                if (!current)
                    break;
                if (current.type === "file")
                    break;
                if (current.type === "link") {
                    current = this.traverse(current.dest);
                    i--;
                    continue;
                }
                const part = parts[i];
                current = nodeStore.nodes[(current as DirectoryNode).children[part]];
            }

            return current;
        },

        readFile(path: string) {
            //return string when file read successfully and
            // undefined when file not found or read failed
        },

        writeFile(path: string, text: string) {
            const encoder = new TextEncoder();
            //encoder.encodeInto();
            //make return false if file not found or
            // other write failure
            return true;
        },
    };
};

export type NodeStore = {
    nodes: Record<number, FileSystemNode>;
    free: number[];
    counter: number;
    freeHead: number;
};

export type NodeMetadata = {
    created: number;
    modified: number;
    owner: string;
    permissions: Access;
};

export type BaseNode = {
    id: number;
    name: string;
    meta?: NodeMetadata;
};

export type FileNode = {
    type: "file";
    content: Uint8Array;
} & BaseNode;

export type DirectoryNode = {
    type: "dir";
    children: Record<string, number>;
} & BaseNode;

export type SymLinkNode = {
    type: "link";
    dest: string;
} & BaseNode;

export type FileSystemNode = FileNode | DirectoryNode | SymLinkNode;

type ReadFlag = "r" | "-";
type WriteFlag = "w" | "-";
type ExecFlag = "x" | "-";

export type AccessString = `${ReadFlag}${WriteFlag}${ExecFlag}`;

export type Access = {
    user: AccessString;
    group: AccessString;
    others: AccessString;
};