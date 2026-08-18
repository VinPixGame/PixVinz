// --- FIREBASE INITIALIZATION & DATABASE BRIDGE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDPFmx35ClB3c5vGBtv8rzVAiTK4rcwAik",
  authDomain: "pixvinz2026.firebaseapp.com",
  projectId: "pixvinz2026",
  storageBucket: "pixvinz2026.firebasestorage.app",
  messagingSenderId: "45609077809",
  appId: "1:45609077809:web:575611e46acda9f64c5910",
  measurementId: "G-W7FSERE8ZJ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

window.pixvinzDb = { db, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs };

// --- SAFE CLOUD PROFILE SYNC ---
async function fetchCloudProfileData() {
  try {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('loggedInUser'));
    } catch (e) {}

    if (!user || !user.username) return null;

    const userDocRef = doc(db, 'players', user.username);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const cloudData = snap.data();
      const mergedUser = { ...user, ...cloudData };
      localStorage.setItem('loggedInUser', JSON.stringify(mergedUser));
      
      const prefix = user.username;
      if (cloudData.level !== undefined) localStorage.setItem(`${prefix}_currentLevel`, cloudData.level);
      if (cloudData.coins !== undefined) localStorage.setItem(`${prefix}_totalCoins`, cloudData.coins);
      if (cloudData.xp !== undefined) localStorage.setItem(`${prefix}_xp`, cloudData.xp);
      if (cloudData.avatar) localStorage.setItem(`${prefix}_vinpix_avatar`, cloudData.avatar);

      return cloudData;
    }
    return user;
  } catch (err) {
    console.warn("Cloud sync fallback:", err);
    try {
      return JSON.parse(localStorage.getItem('loggedInUser'));
    } catch (e) {
      return null;
    }
  }
}

