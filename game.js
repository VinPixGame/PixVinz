// game.js - Complete Synchronized Logic with Safe Module DOM Bootstrapping

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const currentLevel = parseInt(urlParams.get('level')) || 1;

  const levelDisplay = document.getElementById('levelDisplay');
  if (levelDisplay) {
    levelDisplay.innerText = currentLevel.toString().padStart(2, '0');
  }

  // Fetch cloud/local data and update coin display from playerstat.js
  if (typeof fetchUserDataFromFirestore === 'function') {
    await fetchUserDataFromFirestore();
  }
  if (typeof updateCoinDisplay === 'function') {
    updateCoinDisplay();
  }

  const grid = document.getElementById('puzzleGrid');
  const movesDisplay = document.getElementById('movesDisplay');
  const timerDisplay = document.getElementById('timerDisplay');

  function getLevelImageIndex(levelNum) {
      return ((levelNum - 1) % 200) + 1;
  }

  function getGridSize(level) {
    if (level <= 10) return 3;
    if (level <= 30) return 4;
    if (level <= 60) return 5;
    if (level <= 100) return 6;
    if (level <= 150) return 7;
    return 8;
  }

  const gridSize = getGridSize(currentLevel);
  const totalTiles = gridSize * gridSize;

  let moves = 0;
  let seconds = 0;
  let timerInterval = null;
  let tilesState = Array.from({ length: totalTiles }, (_, i) => i);
  let selectedTilePos = null;
  let isGameStarted = false;

  const imageSrc = `image/level${getLevelImageIndex(currentLevel)}.png`;

  function startGameBGM() {
    if (typeof AudioManager !== 'undefined' && AudioManager.musicEnabled) {
      AudioManager.playGame();
    }
  }
  document.body.addEventListener('click', startGameBGM, { once: true });

  function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerInterval = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      if (timerDisplay) timerDisplay.innerText = `${mins}:${secs}`;
    }, 1000);
  }

  function renderGrid() {
    if (!grid) return;
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

    const percentStep = 100 / (gridSize - 1);

    tilesState.forEach((tileIdx, currentPos) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      
      if (selectedTilePos === currentPos) {
        tile.classList.add('selected');
      }

      tile.style.backgroundImage = `url('${imageSrc}')`;
      tile.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;

      const row = Math.floor(tileIdx / gridSize);
      const col = tileIdx % gridSize;
      tile.style.backgroundPosition = `${col * percentStep}% ${row * percentStep}%`;

      tile.addEventListener('click', () => handleTileClick(currentPos));
      grid.appendChild(tile);
    });
  }

  function handleTileClick(pos) {
    if (!isGameStarted) return;
    if (typeof AudioManager !== 'undefined') AudioManager.playSelect();

    if (selectedTilePos === null) {
      selectedTilePos = pos;
      renderGrid();
    } else if (selectedTilePos === pos) {
      selectedTilePos = null;
      renderGrid();
    } else {
      [tilesState[selectedTilePos], tilesState[pos]] = [tilesState[pos], tilesState[selectedTilePos]];
      selectedTilePos = null;
      moves++;
      if (movesDisplay) movesDisplay.innerText = moves;
      renderGrid();
      checkWin();
    }
  }

  function shuffleGrid() {
    const tileCount = tilesState.length;
    for (let i = 0; i < tileCount * 5; i++) {
      const idx1 = Math.floor(Math.random() * tileCount);
      const idx2 = Math.floor(Math.random() * tileCount);
      [tilesState[idx1], tilesState[idx2]] = [tilesState[idx2], tilesState[idx1]];
    }
    selectedTilePos = null;
    renderGrid();
  }

  function checkWin() {
    if (!isGameStarted) return;
    const isSolved = tilesState.every((val, idx) => val === idx);
    if (isSolved) {
      clearInterval(timerInterval);
      if (typeof AudioManager !== 'undefined') AudioManager.playVictory(currentLevel);

      let stars = 1;
      if (moves <= gridSize * 5) stars = 3;
      else if (moves <= gridSize * 8) stars = 2;

      const victoryImg = document.getElementById('victoryImg');
      if (victoryImg) victoryImg.src = imageSrc;

      const vTime = document.getElementById('vTime');
      if (vTime && timerDisplay) vTime.innerText = timerDisplay.innerText;

      const vMoves = document.getElementById('vMoves');
      if (vMoves) vMoves.innerText = moves;

      const earnedCoins = stars * 5;
      const vCoins = document.getElementById('vCoins');
      if (vCoins) vCoins.innerText = `+${earnedCoins}`;

      let tier = Math.floor((currentLevel - 1) / 10);
      let xpGained = (tier + 1) * 100;
      const vXp = document.getElementById('vXp');
      if (vXp) vXp.innerText = `+${xpGained}`;

      const starNodes = document.querySelectorAll('#victoryStars .star');
      starNodes.forEach((star, index) => {
        if (index < stars) star.classList.add('active');
        else star.classList.remove('active');
      });

      const currentMoves = moves;
      const currentTimeStr = timerDisplay ? timerDisplay.innerText : "00:00";

      // --- FIX: Sync Level, Coins, and User Profile Data for profile.js & Firestore ---
      const levelKey = typeof getUserKey === 'function' ? getUserKey('currentLevel') : 'currentLevel';
      const coinKey = typeof getUserKey === 'function' ? getUserKey('totalCoins') : 'totalCoins';
      
      const savedLevel = parseInt(localStorage.getItem(levelKey)) || currentLevel;
      const nextLvl = currentLevel >= savedLevel ? currentLevel + 1 : savedLevel;
      localStorage.setItem(levelKey, nextLvl);

      const currentCoins = parseInt(localStorage.getItem(coinKey)) || 0;
      const newTotalCoins = currentCoins + earnedCoins;
      localStorage.setItem(coinKey, newTotalCoins);

      try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj) {
          userObj.level = nextLvl;
          userObj.coins = newTotalCoins;
          localStorage.setItem('loggedInUser', JSON.stringify(userObj));
        }
      } catch (e) {}
      // ------------------------------------------------------------------------------

      if (typeof handleLevelVictory === 'function') {
        handleLevelVictory(currentLevel, stars, currentMoves, currentTimeStr);
      }

      if (typeof saveUserDataToCloud === 'function') {
        saveUserDataToCloud();
      }

      startConfetti();
    }
  }
  function startConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 220 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 22,
      vy: (Math.random() - 0.7) * 20,
      size: Math.random() * 9 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      color: ['#ffd700', '#9d4edd', '#ff007f', '#00f0ff', '#ffffff', '#ff9e00'][Math.floor(Math.random() * 6)]
    }));

    const startTime = Date.now();
    const minDuration = 2000;

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4;
        p.vx *= 0.98;
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      const elapsed = Date.now() - startTime;
      const stillVisible = particles.some(p => p.y < canvas.height + 20);

      if (elapsed < minDuration || stillVisible) {
        requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    draw();
  }

  const shuffleBtn = document.getElementById('shuffleBtn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playShuffle();
      shuffleGrid();
    });
  }

     
    
      

  const nextLevelBtn = document.getElementById('nextLevelBtn');
  if (nextLevelBtn) {
    nextLevelBtn.onclick = async (e) => {
      e.stopPropagation();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      
      if (typeof saveUserDataToCloud === 'function') {
        await saveUserDataToCloud();
      }

      window.location.href = `game.html?level=${currentLevel + 1}`;
    };
  }

  const victoryHomeBtn = document.getElementById('victoryHomeBtn');
  if (victoryHomeBtn) {
    victoryHomeBtn.onclick = async (e) => {
      e.stopPropagation();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      localStorage.setItem('skipLoading', 'true');
      
      if (typeof saveUserDataToCloud === 'function') {
        await saveUserDataToCloud();
      }

      window.location.href = 'index.html';
    };
  }

  const backToHome = document.getElementById('backToHome');
  if (backToHome) {
    backToHome.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      localStorage.setItem('skipLoading', 'true');
      
      if (typeof saveUserDataToCloud === 'function') {
        await saveUserDataToCloud();
      }

      window.location.href = 'index.html';
    });
  }

  shuffleGrid();
  isGameStarted = true;
  startTimer();
});

