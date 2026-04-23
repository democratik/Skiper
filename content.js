let currentSkipKey = "KeyS";

chrome.storage.sync.get(["skipKey"], (result) => {
  if (result.skipKey) {
    currentSkipKey = result.skipKey;
  }
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.skipKey) {
    currentSkipKey = changes.skipKey.newValue;
  }
});

// Massage style
function showToast(message, isError = false) {
  const toast = document.createElement("div");
  toast.innerText = message;

  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background-color: ${isError ? "#ff4d4f" : "#4caf50"};
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 16px;
    font-weight: bold;
    z-index: 9999999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 1;
    transition: opacity 0.5s ease;
    pointer-events: none;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";

    setTimeout(() => {
      toast.remove();
    }, 500);
  }, 2000);
}

document.addEventListener("keydown", (event) => {
  if (event.shiftKey && event.code === currentSkipKey) {
    const videos = document.querySelectorAll("video");
    let isSkiped = false;

    if (videos.length === 0) {
      showToast("Video not found", true);
      return;
    }

    videos.forEach((video) => {
      if (!isNaN(video.duration) && video.duration > 0) {
        video.currentTime = video.duration;
        isSkiped = true;
      }
    });

    if (isSkiped) {
      showToast(`Video Skipped)`);
    } else {
      showToast("Error: Duration unavailable", true);
    }
  }
});
