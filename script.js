/**
 * Dino Runner Game
 * Built with vanilla HTML5, CSS3, and JavaScript (No external libraries)
 */

// --- Canvas & Audio Setup ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const currentScoreDisplay = document.getElementById('current-score-display');
const highScoreDisplay = document.getElementById('high-score-display');
const gameOverlay = document.getElementById('game-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlaySubtitle = document.getElementById('overlay-subtitle');
const gameOverStats = document.getElementById('game-over-stats');
const finalScore = document.getElementById('final-score');
const finalBest = document.getElementById('final-best');
const actionBtn = document.getElementById('action-btn');
const mobileJumpBtn = document.getElementById('mobile-jump-btn');
const gameContainer = document.getElementById('game-container');

// Sound synthesizer using Web Audio API (Zero external audio files needed)
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(type) {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;

  if (type === 'jump') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.1);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'hit') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.25);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } else if (type === 'score') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.setValueAtTime(900, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }
}

// --- Game Constants & State ---
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 260;
const GROUND_Y = 220;

const STATE_IDLE = 'IDLE';
const STATE_RUNNING = 'RUNNING';
const STATE_GAMEOVER = 'GAMEOVER';

let gameState = STATE_IDLE;
let score = 0;
let highScore = parseInt(localStorage.getItem('dino_runner_high_score') || '0', 10);
let baseSpeed = 6;
let currentSpeed = baseSpeed;
let frameCount = 0;

function formatScore(n) {
  return String(Math.floor(n)).padStart(5, '0');
}

highScoreDisplay.textContent = formatScore(highScore);

// --- Game Entities ---

// 1. Dinosaur
const dino = {
  x: 50,
  y: GROUND_Y - 48,
  width: 44,
  height: 48,
  vy: 0,
  gravity: 0.65,
  jumpStrength: -12.5,
  isGrounded: true,
  runFrame: 0,

  reset() {
    this.x = 50;
    this.y = GROUND_Y - 48;
    this.vy = 0;
    this.isGrounded = true;
    this.runFrame = 0;
  },

  jump() {
    if (this.isGrounded && gameState === STATE_RUNNING) {
      this.vy = this.jumpStrength;
      this.isGrounded = false;
      playSound('jump');
    }
  },

  update() {
    if (!this.isGrounded) {
      this.vy += this.gravity;
      this.y += this.vy;

      if (this.y >= GROUND_Y - this.height) {
        this.y = GROUND_Y - this.height;
        this.vy = 0;
        this.isGrounded = true;
      }
    } else {
      if (frameCount % 6 === 0) {
        this.runFrame = 1 - this.runFrame;
      }
    }
  },

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const color = gameState === STATE_GAMEOVER ? '#ef4444' : '#535353';
    ctx.fillStyle = color;

    // Body & Tail
    ctx.fillRect(10, 16, 24, 22);
    ctx.fillRect(4, 24, 8, 12);
    ctx.fillRect(0, 28, 6, 8);

    // Neck & Head
    ctx.fillRect(20, 4, 18, 14);
    ctx.fillRect(24, 0, 20, 14);
    ctx.fillRect(36, 12, 8, 4);

    // Arm
    ctx.fillRect(32, 22, 6, 3);
    ctx.fillRect(36, 24, 3, 3);

    // Eye
    if (gameState === STATE_GAMEOVER) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(27, 3);
      ctx.lineTo(31, 7);
      ctx.moveTo(31, 3);
      ctx.lineTo(27, 7);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(28, 3, 4, 4);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(29, 4, 2, 2);
    }

    // Legs
    ctx.fillStyle = color;
    if (!this.isGrounded) {
      ctx.fillRect(14, 38, 4, 6);
      ctx.fillRect(22, 38, 4, 6);
    } else if (this.runFrame === 0) {
      ctx.fillRect(14, 38, 4, 10);
      ctx.fillRect(14, 46, 6, 2);
      ctx.fillRect(24, 38, 4, 6);
    } else {
      ctx.fillRect(14, 38, 4, 6);
      ctx.fillRect(24, 38, 4, 10);
      ctx.fillRect(24, 46, 6, 2);
    }

    ctx.restore();
  }
};

// 2. Obstacles (Cacti)
let obstacles = [];
let nextObstacleDistance = 0;

function createObstacle() {
  const types = [
    { type: 'small', width: 22, height: 38 },
    { type: 'tall', width: 26, height: 50 },
    { type: 'double', width: 44, height: 42 }
  ];

  const choice = types[Math.floor(Math.random() * types.length)];
  return {
    x: CANVAS_WIDTH + 20,
    y: GROUND_Y - choice.height,
    width: choice.width,
    height: choice.height,
    type: choice.type
  };
}

function drawCactus(obs) {
  ctx.save();
  ctx.fillStyle = '#2e7d32';

  const { x, y, width, height, type } = obs;

  if (type === 'small') {
    ctx.fillRect(x + 7, y, 8, height);
    ctx.fillRect(x + 1, y + 10, 7, 4);
    ctx.fillRect(x + 1, y + 6, 4, 8);
    ctx.fillRect(x + 14, y + 14, 7, 4);
    ctx.fillRect(x + 17, y + 8, 4, 8);
  } else if (type === 'tall') {
    ctx.fillRect(x + 8, y, 10, height);
    ctx.fillRect(x + 1, y + 16, 8, 5);
    ctx.fillRect(x + 1, y + 10, 5, 10);
    ctx.fillRect(x + 17, y + 20, 8, 5);
    ctx.fillRect(x + 20, y + 12, 5, 12);
  } else {
    ctx.fillRect(x + 4, y + 4, 8, height - 4);
    ctx.fillRect(x, y + 12, 5, 4);
    ctx.fillRect(x, y + 8, 4, 7);
    ctx.fillRect(x + 22, y, 10, height);
    ctx.fillRect(x + 15, y + 14, 8, 4);
    ctx.fillRect(x + 31, y + 16, 8, 4);
    ctx.fillRect(x + 35, y + 10, 4, 10);
  }

  ctx.restore();
}

