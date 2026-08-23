const gridSize = 3;
let currentLevel = 1;
let moves = 0;
let timerInterval = null;
let secondsElapsed = 0;
let isPlaying = false;
let boardState = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // Full 9 pieces, no empty slot
let winningState = [0, 1, 2, 3, 4, 5, 6, 7, 8];

let selectedTileIndex = null; // Tracks the first clicked tile for swapping

const puzzleBoard = document.getElementById('puzzleBoard');
const moveCountDisplay = document.getElementById('moveCount');
const timerDisplay = document.getElementById('timer');
const shuffleBtn = document.getElementById('shuffleBtn');
const previewBtn = document.getElementById('previewBtn');
const winModal = document.getElementById('winModal');
const finalTime = document.getElementById('finalTime');
const finalMoves = document.getElementById('finalMoves');
const nextChallengeBtn = document.getElementById('nextChallengeBtn');

// Render tiles based on boardState array
function renderBoard() {
  puzzleBoard.innerHTML = '';

  boardState.forEach((tileIndex, currentPosition) => {
    const tile = document.createElement('div');
    tile.classList.add('puzzle-tile');
    
    if (selectedTileIndex === currentPosition) {
      tile.classList.add('selected'); // Optional visual cue for active selection
    }

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

    // Scale to 300% and offset to show this specific piece of the video canvas
    video.style.width = '300%';
    video.style.height = '300%';
    video.style.maxWidth = 'none';
    video.style.maxHeight = 'none';
    video.style.left = `-${col * 100}%`;
    video.style.top = `-${row * 100}%`;
    video.style.position = 'absolute';
    video.style.objectFit = 'fill';

    tile.appendChild(video);
    
    video.load();
    video.play().catch(err => console.log("Playback error:", err));

    // Swap logic: Click first tile, then click second tile to swap them
    tile.addEventListener('click', () => {
      handleTileClick(currentPosition);
    });

    puzzleBoard.appendChild(tile);
  });
}

function handleTileClick(clickedPos) {
  if (!isPlaying && secondsElapsed === 0) {
    startTimer();
    isPlaying = true;
  }

  if (selectedTileIndex === null) {
    // First tile clicked
    selectedTileIndex = clickedPos;
    renderBoard();
  } else if (selectedTileIndex === clickedPos) {
    // Deselect if clicking the same tile again
    selectedTileIndex = null;
    renderBoard();
  } else {
    // Second tile clicked: Swap the two tiles!
    [boardState[selectedTileIndex], boardState[clickedPos]] = [boardState[clickedPos], boardState[selectedTileIndex]];
    selectedTileIndex = null;
    moves++;
    moveCountDisplay.textContent = moves;

    renderBoard();

    if (checkWin()) {
      endGame();
    }
  }
}

// Shuffle the board by randomly swapping pieces
function shuffleBoard() {
  for (let i = 0; i < 50; i++) {
    const pos1 = Math.floor(Math.random() * 9);
    const pos2 = Math.floor(Math.random() * 9);
    [boardState[pos1], boardState[pos2]] = [boardState[pos2], boardState[pos1]];
  }
  
  // Prevent instant win layout
  if (checkWin()) {
    shuffleBoard();
    return;
  }

  selectedTileIndex = null;
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

// Preview Button
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
  currentLevel = currentLevel < 100 ? currentLevel + 1 : 1;
  winModal.classList.add('hidden');
  shuffleBoard();
});

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
  shuffleBoard();
});
