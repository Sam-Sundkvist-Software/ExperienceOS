import { legacySystemApi } from "./api";
import { FCCF } from "./compfwk";
import { VFS } from "./vfs";

/* Application Dearchival Runtime (ADR) - ES6 */
export let ADR: IADR | undefined;

export default function createAdr() {
	const LambdaApps: Record<string, (args: string[], FCCF: any, XP_API: any, VFS: any) => void> = {
		"about": (args: string[], FCCF: any, XP_API: any, VFS: any) => {
			const content = FCCF.Controls.Pane({
				style: { padding: '20px', textAlign: 'center' },
				children: [
					FCCF.Controls.Icon({ src: 'https://img.icons8.com/color/48/000000/windows-xp.png', size: '64px' }),
					FCCF.Controls.Pane({ style: { fontSize: '18px', fontWeight: 'bold', margin: '10px 0' }, children: [document.createTextNode('ExperienceOS')] }),
					FCCF.Controls.Pane({ children: [document.createTextNode('Version 5.1 (Build 2600.xpsp_sp3_gdr.130327-1507 : Service Pack 3)')] }),
					FCCF.Controls.Pane({ style: { marginTop: '20px' }, children: [document.createTextNode('Copyright © 2026 Samsoft Incorporated')] })
				]
			});
			FCCF.Window({ title: "About ExperienceOS", width: 400, height: 300, content });
		},
		"dialog": (args: string[], FCCF: any, XP_API: any, VFS: any) => {
			legacySystemApi.showDialog({
				message: args[0],
			});
		},
		"shutdown": (args: string[], FCCF: any, XP_API: any, VFS: any) => {
			XP_API.showDialog({
				type: 'confirm',
				title: 'Turn Off Computer',
				message: 'Are you sure you want to shut down?',
				onOk: () => {
					document.body.innerHTML = '<div style="background:black;color:white;height:100vh;display:flex;align-items:center;justify-content:center;font-family:Tahoma;">It is now safe to turn off your computer.</div>';
				}
			});
		},
		"debugProc": (args: string[]) => {
			legacySystemApi.createWindow({
				title: "DEBUG Window",
				content: FCCF.Controls.Pane({
					children: [
						FCCF.Controls.MenuStrip({
							items: [
								{ text: "File" },
							],
						}),
						FCCF.Controls.List({
							items: Object.keys(legacySystemApi).map(itm => {
								return FCCF.Controls.Pane({
									children: [
										document.createTextNode(itm),
										FCCF.Controls.Button({
											text: "INVOKE",
											onClick: () => {
												try {
												(legacySystemApi as any as Record<string, Function>)[itm]!();
												} catch {
													legacySystemApi.showDialog({
														type: "error",
														message: "Couldn't invoke '" + itm + "' safely. Either the item failed to execute as a function or it wasn't a function."
													})
												}
											},
										}),
									],
								});
							}),
						}).el,
					],
				}),
			});
		},
	};

	const execute = (script: string | Function, path: string, args: unknown) => {
		try {
			// Check if it's a function (Lambda App)
			if (typeof script === "function") {
				script(args || {}, FCCF, legacySystemApi, VFS);
				return;
			}

			// FCCF is expected to be global. 
			// We wrap the script in a function and pass dependencies.
			const fn = new Function("args", "FCCF", "XP_API", "VFS", "close", script);
			fn(args || [], FCCF, legacySystemApi, VFS, () => {throw new Error("CLOSE"); });
		} catch (e) {
			legacySystemApi.showDialog({ 
				title: "ADR Runtime Error", 
				message: `Failed to execute ${path}: ${(e as Error)?.message || "<not Error>"}`, 
				type: "error"
			});
			console.error("ADR Error:", e);
		}
	};

	return ADR = {
		load: async (path: string, args?: unknown) => {
			// Check Lambda Apps first
			if (LambdaApps[path]) {
				execute(LambdaApps[path], path, args);
				return;
			}

			// Normalize path
			// TODO: improve with PATH env var or similar.
			let fullPath = path;
			if (!path.includes("/") && !path.includes(".")) {
				fullPath = `C:/Apps/${path}.js`;
			}

			let scriptText = VFS.readFile(fullPath);
			
			if (!scriptText) {
				// Try to fetch from server if not in VFS
				const serverUrl = path.includes("/") ? path : `/apps/${path}.js`;
				try {
					const res = await fetch(serverUrl);
					if (!res.ok)
						throw new Error("App not found on server");
					scriptText = await res.text();
					
					// Cache in VFS for performance if it's a system app
					if (!path.includes("/")) {
						VFS.writeFile(fullPath, scriptText);
					}
				} catch (e) {
					legacySystemApi.showDialog({ 
						title: "ADR Error", 
						message: `Could not load application ${path}: ${(e as Error)?.message || "<not Error>"}`, 
						type: "error"
					});
					return;
				}
			}
			execute(scriptText, fullPath, args);
		}
	};
}

export interface IADR {
	load: (path: string, args?: unknown) => Promise<void>;
}