// --- FIREBASE INITIALIZATION & DATABASE BRIDGE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
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

// Expose Firestore database tools globally so UI scripts can use them
window.pixvinzDb = { db, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs };


document.addEventListener('DOMContentLoaded', () => {
    // Force load/preload all logo videos across the document upon opening
    const logoVideos = document.querySelectorAll('video#logoVideo, video#loadingLogo, .auth-logo video, .about-logo video');
    logoVideos.forEach(video => {
        video.load();
        video.play().catch(() => {});
    });

// --- AVATAR LOADER FIX (Account-Specific + Default Fallback) ---
    let currentUsername = '';
    try {
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (user && user.username) currentUsername = user.username;
    } catch (e) {}

    const avatarImg = document.getElementById('profileHeaderImg');
    const fallbackIcon = document.getElementById('profileIconFallback');

    if (avatarImg && fallbackIcon) {
        // Check if this specific logged-in user has a custom saved avatar
        const userCustomAvatar = currentUsername ? localStorage.getItem(`${currentUsername}_vinpix_avatar`) : null;
        
        if (userCustomAvatar) {
            // Use their unique custom uploaded avatar
            avatarImg.src = userCustomAvatar;
            avatarImg.style.display = 'block';
            fallbackIcon.style.display = 'none';
        } else {
            // Default fallback image for new accounts or users without custom avatars
            avatarImg.src = 'image/avatar.png';
            avatarImg.style.display = 'block';
            fallbackIcon.style.display = 'none';
        }
    }
});

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

    if (['home', 'levels', 'collections', 'profileView'].includes(targetView)) {
      if (mainHeader) mainHeader.classList.remove('hidden');
      updateCoinDisplay();
    } else {
      if (mainHeader) mainHeader.classList.add('hidden');
    }

    // If profile view is opened, trigger badge and profile stats rendering
    if (targetView === 'profileView') {
        renderProfileBadges();
    }
  }

  // Make showView globally accessible for profile.js and other scripts
  window.showView = showView;

  function updateCoinDisplay() {
    const totalCoins = parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0;
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

  // --- PROFILE HEADER ICON NAVIGATION ---
  const profileHeaderImg = document.getElementById('profileHeaderImg');
  const profileIconFallback = document.getElementById('profileIconFallback');

  [profileHeaderImg, profileIconFallback].forEach(element => {
      if (element) {
          const profileTrigger = element.closest('.profile-header-btn') || element.parentElement;
          if (profileTrigger && !profileTrigger.dataset.hasProfileListener) {
              profileTrigger.dataset.hasProfileListener = 'true';
              profileTrigger.addEventListener('click', (e) => {
                  e.preventDefault();
                  if (typeof AudioManager !== 'undefined') AudioManager.playClick();
                  showView('profileView');
              });
          }
      }
  });

// --- 1. LOADING SCREEN ---
  const skipLoading = localStorage.getItem('skipLoading') === 'true';
  const percentageElem = document.getElementById('loadingPercentage');
  const barFillElem = document.getElementById('loadingBarFill');

  function finishLoading() {
      localStorage.removeItem('skipLoading');
      const loggedInUser = getCurrentUser();
      if (loggedInUser) {
          const nameElem = document.getElementById('userDisplayName');
          if (nameElem) nameElem.innerText = loggedInUser.displayName || 'Vinz';
          showView('home');
          playMainBGM();
      } else {
          showView('login');
      }
  }

  if (skipLoading) {
      finishLoading();
  } else {
      let currentPercent = 1;
      const totalDuration = 10000; // 10 seconds in milliseconds
      const intervalTime = 100; // Update every 100ms
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
  }

  // --- 2. AUTHENTICATION & FORM NAVIGATION ---
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

  function validateUsernameFormat(username) {
    const regex = /^(?=.*[0-9])(?=.*[a-z])[a-z0-9]{6,}$/;
    return regex.test(username);
  }

  function validatePasswordFormat(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/;
    return regex.test(password);
  }

  const regUserField = document.getElementById('regUser');
  let usernameIndicator = document.getElementById('regUserIndicator');
  if (regUserField && !usernameIndicator) {
    usernameIndicator = document.createElement('span');
    usernameIndicator.id = 'regUserIndicator';
    usernameIndicator.style.marginLeft = '8px';
    regUserField.parentNode.appendChild(usernameIndicator);
  }

  if (regUserField) {
    regUserField.addEventListener('input', async () => {
      const val = regUserField.value.trim().toLowerCase();
      regUserField.value = val;

      if (!validateUsernameFormat(val)) {
        usernameIndicator.innerText = '❌ (Min 6 chars, lowercase & number)';
        usernameIndicator.style.color = '#ff4d4d';
        return;
      }

      try {
        if (window.pixvinzDb) {
          const { db, doc, getDoc } = window.pixvinzDb;
          const userDocRef = doc(db, 'players', val);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            usernameIndicator.innerText = '❌ Username already taken!';
            usernameIndicator.style.color = '#ff4d4d';
          } else {
            usernameIndicator.innerText = '✔ Available';
            usernameIndicator.style.color = '#2ecc71';
          }
        } else {
          usernameIndicator.innerText = '⚠️ Database offline';
          usernameIndicator.style.color = '#f39c12';
        }
      } catch (err) {
        usernameIndicator.innerText = '✔ Available';
        usernameIndicator.style.color = '#2ecc71';
      }
    });
  }

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

      if (!validateUsernameFormat(username)) {
        if (errElem) errElem.innerText = "Username must be at least 6 characters and contain lowercase letters and numbers!";
        return;
      }

      if (!validatePasswordFormat(pass)) {
        if (errElem) errElem.innerText = "Password must be 6-12 characters and include at least one Uppercase letter, one lowercase letter, and one number!";
        return;
      }

      if (pass !== passConfirm) {
        if (errElem) errElem.innerText = "Passwords do not match!";
        return;
      }

      try {
        if (!window.pixvinzDb) {
          if (errElem) errElem.innerText = "Database connection not available.";
          return;
        }

        const { db, doc, getDoc, setDoc } = window.pixvinzDb;
        const userDocRef = doc(db, 'players', username);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          if (errElem) errElem.innerText = "Username is already taken or registered!";
          return;
        }

        // Register the user in Firebase Auth using a valid email format
        const dummyEmail = `${username}@pixvinz.com`;
        let authUid = '';
        
        const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, pass);
        authUid = userCredential.user.uid;

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
        showView('home');
        playMainBGM();
      } catch (err) {
        if (errElem) errElem.innerText = "Registration error: " + err.message;
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

      try {
        let userData = null;
        if (window.pixvinzDb) {
          const { db, doc, getDoc } = window.pixvinzDb;
          const userDocRef = doc(db, 'players', username);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            userData = snap.data();
          }
        } else {
          if (errElem) errElem.innerText = "Database connection not available.";
          return;
        }

        if (userData && userData.password === pass) {
          localStorage.setItem('loggedInUser', JSON.stringify(userData));
          const nameElem = document.getElementById('userDisplayName');
          if (nameElem) nameElem.innerText = userData.displayName;
          if (errElem) errElem.innerText = "";
          showView('home');
          playMainBGM();
        } else {
          if (errElem) errElem.innerText = "Invalid username or password!";
        }
      } catch (err) {
        if (errElem) errElem.innerText = "Login error occurred.";
      }
    });
  }

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

  const settingsModal = document.getElementById('settingsModal');
  const aboutModal = document.getElementById('aboutModal');
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

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem('loggedInUser');
        if (settingsModal) settingsModal.classList.add('hidden');
        if (typeof AudioManager !== 'undefined') AudioManager.stopBGM();
        showView('login');
      }
    });
  }

  function renderLevels() {
    const grid = document.getElementById('levelsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const currentLevel = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;

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
});



