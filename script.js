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

// Expose Firestore database tools globally
window.pixvinzDb = { db, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, limit, getDocs };

// --- SAFE CLOUD-FIRST PROFILE SYNC & HYDRATION ---
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
    console.warn("Could not fetch profile data from cloud, falling back safely:", err);
    try {
      return JSON.parse(localStorage.getItem('loggedInUser'));
    } catch (e) {
      return null;
    }
  }
}

// --- CHOOSE AVATAR UPLOAD HANDLER (CLOUD-FIRST) ---
function setupAvatarUploader(currentUsername) {
  const chooseAvatarBtn = document.querySelector('.choose-avatar-btn') || document.getElementById('chooseAvatarBtn') || Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Choose Avatar'));
  
  if (!chooseAvatarBtn) return;

  let fileInput = document.getElementById('hiddenAvatarInput');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'hiddenAvatarInput';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
  }

  let statusMsg = document.getElementById('avatarStatusMsg');
  if (!statusMsg) {
    statusMsg = document.createElement('div');
    statusMsg.id = 'avatarStatusMsg';
    statusMsg.style.cssText = 'font-size: 11px; margin-top: 6px; text-align: center; font-weight: 600; transition: opacity 0.3s ease;';
    chooseAvatarBtn.parentNode.insertBefore(statusMsg, chooseAvatarBtn.nextSibling);
  }

  chooseAvatarBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
    fileInput.click();
  });

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(uploadEvent) {
      const base64Image = uploadEvent.target.result;
      
      try {
        if (window.pixvinzDb && currentUsername) {
          const userDocRef = doc(db, 'players', currentUsername);
          await updateDoc(userDocRef, { avatar: base64Image });
        }
      } catch (err) {
        console.warn("Error updating avatar in Firestore:", err);
      }
      
      if (currentUsername) {
        localStorage.setItem(`${currentUsername}_vinpix_avatar`, base64Image);
      }
      
      try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser')) || {};
        userObj.avatar = base64Image;
        localStorage.setItem('loggedInUser', JSON.stringify(userObj));
      } catch (err) {}

      const avatarImg = document.getElementById('profileHeaderImg');
      const fallbackIcon = document.getElementById('profileIconFallback');
      if (avatarImg) {
        avatarImg.src = base64Image;
        avatarImg.style.display = 'block';
      }
      if (fallbackIcon) {
        fallbackIcon.style.display = 'none';
      }

      statusMsg.innerText = '✔ Avatar uploaded successfully!';
      statusMsg.style.color = '#2ecc71';
      statusMsg.style.opacity = '1';

      setTimeout(() => {
        statusMsg.style.opacity = '0';
      }, 4000);
    };
    reader.readAsDataURL(file);
  });
}

