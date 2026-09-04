import { legacySystemApi, XpUser } from "./api";
import { VFS } from "./vfs";
import { preloadApps } from "./preload";
import BootCore from "./core/BootCore";

function setupHooks() {
	const origAppendChild = Node.prototype.appendChild;

	Node.prototype.appendChild = <T extends Node>(node: T): T => {
		if (node instanceof HTMLElement &&
			(node.id === "desktop" || node.querySelector?.("#desktop"))
		) {
			console.trace("INTERCEPT: #desktop CREATED", node);
			throw new Error("Trace CAUGHT");
		}

		return {} as T;
	};
}

function main() {
	//setup hooks
	//setupHooks();

	const el = document.createElement("div") as HTMLDivElement;
	document.body.appendChild(el);
	const bootCore = new BootCore(el);
	bootCore.startBoot();
}

window.addEventListener("load", () => main());

/*
window.onload = function() {
	// Preload Apps into VFS
	preloadApps();

	function systemBoot() {
		const users = XP_API.Registry.get<Record<string, XpUser>>('Security/Users');
		if (!users) return;
		
		const defaults: Record<string, string> = {
			'Administrator': '12345678',
			'User': '1234'
		};
		var changed = false;
		for (var u in defaults) {
			if (users[u]) {
				var correctHash = XP_API.hash(defaults[u]);
				if (users[u].passwordHash !== correctHash) {
					users[u].passwordHash = correctHash;
					changed = true;
				}
			}
		}
		if (changed) {
			XP_API.Registry.set('Security/Users', users);
			console.log('System Security Provisioned');
		}
	}

	// Run boot process
	systemBoot();

	function showLogonScreen() {
		var desktop = document.getElementById('desktop');
		var logon = document.createElement('div');
		logon.id = 'logon-screen';
		logon.style.position = 'absolute';
		logon.style.top = '0';
		logon.style.left = '0';
		logon.style.width = '100%';
		logon.style.height = '100%';
		logon.style.background = 'linear-gradient(to bottom, #5a7edc 0%, #4a6edc 100%)';
		logon.style.zIndex = '100000';
		logon.style.display = 'flex';
		logon.style.flexDirection = 'column';
		
		var top = document.createElement('div');
		top.style.height = '100px';
		top.style.borderBottom = '2px solid #fff';
		logon.appendChild(top);

		var middle = document.createElement('div');
		middle.style.flexGrow = '1';
		middle.style.display = 'flex';
		middle.style.alignItems = 'center';
		middle.style.justifyContent = 'center';
		middle.style.gap = '50px';
		logon.appendChild(middle);

		var left = document.createElement('div');
		left.style.textAlign = 'right';
		left.innerHTML = '<div style="font-size:36px;color:white;font-weight:bold;">Experience<span style="color:#ff9900;">OS</span></div>' +
						 '<div style="color:white;font-size:14px;opacity:0.8;">To begin, click your user name</div>';
		middle.appendChild(left);

		var right = document.createElement('div');
		right.style.display = 'flex';
		right.style.flexDirection = 'column';
		right.style.gap = '10px';
		right.style.borderLeft = '1px solid rgba(255,255,255,0.3)';
		right.style.paddingLeft = '50px';
		middle.appendChild(right);

		var users = XP_API.Registry.get<Record<string, XpUser>>('Security/Users');
		for (const u in users) {
			(function(user) {
				var userContainer = document.createElement('div');
				userContainer.style.display = 'flex';
				userContainer.style.flexDirection = 'column';
				userContainer.style.gap = '5px';
				userContainer.style.marginBottom = '10px';
				
				var userDiv = document.createElement('div');
				userDiv.style.display = 'flex';
				userDiv.style.alignItems = 'center';
				userDiv.style.gap = '10px';
				userDiv.style.cursor = 'pointer';
				userDiv.style.padding = '5px';
				userDiv.style.borderRadius = '5px';
				userDiv.onmouseover = function() { userDiv.style.background = 'rgba(255,255,255,0.1)'; };
				userDiv.onmouseout = function() { userDiv.style.background = 'transparent'; };
				
				var img = document.createElement('img');
				img.src = user.avatar || "";
				img.style.width = '48px';
				img.style.height = '48px';
				img.style.border = '2px solid #fff';
				img.style.borderRadius = '4px';
				img.referrerPolicy = 'no-referrer';
				
				var name = document.createElement('div');
				name.innerText = user.username;
				name.style.color = 'white';
				name.style.fontSize = '18px';
				name.style.fontWeight = 'bold';
				
				userDiv.appendChild(img);
				userDiv.appendChild(name);
				userContainer.appendChild(userDiv);

				var pwdArea = document.createElement('div');
				pwdArea.className = 'pwd-area';
				pwdArea.style.display = 'none';
				pwdArea.style.paddingLeft = '58px';
				pwdArea.style.flexDirection = 'column';
				pwdArea.style.gap = '5px';
				
				var pwdLabel = document.createElement('div');
				pwdLabel.innerText = 'Type your password:';
				pwdLabel.style.color = 'white';
				pwdLabel.style.fontSize = '12px';
				pwdArea.appendChild(pwdLabel);
				
				var pwdInputRow = document.createElement('div');
				pwdInputRow.style.display = 'flex';
				pwdInputRow.style.gap = '5px';
				pwdInputRow.style.alignItems = 'center';
				
				var pwdInput = document.createElement('input');
				pwdInput.type = 'password';
				pwdInput.style.width = '150px';
				pwdInput.style.border = '1px solid #fff';
				pwdInput.style.background = 'white';
				pwdInput.style.padding = '2px';
				pwdInput.style.borderRadius = '2px';
				pwdInputRow.appendChild(pwdInput);
				
				var goBtn = document.createElement('button');
				goBtn.innerHTML = '➜';
				goBtn.style.background = 'linear-gradient(to bottom, #76b054 0%, #3a7e1c 100%)';
				goBtn.style.color = 'white';
				goBtn.style.border = '1px solid #fff';
				goBtn.style.cursor = 'pointer';
				goBtn.style.width = '24px';
				goBtn.style.height = '24px';
				goBtn.style.borderRadius = '4px';
				goBtn.style.display = 'flex';
				goBtn.style.alignItems = 'center';
				goBtn.style.justifyContent = 'center';
				goBtn.style.fontSize = '14px';
				pwdInputRow.appendChild(goBtn);
				
				pwdArea.appendChild(pwdInputRow);

				var errorMsg = document.createElement('div');
				errorMsg.style.color = '#ffeb3b';
				errorMsg.style.fontSize = '11px';
				errorMsg.style.display = 'none';
				errorMsg.innerText = 'Incorrect password. Please try again.';
				pwdArea.appendChild(errorMsg);

				userContainer.appendChild(pwdArea);
				
				userDiv.onclick = function() {
					// Hide all other pwd areas
					var allPwdAreas = right.querySelectorAll('.pwd-area');
					allPwdAreas.forEach((area) => { (area as HTMLElement).style.display = 'none'; });
					
					if (user.username === 'Guest') {
						if (XP_API.Auth.login('Guest', '')) {
							logon.remove();
							initDesktop();
						}
					} else {
						pwdArea.style.display = 'flex';
						pwdInput.focus();
					}
				};
				
				goBtn.onclick = function() {
					if (XP_API.Auth.login(user.username, pwdInput.value)) {
						logon.remove();
						initDesktop();
					} else {
						errorMsg.style.display = 'block';
						pwdInput.value = '';
						pwdInput.focus();
					}
				};
				
				pwdInput.onkeydown = function(e) {
					errorMsg.style.display = 'none';
					if (e.key === 'Enter') goBtn.click();
				};
				
				right.appendChild(userContainer);
			})(users[u]);
		}

		var bottom = document.createElement('div');
		bottom.style.height = '100px';
		bottom.style.borderTop = '2px solid #fff';
		bottom.style.display = 'flex';
		bottom.style.alignItems = 'center';
		bottom.style.padding = '0 50px';
		
		var turnOffBtn = document.createElement('div');
		turnOffBtn.style.color = 'white';
		turnOffBtn.style.cursor = 'pointer';
		turnOffBtn.style.display = 'flex';
		turnOffBtn.style.alignItems = 'center';
		turnOffBtn.style.gap = '10px';
		turnOffBtn.innerHTML = '<img src="https://img.icons8.com/color/48/000000/shutdown.png" style="width:24px;height:24px;" referrerPolicy="no-referrer"><span>Turn off computer</span>';
		turnOffBtn.onclick = function() {
			var overlay = document.createElement('div');
			overlay.style.position = 'fixed';
			overlay.style.top = '0';
			overlay.style.left = '0';
			overlay.style.width = '100%';
			overlay.style.height = '100%';
			overlay.style.background = 'rgba(0,0,0,0.8)';
			overlay.style.zIndex = '200000';
			overlay.style.display = 'flex';
			overlay.style.alignItems = 'center';
			overlay.style.justifyContent = 'center';
			
			var shutDownBox = document.createElement('div');
			shutDownBox.style.background = '#003399';
			shutDownBox.style.border = '1px solid #fff';
			shutDownBox.style.padding = '20px';
			shutDownBox.style.color = 'white';
			shutDownBox.style.textAlign = 'center';
			shutDownBox.innerHTML = '<div style="font-size:18px;margin-bottom:20px;">Turn off computer?</div>' +
									'<div style="display:flex;gap:20px;justify-content:center;">' +
										'<button id="btn-cancel" style="padding:5px 15px;">Cancel</button>' +
										'<button id="btn-off" style="padding:5px 15px;background:#cc0000;color:white;border:1px solid #fff;">Turn Off</button>' +
									'</div>';
			overlay.appendChild(shutDownBox);
			document.body.appendChild(overlay);
			
			(overlay.querySelector('#btn-cancel') as HTMLElement).onclick = () => { overlay.remove(); };
			(overlay.querySelector('#btn-off') as HTMLElement).onclick = () => {
				document.body.innerHTML = '<div style="background:black;color:white;height:100vh;display:flex;align-items:center;justify-content:center;font-family:Tahoma;">It is now safe to turn off your computer.</div>';
			};
		};
		bottom.appendChild(turnOffBtn);
		logon.appendChild(bottom);

		document.body.appendChild(logon);
	}

	

	initDesktop();
};
*/