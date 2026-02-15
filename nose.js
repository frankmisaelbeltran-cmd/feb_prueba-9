const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const topText = document.getElementById("top-text");
const nextPageBtn = document.querySelector(".next-page-btn");
const pageMusic = document.getElementById("page-music");

ctx.imageSmoothingEnabled = false; // importante para pixelart

const size = 250; // tamano del personaje
const defaultSpeed = 180; // velocidad fallback en px/seg
const offscreenMargin = 80; // margen para ocultar cortes fuera de pantalla
const characterBottomOffset = 80; // cuanto baja el personaje (px)
const keying = {
  minGreen: 130,
  greenDominance: 35,
  edgeSoftness: 80,
  alphaCut: 30,
};

let viewportWidth = window.innerWidth;
let viewportHeight = window.innerHeight;
let x = 0;
let speed = defaultSpeed;
let direction = -1; // -1: derecha -> izquierda, 1: izquierda -> derecha
let animationId = null;
let lastTime = null;
let processedFrameReady = false;
let heartSpawnAccumulator = 0;
let floatingWordSpawnAccumulator = 0;
let wordIndex = 0;
let hasShownNextButton = false;
let isFadingOutMusic = false;

const hearts = [];
const floatingWords = [];
const rotatingWords = [
  "TE",
  "AMO",
  "MUCHO",
  "JOSELIN",
];
const wordDurationMs = 3000;
const wordFadeMs = 280;
const floatingWordsConfig = {
  spawnPerSecond: 2.3,
  minSize: 12,
  maxSize: 22,
  minAlpha: 0.08,
  maxAlpha: 0.22,
  minLife: 2.4,
  maxLife: 4.8,
  maxSpeedX: 24,
  maxSpeedY: 16,
};

const heartsConfig = {
  spawnPerSecond: 3.2,
  minSize: 8,
  maxSize: 34,
  minAlpha: 0.3,
  maxAlpha: 0.65,
  minRiseSpeed: 28,
  maxRiseSpeed: 74,
  maxDriftSpeed: 26,
  glowStrength: 0.8,
  pinkPalette: [
    [255, 72, 122],
    [255, 96, 152],
    [255, 138, 180],
    [244, 92, 146],
    [255, 110, 168],
  ],
};

const bufferCanvas = document.createElement("canvas");
const bufferCtx = bufferCanvas.getContext("2d", { willReadFrequently: true });
bufferCanvas.width = size;
bufferCanvas.height = size;
bufferCtx.imageSmoothingEnabled = false;

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

