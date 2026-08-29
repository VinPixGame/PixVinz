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


// --- DEDICATED LOADING SCREEN SCRIPT ---
document.addEventListener('DOMContentLoaded', () => {
    const loadingView = document.getElementById('loadingView');
    if (!loadingView) return;

    // 1. Check if user is already logged in (handles page refresh) OR coming from auth.html
    const skipLoading = localStorage.getItem('skipLoading') === 'true';
    const storedUser = localStorage.getItem('loggedInUser');

    if (skipLoading || storedUser) {
        // Clear the flag if it was set
        localStorage.removeItem('skipLoading');
        
        if (storedUser) {
            // Instantly skip loader, go straight to homeView, and show the top bar
            loadingView.classList.remove('active');
            const homeView = document.getElementById('homeView');
            const mainHeader = document.getElementById('mainHeader');
            
            if (homeView) homeView.classList.add('active');
            if (mainHeader) mainHeader.classList.remove('hidden'); // Ensures the top bar appears!
            
            if (typeof playMainBGM === 'function') playMainBGM();
            return; // Stop the script here so the timer never runs
        } else {
            window.location.href = 'auth.html';
            return;
        }
    }

    // 2. Play the logo video explicitly (Only runs for cold visits when NOT logged in)
    const logoVideo = document.getElementById('loadingLogo');
    if (logoVideo) {
        logoVideo.play().catch(err => console.log("Video play prevented:", err));
    }

    // 3. Grab elements for normal timer
    const percentageElem = document.getElementById('loadingPercentage');
    const barFillElem = document.getElementById('loadingBarFill');

    // 4. Animation and Timer logic (6 seconds total)
    const startTime = Date.now();
    const minLoadingTime = 6000; // 6 seconds

    function updateProgress() {
        const elapsedTime = Date.now() - startTime;
        let percent = Math.floor((elapsedTime / minLoadingTime) * 100);

        if (percent < 1) percent = 1;
        if (percent > 100) percent = 100;

        // Update DOM
        if (percentageElem) percentageElem.innerText = `${percent}%`;
        if (barFillElem) barFillElem.style.width = `${percent}%`;

        if (elapsedTime < minLoadingTime) {
            // Keep looping every 50ms for smooth progress
            setTimeout(updateProgress, 50);
        } else {
            // Finished! Ensure 100% and transition
            if (percentageElem) percentageElem.innerText = '100%';
            if (barFillElem) barFillElem.style.width = '100%';

            setTimeout(() => {
                const finalStoredUser = localStorage.getItem('loggedInUser');
                
                if (finalStoredUser) {
                    loadingView.classList.remove('active');
                    const homeView = document.getElementById('homeView');
                    const mainHeader = document.getElementById('mainHeader');
                    
                    if (homeView) homeView.classList.add('active');
                    if (mainHeader) mainHeader.classList.remove('hidden'); // Shows top bar on normal load too
                } else {
                    window.location.href = 'auth.html';
                }
            }, 200);
        }
    }

    // Kick off the progress bar loop
    updateProgress();
});


// --- AVATAR LOADER FIX (Account-Specific + Default Fallback) ---
document.addEventListener('DOMContentLoaded', () => {
    let currentUsername = '';
    try {
        const user = JSON.parse(localStorage.getItem('loggedInUser'));
        if (user && user.username) currentUsername = user.username;
    } catch (e) {}

    const avatarImg = document.getElementById('profileHeaderImg');
    const fallbackIcon = document.getElementById('profileIconFallback');

    if (avatarImg && fallbackIcon) {
        const userCustomAvatar = currentUsername ? localStorage.getItem(`${currentUsername}_vinpix_avatar`) : null;
        
        if (userCustomAvatar) {
            avatarImg.src = userCustomAvatar;
            avatarImg.style.display = 'block';
            fallbackIcon.style.display = 'none';
        } else {
            avatarImg.src = 'image/avatar.png';
            avatarImg.style.display = 'block';
            fallbackIcon.style.display = 'none';
        }
    }
});


