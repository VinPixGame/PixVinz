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
        if (!user || !user.username) return null; // Return null if no user is logged in
        return `${user.username}_${keyName}`;
    }

    const user = getCurrentUser();
    if (!user || !user.username) {
        // No user logged in, clear coin UI immediately
        updateChallengeUI(0);
        return;
    }

    const coinKey = getUserKey('totalCoins');
    let totalCoins = parseInt(localStorage.getItem(coinKey)) || 0;

    if (window.pixvinzDb) {
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
    initBoardDOM();
});

// --- DYNAMIC GRID SIZE FUNCTION ---
function getGridSizeForChallenge(challengeNum) {
    if (challengeNum >= 1 && challengeNum <= 3) {
        return 3;
    } else if (challengeNum >= 4 && challengeNum <= 9) {
        return 4;
    } else if (challengeNum >= 10 && challengeNum <= 21) {
        return 5;
    } else {
        return 6;
    }
}

let gridSize = getGridSizeForChallenge(getSavedChallenge());

// --- LOAD SAVED CHALLENGE INSTEAD OF LEVEL ---
function getSavedChallenge() {
    try {
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (!user || !user.username) return 1;
        const saved = localStorage.getItem(`${user.username}_currentChallenge`);
        return saved ? parseInt(saved) : 1;
    } catch (e) {
        return 1;
    }
}

let currentChallenge = getSavedChallenge();
let moves = 0;
let timerInterval = null;
let secondsElapsed = 0;
let isPlaying = false;
let challengeStarted = false;

let boardState = [];
let winningState = [];
let selectedTileIndex = null;

function updateGridArraysAndCSS() {
    gridSize = getGridSizeForChallenge(currentChallenge);
    const totalTiles = gridSize * gridSize;
    
    boardState = Array.from({ length: totalTiles }, (_, i) => i);
    winningState = Array.from({ length: totalTiles }, (_, i) => i);

    if (puzzleBoard) {
        puzzleBoard.style.display = 'grid';
        puzzleBoard.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        puzzleBoard.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    }
}

const puzzleBoard = document.getElementById('puzzleBoard');
const moveCountDisplay = document.getElementById('moveCount');
const timerDisplay = document.getElementById('timer');
const challengeShuffleBtn = document.getElementById('shuffleBtn');
const challengePreviewBtn = document.getElementById('previewBtn');
const winModal = document.getElementById('winModal');
const finalTime = document.getElementById('finalTime');
const finalMoves = document.getElementById('finalMoves');
const homeBtn = document.getElementById('homeBtn');
const nextChallengeBtn = document.getElementById('nextChallengeBtn');

const loadingOverlay = document.getElementById('challengeLoadingOverlay');
const loadingSpinner = document.getElementById('loadingSpinner');
const startChallengeBtn = document.getElementById('startChallengeBtn');

let tilesCache = [];
let masterVideo = null;
let animFrameId = null;

// Helper function to get user keys safely
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

// --- DAILY LIMIT & LOCKOUT SYSTEM (24-Hour Pure Timer Rule) ---
function checkDailyChallengeStatus() {
    const dailyCountKey = getUserKey('challenge_daily_count');
    const lockTimerKey = getUserKey('challenge_lock_expiry');

    let dailyCount = parseInt(localStorage.getItem(dailyCountKey)) || 0;
    const lockExpiry = parseInt(localStorage.getItem(lockTimerKey)) || 0;

    // If a lock is currently active and hasn't expired yet
    if (lockExpiry > Date.now()) {
        return { locked: true, expiry: lockExpiry };
    }

    // If lock expired, clear the lock and reset the daily count for the new 24-hour cycle
    if (lockExpiry > 0 && lockExpiry <= Date.now()) {
        localStorage.removeItem(lockTimerKey);
        localStorage.setItem(dailyCountKey, '0');
        dailyCount = 0;
    }

    // If 3 or more challenges have been completed, start/enforce the 24-hour lock now
    if (dailyCount >= 3) {
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const expiryTime = Date.now() + twentyFourHours;
        localStorage.setItem(lockTimerKey, expiryTime);
        return { locked: true, expiry: expiryTime };
    }

    return { locked: false, remaining: 3 - dailyCount };
}

