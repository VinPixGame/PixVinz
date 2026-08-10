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
  
  if (type === 'main') {
    STATE.audio.bg.pause();
    STATE.audio.main.play().catch(() => {});
  } else if (type === 'bg') {
    STATE.audio.main.pause();
    STATE.audio.bg.play().catch(() => {});
  } else if (type === 'victory') {
    STATE.audio.bg.pause();
    // Rotates through victory1.mp3 to victory10.mp3 every 10 levels
    let trackIndex = ((levelNum - 1) % 10) + 1;
    STATE.audio.victory.src = `sounds/victory${trackIndex}.mp3`;
    STATE.audio.victory.play().catch(() => {});
  }
}

// --- INITIALIZATION & ROUTING ---
document.addEventListener('DOMContentLoaded', () => {
  // 3-Second Splash Delay
  setTimeout(() => {
    checkAuthStatus();
  }, 3000);

  setupEventListeners();
});

function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');

  if (['main-menu-screen', 'level-select-screen', 'auth-screen'].includes(screenId)) {
    playSound('main');
  } else if (screenId === 'game-screen') {
    playSound('bg');
  }
}

// --- AUTHENTICATION SYSTEM ---
function checkAuthStatus() {
  const savedUser = localStorage.getItem('pixvinz_active_user');
  if (savedUser) {
    STATE.user = JSON.parse(localStorage.getItem(`pixvinz_user_${savedUser}`));
    loadUserProgress();
    navigateTo('main-menu-screen');
  } else {
    navigateTo('auth-screen');
  }
}

function loadUserProgress() {
  if (!STATE.user.progress) {
    STATE.user.progress = { unlockedLevel: 1, coins: 0, levelStats: {} };
  }
  document.getElementById('welcome-message').textContent = `Welcome ${STATE.user.displayName}`;
  updateCoinDisplays();
}

function saveUserData() {
  localStorage.setItem(`pixvinz_user_${STATE.user.username}`, JSON.stringify(STATE.user));
  updateCoinDisplays();
}

function updateCoinDisplays() {
  document.getElementById('user-coins').textContent = STATE.user.progress.coins;
  document.getElementById('level-user-coins').textContent = STATE.user.progress.coins;
}

// --- EVENT LISTENERS ---
function setupEventListeners() {
  // Start Audio Context on First Interaction
  document.body.addEventListener('click', () => {
    if (STATE.audio.main.paused && STATE.settings.sound && !document.getElementById('game-screen').classList.contains('active')) {
      playSound('main');
    }
  }, { once: true });

  // Auth Toggle
  document.getElementById('show-signup').onclick = () => {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
  };
  document.getElementById('show-login').onclick = () => {
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('login-form').classList.add('hidden');
  };

  // Auth Submit
  document.getElementById('login-form').onsubmit = (e) => {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    const stored = localStorage.getItem(`pixvinz_user_${u}`);
    if (stored && JSON.parse(stored).password === p) {
      STATE.user = JSON.parse(stored);
      localStorage.setItem('pixvinz_active_user', u);
      loadUserProgress();
      navigateTo('main-menu-screen');
    } else {
      alert('Invalid Username or Password');
    }
  };

  document.getElementById('signup-form').onsubmit = (e) => {
    e.preventDefault();
    const d = document.getElementById('signup-displayname').value;
    const u = document.getElementById('signup-username').value;
    const p = document.getElementById('signup-password').value;
    if (localStorage.getItem(`pixvinz_user_${u}`)) {
      alert('Username already taken!');
      return;
    }
    STATE.user = { displayName: d, username: u, password: p, progress: { unlockedLevel: 1, coins: 0, levelStats: {} } };
    localStorage.setItem('pixvinz_active_user', u);
    saveUserData();
    loadUserProgress();
    navigateTo('main-menu-screen');
  };

  document.getElementById('btn-logout').onclick = () => {
    localStorage.removeItem('pixvinz_active_user');
    location.reload();
  };

  // Navigation Buttons
  document.getElementById('btn-play').onclick = () => startLevel(STATE.user.progress.unlockedLevel);
  document.getElementById('btn-levels').onclick = () => { renderLevelGrid(); navigateTo('level-select-screen'); };
  document.getElementById('btn-level-back').onclick = () => navigateTo('main-menu-screen');
  document.getElementById('btn-game-back').onclick = () => { stopTimer(); navigateTo('main-menu-screen'); };
  
  // Modals
  document.getElementById('btn-settings').onclick = () => document.getElementById('settings-modal').classList.add('active');
  document.getElementById('btn-close-settings').onclick = () => document.getElementById('settings-modal').classList.remove('active');
  document.getElementById('btn-about').onclick = () => document.getElementById('about-modal').classList.add('active');
  document.getElementById('btn-close-about').onclick = () => document.getElementById('about-modal').classList.remove('active');

  // Victory Buttons
  document.getElementById('btn-replay').onclick = () => { document.getElementById('victory-modal').classList.remove('active'); startLevel(STATE.currentLevel); };
  document.getElementById('btn-next-level').onclick = () => { document.getElementById('victory-modal').classList.remove('active'); startLevel(STATE.currentLevel + 1); };
  document.getElementById('btn-victory-menu').onclick = () => { document.getElementById('victory-modal').classList.remove('active'); navigateTo('main-menu-screen'); };

  // Controls
  document.getElementById('btn-shuffle').onclick = () => shuffleTiles();
  document.getElementById('toggle-sound').onchange = (e) => {
    STATE.settings.sound = e.target.checked;
    if (!STATE.settings.sound) { STATE.audio.main.pause(); STATE.audio.bg.pause(); } 
    else { playSound('main'); }
  };
}

