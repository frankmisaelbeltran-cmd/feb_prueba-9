const MIDDLE_TEXT = `De verdad muchas gracias por compartir bastante conmigo, gracias por amarme, gracias por hacerme
reir, gracias por estar conmigo.


Simplemente gracias.

Gracias por todo`;

const pageMusic = document.getElementById("page-music");
const nextPageBtn = document.querySelector(".next-page-btn");
let isFadingOutMusic = false;

function startMusicIfPossible() {
  if (!pageMusic) return;
  const playPromise = pageMusic.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function attachMusicInteractionFallback() {
  const unlock = () => {
    startMusicIfPossible();
    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
    document.removeEventListener("keydown", unlock);
  };

  document.addEventListener("click", unlock, { passive: true });
  document.addEventListener("touchstart", unlock, { passive: true });
  document.addEventListener("keydown", unlock);
}

function fadeOutMusicAndGo(url) {
  if (!pageMusic || isFadingOutMusic) {
    window.location.href = url;
    return;
  }

  isFadingOutMusic = true;
  const startVolume = Number.isFinite(pageMusic.volume) ? pageMusic.volume : 1;
  const durationMs = 900;
  const stepMs = 60;
  const steps = Math.max(1, Math.floor(durationMs / stepMs));
  let currentStep = 0;

  const timer = setInterval(() => {
    currentStep += 1;
    const progress = currentStep / steps;
    pageMusic.volume = Math.max(0, startVolume * (1 - progress));

    if (currentStep >= steps) {
      clearInterval(timer);
      pageMusic.pause();
      pageMusic.volume = startVolume;
      window.location.href = url;
    }
  }, stepMs);
}

window.onload = () => {
  document.body.classList.remove("container");

  const middleTyping = document.getElementById("middle-typing");
  if (nextPageBtn) {
    nextPageBtn.addEventListener("click", (event) => {
      event.preventDefault();
      const targetUrl = nextPageBtn.getAttribute("href") || "nose.html";
      fadeOutMusicAndGo(targetUrl);
    });
  }

  startMusicIfPossible();
  attachMusicInteractionFallback();

  if (!middleTyping) return;

  let i = 0;
  const type = () => {
    if (i < MIDDLE_TEXT.length) {
      middleTyping.textContent += MIDDLE_TEXT.charAt(i);
      i += 1;
      setTimeout(type, 40);
    }
  };

  setTimeout(type, 600);
};
