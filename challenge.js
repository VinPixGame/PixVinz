const gridSize = 3;
let currentLevel = 1;
let moves = 0;
let timerInterval = null;
let secondsElapsed = 0;
let isPlaying = false;

// 9 tiles, no empty space. Board state tracks which piece is at which grid position.
let boardState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
let winningState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
let selectedTileIndex = null;

const puzzleBoard = document.getElementById('puzzleBoard');
const moveCountDisplay = document.getElementById('moveCount');
const timerDisplay = document.getElementById('timer');
const shuffleBtn = document.getElementById('shuffleBtn');
const previewBtn = document.getElementById('previewBtn');
const winModal = document.getElementById('winModal');
const finalTime = document.getElementById('finalTime');
const finalMoves = document.getElementById('finalMoves');
const nextChallengeBtn = document.getElementById('nextChallengeBtn');

// Render the 3x3 swapping grid layout
function renderBoard() {
  puzzleBoard.innerHTML = '';
  const videoSrc = `challenge/challenge${currentLevel}.webm`;

  boardState.forEach((tileIndex, currentPosition) => {
    const tile = document.createElement('div');
    tile.classList.add('puzzle-tile');
    
    if (selectedTileIndex === currentPosition) {
      tile.classList.add('selected');
    }

    // Determine correct slice offsets for this piece of the video canvas
    const row = Math.floor(tileIndex / 3);
    const col = tileIndex % 3;

    const video = document.createElement('video');
    video.src = videoSrc;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    
    video.style.left = `-${col * 100}%`;
    video.style.top = `-${row * 100}%`;

    tile.appendChild(video);
    video.play().catch(err => console.log("Playback error:", err));

    // Click to select and swap mechanics
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
    selectedTileIndex = clickedPos;
    renderBoard();
  } else if (selectedTileIndex === clickedPos) {
    selectedTileIndex = null;
    renderBoard();
  } else {
    // Swap the positions of the two clicked tiles
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

function shuffleBoard() {
  // Randomly swap tiles to shuffle
  for (let i = 0; i < 50; i++) {
    const pos1 = Math.floor(Math.random() * 9);
    const pos2 = Math.floor(Math.random() * 9);
    [boardState[pos1], boardState[pos2]] = [boardState[pos2], boardState[pos1]];
  }
  
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

// Safe Preview Overlay
let previewOverlay = null;
previewBtn.addEventListener('click', () => {
  const boardWrapper = document.querySelector('.puzzle-board-wrapper');
  
  if (!previewOverlay) {
    previewBtn.textContent = "❌ Close Preview";
    
    previewOverlay = document.createElement('div');
    previewOverlay.style.position = 'absolute';
    previewOverlay.style.width = 'calc(100% - 20px)';
    previewOverlay.style.height = 'calc(100% - 20px)';
    previewOverlay.style.top = '10px';
    previewOverlay.style.left = '10px';
    previewOverlay.style.zIndex = '10';
    previewOverlay.style.borderRadius = '8px';
    previewOverlay.style.overflow = 'hidden';
    previewOverlay.style.background = '#000';

    const previewVideo = document.createElement('video');
    previewVideo.src = `challenge/challenge${currentLevel}.webm`;
    previewVideo.autoplay = true;
    previewVideo.loop = true;
    previewVideo.muted = true;
    previewVideo.playsInline = true;
    previewVideo.setAttribute('playsinline', '');
    previewVideo.style.width = '100%';
    previewVideo.style.height = '100%';
    previewVideo.style.objectFit = 'cover';

    previewOverlay.appendChild(previewVideo);
    boardWrapper.appendChild(previewOverlay);
  } else {
    previewBtn.textContent = "👁️ Preview";
    previewOverlay.remove();
    previewOverlay = null;
  }
});

shuffleBtn.addEventListener('click', () => {
  if (previewOverlay) {
    previewOverlay.remove();
    previewOverlay = null;
    previewBtn.textContent = "👁️ Preview";
  }
  shuffleBoard();
});

nextChallengeBtn.addEventListener('click', () => {
  if (previewOverlay) {
    previewOverlay.remove();
    previewOverlay = null;
    previewBtn.textContent = "👁️ Preview";
  }
  currentLevel = currentLevel < 100 ? currentLevel + 1 : 1;
  winModal.classList.add('hidden');
  shuffleBoard();
});

window.addEventListener('DOMContentLoaded', () => {
  shuffleBoard();
});
