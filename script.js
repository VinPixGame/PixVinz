// Import Firebase SDK modules from CDN (matching your index.html setup)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// Initialize Firebase App Configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

// Global state tracker for current authenticated Firestore user data
let currentCloudUser = null;

document.addEventListener('DOMContentLoaded', () => {
  const views = {
    loading: document.getElementById('loadingView'),
    login: document.getElementById('loginView'),
    register: document.getElementById('registerView'),
    home: document.getElementById('homeView'),
    levels: document.getElementById('levelsView'),
    collections: document.getElementById('collectionsView'),
    challenge: document.getElementById('challengeView'),
    leaderboard: document.getElementById('leaderboardView')
  };

  const mainHeader = document.getElementById('mainHeader');

  function getCurrentUser() {
    return currentCloudUser;
  }

  function getUserKey(keyName) {
    const user = getCurrentUser();
    if (!user || !user.username) return keyName;
    return `${user.username}_${keyName}`;
  }

  // --- ROBUST AVATAR SYNC HELPER ---
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

    if (['home', 'levels', 'collections', 'challenge', 'leaderboard'].includes(targetView)) {
      if (mainHeader) mainHeader.classList.remove('hidden');
      updateCoinDisplay();
      updateHeaderAvatar();
    } else {
      if (mainHeader) mainHeader.classList.add('hidden');
    }
  }

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

  // --- FIREBASE AUTH STATE LISTENER ---
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Fetch user profile data from Firestore database
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        currentCloudUser = {
          uid: firebaseUser.uid,
          username: data.username,
          displayName: data.displayName
        };
        
        // Cache local state for quick retrieval
        localStorage.setItem('loggedInUser', JSON.stringify(currentCloudUser));
        localStorage.setItem(getUserKey('currentLevel'), data.level || 1);
        localStorage.setItem(getUserKey('totalCoins'), data.coins || 0);

        const nameElem = document.getElementById('userDisplayName');
        if (nameElem) nameElem.innerText = currentCloudUser.displayName;

        const loadingView = document.getElementById('loadingView');
        if (loadingView) {
          loadingView.classList.remove('active');
          loadingView.style.display = 'none';
        }

        showView('home');
        playMainBGM();
        updateHeaderAvatar();
      }
    } else {
      currentCloudUser = null;
      localStorage.removeItem('loggedInUser');
      setTimeout(() => {
        const loadingView = document.getElementById('loadingView');
        if (loadingView) {
          loadingView.classList.remove('active');
          loadingView.style.display = 'none';
        }
        showView('login');
      }, 3000);
    }
  });

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

      // Firebase Auth requires a valid email format. We map the username to a clean email handle.
      const email = `${username}@pixvinz.game`;

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const firebaseUser = userCredential.user;

        // Save user profile data to Cloud Firestore
        const userPayload = {
          uid: firebaseUser.uid,
          username: username,
          displayName: displayName,
          level: 1,
          coins: 0
        };

        await setDoc(doc(db, "users", firebaseUser.uid), userPayload);
        await setDoc(doc(db, "leaderboard", firebaseUser.uid), {
          name: displayName,
          username: username,
          level: 1,
          coins: 0
        });

        if (errElem) errElem.innerText = "";
      } catch (error) {
        if (errElem) errElem.innerText = error.message.replace("Firebase: ", "");
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

      const email = `${username}@pixvinz.game`;

      try {
        await signInWithEmailAndPassword(auth, email, pass);
        if (errElem) errElem.innerText = "";
      } catch (error) {
        if (errElem) errElem.innerText = "Invalid username or password!";
      }
    });
  }

  // --- 3. HOME PAGE BUTTONS ---
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

  const navChallenge = document.getElementById('navChallenge');
  if (navChallenge) {
    navChallenge.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      showView('challenge');
    });
  }

  const navLeaderboard = document.getElementById('navLeaderboard');
  if (navLeaderboard) {
    navLeaderboard.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      await renderLeaderboard();
      showView('leaderboard');
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

  // --- 4. CHALLENGE 1V1 MATCHMAKING LOGIC ---
  const startMatchmakingBtn = document.getElementById('startMatchmakingBtn');
  const matchmakingStatus = document.getElementById('matchmakingStatus');
  if (startMatchmakingBtn) {
    startMatchmakingBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      startMatchmakingBtn.disabled = true;
      startMatchmakingBtn.style.opacity = '0.5';
      if (matchmakingStatus) matchmakingStatus.innerText = "Searching for an opponent...";

      setTimeout(() => {
        if (matchmakingStatus) matchmakingStatus.innerText = "Opponent found! Initializing Arena...";
        setTimeout(() => {
          startMatchmakingBtn.disabled = false;
          startMatchmakingBtn.style.opacity = '1';
          if (matchmakingStatus) matchmakingStatus.innerText = "";
          const currentLevel = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;
          window.location.href = `game.html?level=${currentLevel}&mode=challenge`;
        }, 1200);
      }, 1800);
    });
  }

  // --- 5. CLOUD LEADERBOARD RANKING LOGIC ---
  async function renderLeaderboard() {
    const listContainer = document.getElementById('leaderboardList');
    const userRankDisplay = document.getElementById('userRankDisplay');
    if (!listContainer) return;
    listContainer.innerHTML = '<div style="text-align:center; color:#b388ff; padding: 20px;">Loading Leaderboard...</div>';

    let players = [];
    try {
      const q = query(collection(db, "leaderboard"), orderBy("level", "desc"), orderBy("coins", "desc"), limit(20));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        players.push({
          name: data.name || data.username,
          username: data.username,
          level: data.level || 1,
          coins: data.coins || 0,
          isCurrent: currentCloudUser && currentCloudUser.username === data.username
        });
      });
    } catch (e) {
      console.error("Error fetching leaderboard: ", e);
    }

    listContainer.innerHTML = '';
    let userFoundRank = "--";

    players.forEach((player, index) => {
      const rank = index + 1;
      if (player.isCurrent) {
        userFoundRank = `#${rank}`;
      }

      const row = document.createElement('div');
      row.className = `overall-best-card ${player.isCurrent ? 'current-user-row' : ''}`;
      row.style.margin = '0';
      row.style.padding = '12px 16px';
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.justifyContent = 'space-between';
      if (player.isCurrent) {
        row.style.border = '2px solid #ffd700';
        row.style.backgroundColor = 'rgba(156, 39, 176, 0.25)';
      }

      let rankMedal = `<strong>#${rank}</strong>`;
      if (rank === 1) rankMedal = '🥇';
      else if (rank === 2) rankMedal = '🥈';
      else if (rank === 3) rankMedal = '🥉';

      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 1.1rem; width: 32px; text-align: center; color: #ffd700;">${rankMedal}</div>
          <div>
            <div style="font-weight: bold; color: #fff; font-size: 0.95rem;">${player.name} ${player.isCurrent ? '(You)' : ''}</div>
            <div style="font-size: 0.75rem; color: #b388ff;">Level ${player.level}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
          <div style="font-size: 0.85rem; color: #ffd700;">🪙 ${player.coins}</div>
        </div>
      `;
      listContainer.appendChild(row);
    });

    if (userRankDisplay) {
      userRankDisplay.innerText = userFoundRank;
    }
  }

  // --- 6. SETTINGS, ABOUT & LOGOUT ---
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
      updateHeaderAvatar();
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
    logoutBtn.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      if (confirm("Are you sure you want to log out?")) {
        try {
          await signOut(auth);
          if (settingsModal) settingsModal.classList.add('hidden');
          if (typeof AudioManager !== 'undefined') AudioManager.stopBGM();
          showView('login');
        } catch (error) {
          console.error("Sign out error: ", error);
        }
      }
    });
  }

  // --- 7. RENDER LEVELS ---
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

  // --- 8. COLLECTION FOLDERS LOGIC ---
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

  updateHeaderAvatar();
});
