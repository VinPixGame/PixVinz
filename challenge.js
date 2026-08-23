const gridSize = 3;
let currentLevel = 1;
let moves = 0;
let timerInterval = null;
let secondsElapsed = 0;
let isPlaying = false;

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

// Persistent DOM elements for the 9 tiles so videos never reload or flicker
let tilesCache = [];

function initBoardDOM() {
  puzzleBoard.innerHTML = '';
  tilesCache = [];
  const videoSrc = `challenge/challenge${currentLevel}.webm`;

  for (let i = 0; i < 9; i++) {
    const tile = document.createElement('div');
    tile.classList.add('puzzle-tile');

    const video = document.createElement('video');
    video.src = videoSrc;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.style.position = 'absolute';
    video.style.width = '300%';
    video.style.height = '300%';
    video.style.maxWidth = 'none';
    video.style.maxHeight = 'none';
    video.style.objectFit = 'fill';

    tile.appendChild(video);
    video.play().catch(err => console.log("Playback error:", err));

    const tileIndex = i;
    tile.addEventListener('click', () => {
      const currentPosition = boardState.indexOf(tileIndex);
      handleTileClick(currentPosition);
    });

    tilesCache.push({ tile, video, tileIndex });
  }
}

// Update layout without destroying video elements
function updateBoard() {
  puzzleBoard.innerHTML = '';

  boardState.forEach((tileIndex, currentPosition) => {
    const cacheObj = tilesCache.find(t => t.tileIndex === tileIndex);
    if (!cacheObj) return;

    const { tile, video } = cacheObj;

    // Update slice video offset based on its original correct video coordinate
    const row = Math.floor(tileIndex / 3);
    const col = tileIndex % 3;
    video.style.left = `-${col * 100}%`;
    video.style.top = `-${row * 100}%`;

    // Handle selection highlight
    if (selectedTileIndex === currentPosition) {
      tile.classList.add('selected');
    } else {
      tile.classList.remove('selected');
    }

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
    updateBoard();
  } else if (selectedTileIndex === clickedPos) {
    selectedTileIndex = null;
    updateBoard();
  } else {
    // Swap positions in the array
    [boardState[selectedTileIndex], boardState[clickedPos]] = [boardState[clickedPos], boardState[selectedTileIndex]];
    selectedTileIndex = null;
    moves++;
    moveCountDisplay.textContent = moves;

    updateBoard();

    if (checkWin()) {
      endGame();
    }
  }
}

function shuffleBoard() {
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
  updateBoard();
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
  initBoardDOM();
  shuffleBoard();
});

window.addEventListener('DOMContentLoaded', () => {
  initBoardDOM();
  shuffleBoard();
});
