/**
 * PixVinz - Main Application Script
 * Handles Authentication, Navigation, State, Levels, Collections, 
 * Leaderboard, Settings, and Matchmaking.
 */

// --- STATE & LOCAL STORAGE MANAGEMENT ---
const STORAGE_KEYS = {
    USER: 'pixvinz_current_user',
    USERS_DB: 'pixvinz_users_db',
    GAME_DATA: 'pixvinz_game_data_', // Appended with username
    SETTINGS: 'pixvinz_settings'
};

let currentUser = null;
let userGameData = {
    coins: 100,
    bestTime: null, // in seconds
    fewestMoves: null,
    levels: {}, // levelId: { solved: boolean, time: seconds, moves: count }
    collections: {}, // folderId: { imageId: boolean }
    rank: 42
};

let appSettings = {
    sfx: true,
    music: true
};

// --- INITIALIZATION & EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    checkExistingSession();
    initEventListeners();
});

function initEventListeners() {
    // Auth Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('toRegister').addEventListener('click', (e) => { e.preventDefault(); switchView('registerView'); });
    document.getElementById('toLogin').addEventListener('click', (e) => { e.preventDefault(); switchView('loginView'); });

    // Main Navigation Cards & Buttons
    document.getElementById('playBtn').addEventListener('click', () => switchView('levelsView'));
    document.getElementById('navChallenge').addEventListener('click', () => switchView('challengeView'));
    document.getElementById('navLevels').addEventListener('click', () => switchView('levelsView'));
    document.getElementById('navCollections').addEventListener('click', () => openCollectionsFolders());
    document.getElementById('navLeaderboard').addEventListener('click', () => { switchView('leaderboardView'); renderLeaderboard(); });
    document.getElementById('navSettings').addEventListener('click', openSettingsModal);

    // Back Buttons across views
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // Special handling for collections view nested folders/images
            const collectionsImgContainer = document.getElementById('collectionsImagesContainer');
            if (!collectionsImgContainer.classList.contains('hidden') && btn.id === 'collectionsBackBtn') {
                openCollectionsFolders();
                return;
            }
            switchView('homeView');
        });
    });

    // Modals Controls
    document.getElementById('closeSettingsModal').addEventListener('click', closeSettingsModal);
    document.getElementById('closeImageModal').addEventListener('click', closeImageModal);
    document.getElementById('closeAboutModal').addEventListener('click', closeAboutModal);
    document.getElementById('aboutBtn').addEventListener('click', () => { closeSettingsModal(); openAboutModal(); });
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Settings Toggles
    document.getElementById('sfxToggle').addEventListener('change', (e) => {
        appSettings.sfx = e.target.checked;
        saveSettings();
    });
    document.getElementById('musicToggle').addEventListener('change', (e) => {
        appSettings.music = e.target.checked;
        saveSettings();
    });

    // Challenge Matchmaking
    document.getElementById('startMatchmakingBtn').addEventListener('click', startMatchmaking);
}

// --- VIEW ROUTER ---
function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) target.classList.add('active');

    const mainHeader = document.getElementById('mainHeader');
    if (['homeView', 'levelsView', 'collectionsView', 'challengeView', 'leaderboardView'].includes(viewId)) {
        mainHeader.classList.remove('hidden');
    } else {
        mainHeader.classList.add('hidden');
    }
}

// --- AUTHENTICATION ---
function checkExistingSession() {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    // Simulate loading screen delay
    setTimeout(() => {
        if (savedUser) {
            loginUserSession(savedUser, false);
        } else {
            switchView('loginView');
        }
    }, 1500);
}

function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    const errorEl = document.getElementById('loginError');

    const usersDb = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DB) || '{}');

    if (!usersDb[user] || usersDb[user].pass !== pass) {
        errorEl.textContent = 'Invalid username or password.';
        return;
    }

    errorEl.textContent = '';
    loginUserSession(user, true);
}

function handleRegister(e) {
    e.preventDefault();
    const displayName = document.getElementById('regDisplayName').value.trim();
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value;
    const passConfirm = document.getElementById('regPassConfirm').value;
    const errorEl = document.getElementById('regError');

    if (pass !== passConfirm) {
        errorEl.textContent = 'Passwords do not match.';
        return;
    }

    const usersDb = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DB) || '{}');
    if (usersDb[user]) {
        errorEl.textContent = 'Username already taken.';
        return;
    }

    usersDb[user] = { pass, displayName };
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(usersDb));

    errorEl.textContent = '';
    alert('Account created successfully! Please log in.');
    switchView('loginView');
}

