// script.js
document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const loadingView = document.getElementById('loadingView');
  const loginView = document.getElementById('loginView');
  const registerView = document.getElementById('registerView');
  const homeView = document.getElementById('homeView');
  const levelsView = document.getElementById('levelsView');
  const collectionsView = document.getElementById('collectionsView');
  const challengeView = document.getElementById('challengeView');
  const leaderboardView = document.getElementById('leaderboardView');
  const mainHeader = document.getElementById('mainHeader');

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loginError = document.getElementById('loginError');
  const regError = document.getElementById('regError');
  const toRegister = document.getElementById('toRegister');
  const toLogin = document.getElementById('toLogin');

  const userDisplayName = document.getElementById('userDisplayName');
  const coinCount = document.getElementById('coinCount');
  const profileHeaderImg = document.getElementById('profileHeaderImg');
  const profileIconFallback = document.getElementById('profileIconFallback');

  const playBtn = document.getElementById('playBtn');
  const navLevels = document.getElementById('navLevels');
  const navCollections = document.getElementById('navCollections');
  const navChallenge = document.getElementById('navChallenge');
  const navLeaderboard = document.getElementById('navLeaderboard');
  const navSettings = document.getElementById('navSettings');

  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsModal = document.getElementById('closeSettingsModal');
  const aboutModal = document.getElementById('aboutModal');
  const aboutBtn = document.getElementById('aboutBtn');
  const closeAboutModal = document.getElementById('closeAboutModal');
  const logoutBtn = document.getElementById('logoutBtn');

  const levelsGrid = document.getElementById('levelsGrid');
  const globalBestTime = document.getElementById('globalBestTime');
  const globalFewestMoves = document.getElementById('globalFewestMoves');

  const collectionsFolderContainer = document.getElementById('collectionsFolderContainer');
  const collectionsImagesContainer = document.getElementById('collectionsImagesContainer');
  const collectionsFolderGrid = document.getElementById('collectionsFolderGrid');
  const collectionsGrid = document.getElementById('collectionsGrid');
  const collectionsTitle = document.getElementById('collectionsTitle');
  const collectionsBackBtn = document.getElementById('collectionsBackBtn');

  const imageModal = document.getElementById('imageModal');
  const closeImageModal = document.getElementById('closeImageModal');
  const modalPreviewImg = document.getElementById('modalPreviewImg');
  const modalLevelTitle = document.getElementById('modalLevelTitle');

  const sfxToggle = document.getElementById('sfxToggle');
  const musicToggle = document.getElementById('musicToggle');

  // Password visibility toggles
  const toggleLoginPass = document.getElementById('toggleLoginPass');
  const loginPass = document.getElementById('loginPass');
  const toggleRegPass = document.getElementById('toggleRegPass');
  const regPass = document.getElementById('regPass');
  const toggleRegPassConfirm = document.getElementById('toggleRegPassConfirm');
  const regPassConfirm = document.getElementById('regPassConfirm');

  // --- State Management ---
  let currentUser = JSON.parse(localStorage.getItem('loggedInUser')) || null;

  function switchView(viewElement) {
    [loadingView, loginView, registerView, homeView, levelsView, collectionsView, challengeView, leaderboardView].forEach(v => {
      if (v) v.classList.remove('active');
    });
    if (viewElement) viewElement.classList.add('active');

    if (viewElement === loadingView || viewElement === loginView || viewElement === registerView) {
      if (mainHeader) mainHeader.classList.add('hidden');
    } else {
      if (mainHeader) mainHeader.classList.remove('hidden');
    }

    // Manage BGM states according to view
    if (typeof AudioManager !== 'undefined') {
      if (viewElement === homeView || viewElement === levelsView || viewElement === collectionsView || viewElement === challengeView || viewElement === leaderboardView) {
        AudioManager.playMain();
      }
    }
  }

  function getUserKey(keyName) {
    if (!currentUser || !currentUser.username) return keyName;
    return `${currentUser.username}_${keyName}`;
  }

  function updateCoinDisplay() {
    const totalCoins = parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0;
    if (coinCount) coinCount.innerText = totalCoins;
  }

  function updateProfileHeader() {
    const avatar = localStorage.getItem(getUserKey('vinpix_avatar'));
    if (profileHeaderImg && profileIconFallback) {
      if (avatar) {
        profileHeaderImg.src = avatar;
        profileHeaderImg.style.display = 'block';
        profileIconFallback.style.display = 'none';
      } else {
        profileHeaderImg.style.display = 'none';
        profileIconFallback.style.display = 'block';
      }
    }
    if (userDisplayName && currentUser) {
      userDisplayName.innerText = currentUser.displayName || currentUser.username;
    }
  }

  // --- Initialization / Flow ---
  setTimeout(() => {
    const skipLoading = localStorage.getItem('skipLoading') === 'true';
    localStorage.removeItem('skipLoading');

    if (currentUser) {
      updateCoinDisplay();
      updateProfileHeader();
      switchView(homeView);
      if (typeof AudioManager !== 'undefined') {
        AudioManager.playMain();
      }
    } else {
      switchView(loginView);
    }
  }, 1200);

  // --- Auth Handlers ---
  if (toRegister) {
    toRegister.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      switchView(registerView);
    });
  }

  if (toLogin) {
    toLogin.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      switchView(loginView);
    });
  }

  if (toggleLoginPass && loginPass) {
    toggleLoginPass.addEventListener('click', () => {
      loginPass.type = loginPass.type === 'password' ? 'text' : 'password';
      toggleLoginPass.textContent = loginPass.type === 'password' ? '👁️' : '🙈';
    });
  }

  if (toggleRegPass && regPass) {
    toggleRegPass.addEventListener('click', () => {
      regPass.type = regPass.type === 'password' ? 'text' : 'password';
      toggleRegPass.textContent = regPass.type === 'password' ? '👁️' : '🙈';
    });
  }

  if (toggleRegPassConfirm && regPassConfirm) {
    toggleRegPassConfirm.addEventListener('click', () => {
      regPassConfirm.type = regPassConfirm.type === 'password' ? 'text' : 'password';
      toggleRegPassConfirm.textContent = regPassConfirm.type === 'password' ? '👁️' : '🙈';
    });
  }

  // Email helper for Firebase Auth (since usernames need an email format for standard Firebase Auth API)
  function getEmailFromUsername(username) {
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${clean}@pixvinz.app`;
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      if (loginError) loginError.innerText = '';

      const usernameInput = document.getElementById('loginUser').value.trim();
      const passwordInput = document.getElementById('loginPass').value;

      if (!window.pixvinzAuth) {
        if (loginError) loginError.innerText = 'Firebase not initialized yet. Please wait.';
        return;
      }

      const { auth, signInWithEmailAndPassword } = window.pixvinzAuth;
      const email = getEmailFromUsername(usernameInput);

      try {
        await signInWithEmailAndPassword(auth, email, passwordInput);
        currentUser = { username: usernameInput.toLowerCase(), displayName: usernameInput };
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser));

        // Load data from Firestore if available
        if (window.pixvinzDb) {
          const { db, doc, getDoc } = window.pixvinzDb;
          const userDoc = await getDoc(doc(db, "players", currentUser.username));
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.level) localStorage.setItem(getUserKey('currentLevel'), data.level);
            if (data.coins !== undefined) localStorage.setItem(getUserKey('totalCoins'), data.coins);
            if (data.avatar) localStorage.setItem(getUserKey('vinpix_avatar'), data.avatar);
            if (data.displayName) currentUser.displayName = data.displayName;
            localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
          }
        }

        updateCoinDisplay();
        updateProfileHeader();
        switchView(homeView);
      } catch (err) {
        console.error("Login error:", err);
        if (loginError) loginError.innerText = 'Invalid username or password.';
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      if (regError) regError.innerText = '';

      const displayNameInput = document.getElementById('regDisplayName').value.trim();
      const usernameInput = document.getElementById('regUser').value.trim().toLowerCase();
      const passwordInput = document.getElementById('regPass').value;
      const confirmInput = document.getElementById('regPassConfirm').value;

      if (passwordInput !== confirmInput) {
        if (regError) regError.innerText = 'Passwords do not match.';
        return;
      }

      // Validate password rules: 6+ chars, 1 uppercase, 1 number
      const passRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
      if (!passRegex.test(passwordInput)) {
        if (regError) regError.innerText = 'Password must be 6+ chars, have 1 uppercase & 1 number.';
        return;
      }

      if (!window.pixvinzAuth) {
        if (regError) regError.innerText = 'Firebase not initialized yet. Please wait.';
        return;
      }

      const { auth, createUserWithEmailAndPassword } = window.pixvinzAuth;
      const email = getEmailFromUsername(usernameInput);

      try {
        await createUserWithEmailAndPassword(auth, email, passwordInput);
        currentUser = { username: usernameInput, displayName: displayNameInput };
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser));

        // Save initial profile to Firestore
        if (window.pixvinzDb) {
          const { db, doc, setDoc } = window.pixvinzDb;
          await setDoc(doc(db, "players", currentUser.username), {
            username: currentUser.username,
            displayName: currentUser.displayName,
            level: 1,
            coins: 0,
            avatar: '',
            lastUpdated: new Date()
          }, { merge: true });
        }

        updateCoinDisplay();
        updateProfileHeader();
        switchView(homeView);
      } catch (err) {
        console.error("Registration error:", err);
        if (regError) regError.innerText = err.message || 'Registration failed. Username may be taken.';
      }
    });
  }

  // --- Navigation Buttons ---
  if (playBtn || navLevels) {
    const handleLevelsNav = () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      renderLevelsGrid();
      updateGlobalStats();
      switchView(levelsView);
    };
    if (playBtn) playBtn.addEventListener('click', handleLevelsNav);
    if (navLevels) navLevels.addEventListener('click', handleLevelsNav);
  }

  if (navCollections) {
    navCollections.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      renderCollectionsFolders();
      switchView(collectionsView);
    });
  }

  if (navChallenge) {
    navChallenge.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      switchView(challengeView);
    });
  }

  if (navLeaderboard) {
    navLeaderboard.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      renderLeaderboard();
      switchView(leaderboardView);
    });
  }

  if (navSettings) {
    navSettings.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      if (settingsModal) settingsModal.classList.remove('hidden');
    });
  }

  if (closeSettingsModal && settingsModal) {
    closeSettingsModal.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      settingsModal.classList.add('hidden');
    });
  }

  if (aboutBtn && aboutModal) {
    aboutBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      aboutModal.classList.remove('hidden');
    });
  }

  if (closeAboutModal && aboutModal) {
    closeAboutModal.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      aboutModal.classList.add('hidden');
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      if (window.pixvinzAuth) {
        await window.pixvinzAuth.signOut(window.pixvinzAuth.auth);
      }
      localStorage.removeItem('loggedInUser');
      currentUser = null;
      if (settingsModal) settingsModal.classList.add('hidden');
      switchView(loginView);
      if (typeof AudioManager !== 'undefined') {
        AudioManager.stopBGM();
      }
    });
  }

  // Back buttons across views
  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      switchView(homeView);
    });
  });

  // --- Levels View Logic ---
  const maxLevels = 200;

  function updateGlobalStats() {
    let bestTimeSecs = Infinity;
    let fewestMovesVal = Infinity;

    for (let i = 1; i <= maxLevels; i++) {
      const tStr = localStorage.getItem(getUserKey(`levelTime_${i}`));
      const mVal = parseInt(localStorage.getItem(getUserKey(`levelMoves_${i}`)));

      if (tStr && tStr !== '--:--') {
        const [m, s] = tStr.split(':').map(Number);
        const totalSecs = m * 60 + s;
        if (totalSecs < bestTimeSecs) bestTimeSecs = totalSecs;
      }
      if (!isNaN(mVal) && mVal < fewestMovesVal) {
        fewestMovesVal = mVal;
      }
    }

    if (globalBestTime) {
      if (bestTimeSecs !== Infinity) {
        const mins = Math.floor(bestTimeSecs / 60).toString().padStart(2, '0');
        const secs = (bestTimeSecs % 60).toString().padStart(2, '0');
        globalBestTime.innerText = `${mins}:${secs}`;
      } else {
        globalBestTime.innerText = '--:--';
      }
    }

    if (globalFewestMoves) {
      globalFewestMoves.innerText = fewestMovesVal !== Infinity ? fewestMovesVal : '--';
    }
  }

  function renderLevelsGrid() {
    if (!levelsGrid) return;
    levelsGrid.innerHTML = '';
    const unlockedMax = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;

    for (let i = 1; i <= maxLevels; i++) {
      const btn = document.createElement('button');
      btn.className = 'level-btn';
      btn.innerText = i;

      if (i > unlockedMax) {
        btn.classList.add('locked');
        btn.disabled = true;
      } else {
        const starsCount = localStorage.getItem(getUserKey(`levelCoins_${i}`)) ? Math.min(3, Math.floor(parseInt(localStorage.getItem(getUserKey(`levelCoins_${i}`))) / 5)) : 0;
        if (starsCount > 0) {
          btn.classList.add('completed');
        }
        btn.addEventListener('click', () => {
          if (typeof AudioManager !== 'undefined') AudioManager.playClick();
          window.location.href = `game.html?level=${i}`;
        });
      }
      levelsGrid.appendChild(btn);
    }
  }

  // --- Collections View Logic ---
  const levelsPerFolder = 10;
  const totalFolders = Math.ceil(maxLevels / levelsPerFolder);

  function renderCollectionsFolders() {
    if (!collectionsFolderGrid || !collectionsFolderContainer || !collectionsImagesContainer) return;
    collectionsFolderContainer.classList.remove('hidden');
    collectionsImagesContainer.classList.add('hidden');
    if (collectionsTitle) collectionsTitle.innerText = 'COLLECTIONS';
    collectionsFolderGrid.innerHTML = '';

    for (let f = 1; f <= totalFolders; f++) {
      const startLvl = (f - 1) * levelsPerFolder + 1;
      const endLvl = f * levelsPerFolder;
      const card = document.createElement('div');
      card.className = 'folder-card';
      card.innerHTML = `
        <h4>Collection ${f}</h4>
        <p>Levels ${startLvl} - ${endLvl}</p>
      `;
      card.addEventListener('click', () => {
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
        renderCollectionImages(startLvl, endLvl, f);
      });
      collectionsFolderGrid.appendChild(card);
    }
  }

  function renderCollectionImages(start, end, folderNum) {
    if (!collectionsGrid || !collectionsFolderContainer || !collectionsImagesContainer) return;
    collectionsFolderContainer.classList.add('hidden');
    collectionsImagesContainer.classList.remove('hidden');
    if (collectionsTitle) collectionsTitle.innerText = `COLLECTION ${folderNum}`;
    collectionsGrid.innerHTML = '';

    const unlockedMax = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;

    for (let l = start; l <= end; l++) {
      const itemCard = document.createElement('div');
      itemCard.className = 'collection-item-card';

      const isUnlocked = l <= unlockedMax;
      const isCompleted = localStorage.getItem(getUserKey(`levelCoins_${l}`)) !== null;

      if (isCompleted || isUnlocked) {
        itemCard.innerHTML = `
          <img src="image/level${l}.jpeg" alt="Level ${l}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
          <div class="collection-level-badge">Lvl ${l}</div>
        `;
        itemCard.addEventListener('click', () => {
          if (typeof AudioManager !== 'undefined') AudioManager.playClick();
          if (modalPreviewImg && modalLevelTitle && imageModal) {
            modalPreviewImg.src = `image/level${l}.jpeg`;
            modalLevelTitle.innerText = `LEVEL ${l.toString().padStart(2, '0')}`;
            imageModal.classList.remove('hidden');
          }
        });
      } else {
        itemCard.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #1a0b2e; color: #555; border-radius: 8px; font-size: 1.5rem;">🔒</div>
          <div class="collection-level-badge">Lvl ${l}</div>
        `;
      }
      collectionsGrid.appendChild(itemCard);
    }
  }

  if (collectionsBackBtn) {
    collectionsBackBtn.addEventListener('click', (e) => {
      if (!collectionsFolderContainer.classList.contains('hidden')) {
        return;
      }
      e.stopImmediatePropagation();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      renderCollectionsFolders();
    });
  }

  if (closeImageModal && imageModal) {
    closeImageModal.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      imageModal.classList.add('hidden');
    });
  }

  // --- Leaderboard View Logic ---
  async function renderLeaderboard() {
    const leaderboardList = document.getElementById('leaderboardList');
    const userRankDisplay = document.getElementById('userRankDisplay');
    if (!leaderboardList) return;

    leaderboardList.innerHTML = '<div style="text-align: center; color: #d1c4e9; padding: 20px;">Loading rankings...</div>';

    try {
      let players = [];
      if (window.pixvinzDb) {
        players = [
          { username: currentUser?.username || 'player', displayName: currentUser?.displayName || 'You', level: parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1, coins: parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0 }
        ];
      } else {
        players = [
          { username: currentUser?.username || 'player', displayName: currentUser?.displayName || 'You', level: parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1, coins: parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0 }
        ];
      }

      players.sort((a, b) => b.level - a.level || b.coins - a.coins);

      leaderboardList.innerHTML = '';
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
      console.error("Leaderboard fetch error:", err);
      leaderboardList.innerHTML = '<div style="text-align: center; color: #ff5252; padding: 20px;">Failed to load leaderboard.</div>';
    }
  }

  // --- Settings Toggles ---
  if (sfxToggle) {
    sfxToggle.checked = localStorage.getItem('sfxEnabled') !== 'false';
    sfxToggle.addEventListener('change', () => {
      if (typeof AudioManager !== 'undefined') {
        AudioManager.setSFX(sfxToggle.checked);
      }
    });
  }

  if (musicToggle) {
    musicToggle.checked = localStorage.getItem('musicEnabled') !== 'false';
    musicToggle.addEventListener('change', () => {
      if (typeof AudioManager !== 'undefined') {
        AudioManager.setMusic(musicToggle.checked);
      }
    });
  }
});
