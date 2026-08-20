// --- FIREBASE INITIALIZATION & DATABASE BRIDGE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-analytics.js";
import { getFirestore, doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
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
window.pixvinzDb = { db, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs };


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
      if (typeof updateCoinDisplay === 'function') updateCoinDisplay();
    } else {
      if (mainHeader) mainHeader.classList.add('hidden');
    }
  }

  // Make showView globally accessible for profile.js and other scripts
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

// --- 1. BULLETPROOF 1% STUCK FIX ---
try {
    const skipLoading = localStorage.getItem('skipLoading') === 'true';
    const percentageElem = document.getElementById('loadingPercentage');
    const barFillElem = document.getElementById('loadingBarFill');

    function finishLoadingSafe() {
        localStorage.removeItem('skipLoading');
        let loggedInUser = null;
        try {
            loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
        } catch (e) {}

        if (loggedInUser) {
            const nameElem = document.getElementById('userDisplayName');
            if (nameElem) nameElem.innerText = loggedInUser.displayName || 'Vinz';
            if (typeof showView === 'function') showView('home');
            if (typeof playMainBGM === 'function') playMainBGM();
        } else {
            if (typeof showView === 'function') showView('login');
        }
    }

    if (skipLoading) {
        finishLoadingSafe();
    } else {
        const assets = [];
        for (let i = 1; i <= 55; i++) {
            assets.push(`image/level${i}.jpeg`);
        }

        let loadedCount = 0;
        const totalAssets = assets.length;

        // Immediate force-finish fallback after 2 seconds no matter what
        const emergencyTimer = setTimeout(() => {
            if (percentageElem) percentageElem.innerText = '100%';
            if (barFillElem) barFillElem.style.width = '100%';
            finishLoadingSafe();
        }, 2000);

        if (totalAssets === 0) {
            clearTimeout(emergencyTimer);
            finishLoadingSafe();
        } else {
            if (percentageElem) percentageElem.innerText = '1%';
            if (barFillElem) barFillElem.style.width = '1%';

            assets.forEach(src => {
                const img = new Image();
                const markProcessed = () => {
                    loadedCount++;
                    let percent = Math.floor((loadedCount / totalAssets) * 100);
                    if (percent < 1) percent = 1;

                    if (percentageElem) percentageElem.innerText = `${percent}%`;
                    if (barFillElem) barFillElem.style.width = `${percent}%`;

                    if (loadedCount >= totalAssets) {
                        clearTimeout(emergencyTimer);
                        setTimeout(finishLoadingSafe, 150);
                    }
                };
                img.onload = markProcessed;
                img.onerror = markProcessed;
                img.src = src;
            });
        }
    }
} catch (err) {
    console.error("Preloader critical error:", err);
    // Absolute last resort: force home/login view if script crashes
    document.getElementById('loadingView')?.classList.remove('active');
    document.getElementById('loginView')?.classList.add('active');
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

        const dummyEmail = `${username}@pixvinz.com`;
        let authUid = '';
        
        const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, pass);
        authUid = userCredential.user.uid;

        const newUserData = {
          username: username,
          displayName: displayName,
          xp: 0,
          coins: 0,
          avatar: '',
          level: 1,
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
          
          // Trigger cloud fetch to sync into playerstat.js cache
          if (typeof fetchUserDataFromFirestore === 'function') {
              fetchUserDataFromFirestore();
          }
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
      const currentLevel = (typeof getCurrentLevel === 'function') ? getCurrentLevel() : 1;
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

    const currentLevel = (typeof getCurrentLevel === 'function') ? getCurrentLevel() : 1;

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

        const starsEarned = (typeof getLevelStars === 'function') ? getLevelStars(i, isSolved) : (isSolved ? 3 : 0);

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
    const currentLevel = (typeof getCurrentLevel === 'function') ? getCurrentLevel() : 1;

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


// --- AUTO-SYNC CLOUD DATA ON PAGE LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    if (typeof fetchUserDataFromFirestore === 'function') {
        fetchUserDataFromFirestore();
    }
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
                    <div style="width: 26px; height: 6px; background: #cc3300; clip-path: polygon(0 0, 100% 0, 80% 100%, 20% 100%); margin-top: 2px;"></div>
                </div>
            `;
        } else if (rank === 2) {
            specialStyle = 'background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(20, 20, 20, 0.95)); border: 1px solid rgba(192, 192, 192, 0.6);';
            frameStyle = 'border: 3px solid #00e5ff;';
            rankBadgeHTML = `
                <div style="min-width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #00d2ff, #3a7bd5); border-radius: 8px; border: 2px solid #fff; font-weight: 900; font-size: 15px; color: #fff;">
                    <span>#2</span>
                    <div style="width: 26px; height: 6px; background: #0055aa; clip-path: polygon(0 0, 100% 0, 80% 100%, 20% 100%); margin-top: 2px;"></div>
                </div>
            `;
        } else if (rank === 3) {
            specialStyle = 'background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(20, 20, 20, 0.95)); border: 1px solid rgba(205, 127, 50, 0.6);';
            frameStyle = 'border: 3px solid #ff9933;';
            rankBadgeHTML = `
                <div style="min-width: 48px; height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #cd7f32, #8b4513); border-radius: 8px; border: 2px solid #fff; font-weight: 900; font-size: 15px; color: #fff;">
                    <span>#3</span>
                    <div style="width: 26px; height: 6px; background: #5c2c16; clip-path: polygon(0 0, 100% 0, 80% 100%, 20% 100%); margin-top: 2px;"></div>
                </div>
            `;
        } else {
            rankBadgeHTML = `<span style="min-width: 48px; text-align: center; font-weight: bold; font-size: 16px; color: #aaa;">#${rank}</span>`;
        }

        const avatarSrc = player.avatar ? player.avatar : 'image/avatar.png';

        const row = document.createElement('div');
        row.className = `rank-row`;
        
        row.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 18px;
            margin-bottom: 10px;
            margin-left: 10px;
            margin-right: 10px;
            border-radius: 14px;
            background: rgba(30, 30, 30, 0.7);
            ${specialStyle}
        `;

        row.innerHTML = `
            <div style="display: flex; align-items: center; min-width: 0; flex: 1; overflow: hidden;">
                ${rankBadgeHTML}
                <img src="${avatarSrc}" alt="${player.name}" class="leaderboard-avatar-img" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; margin: 0 14px; flex-shrink: 0; cursor: pointer; ${frameStyle}">
                <div style="display: flex; flex-direction: column; min-width: 0; overflow: hidden;">
                    <span style="font-weight: 600; font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;">${player.name}</span>
                    <div style="font-size: 12px; font-weight: bold; background: linear-gradient(90deg, #ffd700, #ffaa00); -webkit-background-clip: text; -webkit-text-fill-color: transparent; border-bottom: 1px solid #ffd700; display: inline-block; padding-bottom: 1px; margin-top: 3px; width: fit-content;">LEVEL ${player.level}</div>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; margin-left: 15px; flex-shrink: 0; gap: 4px;">
                <div style="display: flex; align-items: center; font-size: 15px; font-weight: bold; color: #ffd700; text-shadow: 0 0 5px rgba(255,215,0,0.4);">
                    <span style="width: 24px; text-align: center; display: inline-block;">🪙</span>
                    <span style="text-align: right; min-width: 70px;">${player.coins.toLocaleString()}</span>
                </div>
                <div style="display: flex; align-items: center; font-size: 14px; font-weight: bold;">
                    <span style="width: 24px; text-align: center; display: inline-block;">⚡️</span>
                    <span style="color: #ff75a0; text-shadow: 0 0 6px rgba(255,117,160,0.6); text-align: right; min-width: 45px;">${player.xp.toLocaleString()}</span>
                    <span style="color: #00e5ff; text-shadow: 0 0 5px rgba(0,229,255,0.6); margin-left: 4px;">XP</span>
                </div>
            </div>
        `;

        // Attach click listener to the avatar image
        const avatarImg = row.querySelector('.leaderboard-avatar-img');
        if (avatarImg) {
            avatarImg.addEventListener('click', () => {
                if (typeof AudioManager !== 'undefined' && typeof AudioManager.playClick === 'function') {
                    AudioManager.playClick();
                }
                openPlayerProfile(player, rank);
            });
        }

        listContainer.appendChild(row);
    });
}



window.openPlayerProfile = function(player, rank) {
    const modal = document.getElementById('playerProfileModal');
    if (!modal) return;
    
    document.getElementById('profileModalAvatar').src = player.avatar ? player.avatar : 'image/avatar.png';
    document.getElementById('profileModalName').textContent = player.name;
    document.getElementById('profileModalRank').textContent = `#${rank} 🏆`;
    document.getElementById('profileModalXp').textContent = `${player.xp.toLocaleString()} XP 🔹`;
    
    const playerLevel = player.level || 1;
    const playerCoins = player.coins || 0;
    
    // Custom image badge data with unique glow colors
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
            unlocked: player.speedThunder === true || player.speedThunderUnlocked === true, 
            
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

    const badgesContainer = document.getElementById('profileModalBadges');
    badgesContainer.innerHTML = '';
    
    // Set grid to 3 columns per row
    badgesContainer.style.display = 'grid';
    badgesContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    badgesContainer.style.gap = '12px';
    badgesContainer.style.alignItems = 'center';
    badgesContainer.style.justifyItems = 'center';

    allBadges.forEach(badge => {
        const isUnlocked = badge.unlocked;

        const badgeElement = document.createElement('div');
        badgeElement.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            background: transparent;
            border: none;
            box-shadow: none;
            padding: 4px;
            opacity: ${isUnlocked ? '1' : '0.35'};
            transition: all 0.3s ease;
        `;

        badgeElement.innerHTML = `
            <img src="${badge.icon}" alt="${badge.title}" style="width: 64px; height: 64px; object-fit: contain; margin-bottom: 6px; background: transparent; border: none; box-shadow: none; ${isUnlocked ? '' : 'filter: grayscale(100%);'}">
            <span style="font-weight: 700; font-size: 11px; color: ${isUnlocked ? '#fff' : '#777'}; letter-spacing: 0.3px; line-height: 1.2; margin-bottom: 2px;">${badge.title}</span>
            <span style="font-size: 8px; color: ${isUnlocked ? '#bbb' : '#444'}; line-height: 1.1;">${badge.desc}</span>
        `;
        badgesContainer.appendChild(badgeElement);
    });
    
    modal.style.display = 'flex';
};
    

window.closePlayerProfile = function() {
    const modal = document.getElementById('playerProfileModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.addEventListener('click', (event) => {
    const modal = document.getElementById('playerProfileModal');
    if (event.target === modal) {
        window.closePlayerProfile();
    }
});




// --- CONFETTI BACKGROUND EFFECT (Independent) ---
function initLeaderboardConfetti() {
    let container = document.getElementById('leaderboardConfetti');
    if (!container) {
        container = document.createElement('div');
        container.id = 'leaderboardConfetti';
        container.className = 'confetti-bg';
        
        // Push the container down so nothing spawns over the title/header area
        container.style.position = 'absolute';
        container.style.top = '140px'; // Adjust this value to lower where the confetti starts
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = 'calc(100% - 140px)';
        container.style.overflow = 'hidden';
        container.style.pointerEvents = 'none';

        const lbView = document.getElementById('leaderboardView');
        if (lbView) {
            // Ensure leaderboard view can hold absolute children properly
            if (window.getComputedStyle(lbView).position === 'static') {
                lbView.style.position = 'relative';
            }
            lbView.appendChild(container); // Append instead of prepend so it sits safely below the header
        }
    }
    
    if (container.children.length === 0) {
        const colors = ['#ffd700', '#ff75a0', '#00e5ff', '#9b59b6', '#2ecc71'];
        for (let i = 0; i < 22; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.width = `${Math.random() * 6 + 5}px`;
            piece.style.height = piece.style.width;
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            piece.style.animationDuration = `${Math.random() * 6 + 4}s`;
            piece.style.animationDelay = `${Math.random() * 5}s`;
            piece.style.boxShadow = `0 0 6px ${piece.style.backgroundColor}`;
            container.appendChild(piece);
        }
    }
}

// Automatically runs when the page loads without touching your leaderboard function
document.addEventListener('DOMContentLoaded', () => {
    initLeaderboardConfetti();
});


