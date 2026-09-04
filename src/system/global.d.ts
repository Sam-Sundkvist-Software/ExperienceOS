import ISystemAPI from "./core/ISystemAPI";

declare global {
	/**
	 * The primary contract for expOS runtime applications.
	 * This should be the type of the default export of a runtime module.
	 */
	interface IRTApp {
		readonly information: {
			id: string;
			name: string;
			version: string;
			description?: string;
			icon?: string;
		};

		start(api?: ISystemAPI): void;
		stop(): void;
		queryDetails?(): unknown;
	}
}

export {};