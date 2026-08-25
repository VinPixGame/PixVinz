// game.js - Clean & Synchronized Game Logic

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
      return ((levelNum - 1) % 55) + 1;
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
  let isGameStarted = false; // Prevents instant win evaluation on load

  const imageSrc = `image/level${getLevelImageIndex(currentLevel)}.jpeg`;

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

      // Populate victory modal fields before triggering playerstat victory
      const victoryImg = document.getElementById('victoryImg');
      if (victoryImg) victoryImg.src = imageSrc;

      const vTime = document.getElementById('vTime');
      if (vTime && timerDisplay) vTime.innerText = timerDisplay.innerText;

      const vMoves = document.getElementById('vMoves');
      if (vMoves) vMoves.innerText = moves;

      const vCoins = document.getElementById('vCoins');
      if (vCoins) vCoins.innerText = `+${stars * 5}`;

      let tier = Math.floor((currentLevel - 1) / 10);
      let xpGained = (tier + 1) * 100;
      const vXp = document.getElementById('vXp');
      if (vXp) vXp.innerText = `+${xpGained}`;

      const starNodes = document.querySelectorAll('#victoryStars .star');
      starNodes.forEach((star, index) => {
        if (index < stars) star.classList.add('active');
        else star.classList.remove('active');
      });

      // Capture the current moves and time string
      const currentMoves = moves;
      const currentTimeStr = timerDisplay ? timerDisplay.innerText : "00:00";

      // Call playerstat.js victory handler and PASS the moves and time!
      if (typeof handleLevelVictory === 'function') {
        handleLevelVictory(currentLevel, stars, currentMoves, currentTimeStr);
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

    const particles = Array.from({ length: 70 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.7) * 14,
      size: Math.random() * 8 + 4,
      color: ['#ffd700', '#9d4edd', '#ff007f', '#00f0ff', '#ffffff'][Math.floor(Math.random() * 5)]
    }));

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      if (particles.some(p => p.y < canvas.height)) {
        requestAnimationFrame(draw);
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
      
      // Ensure cloud save finishes uploading before changing pages
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
      
      // Ensure cloud save finishes uploading before changing pages
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
      
      // Ensure cloud save finishes uploading before changing pages
      if (typeof saveUserDataToCloud === 'function') {
        await saveUserDataToCloud();
      }

      window.location.href = 'index.html';
    });
  }

  // Initialize board, shuffle properly, then unlock gameplay
  shuffleGrid();
  isGameStarted = true;
  startTimer();


// =========================================================
// NORMAL LEVEL PREVIEW
// Costs 5 coins and shows the current level image for 10s
// =========================================================

let gamePreviewCountdownInterval = null;

const gamePreviewBtn = document.getElementById('gamePreviewBtn');
const gameLevelPreviewModal = document.getElementById('gameLevelPreviewModal');
const gameLevelPreviewModalImg = document.getElementById('gameLevelPreviewModalImg');
const gameLevelPreviewModalTitle = document.getElementById('gameLevelPreviewModalTitle');
const gameLevelPreviewCountdownSeconds =
  document.getElementById('gameLevelPreviewCountdownSeconds');
const closeGameLevelPreviewModalBtn =
  document.getElementById('closeGameLevelPreviewModalBtn');

