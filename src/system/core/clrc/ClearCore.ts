
/**
 * The improved central (UI) component framework for ExperienceOS.
 */
export default class ClearCore implements IClearCore {
	private _apps: { [id: string]: IClearCoreApp; };

	public constructor() {
		this._apps = {};
	}

	public addApp(app: IClearCoreApp): string {
		if (!app)
			throw new ClearCoreError("Invalid app.");

		const id = app.id;

		if (this._apps[id])
			throw new ClearCoreError("App with an identical ID already registered.");

		this._apps[id] = app;

		return id;
	}

	public removeApp(id: string): void {
		if (!this._apps[id])
			return;

		delete this._apps[id];
	}

	public startApp(id: string): void {
		const app = this._apps[id];

		if (!app)
			throw new ClearCoreError("App not found.");

		app.start();
	}

	public stopApp(id: string): void {
		const app = this._apps[id];

		if (!app)
			throw new ClearCoreError("App not found.");

		app.stop();
	}

	public appExists(id: string): boolean {
		return !!this._apps[id];
	}

	public isAppRunning(id: string): boolean {
		const app = this._apps[id];

		if (!app)
			throw new ClearCoreError("App not found.");

		return app.isRunning();
	}
}

export interface IClearCore {
	/**
	 * Adds an app to the ClearCore database.
	 * @returns The app ID.
	 */
	addApp(app: IClearCoreApp): string;
	removeApp(id: string): void;
	startApp(id: string): void;
	stopApp(id: string): void;
	appExists(id: string): boolean;
	isAppRunning(id: string): boolean;
}

export class ClearCoreError extends Error {
	public constructor(message?: string, options?: ErrorOptions) {
		super(message, options);
		this.name = "ClearCoreError";
	}
}

export class ClearCoreApp implements IClearCoreApp {
	private _config: IClearCoreAppConfig;
	private _actionFunctions: { [id: string]: (...args: unknown[]) => void; }

	private _id: string;
	private _isRunning: boolean;

	public get id() {
		return this._id;
	}

	public constructor(config: IClearCoreAppConfig) {
		this._config = config;
		this._actionFunctions = {};

		this._validateConfig();

		this._id = this._config.meta.id;
		this._isRunning = false;
	}

	private _validateConfig() {
		// TODO: Validate config
	}

	public start(): void {
		if (this._isRunning)
			return;

		this._isRunning = true;
	}

	public stop(): void {
		if (!this._isRunning)
			return;

		this._isRunning = false;
	}

	public isRunning(): boolean {
		return this._isRunning;
	}

	public addActionFunction(id: string, func: (...args: unknown[]) => unknown): void {
		// TODO: throw?
		if (!func || typeof func !== "function")
			throw new ClearCoreError("The provided function is invalid.");

		if (this._actionFunctions[id])
			throw new ClearCoreError("Cannot replace a function with the same id.");

		this._actionFunctions[id] = func;
	}

	public removeActionFunction(id: string): void {
		if (!this._actionFunctions[id])
			return;

		delete this._actionFunctions[id];
	}

	public invokeActionFunction(id: string, ...args: unknown[]): unknown {
		const func = this._actionFunctions[id];

		if (!func || typeof func !== "function")
			throw new ClearCoreError("A function by the provided id does not exist or is invalid.");

		return func(...args);
	}

	public actionFunctionExists(id: string): boolean {
		const func = this._actionFunctions[id];
		return !!func && typeof func === "function";
	}
}

export interface IClearCoreApp {
	readonly id: string;
	start(): void;
	stop(): void;
	isRunning(): boolean;
	addActionFunction(id: string, func: (...args: unknown[]) => unknown): void;
	removeActionFunction(id: string): void;
	invokeActionFunction(id: string, ...args: unknown[]): unknown;
	actionFunctionExists(id: string): boolean;
}

export interface IClearCoreAppConfig {

	/**
	 * The mandatory ClearCore type property.
	 */
	type: "clrcApp";

	/**
	 * The ClearCore version to use.
	 */
	version: string;

	/**
	 * ClearCore Application metadata.
	 */
	meta: {
		id: string;
		name: string;
		author: string;
		description: string;
	};

	/**
	 * The configuration for the primary ClearCore window.
	 */
	windowConfig: {
		/**
		 * Specifies the initial (and minimum) width of the window client area.
		 */
		width?: number;

		/**
		 * Specifies the initial (and minimum) height of the window client area.
		 */
		height?: number;

		/**
		 * Specifies if the window is resizable.  
		 * If `true`, the window is resizable along both axes.
		 * @default false
		 */
		resizable?: boolean | {
			/**
			 * Specifies if the window is resizable on the x-axis.
			 * @default false
			 */
			x?: boolean;

			/**
			 * Specifies if the window is resizable on the y-axis.
			 * @default false
			 */
			y?: boolean;
		};
	};

