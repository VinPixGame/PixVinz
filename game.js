// game.js
document.addEventListener('DOMContentLoaded', () => {
  // --- START GAME BACKGROUND MUSIC ---
  if (typeof AudioManager !== 'undefined') {
    if (typeof AudioManager.playGameBGM === 'function') {
      AudioManager.playGameBGM();
    } else if (AudioManager.bgmGame) {
      if (AudioManager.bgmMain) AudioManager.bgmMain.pause();
      AudioManager.bgmGame.loop = true;
      AudioManager.bgmGame.play().catch(e => console.log("Audio autoplay blocked:", e));
    }
  }

  // Fallback click listener to satisfy browser autoplay policies if blocked
  document.addEventListener('click', () => {
    if (typeof AudioManager !== 'undefined' && AudioManager.musicEnabled) {
      if (typeof AudioManager.playGameBGM === 'function') {
        AudioManager.playGameBGM();
      } else if (AudioManager.bgmGame && AudioManager.bgmGame.paused) {
        AudioManager.bgmGame.play().catch(e => console.log(e));
      }
    }
  }, { once: true });

  // --- DOM Elements ---
  const backToHome = document.getElementById('backToHome');
  const coinCount = document.getElementById('coinCount');
  const levelDisplay = document.getElementById('levelDisplay');
  const timerDisplay = document.getElementById('timerDisplay');
  const movesDisplay = document.getElementById('movesDisplay');
  const puzzleGrid = document.getElementById('puzzleGrid');
  const previewBtn = document.getElementById('previewBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');

  // Preview Modal Elements
  const imageModal = document.getElementById('imageModal');
  const modalPreviewImg = document.getElementById('modalPreviewImg');
  const modalLevelTitle = document.getElementById('modalLevelTitle');
  const countdownSeconds = document.getElementById('countdownSeconds');
  const closePreviewBtn = document.getElementById('closePreviewBtn');

  // Victory Modal Elements
  const victoryModal = document.getElementById('victoryModal');
  const victoryImg = document.getElementById('victoryImg');
  const vTime = document.getElementById('vTime');
  const vMoves = document.getElementById('vMoves');
  const vCoins = document.getElementById('vCoins');
  const vXp = document.getElementById('vXp');
  const victoryHomeBtn = document.getElementById('victoryHomeBtn');
  const nextLevelBtn = document.getElementById('nextLevelBtn');
  const confettiCanvas = document.getElementById('confettiCanvas');

  // --- State & Variables ---
  const urlParams = new URLSearchParams(window.location.search);
  let currentLevel = parseInt(urlParams.get('level')) || 1;
  const maxLevels = 200;

  let currentUser = JSON.parse(localStorage.getItem('loggedInUser')) || null;

  function getUserKey(keyName) {
    if (!currentUser || !currentUser.username) return keyName;
    return `${currentUser.username}_${keyName}`;
  }

  function getCoins() {
    return parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0;
  }

  function setCoins(val) {
    localStorage.setItem(getUserKey('totalCoins'), val);
    if (coinCount) coinCount.innerText = val;
  }

  let moves = 0;
  let secondsElapsed = 0;
  let timerInterval = null;
  let isPlaying = false;
  let previewTimer = null;

  // Puzzle settings: 3x3 grid setup for tap-to-swap
  const gridSize = 3;
  const totalTiles = gridSize * gridSize; // 9 tiles
  let currentTiles = []; 
  let selectedTileIndex = null;

  // --- Initialization ---
  if (coinCount) coinCount.innerText = getCoins();
  if (levelDisplay) levelDisplay.innerText = currentLevel.toString().padStart(2, '0');

  setupPuzzle();
  startTimer();

  // --- Navigation & Back ---
  if (backToHome) {
    backToHome.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      window.location.href = 'index.html';
    });
  }

  if (victoryHomeBtn) {
    victoryHomeBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      window.location.href = 'index.html';
    });
  }

  if (nextLevelBtn) {
    nextLevelBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      if (currentLevel < maxLevels) {
        window.location.href = `game.html?level=${currentLevel + 1}`;
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  // --- Timer & Moves Logic ---
  function startTimer() {
    secondsElapsed = 0;
    if (timerDisplay) timerDisplay.innerText = '00:00';
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      if (!isPlaying) return;
      secondsElapsed++;
      const mins = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
      const secs = (secondsElapsed % 60).toString().padStart(2, '0');
      if (timerDisplay) timerDisplay.innerText = `${mins}:${secs}`;
    }, 1000);
  }

  function updateMoves(val) {
    moves = val;
    if (movesDisplay) movesDisplay.innerText = moves;
  }

  // --- Puzzle Board Setup & Shuffling ---
  function setupPuzzle() {
    currentTiles = Array.from({ length: totalTiles }, (_, i) => i);
    shuffleTiles();
    renderBoard();
    updateMoves(0);
    isPlaying = true;
  }

  function shuffleTiles() {
    do {
      for (let i = currentTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentTiles[i], currentTiles[j]] = [currentTiles[j], currentTiles[i]];
      }
    } while (isSolved());
  }

  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      shuffleTiles();
      renderBoard();
      updateMoves(0);
      selectedTileIndex = null;
      isPlaying = true;
    });
  }

  function isSolved() {
    for (let i = 0; i < totalTiles; i++) {
      if (currentTiles[i] !== i) return false;
    }
    return true;
  }

  function renderBoard() {
    if (!puzzleGrid) return;
    puzzleGrid.innerHTML = '';

    const imageUrl = `image/level${currentLevel}.jpeg`;

    currentTiles.forEach((tileOrigIndex, currentIndex) => {
      const tileDiv = document.createElement('div');
      tileDiv.className = 'puzzle-tile';
      if (selectedTileIndex === currentIndex) {
        tileDiv.style.border = '3px solid #ffd700';
        tileDiv.style.transform = 'scale(0.95)';
        tileDiv.style.boxShadow = '0 0 15px rgba(255, 215, 0, 0.6)';
      }

      const row = Math.floor(tileOrigIndex / gridSize);
      const col = tileOrigIndex % gridSize;
      const xPercent = gridSize > 1 ? (col / (gridSize - 1)) * 100 : 0;
      const yPercent = gridSize > 1 ? (row / (gridSize - 1)) * 100 : 0;

      tileDiv.style.backgroundImage = `url('${imageUrl}')`;
      tileDiv.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
      tileDiv.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
      tileDiv.style.cursor = 'pointer';
      tileDiv.style.borderRadius = '8px';
      tileDiv.style.transition = 'transform 0.15s ease, border 0.15s ease';

      tileDiv.addEventListener('click', () => {
        if (!isPlaying) return;
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();

        if (selectedTileIndex === null) {
          selectedTileIndex = currentIndex;
          renderBoard();
        } else if (selectedTileIndex === currentIndex) {
          selectedTileIndex = null;
          renderBoard();
        } else {
          [currentTiles[selectedTileIndex], currentTiles[currentIndex]] = [currentTiles[currentIndex], currentTiles[selectedTileIndex]];
          selectedTileIndex = null;
          updateMoves(moves + 1);
          renderBoard();

          if (isSolved()) {
            handleVictory();
          }
        }
      });

      puzzleGrid.appendChild(tileDiv);
    });
  }

  // --- Preview Logic ---
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      const currentCoins = getCoins();
      if (currentCoins < 5) {
        alert('Not enough coins for a preview! (Needs 5 🪙)');
        return;
      }
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      setCoins(currentCoins - 5);

      if (modalPreviewImg && modalLevelTitle && imageModal) {
        modalPreviewImg.src = `image/level${currentLevel}.jpeg`;
        modalLevelTitle.innerText = `LEVEL ${currentLevel.toString().padStart(2, '0')} PREVIEW`;
        imageModal.classList.remove('hidden');

        let secondsLeft = 10;
        if (countdownSeconds) countdownSeconds.innerText = secondsLeft;

        if (previewTimer) clearInterval(previewTimer);
        previewTimer = setInterval(() => {
          secondsLeft--;
          if (countdownSeconds) countdownSeconds.innerText = secondsLeft;
          if (secondsLeft <= 0) {
            clearInterval(previewTimer);
            imageModal.classList.add('hidden');
          }
        }, 1000);
      }
    });
  }

  if (closePreviewBtn && imageModal) {
    closePreviewBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      if (previewTimer) clearInterval(previewTimer);
      imageModal.classList.add('hidden');
    });
  }

  // --- Victory Logic ---
  function handleVictory() {
    isPlaying = false;
    if (timerInterval) clearInterval(timerInterval);

    if (typeof AudioManager !== 'undefined') AudioManager.playVictory();

    const earnedCoins = 15;
    const earnedXp = 50;
    setCoins(getCoins() + earnedCoins);

    const unlockedMax = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;
    if (currentLevel >= unlockedMax && currentLevel < maxLevels) {
      localStorage.setItem(getUserKey('currentLevel'), currentLevel + 1);
    }

    localStorage.setItem(getUserKey(`levelCoins_${currentLevel}`), earnedCoins);
    const minsStr = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const secsStr = (secondsElapsed % 60).toString().padStart(2, '0');
    localStorage.setItem(getUserKey(`levelTime_${currentLevel}`), `${minsStr}:${secsStr}`);
    localStorage.setItem(getUserKey(`levelMoves_${currentLevel}`), moves);

    if (victoryImg) victoryImg.src = `image/level${currentLevel}.jpeg`;
    if (vTime) vTime.innerText = `${minsStr}:${secsStr}`;
    if (vMoves) vMoves.innerText = moves;
    if (vCoins) vCoins.innerText = `+${earnedCoins}`;
    if (vXp) vXp.innerText = `+${earnedXp}`;

    if (victoryModal) {
      victoryModal.classList.remove('hidden');
      startConfetti();
    }

    if (window.pixvinzDb && currentUser) {
      const { db, doc, setDoc } = window.pixvinzDb;
      setDoc(doc(db, "players", currentUser.username), {
        level: Math.max(unlockedMax, currentLevel + 1),
        coins: getCoins(),
        lastUpdated: new Date()
      }, { merge: true }).catch(err => console.error("Sync error:", err));
    }
  }

  // --- Confetti Effect ---
  function startConfetti() {
    if (!confettiCanvas) return;
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#ffd700', '#ab47bc', '#7e57c2', '#ff4081', '#00e676'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        r: Math.random() * 6 + 4,
        dx: Math.random() * 4 - 2,
        dy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    let animationFrameId;
    function draw() {
      ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        p.x += p.dx;
        p.y += p.dy;

        if (p.y > confettiCanvas.height) {
          p.y = -10;
          p.x = Math.random() * confettiCanvas.width;
        }
      });
      animationFrameId = requestAnimationFrame(draw);
    }
    draw();
  }
});
