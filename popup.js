const MODIFIER_CODES = new Set([
  "ShiftLeft",
  "ShiftRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "MetaLeft",
  "MetaRight",
]);

const DEFAULT_SHORTCUT = {
  ctrlKey: false,
  altKey: false,
  shiftKey: true,
  metaKey: false,
  code: "KeyS",
};

function formatShortcut(shortcut) {
  const parts = [];
  if (shortcut.ctrlKey) parts.push("Ctrl");
  if (shortcut.altKey) parts.push("Alt");
  if (shortcut.shiftKey) parts.push("Shift");
  if (shortcut.metaKey) parts.push("Meta");
  parts.push(shortcut.code.replace(/^Key|^Digit/, ""));
  return parts.join(" + ");
}

function showStatus(message) {
  const status = document.getElementById("status");
  status.innerText = message;
  setTimeout(() => {
    status.innerText = "";
  }, 1500);
}

let currentShortcut = DEFAULT_SHORTCUT;
let recording = false;

const recorderBtn = document.getElementById("shortcutRecorder");

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["skipShortcut", "popupBlockEnabled"], (result) => {
    if (result.skipShortcut) {
      currentShortcut = result.skipShortcut;
    }
    recorderBtn.textContent = formatShortcut(currentShortcut);

    document.getElementById("popupBlockToggle").checked =
      typeof result.popupBlockEnabled === "boolean" ? result.popupBlockEnabled : true;
  });
});

document.getElementById("popupBlockToggle").addEventListener("change", (event) => {
  chrome.storage.sync.set({ popupBlockEnabled: event.target.checked });
});

recorderBtn.addEventListener("click", () => {
  if (recording) return;
  recording = true;
  recorderBtn.textContent = "Press keys...";
  recorderBtn.classList.add("recording");
});

document.addEventListener("keydown", (event) => {
  if (!recording) return;
  event.preventDefault();

  if (event.code === "Escape") {
    recording = false;
    recorderBtn.classList.remove("recording");
    recorderBtn.textContent = formatShortcut(currentShortcut);
    return;
  }

  if (MODIFIER_CODES.has(event.code)) return;

  const shortcut = {
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey,
    code: event.code,
  };

  currentShortcut = shortcut;
  recording = false;
  recorderBtn.classList.remove("recording");
  recorderBtn.textContent = formatShortcut(shortcut);

  chrome.storage.sync.set({ skipShortcut: shortcut }, () => {
    showStatus("Saved!");
  });
});