function recordCompletedChallenge(challengeId) {
    const dailyCountKey = getUserKey('challenge_daily_count');
    let dailyCount = parseInt(localStorage.getItem(dailyCountKey)) || 0;
    dailyCount++;
    localStorage.setItem(dailyCountKey, dailyCount);

    localStorage.setItem(getUserKey(`challenge_done_${challengeId}`), 'true');

    // If this completion hits the 3-challenge limit, immediately lock and set the 24-hour expiry timer
    if (dailyCount >= 3) {
        const lockTimerKey = getUserKey('challenge_lock_expiry');
        const twentyFourHours = 24 * 60 * 60 * 1000;
        const expiryTime = Date.now() + twentyFourHours;
        localStorage.setItem(lockTimerKey, expiryTime);
    }
}


	 // Initialize DOM elements with a smooth simulated & event-backed loader
function initBoardDOM() {
    // Completely stop/clean up masterVideo if it exists from a previous challenge
    if (masterVideo) {
        masterVideo.pause();
        masterVideo.currentTime = 0;
        masterVideo.src = '';
    }

    updateGridArraysAndCSS();

    // --- CHECK DAILY LOCKOUT STATUS BEFORE RENDERING ---
    const status = checkDailyChallengeStatus();
    const titleEl = document.getElementById('challengeTitle');

    if (titleEl) {
        titleEl.textContent = `Challenge ${currentChallenge}`;
    }

    puzzleBoard.innerHTML = '';
    tilesCache = [];

    // If locked out due to the 24-hour 3-challenge limit
    if (status.locked) {
        // Ensure regular loading elements are completely hidden when locked
        const loadingOverlay = document.getElementById('challengeLoadingOverlay');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const startChallengeBtn = document.getElementById('startChallengeBtn');
        
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (startChallengeBtn) startChallengeBtn.classList.add('hidden');
        challengeStarted = false;

        // Render a clean lock overlay message with countdown right inside the board
        puzzleBoard.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; color: #fff; text-align: center; padding: 20px; background: rgba(20, 10, 35, 0.95); position: absolute; top: 0; left: 0; z-index: 10; border-radius: 12px;">
                <h2 style="color: #ff3366; margin-bottom: 10px; font-size: 22px;">🔒 Daily Limit Reached</h2>
                <p style="margin-bottom: 15px; font-size: 14px; color: #ddd;">You have completed your 3 challenges for this cycle.</p>
                <div id="activeLockCountdown" style="font-size: 16px; font-weight: bold; color: #ffcc00; background: rgba(0,0,0,0.4); padding: 10px 15px; border-radius: 8px;">Calculating timer...</div>
            </div>
        `;

        // Live countdown interval updater
        const updateCountdownUI = () => {
            const timeLeft = status.expiry - Date.now();
            const countdownEl = document.getElementById('activeLockCountdown');
            if (!countdownEl) return;

            if (timeLeft <= 0) {
                countdownEl.textContent = "New challenges are available! Refreshing...";
                setTimeout(() => window.location.reload(), 1500);
                return;
            }

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            countdownEl.textContent = `Next challenges available in ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        };

        updateCountdownUI();
        setInterval(updateCountdownUI, 1000);
        return;
    }

    const videoSrc = `challenge/challenge${currentChallenge}.mp4`;

    const loadingPercentEl = document.getElementById('loadingPercent');
    const loadingBarFill = document.getElementById('loadingBarFill');

    // Show loading overlay & lock state
    if (loadingOverlay) loadingOverlay.style.display = 'flex';
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (startChallengeBtn) startChallengeBtn.classList.add('hidden');
    challengeStarted = false;

    let currentProgress = 0;
    if (loadingPercentEl) loadingPercentEl.textContent = '0%';
    if (loadingBarFill) loadingBarFill.style.width = '0%';

    if (!masterVideo) {
        masterVideo = document.createElement('video');
        masterVideo.loop = true;
        masterVideo.muted = false; // Video unmuted
        masterVideo.playsInline = true;
        masterVideo.setAttribute('playsinline', '');
        masterVideo.style.display = 'none';
        document.body.appendChild(masterVideo);
    } else {
        masterVideo.muted = false;
    }

    let isReadyToStart = false;

    const updateProgress = (targetPercent) => {
        if (isReadyToStart) return;
        if (targetPercent > currentProgress) {
            currentProgress = targetPercent;
            if (loadingPercentEl) loadingPercentEl.textContent = `${currentProgress}%`;
            if (loadingBarFill) loadingBarFill.style.width = `${currentProgress}%`;
        }

        if (currentProgress >= 100 && !isReadyToStart) {
            isReadyToStart = true;
            setTimeout(() => {
                if (loadingSpinner) loadingSpinner.style.display = 'none';
                
                const barContainer = document.getElementById('loadingBarContainer');
                if (barContainer) barContainer.style.display = 'none';
                
                if (startChallengeBtn) startChallengeBtn.classList.remove('hidden');
            }, 200);
        }
    };

    const progressInterval = setInterval(() => {
        if (isReadyToStart) {
            clearInterval(progressInterval);
            return;
        }
        if (currentProgress < 90) {
            updateProgress(currentProgress + 15);
        }
    }, 100);

    masterVideo.oncanplaythrough = () => updateProgress(100);
    masterVideo.onloadeddata = () => updateProgress(100);

    setTimeout(() => {
        updateProgress(100);
    }, 1500);

    masterVideo.src = videoSrc;
    masterVideo.load();

    const totalTilesCount = gridSize * gridSize;
    for (let currentPosition = 0; currentPosition < totalTilesCount; currentPosition++) {
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
            const sliceW = vWidth / gridSize;
            const sliceH = vHeight / gridSize;

            boardState.forEach((tileIndex, currentPosition) => {
                const { tile, ctx } = tilesCache[currentPosition];
                const canvas = ctx.canvas;

                if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                }

                const row = Math.floor(tileIndex / gridSize);
                const col = tileIndex % gridSize;

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
        masterVideo.muted = false;
        masterVideo.play().catch(err => console.log("Video error:", err));

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
    const totalTiles = gridSize * gridSize;
    for (let i = 0; i < 50; i++) {
        const pos1 = Math.floor(Math.random() * totalTiles);
        const pos2 = Math.floor(Math.random() * totalTiles);
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

// --- CALCULATE STARS, COINS, AND XP ---
function calculateChallengeRewards(timeInSeconds, moves) {
    const safeMoves = Math.max(moves, 1);
    
    let stars = 1;
    if (timeInSeconds <= 60) {
        stars = 3;
    } else if (timeInSeconds <= 120) {
        stars = 2;
    } else {
        stars = 1;
    }

    let earnedCoins = 30;
    if (stars === 3) earnedCoins = 100;
    else if (stars === 2) earnedCoins = 60;
    else earnedCoins = 30;

    // --- UPDATED XP FORMULA (Base 2000 XP) ---
    const baseXP = 2000;                     
    const timePenalty = timeInSeconds * 3; // Lose 3 XP per second taken
    const movePenalty = safeMoves * 15;    // Lose 15 XP per move made
    
    // Ensures a minimum floor of 100 XP so finishing always feels rewarding
    let earnedXp = Math.max(100, baseXP - timePenalty - movePenalty);

    return { stars, earnedCoins, earnedXp };
}

// Helper to convert MM:SS or similar timer text into total seconds
function getTimerSeconds() {
    const parts = timerDisplay.textContent.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return parseInt(timerDisplay.textContent) || 0;
}

// --- END GAME FUNCTION ---
function endGame() {
    stopTimer();
    isPlaying = false;
    challengeStarted = false;

    // Fully stop the main puzzle video so win modal video can play independently without overlap
    if (masterVideo) {
        masterVideo.pause();
        masterVideo.currentTime = 0;
    }

    finalTime.textContent = timerDisplay.textContent;
    finalMoves.textContent = moves;

    const totalSeconds = getTimerSeconds();
    const { stars, earnedCoins, earnedXp } = calculateChallengeRewards(totalSeconds, moves);

    const isAlreadyCompleted = localStorage.getItem(getUserKey(`challenge_done_${currentChallenge}`)) === 'true';

    const finalCoins = isAlreadyCompleted ? 0 : earnedCoins;
    const finalXp = isAlreadyCompleted ? 0 : earnedXp;

    const earnedCoinsEl = document.getElementById('earnedCoins');
    const earnedXpEl = document.getElementById('earnedXp');
    const starContainerEl = document.getElementById('starContainer');
    
    if (earnedCoinsEl) earnedCoinsEl.textContent = finalCoins;
    if (earnedXpEl) earnedXpEl.textContent = finalXp;
    
    if (starContainerEl) {
        starContainerEl.innerHTML = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    }

    if (!isAlreadyCompleted) {
        if (typeof earnCoins === 'function') {
            earnCoins(finalCoins);
        }

        const currentUsername = typeof getCurrentUsername === 'function' ? getCurrentUsername() : '';
        const xpStoreKey = currentUsername ? currentUsername + '_bonusXp' : 'bonusXp'; 
        
        let currentXp = parseInt(localStorage.getItem(xpStoreKey)) || 0;
        currentXp += finalXp;
        localStorage.setItem(xpStoreKey, currentXp);

        if (typeof saveUserDataToCloud === 'function') {
            saveUserDataToCloud();
        }
        if (typeof updateXpProgress === 'function') updateXpProgress();
        if (typeof updateProfileUI === 'function') updateProfileUI();
        
        recordCompletedChallenge(currentChallenge);
    }

    const currentChallengeKey = getUserKey('currentChallenge');
    let maxUnlocked = parseInt(localStorage.getItem(currentChallengeKey)) || 1;
    if (currentChallenge >= maxUnlocked && currentChallenge < 100) {
        localStorage.setItem(currentChallengeKey, currentChallenge + 1);
    }

    const winVideoContainer = document.getElementById('winVideoContainer');
    if (winVideoContainer) {
        winVideoContainer.innerHTML = '';
        const winVideo = document.createElement('video');
        winVideo.src = `challenge/challenge${currentChallenge}.mp4`;
        winVideo.autoplay = true;
        winVideo.loop = true;
        winVideo.muted = false; // Win video unmuted
        winVideo.playsInline = true;
        winVideoContainer.appendChild(winVideo);
        winVideo.play().catch(err => console.log("Win video play error:", err));
    }

    winModal.classList.remove('hidden');
    winModal.style.display = 'flex';
    startConfetti();
}

function startConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.zIndex = '99999';
    canvas.style.pointerEvents = 'none';
    // ------------------------------------------------

    const videoContainer = document.getElementById('winVideoContainer');
    
    let startX = window.innerWidth / 2;
    let startY = window.innerHeight / 2;

    if (videoContainer) {
        const rect = videoContainer.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
        }
    }

    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.7) * 16 - 5,
        sizeX: Math.random() * 10 + 5, 
        sizeY: Math.random() * 6 + 3,  
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.2, 
        gravity: 0.35,
        opacity: 1,
        color: ['#ff3366', '#ffcc00', '#00ffcc', '#7928ca', '#38ef7d', '#ffffff'][Math.floor(Math.random() * 6)]
    }));

    let animationId;
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        let activeParticles = 0;

        particles.forEach(p => {
            p.vx *= 0.96;
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;
            p.angle += p.spin;

            if (p.y < canvas.height) {
                activeParticles++;
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.sizeX / 2, -p.sizeY / 2, p.sizeX, p.sizeY);
                ctx.restore();
            }
        });

        if (activeParticles > 0) {
            animationId = requestAnimationFrame(animate);
        } else {
            cancelAnimationFrame(animationId);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
        }
    }
    
    animate();

    setTimeout(() => {
        cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.style.display = 'none';
    }, 4000);
}