/* =========================================================
   LEVEL PREVIEW
   image/level1.png → image/level200.png
   ========================================================= */

const PREVIEW_COST = 5;
const PREVIEW_DURATION = 10;

let previewTimer = null;
let previewActive = false;

function getCurrentLevel() {
  const urlParams = new URLSearchParams(window.location.search);
  const level = parseInt(urlParams.get('level'), 10);

  if (!Number.isFinite(level)) {
    return 1;
  }

  return Math.min(Math.max(level, 1), 200);
}

function openLevelPreview() {
  const previewPopup = document.getElementById('previewPopup');
  const previewImage = document.getElementById('previewImage');
  const previewCountdown = document.getElementById('previewCountdown');

  if (!previewPopup || !previewImage || !previewCountdown) {
    return;
  }

  if (previewActive) {
    return;
  }

  const currentLevel = getCurrentLevel();
  const previewTitle = document.getElementById('previewTitle');
if (previewTitle) {
  previewTitle.textContent = `👁 LEVEL ${currentLevel} PREVIEW`;
}

  /*
   * =====================================================
   * COIN CHECK
   * =====================================================
   *
   * This expects your game to have a global `coins`
   * variable.
   *
   * If your existing game uses a different coin variable,
   * this is the ONLY part that needs to be connected to it.
   */

const totalCoinsKey = getUserKey('totalCoins');
const coinsBeforePreview = parseInt(localStorage.getItem(totalCoinsKey)) || 0;

if (coinsBeforePreview < PREVIEW_COST) {
  return;
}

let paymentSuccessful = false;

try {
  paymentSuccessful = spendCoins(PREVIEW_COST);
} catch (error) {
  const coinsAfterPreview =
    parseInt(localStorage.getItem(totalCoinsKey)) || 0;

  if (coinsAfterPreview === coinsBeforePreview - PREVIEW_COST) {
    paymentSuccessful = true;
  } else {
    console.error('Preview coin deduction failed:', error);
  }
}

if (!paymentSuccessful) {
  return;
}
  
  
  previewActive = true;

  clearInterval(previewTimer);

  previewImage.src = `image/level${currentLevel}.png`;
  previewImage.alt = `Level ${currentLevel} Preview`;

  let secondsLeft = PREVIEW_DURATION;

  previewCountdown.textContent = secondsLeft;
  previewPopup.classList.remove('hidden');

  previewTimer = setInterval(() => {
    secondsLeft--;

    previewCountdown.textContent = secondsLeft;

    if (secondsLeft <= 0) {
      closeLevelPreview();
    }
  }, 1000);
}

function closeLevelPreview() {
  const previewPopup = document.getElementById('previewPopup');
  const previewImage = document.getElementById('previewImage');

  clearInterval(previewTimer);
  previewTimer = null;

  previewActive = false;

  if (previewPopup) {
    previewPopup.classList.add('hidden');
  }

  if (previewImage) {
    previewImage.src = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const previewButton = document.getElementById('pv-trigger-btn');
  const previewCloseButton = document.getElementById('previewCloseBtn');

  if (previewButton) {
    previewButton.addEventListener('click', openLevelPreview);
  }

  if (previewCloseButton) {
    previewCloseButton.addEventListener('click', closeLevelPreview);
  }

  const previewPopup = document.getElementById('previewPopup');

  if (previewPopup) {
    previewPopup.addEventListener('click', (event) => {
      if (event.target === previewPopup) {
        closeLevelPreview();
      }
    });
  }
});
