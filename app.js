/**
 * PixVinz Game Engine & State Manager
 */

const STATE = {
  user: null,
  currentLevel: 1,
  totalLevels: 200,
  moves: 0,
  timerSeconds: 0,
  timerInterval: null,
  boardState: [],
  selectedTileIndex: null,
  settings: { sound: true, animations: true },
  audio: {
    main: new Audio('sounds/main.mp3'),
    bg: new Audio('sounds/bgmusic.mp3'),
    victory: new Audio()
  }
};

// --- AUDIO SYSTEM ---
STATE.audio.main.loop = true;
STATE.audio.bg.loop = true;

function playSound(type, levelNum = 1) {
  if (!STATE.settings.sound) return;
  
  try {
    if (type === 'main') {
      STATE.audio.bg.pause();
      STATE.audio.main.play().catch(() => {});
    } else if (type === 'bg') {
      STATE.audio.main.pause();
      STATE.audio.bg.play().catch(() => {});
    } else if (type === 'victory') {
      STATE.audio.bg.pause();
      let trackIndex = ((levelNum - 1) % 10) + 1;
      STATE.audio.victory.src = `sounds/victory${trackIndex}.mp3`;
      STATE.audio.victory.play().catch(() => {});
    }
  } catch (err) {
    console.warn('Audio playback error ignored:', err);
  }
}

// --- DYNAMIC GRID HELPER ---
function getGridSize(level) {
  if (level <= 10) return 3;   // Levels 1-10: 3x3
  if (level <= 20) return 4;   // Levels 11-20: 4x4
  if (level <= 40) return 5;   // Levels 21-40: 5x5
  if (level <= 60) return 6;   // Levels 41-60: 6x6
  return 7;                    // Levels 61+: 7x7
}

// --- INITIALIZATION & ROUTING ---
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();

  // Guarantees screen transition after 3-second splash screen
  setTimeout(() => {
    checkAuthStatus();
  }, 3000);
});

function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.classList.add('active');
  }

  if (['main-menu-screen', 'level-select-screen', 'auth-screen'].includes(screenId)) {
    playSound('main');
  } else if (screenId === 'game-screen') {
    playSound('bg');
  }
}

// --- AUTHENTICATION SYSTEM ---
function checkAuthStatus() {
  try {
    const savedUser = localStorage.getItem('pixvinz_active_user');
    if (savedUser) {
      const userData = localStorage.getItem(`pixvinz_user_${savedUser}`);
      if (userData) {
        STATE.user = JSON.parse(userData);
        loadUserProgress();
        navigateTo('main-menu-screen');
        return;
      }
    }
  } catch (e) {
    console.error('LocalStorage auth check fallback:', e);
  }
  // Default fallback to login screen
  navigateTo('auth-screen');
}

function loadUserProgress() {
  if (!STATE.user || !STATE.user.progress) {
    if (!STATE.user) STATE.user = { displayName: 'Player' };
    STATE.user.progress = { unlockedLevel: 1, coins: 0, levelStats: {} };
  }
  const welcomeEl = document.getElementById('welcome-message');
  if (welcomeEl) welcomeEl.textContent = `Welcome ${STATE.user.displayName || 'Player'}`;
  updateCoinDisplays();
}

function saveUserData() {
  try {
    if (STATE.user && STATE.user.username) {
      localStorage.setItem(`pixvinz_user_${STATE.user.username}`, JSON.stringify(STATE.user));
    }
  } catch (e) {
    console.warn('Unable to save user data to localStorage:', e);
  }
  updateCoinDisplays();
}