// 3. Ground & Background Elements
const groundParticles = [];
for (let i = 0; i < 40; i++) {
  groundParticles.push({
    x: Math.random() * CANVAS_WIDTH,
    y: GROUND_Y + 5 + Math.random() * 25,
    length: 2 + Math.random() * 8
  });
}

const clouds = [
  { x: 120, y: 50, speed: 0.6, scale: 0.9 },
  { x: 420, y: 35, speed: 0.4, scale: 1.1 },
  { x: 700, y: 65, speed: 0.5, scale: 0.8 }
];

function drawClouds() {
  ctx.fillStyle = '#cbd5e1';
  clouds.forEach(cloud => {
    if (gameState === STATE_RUNNING) {
      cloud.x -= cloud.speed;
      if (cloud.x < -100) cloud.x = CANVAS_WIDTH + 50;
    }
    const cx = cloud.x;
    const cy = cloud.y;
    ctx.beginPath();
    ctx.arc(cx, cy, 14 * cloud.scale, 0, Math.PI * 2);
    ctx.arc(cx + 12 * cloud.scale, cy - 6 * cloud.scale, 16 * cloud.scale, 0, Math.PI * 2);
    ctx.arc(cx + 28 * cloud.scale, cy - 4 * cloud.scale, 14 * cloud.scale, 0, Math.PI * 2);
    ctx.arc(cx + 38 * cloud.scale, cy, 12 * cloud.scale, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawGround() {
  ctx.strokeStyle = '#535353';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  groundParticles.forEach(p => {
    if (gameState === STATE_RUNNING) {
      p.x -= currentSpeed;
      if (p.x < -20) p.x = CANVAS_WIDTH + Math.random() * 40;
    }
    ctx.fillRect(p.x, p.y, p.length, 2);
  });
}

// --- Collision Detection (Tight Hitboxes) ---
function checkCollision(player, obs) {
  const pBox = {
    x: player.x + 8,
    y: player.y + 4,
    width: player.width - 14,
    height: player.height - 6
  };

  const oBox = {
    x: obs.x + 4,
    y: obs.y + 4,
    width: obs.width - 8,
    height: obs.height - 4
  };

  return (
    pBox.x < oBox.x + oBox.width &&
    pBox.x + pBox.width > oBox.x &&
    pBox.y < oBox.y + oBox.height &&
    pBox.y + pBox.height > oBox.y
  );
}

// --- Game Loop & Logic ---
function startGame() {
  initAudio();
  gameState = STATE_RUNNING;
  score = 0;
  currentSpeed = baseSpeed;
  obstacles = [];
  nextObstacleDistance = 100;
  dino.reset();

  gameOverlay.classList.add('hidden');
  gameOverStats.classList.add('hidden');
  actionBtn.textContent = 'Restart Game';
}

function triggerGameOver() {
  gameState = STATE_GAMEOVER;
  playSound('hit');

  if (score > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem('dino_runner_high_score', highScore);
    highScoreDisplay.textContent = formatScore(highScore);
  }

  overlayTitle.textContent = 'Game Over!';
  overlaySubtitle.textContent = 'Watch out for those prickly cacti!';
  finalScore.textContent = formatScore(score);
  finalBest.textContent = formatScore(highScore);
  gameOverStats.classList.remove('hidden');
  gameOverlay.querySelector('.overlay-card').classList.add('game-over');
  actionBtn.textContent = 'Try Again';

  gameOverlay.classList.remove('hidden');
}

function triggerJump() {
  initAudio();
  if (gameState === STATE_IDLE || gameState === STATE_GAMEOVER) {
    startGame();
  } else if (gameState === STATE_RUNNING) {
    dino.jump();
  }
}

function getNextGap() {
  const minGap = Math.max(160, currentSpeed * 28);
  const maxGap = minGap + 220;
  return Math.random() * (maxGap - minGap) + minGap;
}

function update() {
  frameCount++;

  if (gameState === STATE_RUNNING) {
    const prevScore = Math.floor(score);
    score += 0.15;
    const currentFloor = Math.floor(score);

    currentScoreDisplay.textContent = formatScore(score);

    if (currentFloor > 0 && currentFloor % 100 === 0 && prevScore % 100 !== 0) {
      playSound('score');
      currentScoreDisplay.classList.add('score-flash');
      setTimeout(() => currentScoreDisplay.classList.remove('score-flash'), 800);
    }

    currentSpeed = baseSpeed + Math.min(score * 0.006, 7.5);
    dino.update();

    nextObstacleDistance -= currentSpeed;
    if (nextObstacleDistance <= 0) {
      obstacles.push(createObstacle());
      nextObstacleDistance = getNextGap();
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obs = obstacles[i];
      obs.x -= currentSpeed;

      if (checkCollision(dino, obs)) {
        triggerGameOver();
        break;
      }

      if (obs.x + obs.width < -30) {
        obstacles.splice(i, 1);
      }
    }
  }
}

function render() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawClouds();
  drawGround();
  obstacles.forEach(obs => drawCactus(obs));
  dino.draw(ctx);
}

function gameLoop() {
  update();
  render();
  requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    triggerJump();
  }
});

gameContainer.addEventListener('pointerdown', (e) => {
  if (e.target === actionBtn) return;
  triggerJump();
});

actionBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  startGame();
});

mobileJumpBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  triggerJump();
});

document.addEventListener('touchstart', (e) => {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

requestAnimationFrame(gameLoop);