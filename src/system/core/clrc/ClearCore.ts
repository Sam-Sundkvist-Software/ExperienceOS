
/**
 * The improved central (UI) component framework for ExperienceOS.
 */
export default class ClearCore implements IClearCore {

	public constructor() {

	}

}

export interface IClearCore {

	

}

export interface IClearCoreAppConfig {

	type: "clrcApp";

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

	viewContent: {

	}
}

export enum ClearCoreViewControlType {
	DEFAULT = "",

	// Regular
	PANEL = "PANEL",
	LABEL = "label",
	BUTTON = "button",
	INPUT = "input",

}

export interface IClearCoreViewControl {
	type: ClearCoreViewControlType;

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