function updateCoinDisplays() {
  const coins = (STATE.user && STATE.user.progress) ? STATE.user.progress.coins : 0;
  const userCoinsEl = document.getElementById('user-coins');
  const levelUserCoinsEl = document.getElementById('level-user-coins');
  if (userCoinsEl) userCoinsEl.textContent = coins;
  if (levelUserCoinsEl) levelUserCoinsEl.textContent = coins;
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  document.body.addEventListener('click', () => {
    if (STATE.audio.main.paused && STATE.settings.sound && !document.getElementById('game-screen').classList.contains('active')) {
      playSound('main');
    }
  }, { once: true });

  // Auth Toggle
  const showSignup = document.getElementById('show-signup');
  const showLogin = document.getElementById('show-login');
  if (showSignup) {
    showSignup.onclick = () => {
      document.getElementById('login-form').classList.add('hidden');
      document.getElementById('signup-form').classList.remove('hidden');
    };
  }
  if (showLogin) {
    showLogin.onclick = () => {
      document.getElementById('signup-form').classList.add('hidden');
      document.getElementById('login-form').classList.remove('hidden');
    };
  }

  // Auth Forms
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      const u = document.getElementById('login-username').value;
      const p = document.getElementById('login-password').value;
      try {
        const stored = localStorage.getItem(`pixvinz_user_${u}`);
        if (stored && JSON.parse(stored).password === p) {
          STATE.user = JSON.parse(stored);
          localStorage.setItem('pixvinz_active_user', u);
          loadUserProgress();
          navigateTo('main-menu-screen');
        } else {
          alert('Invalid Username or Password');
        }
      } catch (err) {
        alert('Authentication error. Please try signing up.');
      }
    };
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.onsubmit = (e) => {
      e.preventDefault();
      const d = document.getElementById('signup-displayname').value;
      const u = document.getElementById('signup-username').value;
      const p = document.getElementById('signup-password').value;
      try {
        if (localStorage.getItem(`pixvinz_user_${u}`)) {
          alert('Username already taken!');
          return;
        }
      } catch (e) {}

      STATE.user = { displayName: d, username: u, password: p, progress: { unlockedLevel: 1, coins: 0, levelStats: {} } };
      try {
        localStorage.setItem('pixvinz_active_user', u);
      } catch (e) {}
      saveUserData();
      loadUserProgress();
      navigateTo('main-menu-screen');
    };
  }

  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      try { localStorage.removeItem('pixvinz_active_user'); } catch(e){}
      location.reload();
    };
  }

  // Navigation Buttons
  const playBtn = document.getElementById('btn-play');
  if (playBtn) playBtn.onclick = () => startLevel((STATE.user && STATE.user.progress) ? STATE.user.progress.unlockedLevel : 1);
  
  const levelsBtn = document.getElementById('btn-levels');
  if (levelsBtn) levelsBtn.onclick = () => { renderLevelGrid(); navigateTo('level-select-screen'); };
  
  const levelBackBtn = document.getElementById('btn-level-back');
  if (levelBackBtn) levelBackBtn.onclick = () => navigateTo('main-menu-screen');
  
  const gameBackBtn = document.getElementById('btn-game-back');
  if (gameBackBtn) gameBackBtn.onclick = () => { stopTimer(); navigateTo('main-menu-screen'); };
  
  // Modals
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) settingsBtn.onclick = () => document.getElementById('settings-modal').classList.add('active');
  
  const closeSettingsBtn = document.getElementById('btn-close-settings');
  if (closeSettingsBtn) closeSettingsBtn.onclick = () => document.getElementById('settings-modal').classList.remove('active');
  
  const aboutBtn = document.getElementById('btn-about');
  if (aboutBtn) aboutBtn.onclick = () => document.getElementById('about-modal').classList.add('active');
  
  const closeAboutBtn = document.getElementById('btn-close-about');
  if (closeAboutBtn) closeAboutBtn.onclick = () => document.getElementById('about-modal').classList.remove('active');

  // Victory Buttons
  const replayBtn = document.getElementById('btn-replay');
  if (replayBtn) replayBtn.onclick = () => { document.getElementById('victory-modal').classList.remove('active'); startLevel(STATE.currentLevel); };
  
  const nextLevelBtn = document.getElementById('btn-next-level');
  if (nextLevelBtn) nextLevelBtn.onclick = () => { document.getElementById('victory-modal').classList.remove('active'); startLevel(STATE.currentLevel + 1); };
  
  const victoryMenuBtn = document.getElementById('btn-victory-menu');
  if (victoryMenuBtn) victoryMenuBtn.onclick = () => { document.getElementById('victory-modal').classList.remove('active'); navigateTo('main-menu-screen'); };

  // Controls
  const shuffleBtn = document.getElementById('btn-shuffle');
  if (shuffleBtn) shuffleBtn.onclick = () => shuffleTiles();
  
  const toggleSound = document.getElementById('toggle-sound');
  if (toggleSound) {
    toggleSound.onchange = (e) => {
      STATE.settings.sound = e.target.checked;
      if (!STATE.settings.sound) { STATE.audio.main.pause(); STATE.audio.bg.pause(); } 
      else { playSound('main'); }
    };
  }
}