// --- LEVEL GRID ---
function renderLevelGrid() {
  const grid = document.getElementById('level-grid');
  grid.innerHTML = '';
  for (let i = 1; i <= STATE.totalLevels; i++) {
    const card = document.createElement('div');
    const isUnlocked = i <= STATE.user.progress.unlockedLevel;
    card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'}`;
    const stats = STATE.user.progress.levelStats[i];
    const stars = stats ? '⭐'.repeat(stats.stars) : '';
    
    card.innerHTML = `<span>${i}</span><small style="font-size: 0.6rem; margin-top: 4px;">${isUnlocked ? (stars || 'PLAY') : '🔒'}</small>`;
    if (isUnlocked) card.onclick = () => startLevel(i);
    grid.appendChild(card);
  }
}

// --- PUZZLE ENGINE (3x3 Sliding Puzzle) ---
function startLevel(levelNum) {
  STATE.currentLevel = levelNum;
  STATE.moves = 0;
  STATE.timerSeconds = 0;
  document.getElementById('moves').textContent = '0';
  
  navigateTo('game-screen');
  startTimer();

  // Board Setup (3x3 grid)
  STATE.boardState = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 8 is empty space
  renderBoard();
  shuffleTiles();
}

function renderBoard() {
  const board = document.getElementById('puzzle-board');
  board.innerHTML = '';
  const imgPath = `image/level${STATE.currentLevel}.jpeg`;

  STATE.boardState.forEach((tileVal, index) => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    
    if (tileVal === 8) {
      tile.classList.add('empty');
    } else {
      const row = Math.floor(tileVal / 3);
      const col = tileVal % 3;
      tile.style.backgroundImage = `url('${imgPath}'), url('https://via.placeholder.com/320/2575fc/ffffff?text=Level+${STATE.currentLevel}')`;
      tile.style.backgroundPosition = `-${col * 104}px -${row * 104}px`;
      tile.onclick = () => moveTile(index);
    }
    board.appendChild(tile);
  });
}

function moveTile(index) {
  const emptyIndex = STATE.boardState.indexOf(8);
  const validMoves = [index - 1, index + 1, index - 3, index + 3];

  // Prevent wrapping row movements
  if ((index % 3 === 0 && emptyIndex === index - 1) || (index % 3 === 2 && emptyIndex === index + 1)) return;

  if (validMoves.includes(emptyIndex)) {
    // Swap
    [STATE.boardState[index], STATE.boardState[emptyIndex]] = [STATE.boardState[emptyIndex], STATE.boardState[index]];
    STATE.moves++;
    document.getElementById('moves').textContent = STATE.moves;
    renderBoard();
    checkWinCondition();
  }
}

function shuffleTiles() {
  for (let i = 0; i < 100; i++) {
    const emptyIndex = STATE.boardState.indexOf(8);
    const possibleMoves = [];
    if (emptyIndex % 3 > 0) possibleMoves.push(emptyIndex - 1);
    if (emptyIndex % 3 < 2) possibleMoves.push(emptyIndex + 1);
    if (emptyIndex >= 3) possibleMoves.push(emptyIndex - 3);
    if (emptyIndex < 6) possibleMoves.push(emptyIndex + 3);

    const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    [STATE.boardState[emptyIndex], STATE.boardState[randomMove]] = [STATE.boardState[randomMove], STATE.boardState[emptyIndex]];
  }
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
    document.getElementById('timer').textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(STATE.timerInterval);
}

function handleVictory() {
  playSound('victory', STATE.currentLevel);

  // Calculate Stars (Based on moves)
  let stars = 1;
  if (STATE.moves <= 25) stars = 3;
  else if (STATE.moves <= 45) stars = 2;

  // Calculate Coin Rules
  let tierMultiplier = Math.ceil(STATE.currentLevel / 30); // Level 1-30 = 1x, 31-60 = 2x, etc.
  let coinsPerStar = 5 * tierMultiplier;
  let potentialCoins = stars * coinsPerStar;

  // Anti-Farming Rule
  let previousStats = STATE.user.progress.levelStats[STATE.currentLevel] || { stars: 0, coinsEarned: 0 };
  let newCoinsToAward = 0;

  if (stars > previousStats.stars) {
    let previousCoins = previousStats.stars * coinsPerStar;
    newCoinsToAward = potentialCoins - previousCoins;
  }

  // Update Progress
  STATE.user.progress.coins += newCoinsToAward;
  if (STATE.currentLevel === STATE.user.progress.unlockedLevel && STATE.currentLevel < STATE.totalLevels) {
    STATE.user.progress.unlockedLevel++;
  }

  STATE.user.progress.levelStats[STATE.currentLevel] = {
    stars: Math.max(stars, previousStats.stars),
    coinsEarned: Math.max(potentialCoins, previousStats.coinsEarned)
  };

  saveUserData();

  // Populate Victory Modal
  const victoryImg = document.getElementById('victory-img');
  victoryImg.src = `image/level${STATE.currentLevel}.jpeg`;
  victoryImg.onerror = () => { victoryImg.src = `https://via.placeholder.com/320/2575fc/ffffff?text=Level+${STATE.currentLevel}+Complete`; };
  
  document.getElementById('victory-stars').textContent = '⭐'.repeat(stars);
  document.getElementById('victory-time').textContent = document.getElementById('timer').textContent;
  document.getElementById('victory-coins').textContent = `+${newCoinsToAward}`;

  document.getElementById('victory-modal').classList.add('active');
}
