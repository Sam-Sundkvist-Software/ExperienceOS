//import { FCCF } from "@/system/compfwk";

const debugItems = {
	"test": () => alert("Notice"),
};

const w = FCCF.Window({
	title: "Debug Suite",
	width: 300,
	height: 200,
	content: FCCF.Controls.List({
		items: Object.keys(debugItems),
		onItemClick: (item) => debugItems[item](),
	}).el,
});