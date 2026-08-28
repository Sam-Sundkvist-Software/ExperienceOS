import { XpUser } from "../api";
import ISystemAPI from "./ISystemAPI";

export let API: ISystemAPI | undefined;

/**
 * The primary kernel for ExperienceOS.
 * Manages the entire system (mostly)
 * and initializes the API.
 */
export default class SystemKernel {
	private _state: {
		currentUser: XpUser | null;
	};

	constructor() {
		this._state = {
			currentUser: null,
		};
		API = (() => {


			return {
				hash(str) {
					let h = 0;
					for (let i = 0; i < str.length; i++) {
						h = ((h << 5) - h) + str.charCodeAt(i);
						h |= 0;
					}
					return (h >>> 0).toString(16);
				},
				Auth: {

				},
			};
		})();
	}
}