async function openGameLevelPreview() {

  // Prevent opening multiple times
  if (!gameLevelPreviewModal || !gameLevelPreviewModalImg) {
    console.error('Level Preview modal elements are missing.');
    return;
  }

  // ---------------------------------------------------------
  // 1. CHECK / DEDUCT 5 COINS
  // ---------------------------------------------------------
  if (typeof spendCoins !== 'function') {
    console.error('spendCoins() is not available.');
    return;
  }

  let coinsAccepted = false;

  try {
    // IMPORTANT:
    // spendCoins() may be synchronous OR return a Promise.
    // Promise.resolve() handles both correctly.
    coinsAccepted = await Promise.resolve(spendCoins(5));
  } catch (error) {
    console.error('Error spending preview coins:', error);
    coinsAccepted = false;
  }

  // Not enough coins
  if (!coinsAccepted) {
    showNotEnoughCoinsPrompt();
    return;
  }

  // ---------------------------------------------------------
  // 2. BUILD THE CURRENT LEVEL IMAGE PATH
  // ---------------------------------------------------------
  const previewImageSrc =
    `image/level${getLevelImageIndex(currentLevel)}.jpeg`;

  console.log('Opening level preview:', previewImageSrc);

  // ---------------------------------------------------------
  // 3. PRELOAD THE IMAGE FIRST
  // ---------------------------------------------------------
  const preloadImage = new Image();

  preloadImage.onload = function () {

    // Put the actual loaded image into the modal
    gameLevelPreviewModalImg.src = previewImageSrc;

    // Current level title
    if (gameLevelPreviewModalTitle) {
      gameLevelPreviewModalTitle.textContent =
        `LEVEL ${String(currentLevel).padStart(2, '0')} PREVIEW`;
    }

    // -------------------------------------------------------
    // 4. RESET COUNTDOWN
    // -------------------------------------------------------
    let secondsLeft = 10;

    if (gameLevelPreviewCountdownSeconds) {
      gameLevelPreviewCountdownSeconds.textContent = secondsLeft;
    }

    clearInterval(gamePreviewCountdownInterval);

    // -------------------------------------------------------
    // 5. SHOW MODAL
    // -------------------------------------------------------
    gameLevelPreviewModal.classList.remove('hidden');

    // Force it visible in case another CSS rule is interfering
    gameLevelPreviewModal.style.display = 'flex';
    gameLevelPreviewModal.style.visibility = 'visible';
    gameLevelPreviewModal.style.opacity = '1';

    // -------------------------------------------------------
    // 6. START 10 SECOND COUNTDOWN
    // -------------------------------------------------------
    gamePreviewCountdownInterval = setInterval(() => {

      secondsLeft--;

      if (gameLevelPreviewCountdownSeconds) {
        gameLevelPreviewCountdownSeconds.textContent = secondsLeft;
      }

      if (secondsLeft <= 0) {
        closeGameLevelPreview();
      }

    }, 1000);
  };

  // If the image itself cannot be found
  preloadImage.onerror = function () {
    console.error(
      'LEVEL PREVIEW IMAGE FAILED TO LOAD:',
      previewImageSrc
    );

    // Refund the 5 coins because the preview could not be displayed.
    // Only do this if your playerstat.js exposes earnCoins().
    if (typeof earnCoins === 'function') {
      earnCoins(5);
    }

    alert(
      `Preview image could not be loaded.\n\nMissing file:\n${previewImageSrc}`
    );
  };

  // Start loading the image
  preloadImage.src = previewImageSrc;
}


// =========================================================
// CLOSE NORMAL LEVEL PREVIEW
// =========================================================

function closeGameLevelPreview() {

  clearInterval(gamePreviewCountdownInterval);
  gamePreviewCountdownInterval = null;

  if (gameLevelPreviewModal) {
    gameLevelPreviewModal.classList.add('hidden');
    gameLevelPreviewModal.style.display = 'none';
    gameLevelPreviewModal.style.visibility = '';
    gameLevelPreviewModal.style.opacity = '';
  }

  if (gameLevelPreviewModalImg) {
    gameLevelPreviewModalImg.src = '';
  }
}


// =========================================================
// PREVIEW BUTTON
// =========================================================

if (gamePreviewBtn) {

  gamePreviewBtn.addEventListener('click', () => {
    openGameLevelPreview();
  });

}


// =========================================================
// PREVIEW CLOSE BUTTON
// =========================================================

if (closeGameLevelPreviewModalBtn) {

  closeGameLevelPreviewModalBtn.addEventListener('click', () => {
    closeGameLevelPreview();
  });

}


// =========================================================
// NOT ENOUGH COINS POPUP
// =========================================================

function showNotEnoughCoinsPrompt() {

  const existing = document.getElementById('notEnoughCoinsPrompt');

  if (existing) {
    existing.remove();
  }

  const prompt = document.createElement('div');

  prompt.id = 'notEnoughCoinsPrompt';

  prompt.innerHTML = `
    <div class="not-enough-coins-card">
      <div class="not-enough-coins-icon">🪙</div>

      <div class="not-enough-coins-title">
        NOT ENOUGH COINS
      </div>

      <div class="not-enough-coins-message">
        You need 5 coins to see the preview.
      </div>

      <button type="button" id="closeNotEnoughCoinsPrompt">
        OK
      </button>
    </div>
  `;

  document.body.appendChild(prompt);

  const closeButton =
    document.getElementById('closeNotEnoughCoinsPrompt');

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      prompt.remove();
    });
  }

  prompt.addEventListener('click', (event) => {
    if (event.target === prompt) {
      prompt.remove();
    }
  });
}
    
});