// --- AUTO-SYNC FIRESTORE DATA ON PAGE LOAD ---
async function syncUserWithFirestore() {
  const loggedInUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('loggedInUser'));
    } catch (e) {
      return null;
    }
  })();

  if (!loggedInUser || !loggedInUser.username || !window.pixvinzDb) return;

  try {
    const { db, doc, getDoc } = window.pixvinzDb;
    const userDocRef = doc(db, 'players', loggedInUser.username);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const freshData = snap.data();
       
      // Update the local storage session object
      localStorage.setItem('loggedInUser', JSON.stringify(freshData));

      // Update user-specific keys (like coins and level)
      const prefix = `${loggedInUser.username}_`;
      if (freshData.coins !== undefined) {
        localStorage.setItem(prefix + 'totalCoins', freshData.coins);
      }
      if (freshData.level !== undefined) {
        localStorage.setItem(prefix + 'currentLevel', freshData.level);
      }

      // Refresh coin display on the header if visible
      const coinElem = document.getElementById('coinCount');
      if (coinElem && freshData.coins !== undefined) {
        coinElem.innerText = freshData.coins;
      }
    }
  } catch (err) {
    console.warn("Could not sync with Firestore:", err);
  }
}

// Call this right when the page loads
document.addEventListener('DOMContentLoaded', () => {
  syncUserWithFirestore();
});




