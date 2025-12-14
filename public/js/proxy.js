const tabsList = document.getElementById("tabs-list");
const tabContents = document.getElementById("tab-contents");
const urlBar = document.getElementById("url-bar");
const newTabBtn = document.getElementById("new-tab-btn");

let activeTab = null;
let scramjet = null;
let connection = null;

const { ScramjetController } = $scramjetLoadController();

scramjet = new ScramjetController({
	files: {
		wasm: '/scram/scramjet.wasm.wasm',
		all: '/scram/scramjet.all.js',
		sync: '/scram/scramjet.sync.js',
	},
});

scramjet.init();
connection = new BareMux.BareMuxConnection("/baremux/worker.js");

// Wait for BareMux to be ready before using it
async function waitForBareMux(timeout = 5000) {
	const startTime = Date.now();
	while (Date.now() - startTime < timeout) {
		try {
			await connection.getTransport();
			return true;
		} catch (err) {
			await new Promise(resolve => setTimeout(resolve, 100));
		}
	}
	throw new Error('BareMux initialization timeout');
}

async function newTab(url = "http://example.com") {
	try {
		await waitForBareMux();

		if (!navigator.serviceWorker.controller) {
			await navigator.serviceWorker.register('/scramjet.sw.js', {
				scope: '/',
			});
			await new Promise(resolve => setTimeout(resolve, 500));
		}

		const currentTransport = await connection.getTransport();
		if (currentTransport !== "/epoxy/index.mjs") {
			let wispUrl =
				(location.protocol === "https:" ? "wss" : "ws") +
				"://" +
				location.host +
				"/wisp/";
			await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispUrl }]);
		}

		// Now create the tab UI
		const tab = document.createElement("div");
		tab.className = "tab active";
		const tabId = `tab-${Date.now()}`;
		tab.id = tabId;
		tab.innerHTML = `<span class="tab-title">Loading...</span><button class="tab-close">×</button>`;
		tabsList.appendChild(tab);

		const content = document.createElement("div");
		content.className = "tab-content active";
		content.id = `content-${tabId}`;
		tabContents.appendChild(content);

		const titleSpan = tab.querySelector(".tab-title");

		// Create Scramjet frame
		const frame = scramjet.createFrame();
		frame.frame.id = `sj-frame-${Date.now()}`;
		frame.frame.classList.add("proxy-frame");
		content.appendChild(frame.frame);

		console.log(`Created frame for tab: ${tabId}`);

		tab.__frame = frame;
		tab.__frameElement = frame.frame;

		frame.frame.addEventListener("load", () => {
			try {
				const docTitle = frame.frame.contentDocument?.title || "Untitled";
				titleSpan.textContent = docTitle.slice(0, 25);
			} catch (e) {
				titleSpan.textContent = "Protected";
			}
		});

		// Tab click = switch
		tab.onclick = (e) => {
			if (e.target.classList.contains("tab-close")) {
				e.stopPropagation();
				closeTab(tab);
			} else {
				switchTab(tab);
			}
		};

		switchTab(tab);
		frame.go(url);
	} catch (err) {
		console.error("Error creating tab:", err);
		// Show error in UI
		const errorDiv = document.createElement('div');
		errorDiv.style.cssText = 'color: red; padding: 20px; font-family: monospace; white-space: pre-wrap;';
		errorDiv.innerHTML = `<h2>⚠ Tab Error</h2><code>${err.message}\n\n${err.stack}</code>`;
		
		if (document.querySelector(".tab-content.active")) {
			const errorContent = document.querySelector(".tab-content.active");
			errorContent.innerHTML = '';
			errorContent.appendChild(errorDiv);
		} else {
			document.body.appendChild(errorDiv);
		}
	}
}

function switchTab(tabEl) {
	activeTab = tabEl;

	// Deactivate all
	document
		.querySelectorAll(".tab")
		.forEach((t) => t.classList.remove("active"));
	document
		.querySelectorAll(".tab-content")
		.forEach((c) => c.classList.remove("active"));

	// Activate clicked tab + content
	tabEl.classList.add("active");
	const index = Array.from(tabsList.children).indexOf(tabEl);
	tabContents.children[index].classList.add("active");
}

function closeTab(tabEl) {
	const index = Array.from(tabsList.children).indexOf(tabEl);
	tabEl.remove();
	tabContents.children[index].remove();

	if (tabsList.children.length === 0) newTab();
	else if (activeTab === tabEl) {
		switchTab(tabsList.children[tabsList.children.length - 1]);
	}
}

// Smart URL detection and normalization
function normalizeURL(input) {
	input = input.trim();
	if (!input) return null;

	// Check if it's a search query (no dots, no slashes, no spaces at start)
	if (!input.includes(".") && !input.includes(" ")) {
		return "https://duckduckgo.com/?q=" + encodeURIComponent(input);
	}

	// Add https if no protocol
	if (!/^https?:\/\//i.test(input)) {
		input = "https://" + input;
	}

	return input;
}

// URL BAR: PRESS ENTER = GO
urlBar.addEventListener("keydown", async (e) => {
	if (e.key !== "Enter") return;
	e.preventDefault();

	const url = normalizeURL(urlBar.value);
	if (!url || !activeTab) return;

	if (activeTab.__frame) {
		activeTab.__frame.go(url);
	}
});

// New tab button
newTabBtn.onclick = () => newTab();

window.addEventListener("DOMContentLoaded", () => {
	setTimeout(() => {
		newTab();
	}, 500);
});


