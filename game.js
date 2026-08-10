document.addEventListener('DOMContentLoaded', () => {
  AudioManager.playGame();

  const urlParams = new URLSearchParams(window.location.search);
  const currentLevel = parseInt(urlParams.get('level')) || 1;

  document.getElementById('levelDisplay').innerText = currentLevel.toString().padStart(2, '0');

  const grid = document.getElementById('puzzleGrid');
  const movesDisplay = document.getElementById('movesDisplay');
  const timerDisplay = document.getElementById('timerDisplay');

  let moves = 0;
  let seconds = 0;
  let timerInterval = null;
  let tilesState = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // All 9 tiles present
  let selectedTilePos = null;

  const imageSrc = `image/level${currentLevel}.jpeg`;

  function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerInterval = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      timerDisplay.innerText = `${mins}:${secs}`;
    }, 1000);
  }

  function renderGrid() {
    grid.innerHTML = '';
    tilesState.forEach((tileIdx, currentPos) => {
      const tile = document.createElement('div');
      tile.className = 'tile';
      
      if (selectedTilePos === currentPos) {
        tile.classList.add('selected');
      }

      tile.style.backgroundImage = `url(${imageSrc})`;
      const row = Math.floor(tileIdx / 3);
      const col = tileIdx % 3;
      tile.style.backgroundPosition = `${col * 50}% ${row * 50}%`;

      tile.addEventListener('click', () => handleTileClick(currentPos));
      grid.appendChild(tile);
    });
  }

  function handleTileClick(pos) {
    AudioManager.playClick();

    if (selectedTilePos === null) {
      // First tile selected
      selectedTilePos = pos;
      renderGrid();
    } else if (selectedTilePos === pos) {
      // Deselect if tapping the same tile again
      selectedTilePos = null;
      renderGrid();
    } else {
      // Swap selected tile with target tile
      [tilesState[selectedTilePos], tilesState[pos]] = [tilesState[pos], tilesState[selectedTilePos]];
      selectedTilePos = null;
      moves++;
      movesDisplay.innerText = moves;
      renderGrid();
      checkWin();
    }
  }

  function shuffleGrid() {
    // Perform random tile swaps
    for (let i = 0; i < 20; i++) {
      const idx1 = Math.floor(Math.random() * 9);
      const idx2 = Math.floor(Math.random() * 9);
      [tilesState[idx1], tilesState[idx2]] = [tilesState[idx2], tilesState[idx1]];
    }
    selectedTilePos = null;
    renderGrid();
  }

  function checkWin() {
    const isSolved = tilesState.every((val, idx) => val === idx);
    if (isSolved) {
      clearInterval(timerInterval);
      setTimeout(() => {
        alert(`Level ${currentLevel} Completed!`);
        let savedLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
        if (currentLevel >= savedLevel) {
          localStorage.setItem('currentLevel', currentLevel + 1);
        }
        window.location.href = 'index.html';
      }, 200);
    }
  }

  document.getElementById('shuffleBtn').addEventListener('click', () => {
    AudioManager.playClick();
    shuffleGrid();
  });
  
  document.getElementById('backToHome').addEventListener('click', () => {
    AudioManager.playClick();
    window.location.href = 'index.html';
  });

  document.getElementById('collectionsBtn').addEventListener('click', () => {
    AudioManager.playClick();
    window.location.href = 'index.html';
  });

  shuffleGrid();
  startTimer();
});