	/**
	 * The primary view content. When left undefined, no useful UI is drawn.
	 */
	viewContent?: ClearCoreViewControl;

	/**
	 * The action definitions, such as for button clicks or link clicks.
	 */
	actions: {
		[actionId: string]: ClearCoreAction;
	};

}

export interface IClearCoreAction {
	// TODO: Implement action system
}

/**
 * An invocable action. Either a TS/JS function identifier or a declarative JSON action.
 */
export type ClearCoreAction = string | IClearCoreAction;

export enum ClearCoreViewControlType {
	DEFAULT = "",

	// Regular
	PANEL = "panel",
	LABEL = "label",
	BUTTON = "button",
	INPUT = "input",

}

export interface IClearCoreViewControl {
	type: ClearCoreViewControlType;

	/**
	 * The ID of the view control, used for retrieving values or setting text.
	 */
	id?: string;

	/**
	 * @default true
	 */
	visible?: boolean;

	/**
	 * @default false
	 */
	disabled?: boolean;
}

export enum ClearCorePanelViewControlPanelType {
	DEFAULT = "flow",

	FLOW = "flow",
	GRID = "grid",
}

export interface IClearCorePanelViewControl extends IClearCoreViewControl {
	type: ClearCoreViewControlType.PANEL;
	panelType: ClearCorePanelViewControlPanelType;
	controls?: ClearCoreViewControl[];
}

export interface IClearCoreLabelViewControl extends IClearCoreViewControl {
	type: ClearCoreViewControlType.LABEL;
	text?: string;
}

export interface IClearCoreButtonViewControl extends IClearCoreViewControl {
	type: ClearCoreViewControlType.BUTTON;
	text?: string;
	action?: string;
}

export enum ClearCoreInputViewControlInputType {
	DEFAULT = "text",

	TEXT = "text",
	INTEGER = "integer",
	DECIMAL = "decimal",
	CHECKBOX = "checkbox",
	RADIOBUTTON = "radiobutton",
	SELECT = "select",
}

export interface IClearCoreInputViewControl extends IClearCoreViewControl {
	type: ClearCoreViewControlType.INPUT;
	inputType: ClearCoreInputViewControlInputType;
}

export interface IClearCoreTextInputViewControl extends IClearCoreInputViewControl {
	inputType: ClearCoreInputViewControlInputType.TEXT;
	initialText?: string;
	placeholderText?: string;
	maxLength?: number;
	freeSize?: boolean;
}

export interface IClearCoreIntegerInputViewControl extends IClearCoreInputViewControl {
	inputType: ClearCoreInputViewControlInputType.INTEGER;
	initialInteger?: number;
	placeholderText?: string;
	minValue?: number;
	maxValue?: number;
}

export interface IClearCoreDecimalInputViewControl extends IClearCoreInputViewControl {
	inputType: ClearCoreInputViewControlInputType.DECIMAL;
	initialDecimal?: number;
	placeholderText?: string;
	minValue?: number;
	maxValue?: number;
	maxDecimals?: number;
}

export interface IClearCoreCheckboxInputViewControl extends IClearCoreInputViewControl {
	inputType: ClearCoreInputViewControlInputType.CHECKBOX;
	initialState?: boolean;
}

export interface IClearCoreRadioButtonInputViewControl extends IClearCoreInputViewControl {
	inputType: ClearCoreInputViewControlInputType.RADIOBUTTON;
	initialState?: boolean;
	buttonGroupId?: string;
}

export interface IClearCoreSelectInputViewControl extends IClearCoreInputViewControl {
	inputType: ClearCoreInputViewControlInputType.SELECT;
	/**
	 * @default -1
	 */
	initialIndex?: number;
	items?: string[];
}

export type ClearCoreInputViewControl =
	| IClearCoreTextInputViewControl
	| IClearCoreIntegerInputViewControl
	| IClearCoreDecimalInputViewControl
	| IClearCoreCheckboxInputViewControl
	| IClearCoreRadioButtonInputViewControl
	| IClearCoreSelectInputViewControl
	;

export type ClearCoreViewControl =
	| IClearCorePanelViewControl
	| IClearCoreLabelViewControl
	| IClearCoreButtonViewControl
	| ClearCoreInputViewControl
	;