// --- MAIN APP BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
  const views = {
    loading: document.getElementById('loadingView'),
    login: document.getElementById('loginView'),
    register: document.getElementById('registerView'),
    home: document.getElementById('homeView'),
    levels: document.getElementById('levelsView'),
    collections: document.getElementById('collectionsView'),
    challenge: document.getElementById('challengeView'),
    leaderboard: document.getElementById('leaderboardView'),
    profileView: document.getElementById('profileView')
  };

  const mainHeader = document.getElementById('mainHeader');

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

  function showView(targetView) {
    Object.values(views).forEach(v => {
      if (v) v.classList.remove('active');
    });

    if (views[targetView]) {
      views[targetView].classList.add('active');
    }

    if (['homeView', 'levelsView', 'collectionsView', 'profileView'].includes(targetView)) {
      if (mainHeader) mainHeader.classList.remove('hidden');
      updateCoinDisplay();
    } else {
      if (mainHeader) mainHeader.classList.add('hidden');
    }

    if (targetView === 'profileView') {
      updateProfileStats();
    }
  }

  window.showView = showView;
  window.goHome = function() {
    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
    showView('homeView');
  };

  function updateCoinDisplay() {
    const user = getCurrentUser();
    const totalCoins = user?.coins ?? parseInt(localStorage.getItem(getUserKey('totalCoins'))) ?? 0;
    const coinElem = document.getElementById('coinCount');
    if (coinElem) {
      coinElem.innerText = totalCoins;
    }
  }

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

  const percentageElem = document.getElementById('loadingPercentage');
  const barFillElem = document.getElementById('loadingBarFill');

  async function finishLoading() {
      const loggedInUser = getCurrentUser();
      if (loggedInUser) {
          await fetchCloudProfileData();
          const freshUser = getCurrentUser();
          
          const nameElem = document.getElementById('userDisplayName');
          if (nameElem) nameElem.innerText = freshUser?.displayName || loggedInUser.displayName || 'Vinz';
          
          const profileNameElem = document.getElementById('displayPlayerName');
          if (profileNameElem) profileNameElem.innerText = freshUser?.displayName || loggedInUser.displayName || 'Ulala';

          const avatarImg = document.getElementById('profileHeaderImg');
          const fallbackIcon = document.getElementById('profileIconFallback');
          const previewImg = document.getElementById('avatar-preview');
          const userAvatar = freshUser?.avatar || loggedInUser.avatar;

          if (userAvatar) {
            if (avatarImg) { avatarImg.src = userAvatar; avatarImg.style.display = 'block'; }
            if (fallbackIcon) { fallbackIcon.style.display = 'none'; }
            if (previewImg) { previewImg.src = userAvatar; }
          }

          showView('homeView');
          playMainBGM();
      } else {
          showView('loginView');
      }
  }

  let currentPercent = 1;
  const totalDuration = 2000;
  const intervalTime = 40;
  const increment = 100 / (totalDuration / intervalTime);

  const loadingInterval = setInterval(() => {
      currentPercent += increment;
      if (currentPercent >= 100) {
          currentPercent = 100;
          clearInterval(loadingInterval);
          finishLoading();
      }
      if (percentageElem) percentageElem.innerText = `${Math.floor(currentPercent)}%`;
      if (barFillElem) barFillElem.style.width = `${currentPercent}%`;
  }, intervalTime);

  // Switch Links
  const toRegBtn = document.getElementById('toRegister');
  if (toRegBtn) {
    toRegBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      showView('registerView');
    });
  }

  const toLogBtn = document.getElementById('toLogin');
  if (toLogBtn) {
    toLogBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      showView('loginView');
    });
  }

  // Password toggles
  function setupPasswordToggle(passwordInputId, toggleBtnId) {
    const passInput = document.getElementById(passwordInputId);
    const toggleBtn = document.getElementById(toggleBtnId);
    if (passInput && toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (passInput.type === 'password') {
          passInput.type = 'text';
          toggleBtn.innerText = 'Hide';
        } else {
          passInput.type = 'password';
          toggleBtn.innerText = 'Show';
        }
      });
    }
  }
  setupPasswordToggle('regPass', 'toggleRegPass');
  setupPasswordToggle('loginPass', 'toggleLoginPass');

  // Username validation indicator
  const regUserField = document.getElementById('regUser');
  const usernameIndicator = document.getElementById('regUserIndicator');
  if (regUserField && usernameIndicator) {
    regUserField.addEventListener('input', async () => {
      const val = regUserField.value.trim().toLowerCase();
      regUserField.value = val;

      const regex = /^(?=.*[0-9])(?=.*[a-z])[a-z0-9]{6,}$/;
      if (!regex.test(val)) {
        usernameIndicator.innerText = '❌ Min 6 chars, letters & numbers';
        usernameIndicator.style.color = '#ff4d4d';
        return;
      }

      try {
        if (window.pixvinzDb) {
          const { db, doc, getDoc } = window.pixvinzDb;
          const userDocRef = doc(db, 'players', val);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            usernameIndicator.innerText = '❌ Taken';
            usernameIndicator.style.color = '#ff4d4d';
          } else {
            usernameIndicator.innerText = '✔ Available';
            usernameIndicator.style.color = '#2ecc71';
          }
        }
      } catch (err) {
        usernameIndicator.innerText = '✔ Available';
        usernameIndicator.style.color = '#2ecc71';
      }
    });
  }

  // Register Form
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

      const userRegex = /^(?=.*[0-9])(?=.*[a-z])[a-z0-9]{6,}$/;
      if (!userRegex.test(username)) {
        if (errElem) errElem.innerText = "Username must be at least 6 characters with lowercase letters and numbers!";
        return;
      }

      const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/;
      if (!passRegex.test(pass)) {
        if (errElem) errElem.innerText = "Password must be 6-12 chars with uppercase, lowercase, and number!";
        return;
      }

      if (pass !== passConfirm) {
        if (errElem) errElem.innerText = "Passwords do not match!";
        return;
      }

      try {
        const { db, doc, getDoc, setDoc } = window.pixvinzDb;
        const userDocRef = doc(db, 'players', username);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          if (errElem) errElem.innerText = "Username is already taken!";
          return;
        }

        const dummyEmail = `${username}@pixvinz.com`;
        const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, pass);
        const authUid = userCredential.user.uid;

        const newUserData = {
          username: username,
          displayName: displayName,
          level: 1,
          xp: 0,
          coins: 0,
          avatar: '',
          password: pass,
          authUid: authUid,
          createdAt: new Date()
        };

        await setDoc(userDocRef, newUserData);
        localStorage.setItem('loggedInUser', JSON.stringify(newUserData));

        const nameElem = document.getElementById('userDisplayName');
        if (nameElem) nameElem.innerText = displayName;

        if (errElem) errElem.innerText = "";
        showView('homeView');
        playMainBGM();
      } catch (err) {
        if (errElem) errElem.innerText = "Registration error: " + err.message;
      }
    });
  }

  // Login Form
  const logForm = document.getElementById('loginForm');
  if (logForm) {
    logForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();

      const username = document.getElementById('loginUser').value.trim().toLowerCase();
      const pass = document.getElementById('loginPass').value;
      const errElem = document.getElementById('loginError');

      try {
        let userData = null;
        if (window.pixvinzDb) {
          const { db, doc, getDoc } = window.pixvinzDb;
          const userDocRef = doc(db, 'players', username);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            userData = snap.data();
          }
        }

        if (userData && userData.password === pass) {
          localStorage.setItem('loggedInUser', JSON.stringify(userData));
          await fetchCloudProfileData();
          const freshUser = getCurrentUser();

          const nameElem = document.getElementById('userDisplayName');
          if (nameElem) nameElem.innerText = freshUser?.displayName || userData.displayName;

          if (errElem) errElem.innerText = "";
          showView('homeView');
          playMainBGM();
        } else {
          if (errElem) errElem.innerText = "Invalid username or password!";
        }
      } catch (err) {
        if (errElem) errElem.innerText = "Login error occurred.";
      }
    });
  }

  // Menu Navigation bindings
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      const cloudData = await fetchCloudProfileData();
      const currentLevel = cloudData?.level ?? parseInt(localStorage.getItem(getUserKey('currentLevel'))) ?? 1;
      window.location.href = `game.html?level=${currentLevel}`;
    });
  }

  const navLevels = document.getElementById('navLevels');
  if (navLevels) {
    navLevels.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      await fetchCloudProfileData();
      renderLevels();
      showView('levelsView');
    });
  }

  const navCollections = document.getElementById('navCollections');
  if (navCollections) {
    navCollections.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      await fetchCloudProfileData();
      renderCollectionFolders();
      showView('collectionsView');
    });
  }

  const navLeaderboard = document.getElementById('navLeaderboard');
  if (navLeaderboard) {
    navLeaderboard.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      showView('leaderboardView');
      await loadLeaderboardData();
    });
  }

  const navChallenge = document.getElementById('navChallenge');
  if (navChallenge) {
    navChallenge.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      showView('challengeView');
    });
  }

  const navSettings = document.getElementById('navSettings');
  if (navSettings) {
    navSettings.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      const settingsModal = document.getElementById('settingsModal');
      if (settingsModal) settingsModal.classList.remove('hidden');
    });
  }

  // Back buttons across views
  document.querySelectorAll('.back-btn').forEach(btn => {
    if (btn.id === 'collectionsBackBtn') return;
    btn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      showView('homeView');
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
        showView('homeView');
      }
    });
  }

  // Settings modals & audio
  const closeSettingsModal = document.getElementById('closeSettingsModal');
  if (closeSettingsModal) {
    closeSettingsModal.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      document.getElementById('settingsModal')?.classList.add('hidden');
    });
  }

  const sfxToggle = document.getElementById('sfxToggle');
  const musicToggle = document.getElementById('musicToggle');
  if (typeof AudioManager !== 'undefined') {
    if (sfxToggle) sfxToggle.checked = AudioManager.sfxEnabled;
    if (musicToggle) musicToggle.checked = AudioManager.musicEnabled;
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
      document.getElementById('aboutModal')?.classList.remove('hidden');
    });
  }

  const closeAboutModal = document.getElementById('closeAboutModal');
  if (closeAboutModal) {
    closeAboutModal.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      document.getElementById('aboutModal')?.classList.add('hidden');
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem('loggedInUser');
        document.getElementById('settingsModal')?.classList.add('hidden');
        if (typeof AudioManager !== 'undefined') AudioManager.stopBGM();
        showView('loginView');
      }
    });
  }

  // Render Levels Grid
  function renderLevels() {
    const grid = document.getElementById('levelsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const user = getCurrentUser();
    const currentLevel = user?.level ?? parseInt(localStorage.getItem(getUserKey('currentLevel'))) ?? 1;
    let overallBestTimeSeconds = Infinity;
    let overallFewestMoves = Infinity;

    for (let i = 1; i <= 200; i++) {
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
          const gSize = i <= 10 ? 3 : i <= 30 ? 4 : i <= 60 ? 5 : i <= 100 ? 6 : i <= 150 ? 7 : 8;
          if (!moves) moves = gSize * 6;
          if (!timeStr || timeStr === '--:--') {
            const estSec = gSize * 15;
            const m = Math.floor(estSec / 60).toString().padStart(2, '0');
            const s = (estSec % 60).toString().padStart(2, '0');
            timeStr = `${m}:${s}`;
          }
        }

        if (moves) {
          const parsedMoves = parseInt(moves);
          if (parsedMoves < overallFewestMoves) overallFewestMoves = parsedMoves;
        }
        if (timeStr && timeStr !== '--:--') {
          const parts = timeStr.split(':');
          if (parts.length === 2) {
            const totalSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
            if (totalSec < overallBestTimeSeconds) overallBestTimeSeconds = totalSec;
          }
        }

        let starsHTML = '';
        for (let s = 1; s <= 3; s++) {
          starsHTML += `<span class="star-icon-small ${s <= starsEarned ? 'earned' : ''}">★</span>`;
        }

        btn.innerHTML = `
          <div class="level-num">${i.toString().padStart(2, '0')}</div>
          <div class="stars">${starsHTML}</div>
          <div class="level-card-pill">
            <div class="pill-stat">⏱️ ${timeStr || '--:--'}</div>
            <div class="pill-stat">🔀 ${moves || '--'} <span class="unit">MOVES</span></div>
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

  // Render Collection Folders
  function renderCollectionFolders() {
    const folderGrid = document.getElementById('collectionsFolderGrid');
    if (!folderGrid) return;
    folderGrid.innerHTML = '';

    const totalLevels = 200;
    const levelsPerFolder = 10;
    const totalFolders = Math.ceil(totalLevels / levelsPerFolder);

    for (let i = 0; i < totalFolders; i++) {
      const start = i * levelsPerFolder + 1;
      const end = Math.min((i + 1) * levelsPerFolder, totalLevels);

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

    document.getElementById('collectionsFolderContainer')?.classList.remove('hidden');
    document.getElementById('collectionsImagesContainer')?.classList.add('hidden');
    const titleElem = document.getElementById('collectionsTitle');
    if (titleElem) titleElem.innerText = 'COLLECTIONS';
  }

  function openCollectionFolder(start, end) {
    document.getElementById('collectionsFolderContainer')?.classList.add('hidden');
    document.getElementById('collectionsImagesContainer')?.classList.remove('hidden');
    const titleElem = document.getElementById('collectionsTitle');
    if (titleElem) titleElem.innerText = `LVL ${start}-${end}`;

    renderFilteredCollections(start, end);
  }

  function renderFilteredCollections(start, end) {
    const grid = document.getElementById('collectionsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const user = getCurrentUser();
    const currentLevel = user?.level ?? parseInt(localStorage.getItem(getUserKey('currentLevel'))) ?? 1;

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
    document.getElementById('imageModal')?.classList.add('hidden');
  }

  document.getElementById('closeImageModal')?.addEventListener('click', closeImageModal);
  document.getElementById('imageModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'imageModal' || e.target.id === 'modalPreviewImg') {
      closeImageModal();
    }
  });
});

// --- DYNAMIC PROFILE STATS & CLOUD SYNC ---
async function updateProfileStats() {
  await fetchCloudProfileData();

  let currentLevel = 1;
  let totalCoins = 0;
  let currentXp = 0;
  let displayName = 'Ulala';

  try {
    const loggedUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedUser) {
      if (loggedUser.level !== undefined) currentLevel = parseInt(loggedUser.level);
      if (loggedUser.coins !== undefined) totalCoins = parseInt(loggedUser.coins);
      if (loggedUser.xp !== undefined) currentXp = parseInt(loggedUser.xp);
      if (loggedUser.displayName) displayName = loggedUser.displayName;
    }
  } catch (e) {}

  if (currentXp === 0 && currentLevel > 1) {
    currentXp = (currentLevel - 1) * 500;
  }

  const coinHeaderElem = document.getElementById('coinCount');
  if (coinHeaderElem) coinHeaderElem.innerText = totalCoins;

  const profileCoinsElem = document.getElementById('profileCoins');
  if (profileCoinsElem) profileCoinsElem.innerText = totalCoins;

  const profileLevelElem = document.getElementById('profileLevel');
  if (profileLevelElem) profileLevelElem.innerText = currentLevel;

  const displayPlayerName = document.getElementById('displayPlayerName');
  if (displayPlayerName) displayPlayerName.innerText = displayName;

  const xpLevelNum = document.querySelector('#displayLevelBadge .xp-level-num');
  if (xpLevelNum) xpLevelNum.innerText = currentLevel;

  const xpTarget = currentLevel * 500;
  const displayXpText = document.getElementById('displayXpText');
  if (displayXpText) displayXpText.innerText = `${currentXp} / ${xpTarget} XP`;

  const xpBarFill = document.getElementById('displayXpBarFill');
  if (xpBarFill) {
    const percentage = Math.min(100, ((currentXp % 500) / 500) * 100);
    xpBarFill.style.width = `${percentage}%`;
  }

  renderProfileBadges(currentLevel, totalCoins);
}

// --- LEADERBOARD DATA LOADER ---
async function loadLeaderboardData() {
  const listContainer = document.getElementById('leaderboardList');
  if (!listContainer) return;
  
  listContainer.innerHTML = '<div class="loading-text" style="text-align:center; padding: 20px; color: #aaa;">Loading leaderboard...</div>';

  let players = [];
  let currentUsername = '';
  try {
    const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
    if (userObj && userObj.username) currentUsername = userObj.username;
  } catch (e) {}

  try {
    if (window.pixvinzDb) {
      const { db, collection, query, orderBy, limit, getDocs } = window.pixvinzDb;
      const q = query(collection(db, 'players'), orderBy('xp', 'desc'), limit(100));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        players.push({
          username: docSnap.id,
          name: data.displayName || data.username || 'Anonymous',
          coins: data.coins || 0,
          xp: data.xp || 0,
          level: data.level || 1,
          avatar: data.avatar || ''
        });
      });
    }
  } catch (err) {
    console.warn("Could not fetch live leaderboard:", err);
  }

  listContainer.innerHTML = '';

  let userRank = '--';
  if (currentUsername) {
    const foundIndex = players.findIndex(p => p.username.toLowerCase() === currentUsername.toLowerCase());
    if (foundIndex !== -1) {
      userRank = `#${foundIndex + 1}`;
    }
  }

  const rankDisplay = document.getElementById('userRankDisplay');
  if (rankDisplay) rankDisplay.textContent = userRank;

  const profileRankDisplay = document.getElementById('profileGlobalRank');
  if (profileRankDisplay) profileRankDisplay.textContent = userRank;

  if (players.length === 0) {
    listContainer.innerHTML = '<div style="text-align:center; padding: 20px; color: #aaa;">No players found on the leaderboard yet.</div>';
    return;
  }

  players.forEach((player, index) => {
    const item = document.createElement('div');
    item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; background: rgba(42, 17, 71, 0.6); padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(156, 39, 176, 0.3);';
    item.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-weight: bold; color: #ffd700; width: 24px;">#${index + 1}</span>
        <span style="color: #fff; font-weight: 600;">${player.name}</span>
      </div>
      <div style="display: flex; gap: 15px; color: #b388ff; font-size: 0.9rem;">
        <span>LVL ${player.level}</span>
        <span>🪙 ${player.coins}</span>
      </div>
    `;
    listContainer.appendChild(item);
  });
}

// --- PROFILE BADGES RENDERING ---
function renderProfileBadges(playerLevel, playerCoins) {
    const allBadges = [
        { title: 'Novice Genesis', desc: 'Completed Level 1', icon: 'image/badge1.png', unlocked: playerLevel >= 1 },
        { title: 'Thunderbolt', desc: 'Speed run < 1m', icon: 'image/badge2.png', unlocked: false },
        { title: 'Aurelian Vault', desc: 'Reached 500 coins', icon: 'image/badge3.png', unlocked: playerCoins >= 500 },
        { title: 'Celestial Elite', desc: 'Reached Level 50', icon: 'image/badge4.png', unlocked: playerLevel >= 50 },
        { title: 'Grand Sovereign', desc: 'Reached Level 75', icon: 'image/badge5.png', unlocked: playerLevel >= 75 },
        { title: 'Imperial Crown', desc: 'Reached Level 100', icon: 'image/badge6.png', unlocked: playerLevel >= 100 },
        { title: 'Infernal Apex', desc: 'Reached Level 150', icon: 'image/badge7.png', unlocked: playerLevel >= 150 },
        { title: 'Mythical Deity', desc: 'Reached Level 200', icon: 'image/badge8.png', unlocked: playerLevel >= 200 }
    ];

    const badgesContainer = document.getElementById('badgesGrid');
    if (!badgesContainer) return;

    badgesContainer.innerHTML = '';
    allBadges.forEach(badge => {
        const isUnlocked = badge.unlocked;
        const badgeElement = document.createElement('div');
        badgeElement.className = 'badge-item';
        badgeElement.style.cssText = 'display: flex; flex-direction: column; align-items: center; text-align: center; padding: 4px;';
        badgeElement.innerHTML = `
            <div style="width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px; filter: ${isUnlocked ? 'drop-shadow(0 0 6px rgba(255, 215, 0, 0.5))' : 'none'};">
                <img src="${badge.icon}" alt="${badge.title}" style="width: 100%; height: 100%; object-fit: contain; ${isUnlocked ? '' : 'filter: grayscale(100%); opacity: 0.35;'}">
            </div>
            <span style="font-weight: 700; font-size: 9px; color: ${isUnlocked ? '#fff' : '#777'};">${badge.title}</span>
            <span style="font-size: 7px; color: ${isUnlocked ? '#bbb' : '#444'};">${badge.desc}</span>
        `;
        badgesContainer.appendChild(badgeElement);
    });
}
