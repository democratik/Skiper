document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["skipKey"], (result) => {
    if (result.skipKey) {
      document.getElementById("shortcutKey").value = result.skipKey.replace(
        "Key",
        "",
      );
    } else {
      document.getElementById("shortcutKey").value = "S";
    }
  });
});

document.getElementById("saveBtn").addEventListener("click", () => {
  let letter = document.getElementById("shortcutKey").value.toUpperCase();

  if (!letter || !letter.match(/[A-Z]/)) {
    letter = "S";
    document.getElementById("shortcutKey").value = letter;
  }

  let keyCode = "Key" + letter;

  chrome.storage.sync.set({ skipKey: keyCode }, () => {
    const status = document.getElementById("status");
    status.innerText = "Збережено!";
    setTimeout(() => {
      status.innerText = "";
    }, 1500);
  });
});
