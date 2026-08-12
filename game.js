document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const currentLevel = parseInt(urlParams.get('level')) || 1;

  const levelDisplay = document.getElementById('levelDisplay');
  if (levelDisplay) {
    levelDisplay.innerText = currentLevel.toString().padStart(2, '0');
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('loggedInUser'));
    } catch (e) {
      return null;
    }
  }

  // Generates user-specific localStorage keys (e.g., 'vinz_currentLevel')
  function getUserKey(keyName) {
    const user = getCurrentUser();
    if (!user || !user.username) return keyName;
    return `${user.username}_${keyName}`;
  }

  updateCoinDisplay();

  const grid = document.getElementById('puzzleGrid');
  const movesDisplay = document.getElementById('movesDisplay');
  const timerDisplay = document.getElementById('timerDisplay');

  // --- DYNAMIC GRID SIZE CALCULATION ---
  function getGridSize(level) {
    if (level <= 10) return 3;       // Level 1-10 (3x3)
    if (level <= 30) return 4;       // Level 11-30 (4x4)
    if (level <= 60) return 5;       // Level 31-60 (5x5)
    if (level <= 100) return 6;      // Level 61-100 (6x6)
    if (level <= 150) return 7;      // Level 101-150 (7x7)
    return 8;                        // Level 151-200 (8x8)
  }

  const gridSize = getGridSize(currentLevel);
  const totalTiles = gridSize * gridSize;

  let moves = 0;
  let seconds = 0;
  let timerInterval = null;
  let tilesState = Array.from({ length: totalTiles }, (_, i) => i);
  let selectedTilePos = null;

  const imageSrc = `image/level${currentLevel}.jpeg`;

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

  function updateCoinDisplay() {
    const totalCoins = parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0;
    const coinElem = document.getElementById('coinCount');
    if (coinElem) coinElem.innerText = totalCoins;
  }

  // --- DYNAMIC TILE CUTTING & RENDERING ---
  function renderGrid() {
    if (!grid) return;
    grid.innerHTML = '';

    // Apply dynamic CSS grid template
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

  // --- DYNAMIC SHUFFLE ---
  function shuffleGrid() {
    const tileCount = tilesState.length;
    for (let i = 0; i < tileCount * 3; i++) {
      const idx1 = Math.floor(Math.random() * tileCount);
      const idx2 = Math.floor(Math.random() * tileCount);
      [tilesState[idx1], tilesState[idx2]] = [tilesState[idx2], tilesState[idx1]];
    }
    selectedTilePos = null;
    renderGrid();
  }

  function checkWin() {
    const isSolved = tilesState.every((val, idx) => val === idx);
    if (isSolved) {
      clearInterval(timerInterval);
      if (typeof AudioManager !== 'undefined') AudioManager.playVictory(currentLevel);

      let stars = 1;
      if (moves <= gridSize * 5) stars = 3;
      else if (moves <= gridSize * 8) stars = 2;

      const levelCoinsKey = getUserKey(`levelCoins_${currentLevel}`);
      const totalCoinsKey = getUserKey('totalCoins');
      const currentLevelKey = getUserKey('currentLevel');
      const levelMovesKey = getUserKey(`levelMoves_${currentLevel}`);
      const levelTimeKey = getUserKey(`levelTime_${currentLevel}`);

      // --- SAVE FEWEST MOVES RECORD ---
      const prevMoves = parseInt(localStorage.getItem(levelMovesKey)) || Infinity;
      if (moves < prevMoves) {
        localStorage.setItem(levelMovesKey, moves);
      }

      // --- SAVE BEST TIME RECORD ---
      const timeString = timerDisplay ? timerDisplay.innerText : "00:00";
      const prevTimeStr = localStorage.getItem(levelTimeKey);
      if (!prevTimeStr || prevTimeStr === '--:--') {
        localStorage.setItem(levelTimeKey, timeString);
      } else {
        const [pMin, pSec] = prevTimeStr.split(':').map(Number);
        if (seconds < (pMin * 60 + pSec)) {
          localStorage.setItem(levelTimeKey, timeString);
        }
      }

      const currentLevelCoins = parseInt(localStorage.getItem(levelCoinsKey)) || 0;
      let targetCoins = stars * 5; 
      let newCoinsEarned = 0;

      if (targetCoins > currentLevelCoins) {
        newCoinsEarned = targetCoins - currentLevelCoins;
        localStorage.setItem(levelCoinsKey, targetCoins);

        let totalCoins = parseInt(localStorage.getItem(totalCoinsKey)) || 0;
        totalCoins += newCoinsEarned;
        localStorage.setItem(totalCoinsKey, totalCoins);
      }

      let maxUnlocked = parseInt(localStorage.getItem(currentLevelKey)) || 1;
      if (currentLevel >= maxUnlocked) {
        localStorage.setItem(currentLevelKey, currentLevel + 1);
      }

      showVictoryModal(stars, newCoinsEarned);
    }
  }

  function showVictoryModal(stars, newCoins) {
    const victoryImg = document.getElementById('victoryImg');
    if (victoryImg) victoryImg.src = imageSrc;

    const vTime = document.getElementById('vTime');
    if (vTime && timerDisplay) vTime.innerText = timerDisplay.innerText;

    const vMoves = document.getElementById('vMoves');
    if (vMoves) vMoves.innerText = moves;

    const vCoins = document.getElementById('vCoins');
    if (vCoins) vCoins.innerText = `+${newCoins}`;

    const starNodes = document.querySelectorAll('#victoryStars .star');
    starNodes.forEach((star, index) => {
      if (index < stars) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });

    updateCoinDisplay();
    const modal = document.getElementById('victoryModal');
    if (modal) modal.classList.remove('hidden');
    startConfetti();
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

  // --- PREVIEW BUTTON LOGIC (5 COINS FOR 10 SECONDS PREVIEW) ---
  let previewTimer = null;
  const previewBtn = document.getElementById('previewBtn');
  if (previewBtn) {
    previewBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();

      const coinKey = getUserKey('totalCoins');
      let totalCoins = parseInt(localStorage.getItem(coinKey)) || 0;
      const previewCost = 5;

      if (totalCoins < previewCost) {
        alert("Not enough coins! You need 5 coins to preview the image.");
        return;
      }

      // Deduct coins and update storage/UI
      totalCoins -= previewCost;
      localStorage.setItem(coinKey, totalCoins);
      updateCoinDisplay();

      // Open modal and show current level image
      const modal = document.getElementById('imageModal');
      const modalImg = document.getElementById('modalPreviewImg');
      const modalTitle = document.getElementById('modalLevelTitle');

      if (modalTitle) modalTitle.innerText = `LEVEL ${currentLevel.toString().padStart(2, '0')} PREVIEW`;
      if (modalImg) modalImg.src = imageSrc;
      if (modal) modal.classList.remove('hidden');

      // Clear existing timer if any
      if (previewTimer) {
        clearTimeout(previewTimer);
      }

      // Automatically close after 10 seconds
      previewTimer = setTimeout(() => {
        if (modal) modal.classList.add('hidden');
      }, 10000);
    });
  }

  const nextLevelBtn = document.getElementById('nextLevelBtn');
  if (nextLevelBtn) {
    nextLevelBtn.onclick = (e) => {
      e.stopPropagation();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      window.location.href = `game.html?level=${currentLevel + 1}`;
    };
  }

  const victoryHomeBtn = document.getElementById('victoryHomeBtn');
  if (victoryHomeBtn) {
    victoryHomeBtn.onclick = (e) => {
      e.stopPropagation();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      window.location.href = 'index.html';
    };
  }

  const backToHome = document.getElementById('backToHome');
  if (backToHome) {
    backToHome.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      window.location.href = 'index.html';
    });
  }

  const collectionsBtn = document.getElementById('collectionsBtn');
  if (collectionsBtn) {
    collectionsBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      window.location.href = 'index.html';
    });
  }

  shuffleGrid();
  startTimer();
});
