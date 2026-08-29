import Kernel, { IKernel } from "./Kernel";
import Log, { ILog } from "./Log";


/**
 * The boot-up manager (BootCore) for ExperienceOS.
 */
export default class BootCore implements IBootCore {
	private _log: ILog;
	private _kernel: IKernel;

	public constructor() {
		this._log = new Log();
		this._kernel = new Kernel();
	}

	public startBoot(): void {
		try {
			this._log.write("Launching kernel...");
			this._kernel.launch();
		} catch {
			throw new BootError("The kernel failed to launch.");
		}
	}
}

export class BootError extends Error {
	public constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "BootError";
	}
}

export interface IBootCore {
	/**
	 * Starts the boot process.
	 */
	startBoot(): void;
}