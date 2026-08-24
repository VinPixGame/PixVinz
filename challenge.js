// --- CHALLENGE VIEW COIN LOADER ---
function loadChallengeCoins() {
    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('loggedInUser'));
        } catch (e) {
            return null;
        }
    }

    function getUserKey(keyName) {
        const user = getCurrentUser();
        if (!user || !user.username) return keyName;
        return `${user.username}_${keyName}`;
    }

    const coinKey = getUserKey('totalCoins');
    let totalCoins = parseInt(localStorage.getItem(coinKey)) || 0;

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

document.addEventListener('DOMContentLoaded', () => {
    loadChallengeCoins();
});

const gridSize = 3;
let currentLevel = 1;
let moves = 0;
let timerInterval = null;
let secondsElapsed = 0;
let isPlaying = false;
let challengeStarted = false;

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
const closeWinModalBtn = document.getElementById('closeWinModalBtn');

const loadingOverlay = document.getElementById('challengeLoadingOverlay');
const loadingSpinner = document.getElementById('loadingSpinner');
const startChallengeBtn = document.getElementById('startChallengeBtn');

let tilesCache = [];
let masterVideo = null;
let animFrameId = null;

// Initialize DOM elements once per level using ONE master video preloaded fully
function initBoardDOM() {
  puzzleBoard.innerHTML = '';
  tilesCache = [];
  const videoSrc = `challenge/challenge${currentLevel}.webm`;

  const loadingPercentEl = document.getElementById('loadingPercent');
  const loadingBarFill = document.getElementById('loadingBarFill');

  // Show loading overlay & lock state
  if (loadingOverlay) loadingOverlay.style.display = 'flex';
  if (loadingSpinner) loadingSpinner.style.display = 'block';
  if (startChallengeBtn) startChallengeBtn.classList.add('hidden');
  challengeStarted = false;

  // Reset progress bar elements
  if (loadingPercentEl) loadingPercentEl.textContent = '0%';
  if (loadingBarFill) loadingBarFill.style.width = '0%';

  // 1. Create ONE master video element
  if (!masterVideo) {
    masterVideo = document.createElement('video');
    masterVideo.loop = true;
    masterVideo.muted = true;
    masterVideo.playsInline = true;
    masterVideo.setAttribute('playsinline', '');
    masterVideo.style.display = 'none';
    document.body.appendChild(masterVideo);
  }

  masterVideo.src = videoSrc;
  masterVideo.load();

  // Smooth simulated progress bar so it doesn't instantly flash away
  let currentProgress = 0;
  const progressInterval = setInterval(() => {
    currentProgress += Math.floor(Math.random() * 15) + 10; // smooth increments
    if (currentProgress >= 100) {
      currentProgress = 100;
      clearInterval(progressInterval);
      
      // Reveal the start button smoothly after hitting 100%
      setTimeout(() => {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (startChallengeBtn) startChallengeBtn.classList.remove('hidden');
      }, 250);
    }
    
    if (loadingPercentEl) loadingPercentEl.textContent = `${currentProgress}%`;
    if (loadingBarFill) loadingBarFill.style.width = `${currentProgress}%`;
  }, 120); // controls the filling speed

  // 2. Create the 9 grid tiles with canvas slices
  for (let currentPosition = 0; currentPosition < 9; currentPosition++) {
    const tile = document.createElement('div');
    tile.classList.add('puzzle-tile');
    tile.style.position = 'relative';
    tile.style.width = '100%';
    tile.style.height = '100%';
    tile.style.overflow = 'hidden';
    tile.style.cursor = 'pointer';

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    tile.appendChild(canvas);

    tile.addEventListener('click', () => {
      if (!challengeStarted) return;
      handleTileClick(currentPosition);
    });

    puzzleBoard.appendChild(tile);
    tilesCache.push({ tile, ctx: canvas.getContext('2d') });
  }

  if (animFrameId) cancelAnimationFrame(animFrameId);
  startRenderLoop();
}

