const tabsList = document.getElementById("tabs-list");
const tabContents = document.getElementById("tab-contents");
const urlBar = document.getElementById("url-bar");
const newTabBtn = document.getElementById("new-tab-btn");

let activeTab = null;

function newTab(url = "https://duckduckgo.com/") {
	const tab = document.createElement("div");
	tab.className = "tab active";
	tab.innerHTML = `<span class="tab-title">New Tab</span><button class="tab-close">×</button>`;
	tabsList.appendChild(tab);

	const content = document.createElement("div");
	content.className = "tab-content active";
	content.innerHTML = `
    <iframe src="/~/scramjet/${encodeURIComponent(url)}" 
            class="proxy-frame"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            loading="lazy">
    </iframe>`;
	tabContents.appendChild(content);

	const iframe = content.querySelector("iframe");
	const titleSpan = tab.querySelector(".tab-title");

	// Update tab title when page loads
	iframe.onload = () => {
		try {
			const docTitle = iframe.contentDocument?.title || "Untitled";
			titleSpan.textContent = docTitle.slice(0, 25);
		} catch (e) {
			titleSpan.textContent = "Protected";
		}
	};

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

	// Sync URL bar
	const src = tabContents.children[index].querySelector("iframe").src;
	urlBar.value = decodeURIComponent(src.split("/~/")[1] || "");
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

// ——— URL BAR: PRESS ENTER = GO ———
urlBar.addEventListener("keydown", (e) => {
	if (e.key !== "Enter") return;
	e.preventDefault();

	let input = urlBar.value.trim();
	if (!input) return;

	// Smart URL detection
	if (!input.includes(".") && !input.includes(" ")) {
		input = "https://www.google.com/search?q=" + encodeURIComponent(input);
	} else if (!/^https?:\/\//i.test(input)) {
		input = "https://" + input;
	}

	// Load in current tab
	document.querySelector(".tab-content.active iframe").src = `/~/scramjet/${input}`;
});

// New tab button
newTabBtn.onclick = () => newTab();


