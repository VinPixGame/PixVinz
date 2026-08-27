// game.js - Complete Synchronized Logic with Working Preview Component

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

      const currentMoves = moves;
      const currentTimeStr = timerDisplay ? timerDisplay.innerText : "00:00";

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

    // Increased particle count for a massive burst
    const particles = Array.from({ length: 220 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 22, // Wider horizontal spread
      vy: (Math.random() - 0.7) * 20, // Higher explosive launch
      size: Math.random() * 9 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      color: ['#ffd700', '#9d4edd', '#ff007f', '#00f0ff', '#ffffff', '#ff9e00'][Math.floor(Math.random() * 6)]
    }));

    const startTime = Date.now();
    const minDuration = 2000; // Guaranteed at least 2 seconds

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // Gravity pull
        p.vx *= 0.98; // Air resistance for natural slowdown
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6); // Slightly rectangular confetti shape
        ctx.restore();
      });

      const elapsed = Date.now() - startTime;
      const stillVisible = particles.some(p => p.y < canvas.height + 20);

      // Keeps running for at least 2 seconds, and until all particles fall off-screen
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



  // =========================================================
  // LEVEL PREVIEW
  // Cost: 5 coins
  // Duration: 10 seconds
  // =========================================================

  const previewBtn = document.getElementById('pv-trigger-btn');
  const previewPopup = document.getElementById('previewPopup');
  const previewImage = document.getElementById('previewImage');
  const previewCountdown = document.getElementById('previewCountdown');
  const previewCloseBtn = document.getElementById('previewCloseBtn');

  let previewTimer = null;
  let previewTimeLeft = 10;

  // 1. Trigger Button Handler (Opens preview, checks coins, sets .png source)
  if (previewBtn) {
    previewBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
alert("Popup element found? " + !!previewPopup);
      if (previewPopup && !previewPopup.classList.contains('hidden') && previewPopup.style.display !== 'none') {
        return;
      }

      if (typeof spendCoins !== 'function') {
        console.error('spendCoins() is not available.');
        return;
      }

      let purchaseSuccessful = spendCoins(5);
      if (purchaseSuccessful instanceof Promise) {
        purchaseSuccessful = await purchaseSuccessful;
      }

      if (!purchaseSuccessful) {
        alert('Not enough coins!');
        return;
      }

      if (previewImage) {
        const imageIndex = ((currentLevel - 1) % 55) + 1;
        previewImage.src = `image/level${imageIndex}.png`;
      }

      previewTimeLeft = 10;
      if (previewCountdown) {
        previewCountdown.innerText = previewTimeLeft;
      }

      if (previewPopup) {
        previewPopup.classList.remove('hidden');
        previewPopup.style.display = 'flex';
      }

      clearInterval(previewTimer);

      previewTimer = setInterval(() => {
        previewTimeLeft--;

        if (previewCountdown) {
          previewCountdown.innerText = previewTimeLeft;
        }

        if (previewTimeLeft <= 0) {
          closePreview();
        }
      }, 1000);
    });
  }

  // 2. Close Button Handler
  if (previewCloseBtn) {
    previewCloseBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closePreview();
    });
  }

  // 3. Close Preview Helper Function
  function closePreview() {
    if (previewTimer) {
      clearInterval(previewTimer);
      previewTimer = null;
    }

    if (previewPopup) {
      previewPopup.classList.add('hidden');
      previewPopup.style.display = 'none';
    }
    
    if (previewImage) {
      previewImage.src = '';
    }
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

  // Initialize board, shuffle properly, then unlock gameplay
  shuffleGrid();
  isGameStarted = true;
  startTimer();
});
