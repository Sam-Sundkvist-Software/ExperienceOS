const internal = {

};

/**
 * @type {IRTApp}
 */
const app = {
	information: {
		id: "authscrn",
		name: "Login Screen",
		version: "1.0.0",
	},
	start(api) {
		api.showDialog()
	},
	stop() {

	},
};

export default Object.freeze(app);