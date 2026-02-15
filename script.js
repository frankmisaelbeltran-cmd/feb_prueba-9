const book = document.getElementById("book");
const textElement = document.getElementById("text");
const pages = document.querySelector(".pages");
const nextButton = document.getElementById("next-button");
const pageMusic = document.getElementById("page-music");

const text = `Para Joselin:
Gracias por dedicarme tu tiempo aunque estes cansada y estresada por tus cosas y tu trabajo, gracias por hacerme sentir seguro y feliz cuando estoy con vos.

Me di cuenta que me enamore cuando mi corazon se emocionaba cada vez que veia un mensaje tuyo, y lo sigue haciendo, cuando lo unico que queria en todo el dia era hablar con vos. Me haces sentir cosas tan inexplicables, mi amor por vos aumenta cada dia, sos especial para mi, no lo olvides.

La distancia me ha ensenado que te prefiero a vos aunque estes a miles de kilometros.

Aunque no pueda tocarte ni besarte, eso no es impedimento para amarte y seguir eligiendote una y mil veces en esta y tambien la otra vida.

Que increible pensar que hubo un tiempo en el que nuestras vidas iban por caminos distintos y yo no sabia nada de tu existencia, que reias, sonabas y vivias sin que mi nombre formara parte de tu historia, y de repente, por pura casualidad, un dia decidimos hablar sin imaginar que en esas primeras palabras estaba comenzando algo que cambiaria por completo la forma en que iba a ver mis dias, porque desde esa conversacion senti una conexion dificil de explicar y jamas habria podido anticipar el impacto tan profundo que ibas a tener en mi vida.

Hoy solo puedo agradecer a esa coincidencia perfecta que hizo que nuestros caminos se cruzaran y que vos y yo decidieramos coincidir.

Te amo Joselin, con mucho pero muchisimo carino, Frank`;

let index = 0;
let started = false;
let isFadingOutMusic = false;

function startMusicIfPossible() {
  if (!pageMusic) {
    return;
  }

  const playPromise = pageMusic.play();
  if (playPromise && typeof playPromise.catch === "function") {
    playPromise.catch(() => {});
  }
}

function attachMusicInteractionFallback() {
  const unlock = () => {
    startMusicIfPossible();
    document.removeEventListener("click", unlock);
    document.removeEventListener("pointerdown", unlock);
    document.removeEventListener("touchstart", unlock);
    document.removeEventListener("keydown", unlock);
  };

  document.addEventListener("click", unlock, { passive: true });
  document.addEventListener("pointerdown", unlock, { passive: true });
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

function typeText() {
  if (index < text.length) {
    textElement.textContent += text.charAt(index);
    if (pages) {
      pages.scrollTop = pages.scrollHeight;
    }
    index += 1;
    setTimeout(typeText, 45);
  } else if (nextButton) {
    nextButton.hidden = false;
    nextButton.removeAttribute("hidden");
    requestAnimationFrame(() => {
      nextButton.classList.add("show");
      if (pages) {
        pages.scrollTop = pages.scrollHeight;
      }
    });
  }
}

book.addEventListener("click", () => {
  startMusicIfPossible();
  book.classList.toggle("open");

  if (!started) {
    started = true;
    setTimeout(typeText, 600);
  }
});

book.addEventListener("pointerdown", startMusicIfPossible, { passive: true });
book.addEventListener("touchstart", startMusicIfPossible, { passive: true });

if (nextButton) {
  nextButton.addEventListener("click", (event) => {
    event.stopPropagation();
    fadeOutMusicAndGo("flowers.html");
  });
}

const butterflySVG = `
<svg viewBox="0 0 64 64">
  <g class="wing-left">
    <path d="M32 32 C18 10, 2 14, 10 32 C14 40, 24 42, 32 32Z"/>
  </g>
  <g class="wing-right">
    <path d="M32 32 C46 10, 62 14, 54 32 C50 40, 40 42, 32 32Z"/>
  </g>
</svg>`;

const bg = document.getElementById("butterfly-background");
const butterflies = [];
const isPhoneViewport = window.matchMedia("(max-width: 768px)").matches;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const COUNT = reducedMotion ? 8 : isPhoneViewport ? 12 : 22;

for (let i = 0; i < COUNT; i += 1) {
  const b = document.createElement("div");
  b.classList.add("butterfly");

  let layer;
  let speedMultiplier;

  if (i < 4) {
    layer = "layer-ultra-far";
    speedMultiplier = 0.2;
  } else if (i < 9) {
    layer = "layer-far";
    speedMultiplier = 0.35;
  } else if (i < 15) {
    layer = "layer-mid";
    speedMultiplier = 0.6;
  } else {
    layer = "layer-near";
    speedMultiplier = 0.9;
  }

  b.classList.add(layer);
  b.innerHTML = butterflySVG;
  bg.appendChild(b);

  butterflies.push({
    el: b,
    leftWing: b.querySelector(".wing-left"),
    rightWing: b.querySelector(".wing-right"),
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    speed: speedMultiplier + Math.random() * 0.3,
    offset: Math.random() * 1000,
    rotation: Math.random() * 360,
    flapOffset: Math.random() * 1000,
    flapSpeed: 0.006 + Math.random() * 0.002,
    flapSize: 26 + Math.random() * 8,
    state: "fly",
    stateTime: Math.floor(Math.random() * 200 + 100),
    direction: Math.random() * Math.PI * 2,
  });
}

function animateButterflies(t) {
  butterflies.forEach((b) => {
    b.stateTime -= 1;
    if (b.stateTime <= 0) {
      const rand = Math.random();
      if (rand < 0.5) {
        b.state = "fly";
      } else if (rand < 0.75) {
        b.state = "hover";
      } else {
        b.state = "turn";
      }

      b.stateTime = Math.random() * 160 + 80;
    }

    if (b.state === "fly") {
      b.x += Math.cos(b.direction) * b.speed;
      b.y += Math.sin(b.direction) * b.speed;
      b.direction += Math.sin((t + b.offset) * 0.002) * 0.003;
    }

    if (b.state === "hover") {
      b.x += Math.sin((t + b.offset) * 0.002) * 0.3;
      b.y += Math.cos((t + b.offset) * 0.002) * 0.2;
    }

    if (b.state === "turn") {
      b.direction += 0.05;
      b.rotation += 3;
    }

    const flap = Math.sin((t + b.flapOffset) * b.flapSpeed) * b.flapSize;
    b.leftWing.style.transform = `rotate(${-flap}deg)`;
    b.rightWing.style.transform = `rotate(${flap}deg)`;

    b.rotation += ((b.direction * 180) / Math.PI - b.rotation) * 0.05;

    if (
      b.x < -80 ||
      b.x > window.innerWidth + 80 ||
      b.y < -80 ||
      b.y > window.innerHeight + 80
    ) {
      b.x = Math.random() * window.innerWidth;
      b.y = window.innerHeight + 60;
      b.direction = Math.random() * Math.PI * 2;
    }

    b.el.style.transform = `translate(${b.x}px, ${b.y}px) rotate(${b.rotation}deg)`;
  });

  requestAnimationFrame(animateButterflies);
}

requestAnimationFrame(animateButterflies);
startMusicIfPossible();
attachMusicInteractionFallback();
