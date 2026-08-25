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

  // =========================================================
  // LEVEL PREVIEW
  // Shows the current level image for 10 seconds.
  // Costs 5 coins per preview.
  // =========================================================

  let gamePreviewCountdownInterval = null;

  window.openGameLevelPreview = function () {
  if (typeof spendCoins !== 'function') {
    console.warn('spendCoins() is not available.');
    return;
  }

  // Check and deduct 5 coins
  const previewPurchased = spendCoins(5);

  if (!previewPurchased) {
    showNotEnoughCoinsPrompt();
    return;
  }

  const previewModal = document.getElementById('gameLevelPreviewModal');
  const previewImg = document.getElementById('gameLevelPreviewModalImg');
  const previewTitle = document.getElementById('gameLevelPreviewModalTitle');
  const countdownDisplay = document.getElementById('gameLevelPreviewCountdownSeconds');

  if (!previewModal || !previewImg) {
    console.error('Preview modal elements were not found.');
    return;
  }

  // Current level image
  previewImg.src = imageSrc;

  // Current level title
  if (previewTitle) {
    previewTitle.innerText =
      `LEVEL ${currentLevel.toString().padStart(2, '0')} PREVIEW`;
  }

  // Reset countdown
  let remainingSeconds = 10;

  if (countdownDisplay) {
    countdownDisplay.innerText = remainingSeconds;
  }

  // Stop previous countdown
  clearInterval(gamePreviewCountdownInterval);

  // IMPORTANT:
  // Remove hidden class and force the modal to display
  previewModal.classList.remove('hidden');

  previewModal.style.display = 'flex';
  previewModal.style.visibility = 'visible';
  previewModal.style.opacity = '1';

  // Start countdown
  gamePreviewCountdownInterval = setInterval(() => {
    remainingSeconds--;

    if (countdownDisplay) {
      countdownDisplay.innerText = remainingSeconds;
    }

    if (remainingSeconds <= 0) {
      closeGameLevelPreview();
    }
  }, 1000);
};


  // =========================================================
  // CLOSE LEVEL PREVIEW
  // =========================================================

  function closeGameLevelPreview() {
    const previewModal = document.getElementById('gameLevelPreviewModal');

    clearInterval(gamePreviewCountdownInterval);
    gamePreviewCountdownInterval = null;

    if (previewModal) {
      previewModal.classList.add('hidden');
      previewModal.style.display = 'none';
    }
  }


  // =========================================================
  // NOT ENOUGH COINS PROMPT
  // =========================================================

  function showNotEnoughCoinsPrompt() {
    // Prevent duplicate prompts
    const existingPrompt = document.getElementById('notEnoughCoinsPrompt');
    if (existingPrompt) {
      existingPrompt.remove();
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

        <button id="closeNotEnoughCoinsPrompt">
          OK
        </button>
      </div>
    `;

    document.body.appendChild(prompt);

    const closeBtn = document.getElementById('closeNotEnoughCoinsPrompt');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        prompt.remove();
      });
    }

    // Also allow clicking outside the popup to close it
    prompt.addEventListener('click', (e) => {
      if (e.target === prompt) {
        prompt.remove();
      }
    });
  }


  // =========================================================
  // PREVIEW CLOSE BUTTON
  // =========================================================

  const closeGameLevelPreviewModalBtn =
    document.getElementById('closeGameLevelPreviewModalBtn');

  if (closeGameLevelPreviewModalBtn) {
    closeGameLevelPreviewModalBtn.addEventListener('click', () => {
      closeGameLevelPreview();
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
});






