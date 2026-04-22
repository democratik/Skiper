document.addEventListener("keydown", (event) => {
  if (event.shiftKey && event.code === "KeyS") {
    const videos = document.querySelectorAll("video");

    videos.forEach((video) => {
      if (!isNaN(video.duration)) {
        video.currentTime = video.duration;
        console.log("Skip");
      } else {
        console.log("Skiper blocked");
      }
    });
  }
});
