const video = document.getElementById("fogata-video");
const musica = document.getElementById("musica");
const overlay = document.getElementById("start-overlay");
const startBtn = document.getElementById("start-btn");
const subtitleOverlay = document.getElementById("subtitle-overlay");
const creditsOverlay = document.querySelector(".credits-overlay");
const overlayVideo1 = document.getElementById("overlay-video1");
const overlayVideo5 = document.getElementById("overlay-video5");
const overlayVideo2 = document.getElementById("overlay-video2");
const overlayVideo3 = document.getElementById("overlay-video3");
const overlayVideo4 = document.getElementById("overlay-video4");
const overlayFoto1 = document.getElementById("overlay-foto1");
const overlayFoto2 = document.getElementById("overlay-foto2");
const overlayFoto3 = document.getElementById("overlay-foto3");
const videoSource = video.querySelector("source");
const videoCutoffTime = 64.0; // 01:04
const subtitleMiddleTime = 65.0; // 01:05
let videoDisabled = false;
const overlayAdvance = -0.18; // Adelanto
const overlaySequenceStart = 75.545; // 01:15:545
const overlaySequenceGap = 1.0; // 1 segundo entre videos

function shifted(seconds) {
  return seconds + overlayAdvance;
}

const overlaySegments = [
  { element: overlayVideo1, start: shifted(66.557), end: shifted(67.776), started: false }, // 01:06:557 - 01:07:776
  { element: overlayVideo2, start: shifted(68.795), end: shifted(69.995), started: false }, // 01:08:795 - 01:09:995
  { element: overlayVideo3, start: shifted(71.046), end: shifted(72.278), started: false }, // 01:11:046 - 01:12:278
  { element: overlayVideo4, start: shifted(73.249), end: shifted(74.387), started: false }, // 01:13:249 - 01:14:387
].filter((segment) => Boolean(segment.element));

const overlayReplayClips = [
  { element: overlayVideo5, trigger: overlaySequenceStart + 0 * overlaySequenceGap, started: false, active: false, playStart: 0 },
  { element: overlayVideo2, trigger: overlaySequenceStart + 1 * overlaySequenceGap, started: false, active: false, playStart: 0 },
  { element: overlayVideo3, trigger: overlaySequenceStart + 2 * overlaySequenceGap, started: false, active: false, playStart: 0 },
  { element: overlayVideo4, trigger: overlaySequenceStart + 3 * overlaySequenceGap, started: false, active: false, playStart: 0 },
].filter((clip) => Boolean(clip.element));
const phase2MaxDuration = 5.0; // segundos maximo por cuadrito
const photoSequenceStart = overlaySequenceStart + (overlayReplayClips.length - 1) * overlaySequenceGap + phase2MaxDuration + 0.2;
const photoSequenceGap = 1.0;
const photoMaxDuration = 5.0;
const overlayPhotoClips = [
  { element: overlayFoto1, trigger: photoSequenceStart + 0 * photoSequenceGap, started: false, active: false, showStart: 0 },
  { element: overlayFoto2, trigger: photoSequenceStart + 1 * photoSequenceGap, started: false, active: false, showStart: 0 },
  { element: overlayFoto3, trigger: photoSequenceStart + 2 * photoSequenceGap, started: false, active: false, showStart: 0 },
].filter((clip) => Boolean(clip.element));
const creditsShowTime = 96.0;
const creditsVisibleDuration = 6.0;

