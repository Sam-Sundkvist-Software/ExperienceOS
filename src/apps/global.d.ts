import { ILegacySystemAPI } from "@/system/api";
import { FCCF as CompFwk } from "@/system/compfwk";

declare global {
	interface IApplication {
		main(args: { [x: string]: unknown }, FCCF: typeof CompFwk, XP_API: ILegacySystemAPI, VFS: typeof XP_API.FS, close: () => void): unknown;
	}
}

export {};