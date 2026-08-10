document.addEventListener('DOMContentLoaded', () => {
  const views = {
    loading: document.getElementById('loadingView'),
    login: document.getElementById('loginView'),
    register: document.getElementById('registerView'),
    home: document.getElementById('homeView'),
    levels: document.getElementById('levelsView'),
    collections: document.getElementById('collectionsView')
  };

  const mainHeader = document.getElementById('mainHeader');

  function showView(viewName) {
    Object.values(views).forEach(v => {
      if (v) v.classList.add('hidden');
    });

    if (views[viewName]) {
      views[viewName].classList.remove('hidden');
    }

    if (['home', 'levels', 'collections'].includes(viewName)) {
      mainHeader.classList.remove('hidden');
      updateCoinDisplay();
    } else {
      mainHeader.classList.add('hidden');
    }
  }

  function updateCoinDisplay() {
    const totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
    const coinElem = document.getElementById('coinCount');
    if (coinElem) {
      coinElem.innerText = totalCoins;
    }
  }

  function getCurrentUser() {
    return JSON.parse(localStorage.getItem('loggedInUser'));
  }

  // Safe wrapper to attempt music playback
  function tryPlayMainBGM() {
    try {
      if (typeof AudioManager !== 'undefined') {
        AudioManager.playMain();
      }
    } catch (err) {
      console.log('Autoplay restriction or audio issue:', err);
    }
  }

  // Unlock web audio context on first user click/tap if blocked by browser
  document.addEventListener('click', () => {
    if (typeof AudioManager !== 'undefined' && AudioManager.musicEnabled) {
      if (!AudioManager.bgmMain || AudioManager.bgmMain.paused) {
        tryPlayMainBGM();
      }
    }
  }, { once: true });

  // --- LOADING PAGE: Wait exactly 4 seconds (4000ms) then switch ---
  setTimeout(() => {
    const loggedInUser = getCurrentUser();
    if (loggedInUser) {
      const nameElem = document.getElementById('userDisplayName');
      if (nameElem) nameElem.innerText = loggedInUser.displayName || 'Vinz';
      showView('home');
      tryPlayMainBGM();
    } else {
      showView('login');
    }
  }, 4000);

  // --- AUTH SYSTEM (LOGIN / REGISTER) ---
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
    regForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      
      const displayName = document.getElementById('regDisplayName').value.trim();
      const username = document.getElementById('regUser').value.trim().toLowerCase();
      const pass = document.getElementById('regPass').value;
      const passConfirm = document.getElementById('regPassConfirm').value;
      const errElem = document.getElementById('regError');

      if (pass !== passConfirm) {
        errElem.innerText = "Passwords do not match!";
        return;
      }

      let users = JSON.parse(localStorage.getItem('registeredUsers')) || {};
      if (users[username]) {
        errElem.innerText = "Username already taken!";
        return;
      }

      const newUser = { displayName, username, password: pass };
      users[username] = newUser;
      localStorage.setItem('registeredUsers', JSON.stringify(users));

      // Auto-login newly registered user
      localStorage.setItem('loggedInUser', JSON.stringify(newUser));
      const nameElem = document.getElementById('userDisplayName');
      if (nameElem) nameElem.innerText = displayName;
      
      errElem.innerText = "";
      showView('home');
      tryPlayMainBGM();
    });
  }

  const logForm = document.getElementById('loginForm');
  if (logForm) {
    logForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();

      const username = document.getElementById('loginUser').value.trim().toLowerCase();
      const pass = document.getElementById('loginPass').value;
      const errElem = document.getElementById('loginError');

      let users = JSON.parse(localStorage.getItem('registeredUsers')) || {};
      
      // Default fallback account if no accounts exist yet
      if (Object.keys(users).length === 0 && username === 'vinz' && pass === '1234') {
        users['vinz'] = { displayName: 'Vinz', username: 'vinz', password: '1234' };
        localStorage.setItem('registeredUsers', JSON.stringify(users));
      }

      if (users[username] && users[username].password === pass) {
        localStorage.setItem('loggedInUser', JSON.stringify(users[username]));
        const nameElem = document.getElementById('userDisplayName');
        if (nameElem) nameElem.innerText = users[username].displayName;
        errElem.innerText = "";
        showView('home');
        tryPlayMainBGM();
      } else {
        errElem.innerText = "Invalid username or password!";
      }
    });
  }

  // --- HOME NAVIGATION ---
  const playBtn = document.getElementById('playBtn');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      const currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
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
      renderCollections();
      showView('collections');
    });
  }

  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      showView('home');
    });
  });

  // --- SETTINGS & LOGOUT ---
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
      settingsModal.classList.remove('hidden');
    });
  }

  const closeSettingsModal = document.getElementById('closeSettingsModal');
  if (closeSettingsModal) {
    closeSettingsModal.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      settingsModal.classList.add('hidden');
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
      aboutModal.classList.remove('hidden');
    });
  }

  const closeAboutModal = document.getElementById('closeAboutModal');
  if (closeAboutModal) {
    closeAboutModal.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      aboutModal.classList.add('hidden');
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      if (confirm("Are you sure you want to log out?")) {
        localStorage.removeItem('loggedInUser');
        settingsModal.classList.add('hidden');
        if (typeof AudioManager !== 'undefined') AudioManager.stopBGM();
        showView('login');
      }
    });
  }

  function renderLevels() {
    const grid = document.getElementById('levelsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
    
    for (let i = 1; i <= 200; i++) {
      const btn = document.createElement('div');
      const isUnlocked = i <= currentLevel;
      
      btn.className = `level-btn ${isUnlocked ? 'unlocked' : 'locked'}`;
      
      if (isUnlocked) {
        btn.innerHTML = `<div class="level-num">${i.toString().padStart(2, '0')}</div><div class="stars">★★★</div>`;
        btn.addEventListener('click', () => {
          if (typeof AudioManager !== 'undefined') AudioManager.playClick();
          window.location.href = `game.html?level=${i}`;
        });
      } else {
        btn.innerHTML = `<div class="level-num" style="opacity:0.4">${i.toString().padStart(2, '0')}</div><div class="lock-icon">🔒</div>`;
      }
      grid.appendChild(btn);
    }

    const infoText = document.getElementById('unlockInfoText');
    if (infoText) {
      infoText.innerText = `COMPLETE LEVEL ${currentLevel.toString().padStart(2, '0')} TO UNLOCK LEVEL ${(currentLevel + 1).toString().padStart(2, '0')}`;
    }
  }

  function renderCollections() {
    const grid = document.getElementById('collectionsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;
    
    for (let i = 1; i < currentLevel; i++) {
      const item = document.createElement('div');
      item.className = 'collection-item';
      
      item.innerHTML = `
        <img src="image/level${i}.jpeg" alt="Level ${i}">
        <div class="collection-badge">LEVEL ${i.toString().padStart(2, '0')}</div>
      `;

      item.addEventListener('click', () => {
        if (typeof AudioManager !== 'undefined') AudioManager.playClick();
        openImageModal(i);
      });

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