const subtitles = [
  { start: 16.0, end: 19.0, text: "Feel like sun" },
  { start: 19.0, end: 21.0, text: "On my skin" },
  { start: 21.0, end: 23.0, text: "So this is love" },
  { start: 23.0, end: 25.0, text: "I know it is" },
  { start: 25.0, end: 27.0, text: "I know it sounds super cliche" },
  { start: 27.0, end: 30.0, text: "But you make me feel some type of way" },
  { start: 28.0, end: 34.0, text: "This is falling, falling in love" },
  { start: 40.0, end: 42.0, text: "I got a lot on my mind" },
  { start: 43.0, end: 45.0, text: "Got some more on my plate" },
  { start: 45.0, end: 47.0, text: "My baby got me looking forward to" },
  { start: 47.0, end: 48.0, text: "The end of the day" },
  { start: 48.0, end: 50.0, text: "What you say?" },
  { start: 50.0, end: 52.0, text: "You and me" },
  { start: 52.0, end: 54.0, text: "Just forget about the past" },
  { start: 54.7, end: 56.0, text: "Throw in the trash" },
  { start: 56.0, end: 57.5, text: "What you say?" },
  { start: 58.0, end: 59.4, text: "You and me" },
  { start: 59.8, end: 61.4, text: "Live the life we never had" },
  { start: 61.8, end: 64.0, text: "like we're never going back" },
  { start: 66.0, end: 68.0, text: "Feel like sun" },
  { start: 69.0, end: 72.0, text: "On my skin" },
  { start: 72.0, end: 74.0, text: "So this is love" },
  { start: 74.0, end: 75.0, text: "I know it is" },
  { start: 75.0, end: 77.0, text: "I know sounds super cliche" },
  { start: 77.0, end: 80.0, text: "But you make me feel some typa way" },
  { start: 80.0, end: 82.0, text: "This is falling" },
  { start: 82.0, end: 85.0, text: "Falling in love" },
  { start: 85.0, end: 87.0, text: "I know it sounds super cliche" },
  { start: 87.0, end: 88.0, text: "But you make me feel some type of way" },
  { start: 88.0, end: 90.0, text: "This is falling" },
  { start: 90.0, end: 94.0, text: "Falling in love" },
];
const subtitleFocusLead = 2.0;
const subtitleFocusStart = Math.max(0, subtitles[0].start - subtitleFocusLead);
const subtitleFocusEnd = subtitles[subtitles.length - 1].end;

function disableBackgroundVideo() {
  if (videoDisabled) {
    return;
  }

  videoDisabled = true;
  video.pause();
  video.classList.add("is-disabled");

  if (videoSource) {
    videoSource.removeAttribute("src");
  }
  video.removeAttribute("src");
  video.load();
}

function hideOverlayVideo(clip, resetTime = false) {
  clip.element.classList.remove("is-visible", "is-mini");
  clip.element.style.left = "";
  clip.element.style.top = "";
  clip.element.style.width = "";
  clip.element.style.height = "";
  clip.element.pause();
  if (Object.prototype.hasOwnProperty.call(clip, "active")) {
    clip.active = false;
  }
  if (resetTime) {
    clip.element.currentTime = 0;
  }
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function rectsOverlap(a, b, gap = 10) {
  return !(
    a.right + gap <= b.left ||
    a.left >= b.right + gap ||
    a.bottom + gap <= b.top ||
    a.top >= b.bottom + gap
  );
}

function getActiveMiniRects(excludeElement) {
  const rects = [];

  for (const clip of overlayReplayClips) {
    if (!clip.active || clip.element === excludeElement) {
      continue;
    }
    if (!clip.element.classList.contains("is-visible") || !clip.element.classList.contains("is-mini")) {
      continue;
    }

    const rect = clip.element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      rects.push({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      });
    }
  }
  for (const clip of overlayPhotoClips) {
    if (!clip.active || clip.element === excludeElement) {
      continue;
    }
    if (!clip.element.classList.contains("is-visible") || !clip.element.classList.contains("is-mini")) {
      continue;
    }

    const rect = clip.element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      rects.push({
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      });
    }
  }

  return rects;
}

function positionOverlayVideo(clip) {
  const size = randomInt(88, 150);
  const maxX = Math.max(0, window.innerWidth - size - 8);
  const maxY = Math.max(0, window.innerHeight - size - 8);
  const occupied = getActiveMiniRects(clip.element);
  const maxAttempts = 28;

  let chosenLeft = 8;
  let chosenTop = 8;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const left = randomInt(8, maxX);
    const top = randomInt(8, maxY);
    const candidate = {
      left,
      top,
      right: left + size,
      bottom: top + size,
    };

    const collides = occupied.some((rect) => rectsOverlap(candidate, rect, 14));
    if (!collides) {
      chosenLeft = left;
      chosenTop = top;
      break;
    }

    // fallback: usa ultimo intento si no encuentra hueco perfecto
    chosenLeft = left;
    chosenTop = top;
  }

  clip.element.style.width = `${size}px`;
  clip.element.style.height = `${size}px`;
  clip.element.style.left = `${chosenLeft}px`;
  clip.element.style.top = `${chosenTop}px`;
}

function showOverlayPhoto(clip) {
  clip.element.classList.add("is-mini");
  positionOverlayVideo(clip);
  clip.element.classList.add("is-visible");
}

function hideOverlayPhoto(clip) {
  clip.element.classList.remove("is-visible", "is-mini");
  clip.element.style.left = "";
  clip.element.style.top = "";
  clip.element.style.width = "";
  clip.element.style.height = "";
  clip.active = false;
}