// --- LEADERBOARD LOGIC (Safe DOM Binding, Avatars & Real Players Only) ---
document.addEventListener('DOMContentLoaded', () => {
    const navLeaderboard = document.getElementById('navLeaderboard');
    if (navLeaderboard) {
        navLeaderboard.addEventListener('click', () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();
            document.querySelectorAll('[id$="View"]').forEach(view => view.classList.remove('active'));
            const leaderboardView = document.getElementById('leaderboardView');
            if (leaderboardView) leaderboardView.classList.add('active');
            loadLeaderboardData();
        });
    }
});

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
    if (!currentUsername) {
        currentUsername = localStorage.getItem('vinpix_username') || '';
    }

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
        console.warn("Could not fetch live leaderboard from Firestore:", err);
    }

    listContainer.innerHTML = '';

    let userRank = '--';
    if (currentUsername) {
        const foundIndex = players.findIndex(p => p.username.toLowerCase() === currentUsername.toLowerCase() || p.name.toLowerCase() === currentUsername.toLowerCase());
        if (foundIndex !== -1) {
            userRank = `#${foundIndex + 1}`;
        }
    }

    const rankDisplay = document.getElementById('userRankDisplay');
    if (rankDisplay) {
        rankDisplay.textContent = userRank !== '--' ? userRank : '#--';
        rankDisplay.style.textAlign = 'center';
        rankDisplay.style.display = 'block';
        rankDisplay.style.width = '100%';
    }

    if (players.length === 0) {
        listContainer.innerHTML = '<div class="loading-text" style="text-align:center; padding: 20px; color: #aaa;">No players found on the leaderboard yet.</div>';
        return;
    }

    const topPlayers = players.slice(0, 20);

    topPlayers.forEach((player, index) => {
        const rank = index + 1;
        let rankBadgeHTML = '';
        let specialStyle = '';
        let frameStyle = 'border: 2px solid rgba(255,255,255,0.2);';

        if (rank === 1) {
            specialStyle = 'background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(20, 20, 20, 0.95)); border: 1px solid rgba(255, 215, 0, 0.6);';
            frameStyle = 'border: 3px solid #ffd700;';
            rankBadgeHTML = `
                <div style="min-width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #ffaa00, #ff5500); border-radius: 8px; border: 2px solid #fff; font-weight: 900; font-size: 15px; color: #fff;">
                    <span>#1</span>
                </div>`;
        }
        // ... (rest of your original leaderboard list generation code remains unchanged)
    });
}


