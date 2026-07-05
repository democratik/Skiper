(() => {
  const nativeOpen = window.open;

  // Only block window.open when it fires right after a click that landed
  // inside a <video>'s bounding box, so links elsewhere on the page (e.g. a
  // link in a YouTube video description) keep working normally.
  let lastClickInPlayer = false;
  let lastClickTime = 0;

  function isInsideAnyVideo(x, y) {
    const videos = document.querySelectorAll("video");
    for (const video of videos) {
      const rect = video.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return true;
      }
    }
    return false;
  }

  document.addEventListener(
    "pointerdown",
    (event) => {
      lastClickInPlayer = isInsideAnyVideo(event.clientX, event.clientY);
      lastClickTime = Date.now();
    },
    true,
  );

  // The toggle in the popup is stored via chrome.storage, which isn't
  // reachable from this MAIN-world script. content.js (isolated world, same
  // DOM) mirrors the setting onto <html data-skipper-popup-block>, and we
  // read it here on every call so toggling takes effect immediately.
  function isFeatureEnabled() {
    return document.documentElement.dataset.skipperPopupBlock !== "false";
  }

  window.open = function (url, ...rest) {
    const triggeredFromPlayer =
      isFeatureEnabled() && lastClickInPlayer && Date.now() - lastClickTime < 1500;

    if (triggeredFromPlayer) {
      console.warn("[Skipper] Blocked popup/redirect attempt from player:", url || "(no url)");
      return null;
    }

    return nativeOpen.call(window, url, ...rest);
  };
})();