async function tryPlayOverlayVideo(clip, mini = false) {
  clip.element.currentTime = 0;
  if (mini) {
    clip.element.classList.add("is-mini");
    positionOverlayVideo(clip);
  } else {
    clip.element.classList.remove("is-mini");
    clip.element.style.left = "";
    clip.element.style.top = "";
    clip.element.style.width = "";
    clip.element.style.height = "";
  }
  clip.element.classList.add("is-visible");

  try {
    await clip.element.play();
  } catch (error) {
    hideOverlayVideo(clip, true);
  }
}

function updateSubtitleOverlay() {
  if (!subtitleOverlay) {
    return;
  }

  const time = musica.currentTime;
  if (time >= videoCutoffTime) {
    disableBackgroundVideo();
  }
  document.body.classList.toggle("subtitle-middle", time >= subtitleMiddleTime);
  const isFocusWindow = time >= subtitleFocusStart && time <= subtitleFocusEnd;
  document.body.classList.toggle("lyric-focus", isFocusWindow);

  const cue = subtitles.find((item) => time >= item.start && time < item.end);
  subtitleOverlay.textContent = cue ? cue.text : "";

  // 1) Mantener lo anterior: ventanas de tiempo originales (solo antes de la parte 2)
  if (time < overlaySequenceStart) {
    for (const segment of overlaySegments) {
      if (time >= segment.start && time < segment.end) {
        if (!segment.started) {
          segment.started = true;
          tryPlayOverlayVideo(segment, false);
        }
        continue;
      }

      if (time < segment.start) {
        segment.started = false;
        hideOverlayVideo(segment, true);
        continue;
      }

      if (time >= segment.end) {
        hideOverlayVideo(segment, true);
      }
    }
  }

  // 2) Adicional: volver a ponerlos desde 1:15.545, pequenos y en posiciones random
  for (const clip of overlayReplayClips) {
    if (time < clip.trigger) {
      clip.started = false;
      clip.active = false;
      clip.playStart = 0;
      continue;
    }

    if (!clip.started && time >= clip.trigger && time < clip.trigger + 0.95) {
      clip.started = true;
      clip.active = true;
      clip.playStart = time;
      tryPlayOverlayVideo(clip, true);
      continue;
    }

    if (!clip.started && time >= clip.trigger + 0.95) {
      clip.started = true;
    }

    if (clip.active && time >= clip.playStart + phase2MaxDuration) {
      clip.active = false;
      hideOverlayVideo(clip, true);
    }
  }

  // 3) Luego de la fase 2: fotos en cuadritos, una por segundo y sin superposicion.
  for (const clip of overlayPhotoClips) {
    if (time < clip.trigger) {
      clip.started = false;
      clip.active = false;
      clip.showStart = 0;
      hideOverlayPhoto(clip);
      continue;
    }

    if (!clip.started && time >= clip.trigger && time < clip.trigger + 0.95) {
      clip.started = true;
      clip.active = true;
      clip.showStart = time;
      showOverlayPhoto(clip);
      continue;
    }

    if (!clip.started && time >= clip.trigger + 0.95) {
      clip.started = true;
    }

    if (clip.active && time >= clip.showStart + photoMaxDuration) {
      hideOverlayPhoto(clip);
    }
  }
  if (creditsOverlay) {
    const showCredits = time >= creditsShowTime && time < creditsShowTime + creditsVisibleDuration;
    creditsOverlay.classList.toggle("is-visible", showCredits);
  }
}

async function startVideo() {
  startBtn.disabled = true;

  try {
    video.muted = false;
    await Promise.all([video.play(), musica.play()]);
    requestAnimationFrame(() => {
      document.body.classList.add("is-playing");
    });
    overlay.classList.add("is-hidden");
  } catch (error) {
    video.muted = true;

    try {
      await Promise.all([video.play(), musica.play()]);
      requestAnimationFrame(() => {
        document.body.classList.add("is-playing");
      });
      overlay.classList.add("is-hidden");
    } catch (innerError) {
      startBtn.disabled = false;
    }
  }
}

startBtn.addEventListener("click", startVideo);
musica.addEventListener("timeupdate", updateSubtitleOverlay);
musica.addEventListener("seeked", updateSubtitleOverlay);
for (const clip of overlayReplayClips) {
  clip.element.addEventListener("ended", () => {
    clip.active = false;
    hideOverlayVideo(clip, true);
  });
}
for (const segment of overlaySegments) {
  segment.element.addEventListener("ended", () => {
    hideOverlayVideo(segment, true);
  });
}