// --- PREVIEW MODAL & BUTTON HANDLERS ---
let challengePreviewTimer = null;
let challengeCountdownInterval = null;

if (challengePreviewBtn) {
  challengePreviewBtn.addEventListener('click', async () => {
    if (!challengeStarted) return;

    // Pause the main puzzle video so audio/playback doesn't overlap with preview
    if (masterVideo) {
        masterVideo.pause();
    }

    const previewCost = 10;
    let success = true;

    if (typeof spendCoins === 'function') {
      success = await spendCoins(previewCost);
    } else {
      const coinKey = getUserKey('totalCoins');
      let totalCoins = parseInt(localStorage.getItem(coinKey)) || 0;
      if (totalCoins < previewCost) {
        success = false;
      } else {
        localStorage.setItem(coinKey, totalCoins - previewCost);
      }
    }

    if (!success) {
      alert("Not enough coins! You need 10 coins to preview the challenge.");
      // Resume main puzzle video if preview fails due to insufficient coins
      if (masterVideo && challengeStarted) {
          masterVideo.play().catch(err => console.log("Resume video error:", err));
      }
      return;
    }

    if (typeof loadChallengeCoins === 'function') loadChallengeCoins();

    const modal = document.getElementById('challengePreviewModal');
    const modalVideo = document.getElementById('challengeModalVideo');
    const modalTitle = document.getElementById('challengeModalTitle');
    const countdownSpan = document.getElementById('challengeCountdownSeconds');

    if (modalTitle) modalTitle.innerText = `CHALLENGE ${String(currentChallenge).padStart(2, '0')} PREVIEW`;
    if (modalVideo) {
      // Only set src if it's empty or points to a different challenge, preserving current progress if paused/resumed
      const expectedSrc = `challenge/challenge${currentChallenge}.mp4`;
      if (!modalVideo.src.includes(expectedSrc)) {
          modalVideo.src = expectedSrc;
      }
      modalVideo.muted = false; // Preview video unmuted
      modalVideo.play().catch(err => console.log("Modal preview video error:", err));
    }
    
    let timeLeft = 15;
    if (countdownSpan) countdownSpan.innerText = timeLeft;
    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }

    if (challengePreviewTimer) clearTimeout(challengePreviewTimer);
    if (challengeCountdownInterval) clearInterval(challengeCountdownInterval);

    challengeCountdownInterval = setInterval(() => {
      timeLeft--;
      if (countdownSpan) countdownSpan.innerText = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(challengeCountdownInterval);
      }
    }, 1000);

    challengePreviewTimer = setTimeout(() => {
      closeChallengePreviewModal();
    }, 15000);
  });
}

