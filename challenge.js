const gridSize = 3;
let currentLevel = 1;
let moves = 0;
let timerInterval = null;
let secondsElapsed = 0;
let isPlaying = false;
let boardState = []; // Holds the current layout of tile indices (0 to 8, where 8 is empty)
let winningState = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const puzzleBoard = document.getElementById('puzzleBoard');
const moveCountDisplay = document.getElementById('moveCount');
const timerDisplay = document.getElementById('timer');
const shuffleBtn = document.getElementById('shuffleBtn');
const previewBtn = document.getElementById('previewBtn');
const winModal = document.getElementById('winModal');
const finalTime = document.getElementById('finalTime');
const finalMoves = document.getElementById('finalMoves');
const nextChallengeBtn = document.getElementById('nextChallengeBtn');

// Initialize game
function initGame() {
  boardState = [...winningState];
  moves = 0;
  secondsElapsed = 0;
  moveCountDisplay.textContent = moves;
  timerDisplay.textContent = "00:00";
  stopTimer();
  
  renderBoard();
}

// Render tiles based on boardState array
function renderBoard() {
  puzzleBoard.innerHTML = '';
  const videoSrc = `challenge/challenge${currentLevel}.webm`;

boardState.forEach((tileIndex, currentPosition) => {
    const tile = document.createElement('div');
    tile.classList.add('puzzle-tile');
    
    if (tileIndex === 8) {
      tile.classList.add('empty');
    } else {
      const row = Math.floor(tileIndex / 3);
      const col = tileIndex % 3;

      const video = document.createElement('video');
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      
      const source = document.createElement('source');
      source.src = `challenge/challenge${currentLevel}.webm`;
      source.type = 'video/webm';
      
      video.appendChild(source);

      // Offset video placement for the 3x3 grid cut
      video.style.width = '300%';
      video.style.height = '300%';
      video.style.left = `-${col * 100}%`;
      video.style.top = `-${row * 100}%`;
      video.style.position = 'absolute';

      tile.appendChild(video);
      
      // Force load and play
      video.load();
      video.play().catch(err => console.log("Playback error:", err));

      tile.addEventListener('click', () => {
        handleTileClick(currentPosition);
      });
    }

    puzzleBoard.appendChild(tile);
  });

// Handle movement logic for sliding tiles
function handleTileClick(clickedPos) {
  const emptyPos = boardState.indexOf(8);
  
  if (isAdjacent(clickedPos, emptyPos)) {
    if (!isPlaying && secondsElapsed === 0) {
      startTimer();
      isPlaying = true;
    }

    // Swap clicked tile with empty slot
    [boardState[clickedPos], boardState[emptyPos]] = [boardState[emptyPos], boardState[clickedPos]];
    moves++;
    moveCountDisplay.textContent = moves;

    renderBoard();

    if (checkWin()) {
      endGame();
    }
  }
}

// Check if clicked position is directly next to the empty slot (up, down, left, right)
function isAdjacent(pos1, pos2) {
  const r1 = Math.floor(pos1 / gridSize);
  const c1 = pos1 % gridSize;
  const r2 = Math.floor(pos2 / gridSize);
  const c2 = pos2 % gridSize;

  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

// Shuffle the board cleanly ensuring it is always solvable
function shuffleBoard() {
  // Simple valid random moves shuffle to guarantee solvability
  for (let i = 0; i < 100; i++) {
    const emptyPos = boardState.indexOf(8);
    const validMoves = [];

    const r = Math.floor(emptyPos / gridSize);
    const c = emptyPos % gridSize;

    if (r > 0) validMoves.use = validMoves.push(emptyPos - gridSize);
    if (r < gridSize - 1) validMoves.push(emptyPos + gridSize);
    if (c > 0) validMoves.push(emptyPos - 1);
    if (c < gridSize - 1) validMoves.push(emptyPos + 1);

    const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    [boardState[emptyPos], boardState[randomMove]] = [boardState[randomMove], boardState[emptyPos]];
  }
  
  // Prevent accidental instant win configuration upon shuffle
  if (checkWin()) {
    shuffleBoard();
    return;
  }

  moves = 0;
  moveCountDisplay.textContent = moves;
  secondsElapsed = 0;
  timerDisplay.textContent = "00:00";
  stopTimer();
  isPlaying = false;
  renderBoard();
}

// Timer Controls
function startTimer() {
  timerInterval = setInterval(() => {
    secondsElapsed++;
    const mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    const secs = String(secondsElapsed % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// Win validation
function checkWin() {
  return boardState.every((val, index) => val === winningState[index]);
}

function endGame() {
  stopTimer();
  isPlaying = false;
  finalTime.textContent = timerDisplay.textContent;
  finalMoves.textContent = moves;
  winModal.classList.remove('hidden');
}

// Preview Button (Hold or toggle preview of full video)
previewBtn.addEventListener('mousedown', () => {
  puzzleBoard.innerHTML = `
    <div style="width:100%; height:100%; position:relative; overflow:hidden; border-radius:8px;">
      <video src="challenge/challenge${currentLevel}.webm" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>
    </div>
  `;
});

previewBtn.addEventListener('mouseup', () => {
  renderBoard();
});

previewBtn.addEventListener('mouseleave', () => {
  renderBoard();
});

// Shuffle Button Click
shuffleBtn.addEventListener('click', () => {
  shuffleBoard();
});

// Next Challenge Button
nextChallengeBtn.addEventListener('click', () => {
  currentLevel = currentLevel < 100 ? currentLevel + 1 : 1; // Loop back or cap at 100
  winModal.classList.add('hidden');
  shuffleBoard();
});

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  shuffleBoard();
});