function startRenderLoop() {
  function render() {
    if (masterVideo && masterVideo.readyState >= masterVideo.HAVE_CURRENT_DATA) {
      const vWidth = masterVideo.videoWidth;
      const vHeight = masterVideo.videoHeight;
      const sliceW = vWidth / 3;
      const sliceH = vHeight / 3;

      boardState.forEach((tileIndex, currentPosition) => {
        const { tile, ctx } = tilesCache[currentPosition];
        const canvas = ctx.canvas;

        if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
        }

        const row = Math.floor(tileIndex / 3);
        const col = tileIndex % 3;

        ctx.drawImage(
          masterVideo,
          col * sliceW, row * sliceH, sliceW, sliceH,
          0, 0, canvas.width, canvas.height
        );

        if (challengeStarted && selectedTileIndex === currentPosition) {
          tile.style.border = '3px solid #ffcc00';
        } else {
          tile.style.border = '1px solid rgba(255,255,255,0.2)';
        }
      });
    }
    animFrameId = requestAnimationFrame(render);
  }
  render();
}

// Start Challenge Image Button Click Event
if (startChallengeBtn) {
  startChallengeBtn.addEventListener('click', () => {
    masterVideo.play().catch(err => console.log("Playback error:", err));
    
    // Play background music
    const bgm = document.getElementById('challengeBGM');
    if (bgm) {
      bgm.volume = 0.5; // Set background volume to 50% (adjust as needed)
      bgm.play().catch(err => console.log("Audio autoplay restriction prevented BGM:", err));
    }

    if (loadingOverlay) loadingOverlay.style.display = 'none';
    challengeStarted = true;
    shuffleBoard();
  });
}

function handleTileClick(clickedPos) {
  if (!isPlaying && secondsElapsed === 0) {
    startTimer();
    isPlaying = true;
  }

  if (selectedTileIndex === null) {
    selectedTileIndex = clickedPos;
  } else if (selectedTileIndex === clickedPos) {
    selectedTileIndex = null;
  } else {
    [boardState[selectedTileIndex], boardState[clickedPos]] = [boardState[clickedPos], boardState[selectedTileIndex]];
    selectedTileIndex = null;
    moves++;
    moveCountDisplay.textContent = moves;

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
  challengeStarted = false;
  
  // Stop background music when winning
  const bgm = document.getElementById('challengeBGM');
  if (bgm) {
    bgm.pause();
    bgm.currentTime = 0;
  }

  finalTime.textContent = timerDisplay.textContent;
  finalMoves.textContent = moves;
  
}
  const earnedCoinsEl = document.getElementById('earnedCoins');
  const earnedXpEl = document.getElementById('earnedXp');
  if (earnedCoinsEl) earnedCoinsEl.textContent = '50';
  if (earnedXpEl) earnedXpEl.textContent = '100';

  const winVideoContainer = document.getElementById('winVideoContainer');
  if (winVideoContainer) {
    winVideoContainer.innerHTML = '';
    const winVideo = document.createElement('video');
    winVideo.src = `challenge/challenge${currentLevel}.webm`;
    winVideo.autoplay = true;
    winVideo.loop = true;
    winVideo.muted = true;
    winVideo.playsInline = true;
    winVideo.setAttribute('playsinline', '');
    winVideo.style.width = '100%';
    winVideo.style.height = '100%';
    winVideo.style.objectFit = 'cover';
    winVideoContainer.appendChild(winVideo);
    winVideo.play().catch(err => console.log("Win video play error:", err));
  }

  winModal.classList.remove('hidden');

  if (typeof confetti === 'function') {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }
}

// Safe Preview Overlay
let previewOverlay = null;
previewBtn.addEventListener('click', () => {
  if (!challengeStarted) return;
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
  if (!challengeStarted) return;
  if (previewOverlay) {
    previewOverlay.remove();
    previewOverlay = null;
    previewBtn.textContent = "👁️ Preview";
  }
  shuffleBoard();
});

if (closeWinModalBtn) {
  closeWinModalBtn.addEventListener('click', () => {
    const bgm = document.getElementById('challengeBGM');
    if (bgm) { bgm.pause(); }
    
    if (previewOverlay) {
      previewOverlay.remove();
      previewOverlay = null;
      previewBtn.textContent = "👁️ Preview";
    }
    winModal.classList.add('hidden');
    window.location.href = 'index.html';
  });
}
window.addEventListener('DOMContentLoaded', () => {
  initBoardDOM();
});
