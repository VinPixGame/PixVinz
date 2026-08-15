/**
 * PixVinz Game Script
 * Handles state management, UI navigation, level generation, and audio preferences.
 */

// Central Configuration & State
const CONFIG = {
    totalLevels: 200,
    loadingDuration: 5000 // 5 seconds
};

let gameState = {
    currentLevel: 1,
    maxUnlockedLevel: 1,
    coins: 150,
    streak: 3,
    settings: {
        musicEnabled: true,
        sfxEnabled: true
    },
    completedLevels: []
};

// DOM Elements
const screens = document.querySelectorAll('.screen');
const loadingProgressFill = document.getElementById('loading-progress-fill');
const loadingPercentageText = document.getElementById('loading-percentage-text');
const playBtn = document.getElementById('play-btn');
const levelsBtn = document.getElementById('levels-btn');
const settingsBtn = document.getElementById('settings-btn');
const backBtns = document.querySelectorAll('.back-btn');
const levelsGrid = document.getElementById('levels-grid');
const coinCountEl = document.getElementById('coin-count');
const streakCountEl = document.getElementById('streak-count');
const currentLevelNumEl = document.getElementById('current-level-num');
const musicToggle = document.getElementById('music-toggle');
const sfxToggle = document.getElementById('sfx-toggle');
const resetDataBtn = document.getElementById('reset-data-btn');

// Audio Synthesizer / Manager (Using Web Audio API or fallback handlers)
const soundManager = {
    playClick() {
        if (!gameState.settings.sfxEnabled) return;
        // SFX logic placeholder or audio element trigger
    },
    playBackgroundMusic() {
        if (!gameState.settings.musicEnabled) return;
        // Background music playback logic
    }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadGameData();
    initLoadingSequence();
    setupEventListeners();
    updateUIValues();
});

// LocalStorage Persistence
function saveGameData() {
    try {
        localStorage.setItem('pixvinz_save', JSON.stringify(gameState));
    } catch (e) {
        console.error('Failed to save game state to localStorage:', e);
    }
}

function loadGameData() {
    try {
        const savedData = localStorage.getItem('pixvinz_save');
        if (savedData) {
            gameState = { ...gameState, ...JSON.parse(savedData) };
        }
    } catch (e) {
        console.error('Failed to load game state from localStorage:', e);
    }
}

// Loading Sequence
function initLoadingSequence() {
    let startTime = performance.now();

    function updateProgress(currentTime) {
        let elapsed = currentTime - startTime;
        let progress = Math.min((elapsed / CONFIG.loadingDuration) * 100, 100);

        if (loadingProgressFill) loadingProgressFill.style.width = `${progress}%`;
        if (loadingPercentageText) loadingPercentageText.innerText = `Loading... ${Math.floor(progress)}%`;

        if (progress < 100) {
            requestAnimationFrame(updateProgress);
        } else {
            // Transition from loading to main menu after completion
            setTimeout(() => {
                switchScreen('menu-screen');
            }, 300);
        }
    }

    requestAnimationFrame(updateProgress);
}

// Screen Transition Manager
function switchScreen(screenId) {
    soundManager.playClick();
    screens.forEach(screen => {
        if (screen.id === screenId) {
            screen.classList.add('active');
        } else {
            screen.classList.remove('active');
        }
    });

    if (screenId === 'levels-screen') {
        renderLevels();
        updateUIValues();
    }
}

// Event Listeners Setup
function setupEventListeners() {
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            loadLevel(gameState.maxUnlockedLevel);
            switchScreen('game-screen');
        });
    }

    if (levelsBtn) {
        levelsBtn.addEventListener('click', () => switchScreen('levels-screen'));
    }

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => switchScreen('settings-screen'));
    }

    backBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetScreen = e.currentTarget.getAttribute('data-target');
            if (targetScreen) switchScreen(targetScreen);
        });
    });

    // Settings Toggles
    if (musicToggle) {
        musicToggle.checked = gameState.settings.musicEnabled;
        musicToggle.addEventListener('change', (e) => {
            gameState.settings.musicEnabled = e.target.checked;
            saveGameData();
        });
    }

    if (sfxToggle) {
        sfxToggle.checked = gameState.settings.sfxEnabled;
        sfxToggle.addEventListener('change', (e) => {
            gameState.settings.sfxEnabled = e.target.checked;
            saveGameData();
        });
    }

    if (resetDataBtn) {
        resetDataBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset all your progress?')) {
                localStorage.removeItem('pixvinz_save');
                location.reload();
            }
        });
    }
}

// Dynamic Level Node Renderer (200 Levels)
function renderLevels() {
    if (!levelsGrid) return;
    levelsGrid.innerHTML = '';

    for (let i = 1; i <= CONFIG.totalLevels; i++) {
        const levelNode = document.createElement('button');
        levelNode.classList.add('level-node');
        levelNode.innerText = i;

        if (i < gameState.maxUnlockedLevel || gameState.completedLevels.includes(i)) {
            levelNode.classList.add('completed');
            levelNode.innerHTML = `${i} <i class="fa-solid fa-check"></i>`;
        } else if (i === gameState.maxUnlockedLevel) {
            levelNode.classList.add('current');
        } else {
            levelNode.classList.add('locked');
            levelNode.disabled = true;
            levelNode.innerHTML = `${i} <i class="fa-solid fa-lock"></i>`;
        }

        levelNode.addEventListener('click', () => {
            if (i <= gameState.maxUnlockedLevel) {
                loadLevel(i);
                switchScreen('game-screen');
            }
        });

        levelsGrid.appendChild(levelNode);
    }
}

// Level Loader
function loadLevel(levelNum) {
    gameState.currentLevel = levelNum;
    if (currentLevelNumEl) currentLevelNumEl.innerText = levelNum;
    // Additional puzzle board setup logic can go here
}

// UI Stat Updaters
function updateUIValues() {
    if (coinCountEl) coinCountEl.innerText = gameState.coins;
    if (streakCountEl) streakCountEl.innerText = gameState.streak;
}