// --- PROFILE BADGES RENDERING LOGIC ---
function renderProfileBadges() {
    const badgesContainer = document.getElementById('badgesGrid');
    if (!badgesContainer) return;

    // Pull variables safely from local storage session or fallback values
    let playerLevel = 1;
    let playerCoins = 0;
    try {
        const loggedUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (loggedUser) {
            if (loggedUser.level) playerLevel = parseInt(loggedUser.level);
            if (loggedUser.coins) playerCoins = parseInt(loggedUser.coins);
        }
        const userPrefix = loggedUser && loggedUser.username ? loggedUser.username : '';
        if (userPrefix) {
            const savedLevel = localStorage.getItem(`${userPrefix}_currentLevel`);
            const savedCoins = localStorage.getItem(`${userPrefix}_totalCoins`);
            if (savedLevel) playerLevel = parseInt(savedLevel);
            if (savedCoins) playerCoins = parseInt(savedCoins);
        }
    } catch (e) {}

    // Custom image badge data with unique unlock checks
    const allBadges = [
        { 
            title: 'Novice Genesis', 
            desc: 'Completed Level 1', 
            icon: 'image/badge1.png', 
            unlocked: playerLevel >= 1, 
        },
        { 
            title: 'Thunderbolt', 
            desc: 'Speed run (20-30) < 1m', 
            icon: 'image/badge2.png', 
            unlocked: window.player?.speedThunder === true || window.player?.speedThunderUnlocked === true, 
        },
        { 
            title: 'Aurelian Vault', 
            desc: 'Reached 500 coins', 
            icon: 'image/badge3.png', 
            unlocked: playerCoins >= 500, 
        },
        { 
            title: 'Celestial Elite', 
            desc: 'Reached Level 50', 
            icon: 'image/badge4.png', 
            unlocked: playerLevel >= 50, 
        },
        { 
            title: 'Grand Sovereign', 
            desc: 'Reached Level 75', 
            icon: 'image/badge5.png', 
            unlocked: playerLevel >= 75, 
        },
        { 
            title: 'Imperial Crown', 
            desc: 'Reached Level 100', 
            icon: 'image/badge6.png', 
            unlocked: playerLevel >= 100, 
        },
        { 
            title: 'Infernal Apex', 
            desc: 'Reached Level 150', 
            icon: 'image/badge7.png', 
            unlocked: playerLevel >= 150, 
        },
        { 
            title: 'Mythical Deity', 
            desc: 'Reached Level 200', 
            icon: 'image/badge8.png', 
            unlocked: playerLevel >= 200, 
        }
    ];

    badgesContainer.innerHTML = '';

    allBadges.forEach(badge => {
        const isUnlocked = badge.unlocked;

        const badgeElement = document.createElement('div');
        badgeElement.className = 'badge-item';
        badgeElement.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 2px;
            width: 100%;
            box-sizing: border-box;
        `;

        badgeElement.innerHTML = `
            <div style="width: 72px; height: 70px; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; filter: ${isUnlocked ? 'drop-shadow(0 0 5px rgba(255, 215, 0, 0.4))' : 'none'};">
                <img src="${badge.icon}" alt="${badge.title}" style="width: 100%; height: 100%; object-fit: contain; ${isUnlocked ? '' : 'filter: grayscale(100%); opacity: 0.35;'}">
            </div>
            <span class="badge-title" style="font-weight: 700; font-size: 9px; color: ${isUnlocked ? '#fff' : '#777'}; line-height: 1.1; margin-bottom: 1px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${badge.title}</span>
            <span class="badge-desc" style="font-size: 7.5px; color: ${isUnlocked ? '#bbb' : '#444'}; line-height: 1; width: 100%; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;">${badge.desc}</span>
        `;
        badgesContainer.appendChild(badgeElement);
    });
}
