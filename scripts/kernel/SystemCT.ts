import { HLFileSystem, IFileSystem } from "./FileSystem";

export type ConfigEntryType =
    | "number"
    | "string"
    | "list"
    ;

export interface ConfigEntry {
    type: ConfigEntryType;
    name: string;
    value?: unknown;

    parent?: ConfigEntry;
}

/**
 * The System Configuration Table (SystemCT) API interface.
 */
export interface ISystemCT {

}

/**
 * The primary system configuration table (SystemCT) implementation
 * for ExperienceOS and the {@link ISystemCT} API interface.
 * @param fs The primary File System API interface.
 * @returns The SCT access interface.
 */
export const SystemCT = (fs: IFileSystem): ISystemCT => {
    const SCT_FILE_PATH = "/System/Configuration.sct";

    const sctCache = {};

    const helpers = {
        flushToDisk: () => {

        },
    };

    return {

    };
};