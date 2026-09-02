import Kernel, { IKernel } from "./Kernel";
import Log, { ILog } from "./Log";


/**
 * The boot-up manager (BootCore) for ExperienceOS.
 */
export default class BootCore implements IBootCore {
	private _rootElement: HTMLElement;
	private _log: ILog;
	private _kernel: IKernel;

	public constructor(rootElement: HTMLElement) {
		this._rootElement = rootElement;
		this._log = new Log();
		this._kernel = new Kernel(rootElement);
	}

	public startBoot(): void {
		this._log.write("Launching kernel...");
		try {
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