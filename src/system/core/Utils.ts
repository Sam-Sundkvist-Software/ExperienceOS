export default class Utils {
	public static hash(str: string): string {
		let h = 0;
		for (let i = 0; i < str.length; i++) {
			h = ((h << 5) - h) + str.charCodeAt(i);
			h |= 0;
		}
		return (h >>> 0).toString(16);
	}
}