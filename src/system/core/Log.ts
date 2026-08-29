export default class Log implements ILog {
	public constructor() {
	}

	public write(...options: unknown[]): void {
		console.log(...options);
	}

	public writeError(...options: unknown[]): void {
		console.error(...options);
	}

	public writeWarning(...options: unknown[]): void {
		console.warn(...options);
	}

	public writeInfo(...options: unknown[]): void {
		console.info(...options);
	}
}

export class LogError extends Error {
	public constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "LogError";
	}
}

export interface ILog {
	write(...options: unknown[]): void;
	writeError(...options: unknown[]): void;
	writeWarning(...options: unknown[]): void;
	writeInfo(...options: unknown[]): void;
}