// --- LEVEL SELECTION GRID ---
function renderLevelGrid() {
  const grid = document.getElementById('level-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const unlocked = (STATE.user && STATE.user.progress) ? STATE.user.progress.unlockedLevel : 1;

  for (let i = 1; i <= STATE.totalLevels; i++) {
    const card = document.createElement('div');
    const isUnlocked = i <= unlocked;
    card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    const stats = (STATE.user && STATE.user.progress && STATE.user.progress.levelStats) ? STATE.user.progress.levelStats[i] : null;
    const stars = stats ? '⭐'.repeat(stats.stars) : '';
    
    card.innerHTML = `<span>${i}</span><small style="font-size: 0.6rem; margin-top: 4px;">${isUnlocked ? (stars || 'PLAY') : '🔒'}</small>`;
    if (isUnlocked) card.onclick = () => startLevel(i);
    grid.appendChild(card);
  }
}

// --- PUZZLE ENGINE (Dynamic Tap-to-Swap) ---
function startLevel(levelNum) {
  STATE.currentLevel = levelNum;
  STATE.moves = 0;
  STATE.timerSeconds = 0;
  STATE.selectedTileIndex = null;
  
  const movesEl = document.getElementById('moves');
  if (movesEl) movesEl.textContent = '0';
  
  navigateTo('game-screen');
  startTimer();

  const gridSize = getGridSize(levelNum);
  const totalTiles = gridSize * gridSize;
  
  STATE.boardState = Array.from({ length: totalTiles }, (_, i) => i);
  shuffleTiles();
}

function renderBoard() {
  const board = document.getElementById('puzzle-board');
  if (!board) return;
  board.innerHTML = '';
  
  const gridSize = getGridSize(STATE.currentLevel);
  board.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;

  const imgPath = `image/level${STATE.currentLevel}.jpeg`;

  STATE.boardState.forEach((tileVal, index) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    
    if (index === STATE.selectedTileIndex) {
      tile.classList.add('selected');
    }

    const row = Math.floor(tileVal / gridSize);
    const col = tileVal % gridSize;
    
    const posX = gridSize > 1 ? (col / (gridSize - 1)) * 100 : 0;
    const posY = gridSize > 1 ? (row / (gridSize - 1)) * 100 : 0;

    tile.style.backgroundImage = `url('${imgPath}'), url('https://via.placeholder.com/320/2575fc/ffffff?text=Level+${STATE.currentLevel}')`;
    tile.style.backgroundSize = `${gridSize * 100}% ${gridSize * 100}%`;
    tile.style.backgroundPosition = `${posX}% ${posY}%`;
    
    tile.onclick = () => handleTileClick(index);
    board.appendChild(tile);
  });
}

