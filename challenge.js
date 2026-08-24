// --- CHALLENGE VIEW COIN LOADER ---
function loadChallengeCoins() {
    // Helper to get the logged-in user
    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('loggedInUser'));
        } catch (e) {
            return null;
        }
    }

    // Helper to format the key with the username prefix
    function getUserKey(keyName) {
        const user = getCurrentUser();
        if (!user || !user.username) return keyName;
        return `${user.username}_${keyName}`;
    }

    const coinKey = getUserKey('totalCoins');
    let totalCoins = parseInt(localStorage.getItem(coinKey)) || 0;

    // Optional: Pull from Firebase if available
    const user = getCurrentUser();
    if (user && user.username && window.pixvinzDb) {
        const { db, doc, getDoc } = window.pixvinzDb;
        getDoc(doc(db, 'players', user.username)).then(userSnap => {
            if (userSnap.exists() && typeof userSnap.data().coins === 'number') {
                totalCoins = userSnap.data().coins;
                localStorage.setItem(coinKey, totalCoins);
                updateChallengeUI(totalCoins);
            }
        }).catch(err => console.warn("Firestore coin sync warning:", err));
    }

    updateChallengeUI(totalCoins);
}

function updateChallengeUI(coins) {
    document.querySelectorAll('#challengeView #coinCount, #challengeView .coin-display, #coinCount').forEach(el => {
        el.textContent = coins;
    });
}

// Run when the challenge page/view loads
document.addEventListener('DOMContentLoaded', () => {
    loadChallengeCoins();
});

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

let tilesCache = [];
let masterVideo = null;

// Initialize DOM elements once per level using ONE master background video
function initBoardDOM() {
  puzzleBoard.innerHTML = '';
  tilesCache = [];
  const videoSrc = `challenge/challenge${currentLevel}.webm`;

  // 1. Create ONE master video that plays continuously in the background
  if (!masterVideo) {
    masterVideo = document.createElement('video');
    masterVideo.autoplay = true;
    masterVideo.loop = true;
    masterVideo.muted = true;
    masterVideo.playsInline = true;
    masterVideo.setAttribute('playsinline', '');
    masterVideo.style.position = 'absolute';
    masterVideo.style.top = '0';
    masterVideo.style.left = '0';
    masterVideo.style.width = '100%';
    masterVideo.style.height = '100%';
    masterVideo.style.objectFit = 'cover';
    masterVideo.style.zIndex = '1';
    masterVideo.style.pointerEvents = 'none';
    
    const boardWrapper = document.querySelector('.puzzle-board-wrapper');
    if (boardWrapper) {
      boardWrapper.style.position = 'relative';
      boardWrapper.style.overflow = 'hidden';
      boardWrapper.appendChild(masterVideo);
    }
  }
  
  if (!masterVideo.src.includes(videoSrc)) {
    masterVideo.src = videoSrc;
    masterVideo.play().catch(err => console.log("Playback error:", err));
  }

  // 2. Create the 9 transparent grid tiles acting as windows/cutouts
  for (let currentPosition = 0; currentPosition < 9; currentPosition++) {
    const tile = document.createElement('div');
    tile.classList.add('puzzle-tile');
    tile.style.position = 'relative';
    tile.style.zIndex = '2';
    tile.style.background = 'rgba(0,0,0,0.2)';
    tile.style.cursor = 'pointer';
    tile.style.border = '1px solid rgba(255,255,255,0.1)';

    tile.addEventListener('click', () => {
      handleTileClick(currentPosition);
    });

    puzzleBoard.appendChild(tile);
    tilesCache.push({ tile });
  }
}

// Update slice positions instantly using background coordinates
function updateBoardVisuals() {
  boardState.forEach((tileIndex, currentPosition) => {
    const { tile } = tilesCache[currentPosition];

    const row = Math.floor(tileIndex / 3);
    const col = tileIndex % 3;
    
    tile.style.backgroundImage = `url(${masterVideo.src})`;
    tile.style.backgroundSize = '300% 300%';
    tile.style.backgroundPosition = `${(col / 2) * 100}% ${(row / 2) * 100}%`;

    if (selectedTileIndex === currentPosition) {
      tile.classList.add('selected');
      tile.style.border = '2px solid #ffcc00';
    } else {
      tile.classList.remove('selected');
      tile.style.border = '1px solid rgba(255,255,255,0.1)';
    }
  });
}

function handleTileClick(clickedPos) {
  if (!isPlaying && secondsElapsed === 0) {
    startTimer();
    isPlaying = true;
  }

  if (selectedTileIndex === null) {
    selectedTileIndex = clickedPos;
    updateBoardVisuals();
  } else if (selectedTileIndex === clickedPos) {
    selectedTileIndex = null;
    updateBoardVisuals();
  } else {
    [boardState[selectedTileIndex], boardState[clickedPos]] = [boardState[clickedPos], boardState[selectedTileIndex]];
    selectedTileIndex = null;
    moves++;
    moveCountDisplay.textContent = moves;

    updateBoardVisuals();

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
  updateBoardVisuals();
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
