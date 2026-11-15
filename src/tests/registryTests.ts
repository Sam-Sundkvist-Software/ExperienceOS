import { IRegistry } from "@/system/core/Registry";

export default function testRegistry(registry: IRegistry) {
	registry.createGroup("A/B/C", true);
	registry.setNodeValue("A/Avalue", "A");
	registry.setNodeValue("A/B/Bvalue", "B");
	registry.setNodeValue("A/B/C/Cvalue", "C");
	console.log(registry.getGroupItems("A"));
	console.log(registry.getGroupItems("A/B"));
	console.log(registry.getGroupItems("A/B/C"));
	console.log(registry.getNodeValue("A/Avalue"));
	console.log(registry.getNodeValue("A/B/Bvalue"));
	console.log(registry.getNodeValue("A/B/C/Cvalue"));
	registry.deleteGroup("A/B", false);
	registry.deleteGroup("A/B", true);
}