const DEFAULT_SHORTCUT = {
  ctrlKey: false,
  altKey: false,
  shiftKey: true,
  metaKey: false,
  code: "KeyS",
};

let currentShortcut = DEFAULT_SHORTCUT;

function matchesShortcut(event, shortcut) {
  return (
    event.code === shortcut.code &&
    event.ctrlKey === shortcut.ctrlKey &&
    event.altKey === shortcut.altKey &&
    event.shiftKey === shortcut.shiftKey &&
    event.metaKey === shortcut.metaKey
  );
}

chrome.storage.sync.get(["skipShortcut", "popupBlockEnabled"], (result) => {
  if (result.skipShortcut) {
    currentShortcut = result.skipShortcut;
  }

  const popupBlockEnabled =
    typeof result.popupBlockEnabled === "boolean" ? result.popupBlockEnabled : true;
  document.documentElement.dataset.skipperPopupBlock = String(popupBlockEnabled);
  setOverlayProtection(popupBlockEnabled);
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.skipShortcut) {
    currentShortcut = changes.skipShortcut.newValue;
  }

  if (changes.popupBlockEnabled) {
    document.documentElement.dataset.skipperPopupBlock = String(changes.popupBlockEnabled.newValue);
    setOverlayProtection(changes.popupBlockEnabled.newValue);
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

// --- Click-hijack overlay neutralizer ---
// Some ad scripts place an invisible, fully-clickable layer (an <a> or a div
// with an onclick) directly on top of the <video>, so any click meant for the
// player (play/pause, seek) instead opens a new tab / redirects the page.
// We find elements that cover a video almost entirely, carry no visible
// content, and are click-trapped, then make them click-through so the click
// reaches the real player underneath instead of the hijack layer.

function rectsOverlapMostly(videoRect, elRect) {
  const xOverlap =
    Math.max(0, Math.min(videoRect.right, elRect.right) - Math.max(videoRect.left, elRect.left));
  const yOverlap =
    Math.max(0, Math.min(videoRect.bottom, elRect.bottom) - Math.max(videoRect.top, elRect.top));
  const videoArea = (videoRect.right - videoRect.left) * (videoRect.bottom - videoRect.top);
  return videoArea > 0 && (xOverlap * yOverlap) / videoArea > 0.8;
}

function looksInvisible(el) {
  const style = window.getComputedStyle(el);
  const hasVisibleBg =
    style.backgroundImage !== "none" ||
    !/rgba?\(0,\s*0,\s*0,\s*0\)|transparent/.test(style.backgroundColor);
  const hasText = el.innerText && el.innerText.trim().length > 0;
  const hasVisualChild = el.querySelector("img, svg, canvas");
  return !hasVisibleBg && !hasText && !hasVisualChild;
}

function isClickTrap(el, style) {
  return el.tagName === "A" || el.hasAttribute("onclick") || style.cursor === "pointer";
}

function findHijackOverlays() {
  const suspects = [];

  document.querySelectorAll("video").forEach((video) => {
    const videoRect = video.getBoundingClientRect();
    if (videoRect.width === 0 || videoRect.height === 0) return;

    document.querySelectorAll("a, div, span").forEach((el) => {
      if (el === video || el.contains(video) || el.dataset.skipperNeutralized) return;

      const style = window.getComputedStyle(el);
      if (style.position !== "absolute" && style.position !== "fixed") return;
      if (style.pointerEvents === "none") return;
      if (!isClickTrap(el, style)) return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      if (!rectsOverlapMostly(videoRect, rect)) return;
      if (!looksInvisible(el)) return;

      suspects.push(el);
    });
  });

  return suspects;
}

function neutralizeOverlays() {
  findHijackOverlays().forEach((el) => {
    el.style.pointerEvents = "none";
    el.dataset.skipperNeutralized = "true";
  });
}

let neutralizeTimer = null;
function scheduleNeutralize() {
  clearTimeout(neutralizeTimer);
  neutralizeTimer = setTimeout(neutralizeOverlays, 300);
}

let overlayObserver = null;
let overlayInterval = null;

function startOverlayProtection() {
  if (overlayObserver) return;

  neutralizeOverlays();
  overlayObserver = new MutationObserver(scheduleNeutralize);
  overlayObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  });
  overlayInterval = setInterval(neutralizeOverlays, 2000);
}

function stopOverlayProtection() {
  clearTimeout(neutralizeTimer);

  if (overlayObserver) {
    overlayObserver.disconnect();
    overlayObserver = null;
  }

  if (overlayInterval) {
    clearInterval(overlayInterval);
    overlayInterval = null;
  }
}

function setOverlayProtection(enabled) {
  if (enabled) {
    startOverlayProtection();
  } else {
    stopOverlayProtection();
  }
}

document.addEventListener("keydown", (event) => {
  if (matchesShortcut(event, currentShortcut)) {
    const videos = document.querySelectorAll("video");
    let isSkiped = false;

    if (videos.length === 0) {
      showToast("Video not found", true);
      return;
    }

    videos.forEach((video) => {
      if (!isNaN(video.duration) && video.duration > 0 && !video.paused) {
        video.currentTime = video.duration;
        isSkiped = true;
      }
    });

    if (isSkiped) {
      showToast(`Video Skipped`);
    } else {
      showToast("Error: The video should play", true);
    }
  }
});