function getViewportSize() {
  if (window.visualViewport) {
    return {
      width: Math.round(window.visualViewport.width),
      height: Math.round(window.visualViewport.height),
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

function recalculateMotion() {
  if (Number.isFinite(video.duration) && video.duration > 0) {
    // Escala suavemente la velocidad segun duracion del clip.
    speed = Math.max(120, (viewportWidth + size) / video.duration);
  } else {
    speed = defaultSpeed;
  }

  const minX = -offscreenMargin;
  const maxX = viewportWidth - size + offscreenMargin;
  if (x === 0) {
    x = maxX;
  } else {
    x = Math.min(maxX, Math.max(minX, x));
  }
}

function resizeCanvas() {
  const viewport = getViewportSize();
  viewportWidth = viewport.width;
  viewportHeight = viewport.height;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(viewportWidth * dpr);
  canvas.height = Math.floor(viewportHeight * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;

  recalculateMotion();
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", resizeCanvas);
  window.visualViewport.addEventListener("scroll", resizeCanvas);
}

function processFrame() {
  bufferCtx.clearRect(0, 0, size, size);
  bufferCtx.drawImage(video, 0, 0, size, size);

  const frame = bufferCtx.getImageData(0, 0, size, size);
  const data = frame.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const maxOther = Math.max(r, b);
    const dominance = g - maxOther;

    if (g >= keying.minGreen && dominance >= keying.greenDominance) {
      data[i + 3] = 0;
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      continue;
    }

    if (dominance > 0) {
      // Suaviza borde y reduce derrame verde sin recortar de golpe.
      const fade = Math.min(dominance / keying.edgeSoftness, 1);
      data[i + 3] = Math.round(data[i + 3] * (1 - fade * 0.82));
      data[i + 1] = Math.round(g * (1 - fade * 0.35));
    }

    // Quita halos claros en bordes semitransparentes (white fringe).
    const a = data[i + 3];
    if (a <= keying.alphaCut) {
      data[i + 3] = 0;
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      continue;
    }

    if (a < 255) {
      const m = a / 255;
      data[i] = Math.round(data[i] * m);
      data[i + 1] = Math.round(data[i + 1] * m);
      data[i + 2] = Math.round(data[i + 2] * m);
    }
  }

  bufferCtx.putImageData(frame, 0, 0);
  processedFrameReady = true;
}

function scheduleVideoProcessing() {
  if (typeof video.requestVideoFrameCallback === "function") {
    video.requestVideoFrameCallback(() => {
      processFrame();
      scheduleVideoProcessing();
    });
  }
}

function drawCharacter(drawX, drawY, flipHorizontally) {
  if (!flipHorizontally) {
    ctx.drawImage(bufferCanvas, drawX, drawY, size, size);
    return;
  }

  ctx.save();
  ctx.translate(drawX + size, drawY);
  ctx.scale(-1, 1);
  ctx.drawImage(bufferCanvas, 0, 0, size, size);
  ctx.restore();
}

function startTopTextRotation() {
  if (!topText || rotatingWords.length === 0) {
    return;
  }

  topText.textContent = rotatingWords[wordIndex];

  setInterval(() => {
    topText.classList.add("is-hidden");

    setTimeout(() => {
      wordIndex = (wordIndex + 1) % rotatingWords.length;
      topText.textContent = rotatingWords[wordIndex];
      floatingWords.length = 0;
      if (!hasShownNextButton && wordIndex === 0 && nextPageBtn) {
        nextPageBtn.classList.add("is-visible");
        hasShownNextButton = true;
      }
      topText.classList.remove("is-hidden");
    }, wordFadeMs);
  }, wordDurationMs);
}

function getCurrentMainWord() {
  return rotatingWords[wordIndex] || "";
}

function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

function spawnHeart() {
  const sizeValue = randomRange(heartsConfig.minSize, heartsConfig.maxSize);
  const paletteIndex = Math.floor(randomRange(0, heartsConfig.pinkPalette.length));
  const [r, g, b] = heartsConfig.pinkPalette[paletteIndex];
  hearts.push({
    x: randomRange(0, viewportWidth),
    y: viewportHeight + sizeValue + randomRange(4, 50),
    size: sizeValue,
    alpha: randomRange(heartsConfig.minAlpha, heartsConfig.maxAlpha),
    color: { r, g, b },
    speedY: randomRange(heartsConfig.minRiseSpeed, heartsConfig.maxRiseSpeed),
    speedX: randomRange(-heartsConfig.maxDriftSpeed, heartsConfig.maxDriftSpeed),
    phase: randomRange(0, Math.PI * 2),
    phaseSpeed: randomRange(0.8, 2.1),
  });
}

function drawHeart(xPos, yPos, heartSize, alpha, color) {
  const half = heartSize / 2;
  const top = -half * 0.35;
  const bottom = half * 0.95;
  const left = -half;
  const right = half;
  ctx.save();
  ctx.translate(xPos, yPos);
  ctx.scale(1, 1.05);
  ctx.beginPath();
  ctx.moveTo(0, bottom);
  ctx.bezierCurveTo(left * 0.45, half * 0.55, left * 0.95, half * 0.1, left * 0.9, top);
  ctx.bezierCurveTo(left * 0.85, -half * 0.7, left * 0.15, -half * 0.78, 0, -half * 0.38);
  ctx.bezierCurveTo(right * 0.15, -half * 0.78, right * 0.85, -half * 0.7, right * 0.9, top);
  ctx.bezierCurveTo(right * 0.95, half * 0.1, right * 0.45, half * 0.55, 0, bottom);
  ctx.closePath();

  // Halo exterior para efecto brillante.
  ctx.shadowBlur = heartSize * 1.1;
  ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * heartsConfig.glowStrength})`;
  ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
  ctx.fill();

  // Centro un poco mas brillante para dar volumen.
  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(255, 210, 230, ${Math.min(0.6, alpha * 0.75)})`;
  ctx.beginPath();
  ctx.moveTo(0, bottom * 0.55);
  ctx.bezierCurveTo(left * 0.3, half * 0.2, left * 0.35, -half * 0.25, 0, -half * 0.12);
  ctx.bezierCurveTo(right * 0.35, -half * 0.25, right * 0.3, half * 0.2, 0, bottom * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function spawnFloatingWord() {
  const text = getCurrentMainWord();
  if (!text) {
    return;
  }

  floatingWords.push({
    text,
    x: randomRange(30, viewportWidth - 30),
    y: randomRange(30, viewportHeight - 30),
    size: randomRange(floatingWordsConfig.minSize, floatingWordsConfig.maxSize),
    baseAlpha: randomRange(floatingWordsConfig.minAlpha, floatingWordsConfig.maxAlpha),
    life: randomRange(floatingWordsConfig.minLife, floatingWordsConfig.maxLife),
    age: 0,
    vx: randomRange(-floatingWordsConfig.maxSpeedX, floatingWordsConfig.maxSpeedX),
    vy: randomRange(-floatingWordsConfig.maxSpeedY, floatingWordsConfig.maxSpeedY),
  });
}

function updateAndDrawFloatingWords(dt) {
  floatingWordSpawnAccumulator += dt * floatingWordsConfig.spawnPerSecond;
  while (floatingWordSpawnAccumulator >= 1) {
    spawnFloatingWord();
    floatingWordSpawnAccumulator -= 1;
  }

  for (let i = floatingWords.length - 1; i >= 0; i -= 1) {
    const word = floatingWords[i];
    word.age += dt;
    if (word.age >= word.life) {
      floatingWords.splice(i, 1);
      continue;
    }

    word.x += word.vx * dt;
    word.y += word.vy * dt;

    const progress = word.age / word.life;
    const fade = 1 - progress;
    const alpha = Math.max(0, word.baseAlpha * fade);

    ctx.save();
    ctx.font = `${word.size}px "Trebuchet MS", "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillText(word.text, word.x, word.y);
    ctx.restore();
  }
}

function updateAndDrawHearts(dt) {
  heartSpawnAccumulator += dt * heartsConfig.spawnPerSecond;
  while (heartSpawnAccumulator >= 1) {
    spawnHeart();
    heartSpawnAccumulator -= 1;
  }

  for (let i = hearts.length - 1; i >= 0; i -= 1) {
    const heart = hearts[i];
    heart.phase += heart.phaseSpeed * dt;
    heart.y -= heart.speedY * dt;
    heart.x += (heart.speedX + Math.sin(heart.phase) * 10) * dt;

    if (heart.y < -heart.size * 2 || heart.x < -heart.size * 2 || heart.x > viewportWidth + heart.size * 2) {
      hearts.splice(i, 1);
      continue;
    }

    drawHeart(heart.x, heart.y, heart.size, heart.alpha, heart.color);
  }
}

function draw(now) {
  if (lastTime === null) {
    lastTime = now;
  }

  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  ctx.clearRect(0, 0, viewportWidth, viewportHeight);
  updateAndDrawFloatingWords(dt);
  updateAndDrawHearts(dt);

  x += direction * speed * dt;

  const leftExit = -size - offscreenMargin;
  const rightExit = viewportWidth + offscreenMargin;
  if (direction < 0 && x <= leftExit) {
    // Salio totalmente por la izquierda: reaparece fuera por la izquierda y vuelve.
    x = leftExit;
    direction = 1;
  } else if (direction > 0 && x >= rightExit) {
    // Salio totalmente por la derecha: reaparece fuera por la derecha y regresa.
    x = rightExit;
    direction = -1;
  }

  // Fallback para navegadores sin requestVideoFrameCallback.
  if (!processedFrameReady || typeof video.requestVideoFrameCallback !== "function") {
    processFrame();
  }

  const y = viewportHeight - size + characterBottomOffset;
  const flipHorizontally = direction > 0;
  drawCharacter(x, y, flipHorizontally);

  animationId = requestAnimationFrame((ts) => draw(ts));
}

async function startAnimation() {
  try {
    await video.play();
  } catch (err) {
    console.log("Autoplay bloqueado:", err);
  }

  recalculateMotion();
  scheduleVideoProcessing();

  if (animationId === null) {
    animationId = requestAnimationFrame((ts) => draw(ts));
  }
}

video.addEventListener("loadedmetadata", recalculateMotion);

if (video.readyState >= 2) {
  startAnimation();
} else {
  video.addEventListener("loadeddata", startAnimation, { once: true });
}

startTopTextRotation();
startMusicIfPossible();
attachMusicInteractionFallback();

if (nextPageBtn) {
  nextPageBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const targetUrl = nextPageBtn.getAttribute("href") || "Fogata.html";
    fadeOutMusicAndGo(targetUrl);
  });
}