function closeChallengePreviewModal() {
  const modal = document.getElementById('challengePreviewModal');
  const modalVideo = document.getElementById('challengeModalVideo');
  
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = 'none';
  }
  if (modalVideo) {
    // Pause only to its current playback time instead of resetting, so it resumes on next preview click
    modalVideo.pause();
  }
  if (challengePreviewTimer) clearTimeout(challengePreviewTimer);
  if (challengeCountdownInterval) clearInterval(challengeCountdownInterval);

  // Resume main puzzle video when preview modal is closed
  if (masterVideo && challengeStarted) {
      masterVideo.play().catch(err => console.log("Resume main video error:", err));
  }
}

const closeChallengePreviewBtn = document.getElementById('closeChallengePreviewBtn');
if (closeChallengePreviewBtn) {
  closeChallengePreviewBtn.addEventListener('click', () => {
    closeChallengePreviewModal();
  });
}

if (challengeShuffleBtn) {
  challengeShuffleBtn.addEventListener('click', () => {
    if (!challengeStarted) return;
    shuffleBoard();
  });
}

// --- HOME BUTTON HANDLER ---
if (homeBtn) {
    homeBtn.addEventListener('click', () => {
        // Ensure masterVideo is completely stopped/cleared when going home
        if (masterVideo) {
            masterVideo.pause();
            masterVideo.currentTime = 0;
            masterVideo.src = '';
        }

        // Stop winmodal video completely so audio/video doesn't overlap/continue playing
        const winVideoContainer = document.getElementById('winVideoContainer');
        if (winVideoContainer) {
            const winVideo = winVideoContainer.querySelector('video');
            if (winVideo) {
                winVideo.pause();
                winVideo.currentTime = 0;
                winVideo.src = '';
            }
            winVideoContainer.innerHTML = '';
        }

        // Clear/hide confetti canvas immediately
        const canvas = document.getElementById('confettiCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
        }

        winModal.classList.add('hidden');
        winModal.style.display = 'none';
        window.location.href = 'index.html';
    });
}

