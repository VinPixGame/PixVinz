document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  let currentLevel = parseInt(urlParams.get('level')) || 1;

  const levelTitle = document.getElementById('gameLevelTitle');
  const board = document.getElementById('puzzleBoard');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const backBtn = document.getElementById('gameBackBtn');
  const coinCountElem = document.getElementById('coinCount');

  levelTitle.innerText = `LEVEL ${currentLevel.toString().padStart(2, '0')}`;
  
  const totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
  if (coinCountElem) coinCountElem.innerText = totalCoins;

  // Start Game Music (sounds/bgmusic.mp3) on user interaction
  function startGameAudio() {
    if (typeof AudioManager !== 'undefined' && AudioManager.musicEnabled) {
      AudioManager.playGame();
    }
  }

  document.body.addEventListener('click', startGameAudio, { once: true });

  // Grid setup (3x3 grid)
  const gridCount = 3;
  let tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const imgSrc = `image/level${currentLevel}.jpeg`;

  board.style.gridTemplateColumns = `repeat(${gridCount}, 1fr)`;

  function renderBoard() {
    board.innerHTML = '';
    tiles.forEach((val, idx) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      
      if (val === 8) {
        tile.classList.add('empty');
      } else {
        const row = Math.floor(val / gridCount);
        const col = val % gridCount;
        tile.style.backgroundImage = `url('${imgSrc}')`;
        tile.style.backgroundPosition = `-${col * 112}px -${row * 112}px`;
      }

      tile.addEventListener('click', () => handleTileClick(idx));
      board.appendChild(tile);
    });
  }

  function handleTileClick(index) {
    const emptyIndex = tiles.indexOf(8);
    if (isAdjacent(index, emptyIndex)) {
      if (typeof AudioManager !== 'undefined') AudioManager.playSelect();
      [tiles[index], tiles[emptyIndex]] = [tiles[emptyIndex], tiles[index]];
      renderBoard();
      checkWin();
    }
  }

  function isAdjacent(idx1, idx2) {
    const row1 = Math.floor(idx1 / gridCount), col1 = idx1 % gridCount;
    const row2 = Math.floor(idx2 / gridCount), col2 = idx2 % gridCount;
    return (Math.abs(row1 - row2) + Math.abs(col1 - col2)) === 1;
  }

  function shuffleTiles() {
    if (typeof AudioManager !== 'undefined') AudioManager.playShuffle();
    for (let i = 0; i < 100; i++) {
      const emptyIdx = tiles.indexOf(8);
      const validMoves = [];
      [emptyIdx - 1, emptyIdx + 1, emptyIdx - gridCount, emptyIdx + gridCount].forEach(idx => {
        if (idx >= 0 && idx < 9 && isAdjacent(emptyIdx, idx)) {
          validMoves.push(idx);
        }
      });
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      [tiles[emptyIdx], tiles[randomMove]] = [tiles[randomMove], tiles[emptyIdx]];
    }
    renderBoard();
  }

  function checkWin() {
    const isSolved = tiles.every((val, idx) => val === idx);
    if (isSolved) {
      if (typeof AudioManager !== 'undefined') AudioManager.playVictory(currentLevel);
      
      // Update coins & level progression
      let coins = (parseInt(localStorage.getItem('totalCoins')) || 0) + 10;
      localStorage.setItem('totalCoins', coins);
      
      let unlocked = parseInt(localStorage.getItem('currentLevel')) || 1;
      if (currentLevel >= unlocked) {
        localStorage.setItem('currentLevel', currentLevel + 1);
      }

      setTimeout(() => {
        alert(`🎉 LEVEL ${currentLevel} COMPLETED! +10 🪙`);
        window.location.href = 'index.html';
      }, 300);
    }
  }

  shuffleBtn.addEventListener('click', shuffleTiles);

  backBtn.addEventListener('click', () => {
    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
    window.location.href = 'index.html';
  });

  // Initial setup
  renderBoard();
  shuffleTiles();
});
