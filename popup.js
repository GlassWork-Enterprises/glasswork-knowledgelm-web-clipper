const projectInput = document.getElementById("project-id");
const saveButton = document.getElementById("save-defaults");
const captureButton = document.getElementById("capture");
const optionsButton = document.getElementById("open-options");
const statusLine = document.getElementById("status");

function setStatus(message) {
  statusLine.textContent = message;
}

async function loadSettings() {
  const stored = await chrome.storage.sync.get(["projectId"]);
  projectInput.value = stored.projectId || "";
}

async function saveSettings() {
  await chrome.storage.sync.set({ projectId: projectInput.value.trim() });
}

saveButton.addEventListener("click", async () => {
  await saveSettings();
  setStatus("Saved.");
});

captureButton.addEventListener("click", async () => {
  await saveSettings();
  setStatus("Sending to GlassWork...");
  const response = await chrome.runtime.sendMessage({ type: "knowledgelm:save-active-tab" });
  setStatus(response && response.message ? response.message : "Capture sent.");
  if (response && response.ok) {
    window.close();
  }
});

optionsButton.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

void loadSettings();
