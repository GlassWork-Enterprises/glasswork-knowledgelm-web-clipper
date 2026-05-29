const projectInput = document.getElementById("project-id");
const saveButton = document.getElementById("save-defaults");
const statusLine = document.getElementById("status");

async function loadSettings() {
  const stored = await chrome.storage.sync.get(["projectId"]);
  projectInput.value = stored.projectId || "";
}

saveButton.addEventListener("click", async () => {
  await chrome.storage.sync.set({ projectId: projectInput.value.trim() });
  statusLine.textContent = "Defaults saved.";
});

void loadSettings();
