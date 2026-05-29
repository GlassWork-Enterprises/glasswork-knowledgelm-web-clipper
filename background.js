const DEFAULT_SETTINGS = {
  projectId: ""
};

async function getSettings() {
  const stored = await chrome.storage.sync.get(["projectId"]);
  return {
    projectId: stored.projectId || DEFAULT_SETTINGS.projectId
  };
}

async function ensureContextMenu() {
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({
    id: "knowledgelm-save-page",
    title: "Save to KnowledgeLM",
    contexts: ["page", "selection", "link"]
  });
}

function fallbackContext(tab) {
  return {
    title: tab.title || tab.url || "Captured page",
    url: tab.url || "",
    selection: "",
    content: tab.url || ""
  };
}

async function collectPageContext(tab) {
  if (!tab.id) return fallbackContext(tab);
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type: "knowledgelm:collect-page-context" });
    return { ...fallbackContext(tab), ...(response || {}) };
  } catch {
    return fallbackContext(tab);
  }
}

function buildDeepLink(settings, payload) {
  if (!settings.projectId) {
    throw new Error("Set a GlassWork project ID in the extension options first.");
  }

  const params = new URLSearchParams({
    projectId: settings.projectId,
    title: payload.title || "Captured page",
    url: payload.url || "",
    selection: payload.selection || "",
    content: payload.content || payload.selection || payload.url || ""
  });

  return `glasswork://knowledge/capture?${params.toString()}`;
}

async function saveActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return { ok: false, message: "No active tab was found." };

  const [settings, context] = await Promise.all([getSettings(), collectPageContext(tab)]);
  const deepLink = buildDeepLink(settings, context);
  await chrome.tabs.create({ url: deepLink });
  return { ok: true, message: "Sent capture to GlassWork KnowledgeLM." };
}

chrome.runtime.onInstalled.addListener(async () => {
  await ensureContextMenu();
  const settings = await getSettings();
  await chrome.storage.sync.set(settings);
});

chrome.runtime.onStartup.addListener(ensureContextMenu);

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "knowledgelm-save-page") {
    void saveActiveTab();
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "save-selection-to-knowledgelm") {
    void saveActiveTab();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && message.type === "knowledgelm:save-active-tab") {
    void saveActiveTab()
      .then(sendResponse)
      .catch((error) => sendResponse({ ok: false, message: error instanceof Error ? error.message : "Capture failed." }));
    return true;
  }
  return false;
});
