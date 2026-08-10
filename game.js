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
  let tilesState = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 8 is the empty space

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

      if (tileIdx === 8) {
        tile.classList.add('empty');
      } else {
        tile.style.backgroundImage = `url(${imageSrc})`;
        const row = Math.floor(tileIdx / 3);
        const col = tileIdx % 3;
        tile.style.backgroundPosition = `${col * 50}% ${row * 50}%`;
      }

      tile.addEventListener('click', () => moveTile(currentPos));
      grid.appendChild(tile);
    });
  }

  function moveTile(pos) {
    const emptyPos = tilesState.indexOf(8);
    const validMoves = [
      emptyPos - 1, emptyPos + 1, // Left, Right
      emptyPos - 3, emptyPos + 3  // Up, Down
    ];

    // Prevent wrapping across horizontal edges
    if ((emptyPos % 3 === 0 && pos === emptyPos - 1) || 
        (emptyPos % 3 === 2 && pos === emptyPos + 1)) return;

    if (validMoves.includes(pos)) {
      // Swap tiles
      [tilesState[emptyPos], tilesState[pos]] = [tilesState[pos], tilesState[emptyPos]];
      moves++;
      movesDisplay.innerText = moves;
      renderGrid();
      checkWin();
    }
  }

  // Shuffle does NOT count as a move
  function shuffleGrid() {
    for (let i = 0; i < 100; i++) {
      const emptyPos = tilesState.indexOf(8);
      const validMoves = [];
      if (emptyPos % 3 !== 0) validMoves.push(emptyPos - 1);
      if (emptyPos % 3 !== 2) validMoves.push(emptyPos + 1);
      if (emptyPos >= 3) validMoves.push(emptyPos - 3);
      if (emptyPos < 6) validMoves.push(emptyPos + 3);

      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      [tilesState[emptyPos], tilesState[randomMove]] = [tilesState[randomMove], tilesState[emptyPos]];
    }
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

  document.getElementById('shuffleBtn').addEventListener('click', shuffleGrid);
  
  document.getElementById('backToHome').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  document.getElementById('collectionsBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Setup Init Game state
  shuffleGrid();
  startTimer();
});