// Populate the user's display name on the home page view
const loggedInUser = localStorage.getItem('loggedInUser');
if (loggedInUser) {
    try {
        const user = JSON.parse(loggedInUser);
        const nameEl = document.getElementById('userDisplayName');
        if (nameEl && user.displayName) {
            nameEl.innerText = user.displayName;
        }
    } catch (err) {
        console.error("Could not load display name:", err);
    }
}

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

  function updateCoinDisplay() {
    const coinKey = getUserKey('totalCoins');
    const totalCoins = parseInt(localStorage.getItem(coinKey)) || 0;
    
    // Target all elements displaying the coin count
    document.querySelectorAll('#coinCount, .coin-display, [data-coin-count]').forEach(el => {
      el.textContent = totalCoins;
    });
  }
  
  // Expose it globally so other views/scripts can trigger it
  window.updateCoinDisplay = updateCoinDisplay;

  // Run it immediately on load
  updateCoinDisplay();

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
                  
                  // Refresh stats right before showing the view!
                  if (typeof updateXpProgress === 'function') updateXpProgress();
                  if (typeof updateProfileStats === 'function') updateProfileStats();
                  if (typeof checkAndUnlockBadges === 'function') checkAndUnlockBadges();
                  if (typeof loadProfileGlobalRank === 'function') loadProfileGlobalRank();

                  showView('profileView');
              });
          }
      }
  });

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

  document.addEventListener('click', (event) => {
    if (event.target.closest('#openSettings')) {
      document.getElementById('profileView')?.classList.add('hidden');
      document.getElementById('settingsView')?.classList.remove('hidden');
    }

    if (event.target.closest('#closeSettingsModal')) {
      document.getElementById('settingsView')?.classList.add('hidden');
      document.getElementById('profileView')?.classList.remove('hidden');
    }
  });
    
  const sfxToggle = document.getElementById('sfxToggle');
  if (sfxToggle) {
    sfxToggle.addEventListener('change', (e) => {
      if (typeof AudioManager !== 'undefined') {
        AudioManager.setSFX(e.target.checked);
        if (e.target.checked) AudioManager.playClick();
      }
    });
  }

  const musicToggle = document.getElementById('musicToggle');
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
      const aboutModal = document.getElementById('aboutModal');
      if (aboutModal) aboutModal.classList.remove('hidden');
    });
  }

  const closeAboutModal = document.getElementById('closeAboutModal');
  if (closeAboutModal) {
    closeAboutModal.addEventListener('click', () => {
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      const aboutModal = document.getElementById('aboutModal');
      if (aboutModal) aboutModal.classList.add('hidden');
    });
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Clear the session data
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('skipLoading');
        
        // Redirect to the login/register page
        window.location.href = 'auth.html';
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
      btn.style.setProperty('--level-bg', `url('image/level${i}.png')`);

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
          <img src="image/level${i}.png" alt="Level ${i}">
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
    const data = (typeof collectionData !== 'undefined') ? collectionData[levelNum] : null;

    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalPreviewImg');
    const modalTitle = document.getElementById('modalLevelTitle');
    const imageTitle = document.getElementById('modalImageTitle');
    const locationSubtitle = document.getElementById('modalLocationSubtitle');

    if (modalTitle) modalTitle.innerText = `LEVEL ${levelNum.toString().padStart(2, '0')}`;
    
    if (data) {
      if (imageTitle) imageTitle.innerText = data.name ? `"${data.name}"` : "";
      if (locationSubtitle) locationSubtitle.innerText = data.location ? `(${data.location})` : "";
      if (modalImg) modalImg.src = data.image || `image/level${levelNum}.png`;
    } else {
      if (imageTitle) imageTitle.innerText = "";
      if (locationSubtitle) locationSubtitle.innerText = "";
      if (modalImg) modalImg.src = `image/level${levelNum}.png`;
    }

    if (modal) {
      modal.classList.remove('hidden');
      modal.style.display = 'flex';
    }
  }

  function closeImageModal() {
    if (typeof AudioManager !== 'undefined') AudioManager.playClick();
    const modal = document.getElementById('imageModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  }

  const closeImgModalBtn = document.getElementById('closeImageModal');
  if (closeImgModalBtn) closeImgModalBtn.addEventListener('click', closeImageModal);

  const imgModal = document.getElementById('imageModal');
  if (imgModal) {
    imgModal.addEventListener('click', (e) => {
      if (e.target.id === 'imageModal') {
        closeImageModal();
      }
    });
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
        let avatarHTML = '';

        const avatarSrc = player.avatar ? player.avatar : 'image/avatar.png';

        if (rank === 1) {
            specialStyle = 'background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(20, 20, 20, 0.95)); border: 1px solid rgba(255, 215, 0, 0.6);';
            frameStyle = 'border: 3px solid #ffd700;';
            rankBadgeHTML = `
                <div style="min-width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
                    <img src="image/rank1.png" alt="#1" style="width: 44px; height: 44px; object-fit: contain;">
                </div>
            `;
            avatarHTML = `
                <div style="position: relative; width: 48px; height: 48px; margin: 0 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    <span style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); font-size: 18px; z-index: 3; filter: drop-shadow(0 0 6px #ffd700);">👑</span>
                    <img src="${avatarSrc}" alt="${player.name}" class="leaderboard-avatar-img" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; cursor: pointer; ${frameStyle} position: relative; z-index: 2;">
                </div>
            `;
        } else if (rank === 2) {
            specialStyle = 'background: linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(20, 20, 20, 0.95)); border: 1px solid rgba(192, 192, 192, 0.6);';
            frameStyle = 'border: 3px solid #00e5ff;';
            rankBadgeHTML = `
                <div style="min-width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
                    <img src="image/rank2.png" alt="#2" style="width: 44px; height: 44px; object-fit: contain;">
                </div>
            `;
            avatarHTML = `
                <div style="position: relative; width: 48px; height: 48px; margin: 0 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    <span style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); font-size: 18px; z-index: 3; filter: drop-shadow(0 0 6px #c0c0c0) brightness(1.3);">👑</span>
                    <img src="${avatarSrc}" alt="${player.name}" class="leaderboard-avatar-img" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; cursor: pointer; ${frameStyle} position: relative; z-index: 2;">
                </div>
            `;
        } else if (rank === 3) {
            specialStyle = 'background: linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(20, 20, 20, 0.95)); border: 1px solid rgba(205, 127, 50, 0.6);';
            frameStyle = 'border: 3px solid #ff9933;';
            rankBadgeHTML = `
                <div style="min-width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
                    <img src="image/rank3.png" alt="#3" style="width: 44px; height: 44px; object-fit: contain;">
                </div>
            `;
            avatarHTML = `
                <div style="position: relative; width: 48px; height: 48px; margin: 0 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    <span style="position: absolute; top: -14px; left: 50%; transform: translateX(-50%); font-size: 18px; z-index: 3; filter: drop-shadow(0 0 6px #cd7f32) sepia(1) hue-rotate(10deg);">👑</span>
                    <img src="${avatarSrc}" alt="${player.name}" class="leaderboard-avatar-img" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; cursor: pointer; ${frameStyle} position: relative; z-index: 2;">
                </div>
            `;
        } else {
            rankBadgeHTML = `<span style="min-width: 48px; text-align: center; font-weight: bold; font-size: 16px; color: #aaa;">#${rank}</span>`;
            avatarHTML = `
                <div style="position: relative; width: 48px; height: 48px; margin: 0 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                    <img src="${avatarSrc}" alt="${player.name}" class="leaderboard-avatar-img" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; cursor: pointer; ${frameStyle}">
                </div>
            `;
        }

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
                ${avatarHTML}
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

    // Dynamic Crown & Border Logic for Top 3 vs Rank 4+
    const avatarImg = document.getElementById('profileModalAvatar');
    const crownDiv = document.getElementById('profileModalCrown');
    
    if (avatarImg) {
        if (rank === 1) {
            if (crownDiv) {
                crownDiv.style.display = 'block';
                crownDiv.style.filter = 'drop-shadow(0 0 8px #ffd700)';
            }
            avatarImg.style.border = '3px solid #ffd700';
            avatarImg.style.boxShadow = '0 0 18px rgba(255,215,0,0.7)';
        } else if (rank === 2) {
            if (crownDiv) {
                crownDiv.style.display = 'block';
                crownDiv.style.filter = 'drop-shadow(0 0 8px #c0c0c0) brightness(1.3)';
            }
            avatarImg.style.border = '3px solid #00e5ff';
            avatarImg.style.boxShadow = '0 0 18px rgba(0,229,255,0.7)';
        } else if (rank === 3) {
            if (crownDiv) {
                crownDiv.style.display = 'block';
                crownDiv.style.filter = 'drop-shadow(0 0 8px #cd7f32) sepia(1) hue-rotate(10deg)';
            }
            avatarImg.style.border = '3px solid #ff9933';
            avatarImg.style.boxShadow = '0 0 18px rgba(255,153,51,0.7)';
        } else {
            // Rank 4 and below: Hide crown and clear special styling
            if (crownDiv) {
                crownDiv.style.display = 'none';
            }
            avatarImg.style.border = '3px solid #ffd700';
            avatarImg.style.boxShadow = '0 0 18px rgba(255,215,0,0.7)';
        }
    }
    
    // Custom image badge data with unique glow colors
    const allBadges = [
        { 
            title: 'Novice Genesis', 
            desc: 'Completed Level 1', 
            icon: 'image/badge1.png', 
            unlocked: playerLevel >= 1, 
            glowColor: '#00ffcc'
        },
        { 
            title: 'Thunderbolt', 
            desc: 'Speed run (20-30) < 1m', 
            icon: 'image/badge2.png', 
            unlocked: player.speedThunder === true || player.speedThunderUnlocked === true, 
            glowColor: '#00e5ff'
        },
        { 
            title: 'Aurelian Vault', 
            desc: 'Reached 500 coins', 
            icon: 'image/badge3.png', 
            unlocked: playerCoins >= 500, 
            glowColor: '#ffd700'
        },
        { 
            title: 'Celestial Elite', 
            desc: 'Reached Level 50', 
            icon: 'image/badge4.png', 
            unlocked: playerLevel >= 50, 
            glowColor: '#ff00aa'
        },
        { 
            title: 'Grand Sovereign', 
            desc: 'Reached Level 75', 
            icon: 'image/badge5.png', 
            unlocked: playerLevel >= 75, 
            glowColor: '#b000ff'
        },
        { 
            title: 'Imperial Crown', 
            desc: 'Reached Level 100', 
            icon: 'image/badge6.png', 
            unlocked: playerLevel >= 100, 
            glowColor: '#ff2255'
        },
        { 
            title: 'Infernal Apex', 
            desc: 'Reached Level 150', 
            icon: 'image/badge7.png', 
            unlocked: playerLevel >= 150, 
            glowColor: '#ff5500'
        },
        { 
            title: 'Mythical Deity', 
            desc: 'Reached Level 200', 
            icon: 'image/badge8.png', 
            unlocked: playerLevel >= 200, 
            glowColor: '#00ffff'
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
            cursor: pointer;
        `;

        badgeElement.innerHTML = `
            <img src="${badge.icon}" alt="${badge.title}" style="width: 64px; height: 64px; object-fit: contain; margin-bottom: 6px; background: transparent; border: none; box-shadow: none; ${isUnlocked ? '' : 'filter: grayscale(100%);'}">
            <span style="font-weight: 700; font-size: 11px; color: ${isUnlocked ? '#fff' : '#777'}; letter-spacing: 0.3px; line-height: 1.2; margin-bottom: 2px;">${badge.title}</span>
            <span style="font-size: 8px; color: ${isUnlocked ? '#bbb' : '#444'}; line-height: 1.1;">${badge.desc}</span>
        `;

        // Click handler to display enlarged badge popup
        badgeElement.onclick = () => showBadgeModal(badge.icon, badge.title, badge.desc, badge.glowColor, isUnlocked);

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
        
        container.style.position = 'absolute';
        container.style.top = '140px';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = 'calc(100% - 140px)';
        container.style.overflow = 'hidden';
        container.style.pointerEvents = 'none';

        const lbView = document.getElementById('leaderboardView');
        if (lbView) {
            if (window.getComputedStyle(lbView).position === 'static') {
                lbView.style.position = 'relative';
            }
            lbView.appendChild(container);
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

document.addEventListener('DOMContentLoaded', () => {
    initLeaderboardConfetti();
});

// Force full-screen API if supported and running standalone
if (window.matchMedia('(display-mode: fullscreen)').matches || window.matchMedia('(display-mode: standalone)').matches) {
  document.addEventListener('click', () => {
    if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log("Fullscreen request skipped or denied:", err);
      });
    }
  }, { once: true });
}




document.addEventListener('DOMContentLoaded', () => {
  const navChallenge = document.getElementById('navChallenge');
  if (navChallenge) {
    navChallenge.addEventListener('click', () => {
      window.location.href = 'challenge.html';
    });
  }
});


// Function to handle switching views (including the Shop)
function showView(viewId) {
  // Hide all view sections
  const views = document.querySelectorAll('.view');
  views.forEach(view => {
    view.classList.remove('active');
    view.classList.add('hidden');
  });

  // Show the requested view
  const targetView = document.getElementById(viewId);
  if (targetView) {
    targetView.classList.remove('hidden');
    targetView.classList.add('active');
  }
}

// Function to handle buying shop items
function buyItem(itemName, price) {
  console.log(`Attempting to purchase: ${itemName} for ${price}`);
  
  // Example purchase logic
  alert(`Thank you for selecting ${itemName} (${price})! Purchase processing coming soon.`);
}