function loginUserSession(username, transition = true) {
    currentUser = username;
    localStorage.setItem(STORAGE_KEYS.USER, username);

    const usersDb = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS_DB) || '{}');
    const profile = usersDb[username] || { displayName: username };

    // Update UI headers & welcome text
    document.getElementById('userDisplayName').textContent = profile.displayName;
    
    loadUserGameData();
    updateHeaderUI();
    renderLevelsGrid();

    if (transition) {
        switchView('homeView');
    }
}

function handleLogout() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    currentUser = null;
    closeSettingsModal();
    switchView('loginView');
}

// --- GAME DATA & UI SYNC ---
function loadUserGameData() {
    const data = localStorage.getItem(STORAGE_KEYS.GAME_DATA + currentUser);
    if (data) {
        userGameData = JSON.parse(data);
    } else {
        // Initialize default mock data for new user
        userGameData = {
            coins: 150,
            bestTime: 45, // seconds
            fewestMoves: 12,
            levels: { 1: { solved: true, time: 45, moves: 12 } },
            collections: { 'animals': { 'img1': true } }
        };
        saveUserGameData();
    }
}

function saveUserGameData() {
    if (!currentUser) return;
    localStorage.setItem(STORAGE_KEYS.GAME_DATA + currentUser, JSON.stringify(userGameData));
}