function handleTileClick(index) {
  if (STATE.selectedTileIndex === null) {
    STATE.selectedTileIndex = index;
    renderBoard();
    return;
  }

  if (STATE.selectedTileIndex === index) {
    STATE.selectedTileIndex = null;
    renderBoard();
    return;
  }

  const firstIndex = STATE.selectedTileIndex;
  const secondIndex = index;

  [STATE.boardState[firstIndex], STATE.boardState[secondIndex]] = 
  [STATE.boardState[secondIndex], STATE.boardState[firstIndex]];

  STATE.selectedTileIndex = null;
  STATE.moves++;
  const movesEl = document.getElementById('moves');
  if (movesEl) movesEl.textContent = STATE.moves;

  renderBoard();
  checkWinCondition();
}

function shuffleTiles() {
  do {
    for (let i = STATE.boardState.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [STATE.boardState[i], STATE.boardState[j]] = [STATE.boardState[j], STATE.boardState[i]];
    }
  } while (STATE.boardState.every((val, index) => val === index));

  renderBoard();
}

function checkWinCondition() {
  const isSolved = STATE.boardState.every((val, index) => val === index);
  if (isSolved) {
    stopTimer();
    handleVictory();
  }
}

// --- TIMER & REWARD SYSTEM ---
function startTimer() {
  stopTimer();
  STATE.timerInterval = setInterval(() => {
    STATE.timerSeconds++;
    const mins = String(Math.floor(STATE.timerSeconds / 60)).padStart(2, '0');
    const secs = String(STATE.timerSeconds % 60).padStart(2, '0');
    const timerEl = document.getElementById('timer');
    if (timerEl) timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(STATE.timerInterval);
}

function handleVictory() {
  playSound('victory', STATE.currentLevel);

  const gridSize = getGridSize(STATE.currentLevel);
  const totalTiles = gridSize * gridSize;

  let stars = 1;
  if (STATE.moves <= totalTiles + 5) stars = 3;
  else if (STATE.moves <= totalTiles * 2) stars = 2;

  let tierMultiplier = Math.ceil(STATE.currentLevel / 30);
  let coinsPerStar = 5 * tierMultiplier;
  let potentialCoins = stars * coinsPerStar;

  let previousStats = (STATE.user && STATE.user.progress && STATE.user.progress.levelStats) ? (STATE.user.progress.levelStats[STATE.currentLevel] || { stars: 0, coinsEarned: 0 }) : { stars: 0, coinsEarned: 0 };
  let newCoinsToAward = 0;

  if (stars > previousStats.stars) {
    let previousCoins = previousStats.stars * coinsPerStar;
    newCoinsToAward = potentialCoins - previousCoins;
  }

  if (STATE.user && STATE.user.progress) {
    STATE.user.progress.coins += newCoinsToAward;
    if (STATE.currentLevel === STATE.user.progress.unlockedLevel && STATE.currentLevel < STATE.totalLevels) {
      STATE.user.progress.unlockedLevel++;
    }
    STATE.user.progress.levelStats[STATE.currentLevel] = {
      stars: Math.max(stars, previousStats.stars),
      coinsEarned: Math.max(potentialCoins, previousStats.coinsEarned)
    };
  }

  saveUserData();

  const victoryImg = document.getElementById('victory-img');
  if (victoryImg) {
    victoryImg.src = `image/level${STATE.currentLevel}.jpeg`;
    victoryImg.onerror = () => { victoryImg.src = `https://via.placeholder.com/320/2575fc/ffffff?text=Level+${STATE.currentLevel}+Complete`; };
  }
  
  const vStars = document.getElementById('victory-stars');
  const vTime = document.getElementById('victory-time');
  const vCoins = document.getElementById('victory-coins');
  const timerEl = document.getElementById('timer');

  if (vStars) vStars.textContent = '⭐'.repeat(stars);
  if (vTime && timerEl) vTime.textContent = timerEl.textContent;
  if (vCoins) vCoins.textContent = `+${newCoinsToAward}`;

  const vModal = document.getElementById('victory-modal');
  if (vModal) vModal.classList.add('active');
}
