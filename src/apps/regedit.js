/* Registry Editor - FCCF Version */
const [getSelectedKey, setSelectedKey, subscribeKey] = FCCF.useState('System');
const [getSidebarWidth, setSidebarWidth, subscribeSidebarWidth] = FCCF.useState(200);

function genRegtree() {
	const registry = XP_API.Registry.getAll();

	function createTreeNode(text, value) {
		if (value === null) {
			return {
				text: `${text} --- null`,
			};
		}

		if (Array.isArray(value)) {
			return {
				text,
				children: value.map((item, index) =>
					createTreeNode(String(index), item)
				),
			};
		}

		if (typeof value === "object") {
			return {
				text,
				children: Object.entries(value).map(([key, child]) =>
					createTreeNode(key, child)
				),
			};
		}

		return {
			text: `${text} --- ${value}`,
		};
	}

	return createTreeNode("ROOT", registry);
}

const treeData = genRegtree();
/*
const treeData = [
	{ text: 'HKEY_LOCAL_MACHINE', children: [
		{ text: 'Software', children: [
			{ text: 'Samsoft', children: [
				{ text: 'ExperienceOS', children: [
					{ text: 'CurrentVersion' }
				]}
			]}
		]},
		{ text: 'System' },
		{ text: 'Security' },
		{ text: 'Apps' }
	]}
];
*/

const tree = FCCF.Controls.Tree({
	data: treeData,
	onNodeClick: (node) => {
		// Find the path in registry
		const path = node.text; // Simplified
		setSelectedKey(path);
	}
});

const sidebar = FCCF.Controls.Pane({
	style: { width: getSidebarWidth() + 'px', borderRight: 'none', overflow: 'auto', background: 'white', flexShrink: 0 },
	children: [tree]
});

const mainArea = FCCF.Controls.Pane({
	style: { flexGrow: 1, flexBasis: 0, padding: '10px', background: 'white', overflow: 'auto' }
});

const splitter = FCCF.Controls.Splitter({
	vertical: true,
	onResize: (delta) => {
		const newWidth = Math.max(100, Math.min(500, getSidebarWidth() + delta));
		setSidebarWidth(newWidth);
	}
});

const renderValues = (keyPath) => {
	const data = XP_API.Registry.get(keyPath);
	mainArea.innerHTML = '';
	if (typeof data === 'object' && data !== null) {
		const table = document.createElement('table');
		table.style.width = '100%';
		table.style.fontSize = '11px';
		table.style.borderCollapse = 'collapse';
		table.innerHTML = '<thead><tr style="text-align:left;background:#ece9d8;border-bottom:1px solid #aca899;"><th style="padding:2px 5px;">Name</th><th style="padding:2px 5px;">Type</th><th style="padding:2px 5px;">Data</th></tr></thead><tbody></tbody>';
		const tbody = table.querySelector('tbody');
		
		for (const k in data) {
			const tr = document.createElement('tr');
			const val = data[k];
			const type = typeof val === 'string' ? 'REG_SZ' : (typeof val === 'number' ? 'REG_DWORD' : 'REG_BINARY');
			tr.innerHTML = `<td style="padding:2px 5px;">${k}</td><td style="padding:2px 5px;">${type}</td><td style="padding:2px 5px;">${JSON.stringify(val)}</td>`;
			tr.style.cursor = 'pointer';
			tr.onclick = () => {
				XP_API.showDialog({
					type: 'prompt',
					title: 'Edit String',
					message: `Value name: ${k}\nValue data:`,
					value: typeof val === 'string' ? val : JSON.stringify(val),
					onOk: (newVal) => {
						let parsed = newVal;
						if (type === 'REG_DWORD') parsed = parseInt(newVal);
						XP_API.Registry.set(keyPath + '/' + k, parsed);
						renderValues(keyPath);
					}
				});
			};
			tbody.appendChild(tr);
		}
		mainArea.appendChild(table);
	} else {
		mainArea.innerText = `(Default): ${JSON.stringify(data)}`;
	}
};

const layout = FCCF.Controls.Pane({
	style: { display: 'flex', height: '100%' },
	children: [sidebar, splitter, mainArea]
});

const winId = FCCF.Window({
	title: 'Registry Editor',
	width: 600,
	height: 450,
	content: layout,
	resizable: true
});

subscribeKey(key => renderValues(key));
subscribeSidebarWidth(width => {
	sidebar.style.width = width + 'px';
});

// Initial render
renderValues(getSelectedKey());