function updateHeaderUI() {
    document.getElementById('coinCount').textContent = userGameData.coins;
    
    // Global Best Stats display
    document.getElementById('globalBestTime').textContent = userGameData.bestTime ? formatTime(userGameData.bestTime) : '--:--';
    document.getElementById('globalFewestMoves').textContent = userGameData.fewestMoves ?? '--';
    document.getElementById('userRankDisplay').textContent = `#${userGameData.rank || 42}`;
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// --- LEVELS VIEW RENDERING ---
function renderLevelsGrid() {
    const grid = document.getElementById('levelsGrid');
    grid.innerHTML = '';

    // Generate 20 sample levels
    for (let i = 1; i <= 20; i++) {
        const isUnlocked = i === 1 || userGameData.levels[i - 1]?.solved || userGameData.levels[i]?.solved;
        const isSolved = userGameData.levels[i]?.solved;

        const card = document.createElement('div');
        card.className = `level-card ${isUnlocked ? '' : 'locked'} ${isSolved ? 'solved' : ''}`;
        card.innerHTML = `
            <div class="level-number">${i < 10 ? '0' + i : i}</div>
            <div class="level-status">${isSolved ? '⭐ Done' : (isUnlocked ? 'Play' : '🔒')}</div>
        `;

        if (isUnlocked) {
            card.addEventListener('click', () => {
                alert(`Starting Level ${i}! (Puzzle gameplay module placeholder)`);
                // Simulate solving level for demonstration
                simulateLevelComplete(i);
            });
        }
        grid.appendChild(card);
    }
}

function simulateLevelComplete(levelNum) {
    userGameData.levels[levelNum] = { solved: true, time: 30, moves: 10 };
    userGameData.coins += 50;
    userGameData.bestTime = userGameData.bestTime ? Math.min(userGameData.bestTime, 30) : 30;
    userGameData.fewestMoves = userGameData.fewestMoves ? Math.min(userGameData.fewestMoves, 10) : 10;
    saveUserGameData();
    updateHeaderUI();
    renderLevelsGrid();
}

// --- COLLECTIONS VIEW ---
function openCollectionsFolders() {
    switchView('collectionsView');
    document.getElementById('collectionsTitle').textContent = 'COLLECTIONS';
    document.getElementById('collectionsFolderContainer').classList.remove('hidden');
    document.getElementById('collectionsImagesContainer').classList.add('hidden');

    const folderGrid = document.getElementById('collectionsFolderGrid');
    folderGrid.innerHTML = '';

    const folders = [
        { id: 'animals', name: 'Animals', icon: '🦁', count: '1/5' },
        { id: 'landscapes', name: 'Landscapes', icon: '🌄', count: '0/5' },
        { id: 'anime', name: 'Anime Art', icon: '🎨', count: '0/5' }
    ];

    folders.forEach(folder => {
        const el = document.createElement('div');
        el.className = 'card menu-card';
        el.innerHTML = `
            <div class="card-icon">${folder.icon}</div>
            <div class="card-text">
                <h3>${folder.name}</h3>
                <p>Unlocked: ${folder.count}</p>
            </div>
            <span class="arrow">›</span>
        `;
        el.addEventListener('click', () => openCollectionImages(folder.id, folder.name));
        folderGrid.appendChild(el);
    });
}

function openCollectionImages(folderId, folderName) {
    document.getElementById('collectionsTitle').textContent = folderName.toUpperCase();
    document.getElementById('collectionsFolderContainer').classList.add('hidden');
    document.getElementById('collectionsImagesContainer').classList.remove('hidden');

    const grid = document.getElementById('collectionsGrid');
    grid.innerHTML = '';

    // Sample images inside folder
    for (let i = 1; i <= 6; i++) {
        const isUnlocked = (folderId === 'animals' && i === 1);
        const item = document.createElement('div');
        item.className = `collection-item ${isUnlocked ? '' : 'locked'}`;
        item.style.cssText = "background: #2a1147; border-radius: 12px; height: 120px; display: flex; align-items: center; justify-content: center; font-size: 2rem; position: relative; border: 2px solid #9c27b0; cursor: pointer;";
        
        item.innerHTML = isUnlocked ? '🖼️' : '🔒';

        if (isUnlocked) {
            item.addEventListener('click', () => {
                openImageModal(`Sample ${folderName} ${i}`, 'https://via.placeholder.com/400');
            });
        }
        grid.appendChild(item);
    }
}

// --- LEADERBOARD VIEW ---
function renderLeaderboard() {
    const list = document.getElementById('leaderboardList');
    list.innerHTML = '';

    const mockLeaders = [
        { rank: 1, name: 'ShadowVinz', score: 1420 },
        { rank: 2, name: 'PixelQueen', score: 1350 },
        { rank: 3, name: 'SpeedSolver', score: 1280 },
        { rank: 4, name: 'MasterV', score: 1150 },
        { rank: 5, name: 'PuzzleKing', score: 990 }
    ];

    mockLeaders.forEach(leader => {
        const row = document.createElement('div');
        row.style.cssText = "display: flex; align-items: center; justify-content: space-between; background: rgba(42, 17, 71, 0.6); padding: 12px 16px; border-radius: 10px; border: 1px solid #7b1fa2;";
        row.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-weight: bold; color: ${leader.rank === 1 ? '#ffd700' : leader.rank === 2 ? '#c0c0c0' : leader.rank === 3 ? '#cd7f32' : '#b388ff'}">#${leader.rank}</span>
                <span style="color: #fff; font-weight: 500;">${leader.name}</span>
            </div>
            <span style="color: #ffd700; font-weight: bold;">⭐ ${leader.score} pts</span>
        `;
        list.appendChild(row);
    });
}

// --- MATCHMAKING 1V1 ---
function startMatchmaking() {
    const statusEl = document.getElementById('matchmakingStatus');
    const btn = document.getElementById('startMatchmakingBtn');
    
    btn.disabled = true;
    statusEl.textContent = 'Searching for an opponent...';

    setTimeout(() => {
        statusEl.textContent = 'Opponent found! Starting match...';
        setTimeout(() => {
            statusEl.textContent = '';
            btn.disabled = false;
            alert('Match battle started! (1v1 real-time gameplay view placeholder)');
        }, 1200);
    }, 2000);
}

// --- MODALS & SETTINGS ---
function openSettingsModal() {
    document.getElementById('settingsModal').classList.remove('hidden');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.add('hidden');
}

function openAboutModal() {
    document.getElementById('aboutModal').classList.remove('hidden');
}

function closeAboutModal() {
    document.getElementById('aboutModal').classList.add('hidden');
}

function openImageModal(title, imgSrc) {
    document.getElementById('modalLevelTitle').textContent = title;
    document.getElementById('modalPreviewImg').src = imgSrc;
    document.getElementById('imageModal').classList.remove('hidden');
}

function closeImageModal() {
    document.getElementById('imageModal').classList.add('hidden');
}

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
        appSettings = JSON.parse(saved);
        document.getElementById('sfxToggle').checked = appSettings.sfx;
        document.getElementById('musicToggle').checked = appSettings.music;
    }
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
}