// --- NEXT CHALLENGE BUTTON HANDLER ---
if (nextChallengeBtn) {
    nextChallengeBtn.addEventListener('click', () => {
        // Fully stop and clear masterVideo so the next puzzle video starts fresh on its own
        if (masterVideo) {
            masterVideo.pause();
            masterVideo.currentTime = 0;
            masterVideo.src = '';
        }

        // Stop and clear winmodal video completely so its audio/video stops playing and never overlaps
        const winVideoContainer = document.getElementById('winVideoContainer');
        if (winVideoContainer) {
            const winVideo = winVideoContainer.querySelector('video');
            if (winVideo) {
                winVideo.pause();
                winVideo.currentTime = 0;
                winVideo.src = '';
            }
            winVideoContainer.innerHTML = '';
        }

        // Clear/hide confetti canvas immediately so it doesn't linger or pop up
        const canvas = document.getElementById('confettiCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
        }

        winModal.classList.add('hidden');
        winModal.style.display = 'none';

        // Advance to the next challenge up to 100 max
        if (currentChallenge < 100) {
            currentChallenge++;
        } else {
            alert("Congratulations! You've beaten all 100 challenges!");
            window.location.href = 'index.html';
            return;
        }

        // Save progress to localStorage
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (user && user.username) {
            localStorage.setItem(`${user.username}_currentChallenge`, currentChallenge);
        }

        // Re-initialize the puzzle board for the next challenge
        initBoardDOM();
    });
}