// --- EDIT PLAYER NAME HANDLER (CLOUD-FIRST) ---
function setupNameEditor(currentUsername) {
  const editBtn = Array.from(document.querySelectorAll('button')).find(el => el.textContent.trim() === 'Edit');
  if (!editBtn) return;

  editBtn.addEventListener('click', async () => {
    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
    
    let nameDisplayElem = document.querySelector('#profileView .player-name') || document.getElementById('userDisplayName');
    if (!nameDisplayElem) return;

    if (editBtn.innerText === 'Edit') {
      const currentName = nameDisplayElem.innerText;
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentName;
      input.maxLength = 20;
      input.style.cssText = 'background: rgba(0,0,0,0.5); border: 1px solid #ffd700; color: #fff; padding: 4px 8px; border-radius: 6px; font-size: 14px; text-align: center; width: 140px;';
      
      nameDisplayElem.replaceWith(input);
      input.focus();
      editBtn.innerText = 'Save';

      const saveAction = async () => {
        const newName = input.value.trim() || currentName;
        const newSpan = document.createElement('span');
        newSpan.id = 'userDisplayName';
        newSpan.className = nameDisplayElem.className;
        newSpan.innerText = newName;
        input.replaceWith(newSpan);
        editBtn.innerText = 'Edit';

        try {
          if (window.pixvinzDb && currentUsername) {
            const userDocRef = doc(db, 'players', currentUsername);
            await updateDoc(userDocRef, { displayName: newName });
          }
        } catch (err) {
          console.warn("Could not save display name to cloud:", err);
        }

        try {
          const userObj = JSON.parse(localStorage.getItem('loggedInUser')) || {};
          userObj.displayName = newName;
          localStorage.setItem('loggedInUser', JSON.stringify(userObj));
        } catch (err) {}
      };

      input.addEventListener('blur', saveAction);
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveAction();
      });
    }
  });
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

    if (['home', 'levels', 'collections', 'profileView'].includes(targetView)) {
      if (mainHeader) mainHeader.classList.remove('hidden');
      updateCoinDisplay();
    } else {
      if (mainHeader) mainHeader.classList.add('hidden');
    }

    if (targetView === 'profileView') {
      updateProfileStats();
      renderProfileBadges();
    }
  }

  window.showView = showView;

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

  const profileHeaderImg = document.getElementById('profileHeaderImg');
  const profileIconFallback = document.getElementById('profileIconFallback');

  [profileHeaderImg, profileIconFallback].forEach(element => {
    if (element) {
      const profileTrigger = element.closest('.profile-header-btn') || element.parentElement;
      if (profileTrigger && !profileTrigger.dataset.hasProfileListener) {
        profileTrigger.dataset.hasProfileListener = 'true';
        profileTrigger.addEventListener('click', async (e) => {
          e.preventDefault();
          if (typeof AudioManager !== 'undefined') AudioManager.playClick();
          await fetchCloudProfileData();
          showView('profileView');
        });
      }
    }
  });

  const skipLoading = localStorage.getItem('skipLoading') === 'true';
  const percentageElem = document.getElementById('loadingPercentage');
  const barFillElem = document.getElementById('loadingBarFill');

  async function finishLoading() {
      localStorage.removeItem('skipLoading');
      const loggedInUser = getCurrentUser();
      if (loggedInUser) {
          await fetchCloudProfileData();
          const freshUser = getCurrentUser();
          const nameElem = document.getElementById('userDisplayName');
          if (nameElem) nameElem.innerText = freshUser?.displayName || loggedInUser.displayName || 'Vinz';
          
          let currentUsername = loggedInUser.username || '';
          setupAvatarUploader(currentUsername);
          setupNameEditor(currentUsername);

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
      const totalDuration = 3000; // Optimized loading speed
      const intervalTime = 50;
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

        setupAvatarUploader(username);
        setupNameEditor(username);

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
        }

        if (userData && userData.password === pass) {
          localStorage.setItem('loggedInUser', JSON.stringify(userData));
          await fetchCloudProfileData();
          const freshUser = getCurrentUser();
          const nameElem = document.getElementById('userDisplayName');
          if (nameElem) nameElem.innerText = freshUser?.displayName || userData.displayName;

          setupAvatarUploader(username);
          setupNameEditor(username);

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
    playBtn.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      const cloudData = await fetchCloudProfileData();
      const currentLevel = cloudData?.level ?? parseInt(localStorage.getItem(getUserKey('currentLevel'))) ?? parseInt(getCurrentUser()?.level) ?? 1;
      window.location.href = `game.html?level=${currentLevel}`;
    });
  }

  const navLevels = document.getElementById('navLevels');
  if (navLevels) {
    navLevels.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      await fetchCloudProfileData();
      renderLevels();
      showView('levels');
    });
  }

  const navCollections = document.getElementById('navCollections');
  if (navCollections) {
    navCollections.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      await fetchCloudProfileData();
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

// --- DYNAMIC PROFILE STATS & CLOUD-SYNCED LEVEL/XP/COINS ---
async function updateProfileStats() {
  await fetchCloudProfileData();

  let currentLevel = 1;
  let totalCoins = 0;
  let currentXp = 0;

  try {
    const loggedUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (loggedUser) {
      if (loggedUser.level !== undefined) currentLevel = parseInt(loggedUser.level);
      if (loggedUser.coins !== undefined) totalCoins = parseInt(loggedUser.coins);
      if (loggedUser.xp !== undefined) currentXp = parseInt(loggedUser.xp);
      if (loggedUser.displayName) {
        const nameElem = document.getElementById('userDisplayName') || document.querySelector('.player-name');
        if (nameElem) nameElem.innerText = loggedUser.displayName;
      }
      if (loggedUser.avatar) {
        const avatarImg = document.getElementById('profileHeaderImg');
        const fallbackIcon = document.getElementById('profileIconFallback');
        if (avatarImg) {
          avatarImg.src = loggedUser.avatar;
          avatarImg.style.display = 'block';
        }
        if (fallbackIcon) fallbackIcon.style.display = 'none';
      }
    }
  } catch (e) {}

  if (currentXp === 0 && currentLevel > 1) {
    currentXp = (currentLevel - 1) * 500;
  }

  const coinHeaderElem = document.getElementById('coinCount');
  if (coinHeaderElem) coinHeaderElem.innerText = totalCoins;

  const coinBoxes = document.querySelectorAll('#profileView span, #profileView div');
  coinBoxes.forEach(box => {
    if (box.textContent.trim().match(/^\d+$/) && box.previousElementSibling && box.previousElementSibling.textContent.includes('🪙')) {
      box.innerText = totalCoins;
    }
  });

  document.querySelectorAll('#profileView').forEach(view => {
    const textNodes = document.createTreeWalker(view, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = textNodes.nextNode()) {
      if (node.nodeValue.includes('Level:')) {
        node.nodeValue = `Level: ${currentLevel}`;
      }
      if (node.nodeValue.includes('LEVEL 1') || node.nodeValue.includes('LEVEL ')) {
        node.nodeValue = `LEVEL ${currentLevel}`;
      }
    }
  });

  const levelBadges = document.querySelectorAll('#profileView .level-badge, #profileView div');
  levelBadges.forEach(el => {
    if (el.innerText && el.innerText.startsWith('LEVEL')) {
      el.innerText = `LEVEL ${currentLevel}`;
    }
  });

  const xpTextElem = Array.from(document.querySelectorAll('span, div')).find(el => el.textContent.includes('/ 500 XP') || el.textContent.includes('XP'));
  if (xpTextElem) {
    const xpTarget = currentLevel * 500;
    xpTextElem.innerText = `${currentXp} / ${xpTarget} XP`;
  }

  const progressBar = document.querySelector('#profileView .progress-bar-fill, #profileView div[style*="width"]');
  if (progressBar) {
    const percentage = Math.min(100, (currentXp % 500) / 5 * 1);
    progressBar.style.width = `${percentage}%`;
  }
}

// --- LEADERBOARD LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
  const navLeaderboard = document.getElementById('navLeaderboard');
  if (navLeaderboard) {
    navLeaderboard.addEventListener('click', async () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      document.querySelectorAll('[id$="View"]').forEach(view => view.classList.remove('active'));
      const leaderboardView = document.getElementById('leaderboardView');
      if (leaderboardView) leaderboardView.classList.add('active');
      await loadLeaderboardData();
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
}

// --- PROFILE BADGES RENDERING LOGIC ---
async function renderProfileBadges() {
    await fetchCloudProfileData();

    let playerLevel = 1;
    let playerCoins = 0;
    try {
        const loggedUser = JSON.parse(localStorage.getItem('loggedInUser'));
        if (loggedUser) {
            if (loggedUser.level !== undefined) playerLevel = parseInt(loggedUser.level);
            if (loggedUser.coins !== undefined) playerCoins = parseInt(loggedUser.coins);
        }
    } catch (e) {}

    const allBadges = [
        { title: 'Novice Genesis', desc: 'Completed Level 1', icon: 'image/badge1.png', unlocked: playerLevel >= 1 },
        { title: 'Thunderbolt', desc: 'Speed run (20-30) < 1m', icon: 'image/badge2.png', unlocked: window.player?.speedThunder === true },
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
    badgesContainer.style.gap = '16px 12px';

    allBadges.forEach(badge => {
        const isUnlocked = badge.unlocked;

        const badgeElement = document.createElement('div');
        badgeElement.className = 'badge-item';
        badgeElement.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 4px;
            width: 100%;
            box-sizing: border-box;
        `;

        badgeElement.innerHTML = `
            <div style="width: 84px; height: 82px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px; filter: ${isUnlocked ? 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.5))' : 'none'};">
                <img src="${badge.icon}" alt="${badge.title}" style="width: 100%; height: 100%; object-fit: contain; ${isUnlocked ? '' : 'filter: grayscale(100%); opacity: 0.35;'}">
            </div>
            <span class="badge-title" style="font-weight: 700; font-size: 10px; color: ${isUnlocked ? '#fff' : '#777'}; line-height: 1.2; margin-bottom: 2px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${badge.title}</span>
            <span class="badge-desc" style="font-size: 8px; color: ${isUnlocked ? '#bbb' : '#444'}; line-height: 1.1; width: 100%; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;">${badge.desc}</span>
        `;
        badgesContainer.appendChild(badgeElement);
    });
}
