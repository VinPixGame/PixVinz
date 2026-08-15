/* =========================================================
   PIXVINZ - CONSOLIDATED & ORGANIZED SCRIPT
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================================
       1. GLOBAL CONSTANTS & CONFIGURATIONS (from levels.js)
       ========================================================= */
    const TOTAL_LEVELS = 200;
    const MAX_LEVELS = 200;

    function getPuzzleSize(level) {
        if (level >= 1 && level <= 10) return 3;
        if (level >= 11 && level <= 20) return 4;
        if (level >= 21 && level <= 40) return 5;
        if (level >= 41 && level <= 80) return 6;
        return 7;
    }

    function createLevel(level) {
        return {
            id: level,
            image: `image/level${level}.jpeg`,
            size: getPuzzleSize(level)
        };
    }

    const LEVELS = Array.from({ length: TOTAL_LEVELS }, (_, index) => createLevel(index + 1));

    function getLevel(level) {
        return LEVELS.find(item => item.id === Number(level));
    }


    /* =========================================================
       2. VIEW MANAGEMENT & DOM ELEMENT REFERENCES
       ========================================================= */
    const views = {
        loading: document.getElementById('loadingView'),
        login: document.getElementById('loginView'),
        register: document.getElementById('registerView'),
        home: document.getElementById('homeView'),
        levels: document.getElementById('levelsView'),
        collections: document.getElementById('collectionsView'),
        challenge: document.getElementById('challengeView'),
        leaderboardView: document.getElementById('leaderboardView')
    };

    const mainHeader = document.getElementById('mainHeader');


    /* =========================================================
       3. USER & AUTHENTICATION UTILITIES
       ========================================================= */
    function getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('loggedInUser'));
        } catch (e) {
            return null;
        }
    }

    function getCurrentUsername() {
        const user = getCurrentUser();
        return user && user.username ? user.username : '';
    }

    function getUserKey(keyName) {
        const username = getCurrentUsername();
        if (!username) return keyName;
        return `${username}_${keyName}`;
    }

    function getCoins() {
        return parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0;
    }

    function setCoins(val) {
        localStorage.setItem(getUserKey('totalCoins'), val);
        const coinElem = document.getElementById('coinCount');
        if (coinElem) coinElem.innerText = val;
    }

    function updateCoinDisplay() {
        const totalCoins = getCoins();
        const coinElem = document.getElementById('coinCount');
        if (coinElem) {
            coinElem.innerText = totalCoins;
        }
    }

    function getEmailFromUsername(username) {
        const clean = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        return `${clean}@pixvinz.app`;
    }


    /* =========================================================
       4. CLOUD & LOCAL SYNC (FIRESTORE)
       ========================================================= */
    async function syncPlayerProgress() {
        const user = getCurrentUser();
        if (user && window.pixvinzDb) {
            const { db, doc, setDoc } = window.pixvinzDb;
            const currentLevel = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;
            const totalCoins = getCoins();
            const avatar = localStorage.getItem(getUserKey('vinpix_avatar')) || '';

            try {
                await setDoc(doc(db, "players", user.username), {
                    username: user.username,
                    displayName: user.displayName || user.username,
                    level: currentLevel,
                    coins: totalCoins,
                    avatar: avatar,
                    lastUpdated: new Date()
                }, { merge: true });
            } catch (e) {
                console.error("Failed to sync progress:", e);
            }
        }
    }
    window.syncPlayerProgress = syncPlayerProgress;

    async function loadUserDataFromCloud(username) {
        if (!window.pixvinzDb || !username) return;
        const { db, doc, getDoc } = window.pixvinzDb;
        try {
            const userDocRef = doc(db, "players", username);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.displayName) {
                    try {
                        let userObj = JSON.parse(localStorage.getItem('loggedInUser')) || {};
                        userObj.displayName = data.displayName;
                        localStorage.setItem('loggedInUser', JSON.stringify(userObj));

                        let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || {};
                        if (registeredUsers[username]) {
                            registeredUsers[username].displayName = data.displayName;
                            localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                        }
                    } catch (e) {}
                }
                if (data.level) localStorage.setItem(`${username}_currentLevel`, data.level);
                if (data.coins !== undefined) localStorage.setItem(`${username}_totalCoins`, data.coins);
                if (data.avatar) localStorage.setItem(`${username}_vinpix_avatar`, data.avatar);
            }
        } catch (error) {
            console.error("Error loading profile data from cloud:", error);
        }
    }


    /* =========================================================
       5. AVATAR & UI HELPERS
       ========================================================= */
    function updateHeaderAvatar() {
        const savedAvatar = localStorage.getItem(getUserKey('vinpix_avatar')) ||  
                            localStorage.getItem('vinpix_avatar') ||
                            localStorage.getItem('avatar');

        const avatarImg = document.getElementById('profileHeaderImg');
        const fallbackIcon = document.getElementById('profileIconFallback');

        if (savedAvatar) {
            if (avatarImg) {
                avatarImg.src = savedAvatar;
                avatarImg.style.display = 'block';
            }
            if (fallbackIcon) {
                fallbackIcon.style.display = 'none';
            }
        } else {
            if (avatarImg) {
                avatarImg.style.display = 'none';
            }
            if (fallbackIcon) {
                fallbackIcon.style.display = 'block';
            }
        }
    }
    window.updateHeaderAvatar = updateHeaderAvatar;

    window.addEventListener('storage', (e) => {
        if (e.key && e.key.includes('vinpix_avatar')) {
            updateHeaderAvatar();
        }
    });

    function showView(targetView) {
        Object.values(views).forEach(v => {
            if (v) v.classList.remove('active');
        });

        if (views[targetView]) {
            views[targetView].classList.add('active');
        }

        if (['home', 'levels', 'collections', 'challenge', 'leaderboardView'].includes(targetView)) {
            if (mainHeader) mainHeader.classList.remove('hidden');
            updateCoinDisplay();
            updateHeaderAvatar();
            if (targetView === 'home') {
                updateXpProgress();
            }
        } else {
            if (mainHeader) mainHeader.classList.add('hidden');
        }
    }
    window.showView = showView;

    function playMainBGM() {
        if (typeof AudioManager !== 'undefined' && AudioManager.musicEnabled) {
            AudioManager.playMain();
        }
    }

    document.addEventListener('click', () => {
        const user = getCurrentUser();
        if (user && typeof AudioManager !== 'undefined' && AudioManager.musicEnabled) {
            if (!AudioManager.bgmMain || AudioManager.bgmMain.paused) {
                playMainBGM();
            }
        }
    });


    /* =========================================================
       6. XP & PROFILE CALCULATIONS (from profile.js)
       ========================================================= */
    function calculateLevelAndXp(totalPuzzlesSolved) {
        let totalXpEarned = 0;
        for (let i = 1; i <= totalPuzzlesSolved; i++) {
            let lvlForPuzzle = Math.floor((i - 1) / 5) + 1;
            let tier = Math.floor((lvlForPuzzle - 1) / 10);
            let xpPerPuzzle = (tier + 1) * 100;
            totalXpEarned += xpPerPuzzle;
        }

        let currentLevel = 1;
        let cumulativeXpRequired = 500;
        let accumulated = 0;

        for (let lvl = 1; lvl <= 200; lvl++) {
            let tier = Math.floor((lvl - 1) / 10);
            let xpNeededForThisLevel = (tier + 1) * 500;
            accumulated += xpNeededForThisLevel;

            if (totalXpEarned >= accumulated) {
                currentLevel = lvl + 1;
            } else {
                currentLevel = lvl;
                cumulativeXpRequired = accumulated;
                break;
            }
        }

        return {
            level: currentLevel,
            currentXp: totalXpEarned,
            maxXp: cumulativeXpRequired
        };
    }

    function updateXpProgress() {
        const currentUsername = getCurrentUsername();
        let currentLevelVal = currentUsername ? 
            (parseInt(localStorage.getItem(currentUsername + '_currentLevel')) || 1) : 
            (parseInt(localStorage.getItem('currentLevel')) || 1);

        const puzzlesSolved = Math.max(0, currentLevelVal - 1);
        const playerProgression = calculateLevelAndXp(puzzlesSolved);
        const progressPercent = Math.min(100, (playerProgression.currentXp / playerProgression.maxXp) * 100);

        const levelBadge = document.getElementById('displayLevelBadge');
        const xpText = document.getElementById('displayXpText');
        const xpBarFill = document.getElementById('displayXpBarFill');

        if (levelBadge) levelBadge.textContent = `LEVEL ${playerProgression.level}`;
        if (xpText) xpText.textContent = `${playerProgression.currentXp.toLocaleString()} / ${playerProgression.maxXp.toLocaleString()} XP`;
        if (xpBarFill) xpBarFill.style.width = `${progressPercent}%`;
    }


    /* =========================================================
       7. INITIALIZATION & ROUTING LOGIC
       ========================================================= */
    async function initApp() {
        const username = getCurrentUsername();
        if (username) {
            await loadUserDataFromCloud(username);
        }

        if (localStorage.getItem('skipLoading') === 'true') {
            localStorage.removeItem('skipLoading');
            const loadingView = document.getElementById('loadingView');
            if (loadingView) {
                loadingView.classList.remove('active');
                loadingView.style.display = 'none';
            }
            const loggedInUser = getCurrentUser();
            if (loggedInUser) {
                const nameElem = document.getElementById('userDisplayName');
                const profileNameDisplay = document.getElementById('displayPlayerName');
                const nameVal = loggedInUser.displayName || 'Vinz';
                if (nameElem) nameElem.innerText = nameVal;
                if (profileNameDisplay) profileNameDisplay.innerText = nameVal;
            }
            showView('home');
            playMainBGM();
            updateHeaderAvatar();
            updateXpProgress();
        } else {
            setTimeout(() => {
                const loggedInUser = getCurrentUser();
                if (loggedInUser) {
                    const nameElem = document.getElementById('userDisplayName');
                    const profileNameDisplay = document.getElementById('displayPlayerName');
                    const nameVal = loggedInUser.displayName || 'Vinz';
                    if (nameElem) nameElem.innerText = nameVal;
                    if (profileNameDisplay) profileNameDisplay.innerText = nameVal;

                    showView('home');
                    playMainBGM();
                    updateHeaderAvatar();
                    updateXpProgress();
                } else {
                    showView('login');
                }
            }, 4000);
        }
    }
    initApp();


    /* =========================================================
       8. AUTHENTICATION & FORM LISTENERS
       ========================================================= */
    const toRegBtn = document.getElementById('toRegister');
    if (toRegBtn) {
        toRegBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            showView('register');
        });
    }

    const toLogBtn = document.getElementById('toLogin');
    if (toLogBtn) {
        toLogBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            showView('login');
        });
    }

    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();

            const displayName = document.getElementById('regDisplayName').value.trim();
            const username = document.getElementById('regUser').value.trim().toLowerCase();
            const pass = document.getElementById('regPass').value;
            const passConfirm = document.getElementById('regPassConfirm').value;
            const errElem = document.getElementById('regError');

            if (pass !== passConfirm) {
                if (errElem) errElem.innerText = "Passwords do not match!";
                return;
            }

            if (!window.pixvinzAuth) {
                if (errElem) errElem.innerText = 'Firebase initializing... please try again in a second.';
                return;
            }

            const { auth, createUserWithEmailAndPassword } = window.pixvinzAuth;
            const email = getEmailFromUsername(username);

            try {
                await createUserWithEmailAndPassword(auth, email, pass);
                const newUser = { displayName, username, password: pass };
                
                let users = JSON.parse(localStorage.getItem('registeredUsers')) || {};
                users[username] = newUser;
                localStorage.setItem('registeredUsers', JSON.stringify(users));
                localStorage.setItem('loggedInUser', JSON.stringify(newUser));

                if (window.pixvinzDb) {
                    const { db, doc, setDoc } = window.pixvinzDb;
                    await setDoc(doc(db, "players", username), {
                        username: username,
                        displayName: displayName,
                        level: 1,
                        coins: 0,
                        avatar: '',
                        lastUpdated: new Date()
                    }, { merge: true });
                }

                const nameElem = document.getElementById('userDisplayName');
                const profileNameDisplay = document.getElementById('displayPlayerName');
                if (nameElem) nameElem.innerText = displayName;
                if (profileNameDisplay) profileNameDisplay.innerText = displayName;

                if (errElem) errElem.innerText = "";
                updateCoinDisplay();
                updateHeaderAvatar();
                updateXpProgress();
                showView('home');
                playMainBGM();
            } catch (err) {
                console.error("Registration error:", err);
                if (errElem) errElem.innerText = err.message || 'Registration failed. Username may be taken.';
            }
        });
    }

    const logForm = document.getElementById('loginForm');
    if (logForm) {
        logForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();

            const username = document.getElementById('loginUser').value.trim().toLowerCase();
            const pass = document.getElementById('loginPass').value;
            const errElem = document.getElementById('loginError');

            if (!window.pixvinzAuth) {
                if (errElem) errElem.innerText = 'Firebase initializing... please try again in a second.';
                return;
            }

            const { auth, signInWithEmailAndPassword } = window.pixvinzAuth;
            const email = getEmailFromUsername(username);

            try {
                await signInWithEmailAndPassword(auth, email, pass);
                let currentUser = { username: username, displayName: username, password: pass };

                if (window.pixvinzDb) {
                    const { db, doc, getDoc, setDoc } = window.pixvinzDb;
                    const userDoc = await getDoc(doc(db, "players", username));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        if (data.level) localStorage.setItem(getUserKey('currentLevel'), data.level);
                        if (data.coins !== undefined) localStorage.setItem(getUserKey('totalCoins'), data.coins);
                        if (data.avatar) {
                            localStorage.setItem(getUserKey('vinpix_avatar'), data.avatar);
                            localStorage.setItem('vinpix_avatar', data.avatar);
                        }
                        if (data.displayName) currentUser.displayName = data.displayName;
                    } else {
                        await setDoc(doc(db, "players", username), {
                            username: username,
                            displayName: username,
                            level: parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1,
                            coins: getCoins(),
                            lastUpdated: new Date()
                        }, { merge: true });
                    }
                }

                let users = JSON.parse(localStorage.getItem('registeredUsers')) || {};
                users[username] = currentUser;
                localStorage.setItem('registeredUsers', JSON.stringify(users));
                localStorage.setItem('loggedInUser', JSON.stringify(currentUser));

                const nameElem = document.getElementById('userDisplayName');
                const profileNameDisplay = document.getElementById('displayPlayerName');
                if (nameElem) nameElem.innerText = currentUser.displayName;
                if (profileNameDisplay) profileNameDisplay.innerText = currentUser.displayName;
                if (errElem) errElem.innerText = "";

                updateCoinDisplay();
                updateHeaderAvatar();
                updateXpProgress();
                showView('home');
                playMainBGM();
            } catch (err) {
                console.error("Login error:", err);
                if (errElem) errElem.innerText = "Invalid username or password!";
            }
        });
    }


    /* =========================================================
       9. HOME PAGE & NAVIGATION BUTTON LISTENERS
       ========================================================= */
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            const currentLevel = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;
            window.location.href = `game.html?level=${currentLevel}`;
        });
    }

    const navLevels = document.getElementById('navLevels');
    if (navLevels) {
        navLevels.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            renderLevels();
            showView('levels');
        });
    }

    const navCollections = document.getElementById('navCollections');
    if (navCollections) {
        navCollections.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            renderCollectionFolders();
            showView('collections');
        });
    }

    const navLeaderboard = document.getElementById('navLeaderboard');
    if (navLeaderboard) {
        navLeaderboard.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            renderLeaderboard();
            showView('leaderboardView');
        });
    }

    document.querySelectorAll('.back-btn').forEach(btn => {
        if (btn.id === 'collectionsBackBtn') return;
        btn.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            showView('home');
        });
    });

    const collectionsBackBtn = document.getElementById('collectionsBackBtn');
    if (collectionsBackBtn) {
        collectionsBackBtn.addEventListener('click', (e) => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            const imagesContainer = document.getElementById('collectionsImagesContainer');
            
            if (imagesContainer && !imagesContainer.classList.contains('hidden')) {
                e.stopImmediatePropagation();
                renderCollectionFolders();
            } else {
                showView('home');
            }
        });
    }


    /* =========================================================
       10. SETTINGS, MODALS & PROFILE EDIT LOGIC
       ========================================================= */
    const settingsModal = document.getElementById('settingsModal');
    const aboutModal = document.getElementById('aboutModal');
    const editNameModal = document.getElementById('editNameModal');
    const sfxToggle = document.getElementById('sfxToggle');
    const musicToggle = document.getElementById('musicToggle');

    if (typeof AudioManager !== 'undefined') {
        if (sfxToggle) sfxToggle.checked = AudioManager.sfxEnabled;
        if (musicToggle) musicToggle.checked = AudioManager.musicEnabled;
    }

    const navSettings = document.getElementById('navSettings');
    if (navSettings) {
        navSettings.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            if (settingsModal) settingsModal.classList.remove('hidden');
            updateHeaderAvatar();
            updateXpProgress();
        });
    }

    const closeSettingsModal = document.getElementById('closeSettingsModal');
    if (closeSettingsModal) {
        closeSettingsModal.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            if (settingsModal) settingsModal.classList.add('hidden');
        });
    }

    if (sfxToggle) {
        sfxToggle.addEventListener('change', (e) => {
            if (typeof AudioManager !== 'undefined') {
                AudioManager.setSFX(e.target.checked);
                if (e.target.checked) AudioManager.playClick();
            }
        });
    }

    if (musicToggle) {
        musicToggle.addEventListener('change', (e) => {
            if (typeof AudioManager !== 'undefined') {
                AudioManager.setMusic(e.target.checked);
            }
        });
    }

    const aboutBtn = document.getElementById('aboutBtn');
    if (aboutBtn) {
        aboutBtn.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            if (aboutModal) aboutModal.classList.remove('hidden');
        });
    }

    const closeAboutModal = document.getElementById('closeAboutModal');
    if (closeAboutModal) {
        closeAboutModal.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            if (aboutModal) aboutModal.classList.add('hidden');
        });
    }

    const openEditNameModal = document.getElementById('openEditNameModal');
    if (openEditNameModal && editNameModal) {
        openEditNameModal.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            editNameModal.classList.remove('hidden');
        });
    }

    const closeEditNameModal = document.getElementById('closeEditNameModal');
    if (closeEditNameModal && editNameModal) {
        closeEditNameModal.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            editNameModal.classList.add('hidden');
        });
    }

    // Avatar Upload & Base64 Cloud Sync
    const avatarInput = document.getElementById('avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const previewElem = document.getElementById('avatar-preview');
                    if (previewElem) previewElem.src = e.target.result;
                    
                    localStorage.setItem(getUserKey('vinpix_avatar'), e.target.result);
                    await syncPlayerProgress();
                    updateHeaderAvatar();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Save Profile Display Name
    const saveProfileBtn = document.getElementById('save-profile-btn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const newDisplayName = document.getElementById('username-input').value.trim();
            const statusEl = document.getElementById('save-status');

            if (!newDisplayName) {
                if (statusEl) {
                    statusEl.style.color = '#ff5252';
                    statusEl.textContent = 'Please enter a player name!';
                }
                return;
            }

            let currentUser = getCurrentUser();
            if (!currentUser || !currentUser.username) {
                if (statusEl) {
                    statusEl.style.color = '#ff5252';
                    statusEl.textContent = 'Error: Not logged in properly!';
                }
                return;
            }

            currentUser.displayName = newDisplayName;
            localStorage.setItem('loggedInUser', JSON.stringify(currentUser));

            try {
                let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || {};
                if (registeredUsers[currentUser.username]) {
                    registeredUsers[currentUser.username].displayName = newDisplayName;
                    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                }
            } catch (e) {}

            localStorage.setItem('vinpix_username', newDisplayName);

            const nameDisplay = document.getElementById('displayPlayerName');
            const userDisplayName = document.getElementById('userDisplayName');
            if (nameDisplay) nameDisplay.innerText = newDisplayName;
            if (userDisplayName) userDisplayName.innerText = newDisplayName;

            if (statusEl) {
                statusEl.style.color = '#4caf50';
                statusEl.textContent = 'Saving to cloud...';
            }

            await syncPlayerProgress();

            if (statusEl) {
                statusEl.style.color = '#4caf50';
                statusEl.textContent = 'Name updated successfully!';
            }

            setTimeout(() => {
                if (statusEl) statusEl.textContent = '';
                if (editNameModal) editNameModal.classList.add('hidden');
            }, 1200);
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            if (confirm("Are you sure you want to log out?")) {
                if (window.pixvinzAuth) {
                    await window.pixvinzAuth.signOut(window.pixvinzAuth.auth);
                }
                localStorage.removeItem('loggedInUser');
                if (settingsModal) settingsModal.classList.add('hidden');
                if (typeof AudioManager !== 'undefined') AudioManager.stopBGM();
                showView('login');
            }
        });
    }


    /* =========================================================
       11. RENDER LEVELS GRID
       ========================================================= */
    function renderLevels() {
        const grid = document.getElementById('levelsGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const currentLevel = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;

        let overallBestTimeSeconds = Infinity;
        let overallFewestMoves = Infinity;

        for (let i = 1; i <= TOTAL_LEVELS; i++) {
            const btn = document.createElement('div');
            const isUnlocked = i <= currentLevel;
            const isSolved = i < currentLevel;

            btn.className = `level-btn ${isUnlocked ? 'unlocked' : 'locked'}`;
            btn.style.setProperty('--level-bg', `url('image/level${i}.jpeg')`);

            if (isUnlocked) {
                if (!isSolved) {
                    btn.classList.add('unsolved-bg');
                } else {
                    btn.classList.add('solved-bg');
                }

                const levelCoins = parseInt(localStorage.getItem(getUserKey(`levelCoins_${i}`))) || 0;
                const starsEarned = Math.min(3, Math.floor(levelCoins / 5)) || (isSolved ? 3 : 0);
                
                let moves = localStorage.getItem(getUserKey(`levelMoves_${i}`));
                let timeStr = localStorage.getItem(getUserKey(`levelTime_${i}`));

                if (isSolved) {
                    const gSize = getPuzzleSize(i);
                    if (!moves) {
                        moves = gSize * 6;
                    }
                    if (!timeStr || timeStr === '--:--') {
                        const estSec = gSize * 15;
                        const m = Math.floor(estSec / 60).toString().padStart(2, '0');
                        const s = (estSec % 60).toString().padStart(2, '0');
                        timeStr = `${m}:${s}`;
                    }
                }

                if (moves) {
                    const parsedMoves = parseInt(moves);
                    if (parsedMoves < overallFewestMoves) {
                        overallFewestMoves = parsedMoves;
                    }
                }
                if (timeStr && timeStr !== '--:--') {
                    const parts = timeStr.split(':');
                    if (parts.length === 2) {
                        const totalSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                        if (totalSec < overallBestTimeSeconds) {
                            overallBestTimeSeconds = totalSec;
                        }
                    }
                }

                let starsHTML = '';
                for (let s = 1; s <= 3; s++) {
                    starsHTML += `<span class="star-icon-small ${s <= starsEarned ? 'earned' : ''}">★</span>`;
                }

                const displayMoves = moves ? moves : '--';
                const displayTime = timeStr ? timeStr : '--:--';

                btn.innerHTML = `
                    <div class="level-num">${i.toString().padStart(2, '0')}</div>
                    <div class="stars">${starsHTML}</div>
                    <div class="level-card-pill">
                        <div class="pill-stat">⏱️ ${displayTime}</div>
                        <div class="pill-stat">🔀 ${displayMoves} <span class="unit">MOVES</span></div>
                    </div>
                `;

                btn.addEventListener('click', () => {
                    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                    window.location.href = `game.html?level=${i}`;
                });
            } else {
                btn.style.backgroundColor = '#100424';
                btn.innerHTML = `
                    <div class="level-num" style="opacity:0.3">${i.toString().padStart(2, '0')}</div>
                    <div class="lock-icon" style="font-size:22px; opacity:0.6;">🔒</div>
                    <div class="locked-text">LOCKED</div>
                `;
            }

            grid.appendChild(btn);
        }

        const timeElem = document.getElementById('globalBestTime');
        if (timeElem) {
            if (overallBestTimeSeconds !== Infinity) {
                const m = Math.floor(overallBestTimeSeconds / 60).toString().padStart(2, '0');
                const s = (overallBestTimeSeconds % 60).toString().padStart(2, '0');
                timeElem.innerText = `${m}:${s}`;
            } else {
                timeElem.innerText = '--:--';
            }
        }

        const movesElem = document.getElementById('globalFewestMoves');
        if (movesElem) {
            movesElem.innerText = overallFewestMoves !== Infinity ? overallFewestMoves : '--';
        }
    }


    /* =========================================================
       12. COLLECTIONS FOLDERS LOGIC
       ========================================================= */
    function renderCollectionFolders() {
        const folderGrid = document.getElementById('collectionsFolderGrid');
        if (!folderGrid) return;
        folderGrid.innerHTML = '';

        const levelsPerFolder = 10;
        const totalFolders = Math.ceil(TOTAL_LEVELS / levelsPerFolder);

        for (let i = 0; i < totalFolders; i++) {
            const start = i * levelsPerFolder + 1;
            const end = Math.min((i + 1) * levelsPerFolder, TOTAL_LEVELS);

            const folderCard = document.createElement('div');
            folderCard.className = 'collection-folder-btn';
            folderCard.innerHTML = `
                <div class="collection-folder-icon">📁</div>
                <div class="collection-folder-title">LEVELS ${start} - ${end}</div>
                <div class="collection-folder-sub">Tap to view</div>
            `;
            
            folderCard.addEventListener('click', () => {
                if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                openCollectionFolder(start, end);
            });

            folderGrid.appendChild(folderCard);
        }

        const folderContainer = document.getElementById('collectionsFolderContainer');
        const imagesContainer = document.getElementById('collectionsImagesContainer');
        const titleElem = document.getElementById('collectionsTitle');

        if (folderContainer) folderContainer.classList.remove('hidden');
        if (imagesContainer) imagesContainer.classList.add('hidden');
        if (titleElem) titleElem.innerText = 'COLLECTIONS';
    }

    function openCollectionFolder(start, end) {
        const folderContainer = document.getElementById('collectionsFolderContainer');
        const imagesContainer = document.getElementById('collectionsImagesContainer');
        const titleElem = document.getElementById('collectionsTitle');

        if (folderContainer) folderContainer.classList.add('hidden');
        if (imagesContainer) imagesContainer.classList.remove('hidden');
        if (titleElem) titleElem.innerText = `LVL ${start}-${end}`;

        renderFilteredCollections(start, end);
    }

    function renderFilteredCollections(start, end) {
        const grid = document.getElementById('collectionsGrid');
        if (!grid) return;
        grid.innerHTML = '';
        const currentLevel = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;

        for (let i = start; i <= end; i++) {
            const isUnlocked = i < currentLevel;
            const item = document.createElement('div');
            item.className = 'collection-item';

            if (isUnlocked) {
                item.innerHTML = `
                    <img src="image/level${i}.jpeg" alt="Level ${i}">
                    <div class="collection-badge">LEVEL ${i.toString().padStart(2, '0')}</div>
                `;

                item.addEventListener('click', () => {
                    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                    openImageModal(i);
                });
            } else {
                item.style.opacity = '0.4';
                item.innerHTML = `
                    <div style="display:flex; align-items:center; justify-content:center; height:100%; font-size:24px;">🔒</div>
                    <div class="collection-badge">LEVEL ${i.toString().padStart(2, '0')}</div>
                `;
            }

            grid.appendChild(item);
        }
    }

    function openImageModal(levelNum) {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalPreviewImg');
        const modalTitle = document.getElementById('modalLevelTitle');

        if (modalTitle) modalTitle.innerText = `LEVEL ${levelNum.toString().padStart(2, '0')}`;
        if (modalImg) modalImg.src = `image/level${levelNum}.jpeg`;
        if (modal) modal.classList.remove('hidden');
    }

    function closeImageModal() {
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
        const modal = document.getElementById('imageModal');
        if (modal) modal.classList.add('hidden');
    }

    const closeImgModalBtn = document.getElementById('closeImageModal');
    if (closeImgModalBtn) closeImgModalBtn.addEventListener('click', closeImageModal);

    const imgModal = document.getElementById('imageModal');
    if (imgModal) {
        imgModal.addEventListener('click', (e) => {
            if (e.target.id === 'imageModal' || e.target.id === 'modalPreviewImg') {
                closeImageModal();
            }
        });
    }


    /* =========================================================
       13. GLOBAL LEADERBOARD SYNC
       ========================================================= */
    async function renderLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        const userRankDisplay = document.getElementById('userRankDisplay');
        if (!leaderboardList) return;

        leaderboardList.innerHTML = '<div style="text-align: center; color: #d1c4e9; padding: 20px;">Loading rankings...</div>';

        try {
            let players = [];

            if (window.pixvinzDb) {
                const { db, collection, getDocs } = window.pixvinzDb;
                const querySnapshot = await getDocs(collection(db, "players"));
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data();
                    players.push({
                        username: data.username,
                        displayName: data.displayName || data.username,
                        level: data.level || 1,
                        coins: data.coins || 0
                    });
                });
            }

            if (players.length === 0) {
                const currentUser = getCurrentUser();
                players.push({
                    username: currentUser?.username || 'vinz',
                    displayName: currentUser?.displayName || 'Vinz',
                    level: parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1,
                    coins: getCoins()
                });
            }

            players.sort((a, b) => b.level - a.level || b.coins - a.coins);

            leaderboardList.innerHTML = '';
            const currentUser = getCurrentUser();
            let userRank = '-';

            players.forEach((p, idx) => {
                const rank = idx + 1;
                if (currentUser && p.username === currentUser.username) {
                    userRank = `#${rank}`;
                }
                const row = document.createElement('div');
                row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: #2a1147; padding: 12px 16px; border-radius: 12px; border: 1px solid #4a148c;';
                row.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-weight: bold; color: ${rank === 1 ? '#ffd700' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : '#d1c4e9'}; width: 25px;">#${rank}</span>
                        <span style="color: #fff; font-weight: 500;">${p.displayName || p.username}</span>
                    </div>
                    <div style="display: flex; gap: 15px; font-size: 0.9rem; color: #d1c4e9;">
                        <span>Lvl ${p.level}</span>
                        <span>🪙 ${p.coins}</span>
                    </div>
                `;
                leaderboardList.appendChild(row);
            });

            if (userRankDisplay) userRankDisplay.innerText = userRank;
        } catch (err) {
            console.error("Leaderboard error:", err);
            leaderboardList.innerHTML = '<div style="text-align: center; color: #ff5252; padding: 20px;">Failed to load leaderboard.</div>';
        }
    }

    // Initial Avatar & UI check
    updateHeaderAvatar();
});
