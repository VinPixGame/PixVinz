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

  const logoutBtn = document.getElementById('logoutBtn'); // Make sure this matches your logout button's ID
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
            avatarImg.style.border = '3px solid #ffd700'; // fallback border or keep default
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





































/* =========================================================
   EXTRA CHALLENGE — MOVING VIDEO PUZZLE
   challenge1.webm → challenge100.webm
   ========================================================= */

const EXTRA_CHALLENGE_TOTAL = 100;

let currentChallenge = 1;
let challengeMoves = 0;
let challengeSeconds = 0;
let challengeTimerInterval = null;
let challengeStarted = false;
let challengeSolved = false;

let challengeTiles = [];
let challengeVideo = null;

/* ---------------------------------------------------------
   ELEMENTS
   --------------------------------------------------------- */

const navChallenge = document.getElementById("navChallenge");
const challengeView = document.getElementById("challengeView");
const backFromChallenge = document.getElementById("backFromChallenge");

const challengePuzzleGrid =
  document.getElementById("challengePuzzleGrid");

const challengeTitle =
  document.getElementById("challengeTitle");

const challengeTimer =
  document.getElementById("challengeTimer");

const challengeMovesDisplay =
  document.getElementById("challengeMoves");

const challengePreviewBtn =
  document.getElementById("challengePreviewBtn");

const challengeShuffleBtn =
  document.getElementById("challengeShuffleBtn");


/* =========================================================
   NAVIGATION
   ========================================================= */

if (navChallenge) {
  navChallenge.addEventListener("click", openExtraChallenge);
}

if (backFromChallenge) {
  backFromChallenge.addEventListener("click", closeExtraChallenge);
}

function openExtraChallenge() {

  if (!challengeView) return;

  /*
     Hide the currently visible normal views.
     This prevents Extra Challenge from appearing
     underneath another game screen.
  */
  document.querySelectorAll(".view").forEach(view => {
    view.classList.remove("active");
  });

  challengeView.classList.add("active");

  loadExtraChallenge(currentChallenge);
}


function closeExtraChallenge() {

  stopChallengeTimer();

  if (challengeView) {
    challengeView.classList.remove("active");
  }

  /*
     Return to Home.
     Change this ID only if your Home view
     uses a different ID.
  */
  const homeView = document.getElementById("homeView");

  if (homeView) {
    document.querySelectorAll(".view").forEach(view => {
      view.classList.remove("active");
    });

    homeView.classList.add("active");
  }
}


/* =========================================================
   LOAD CHALLENGE
   ========================================================= */

function loadExtraChallenge(number) {

  if (number < 1) number = 1;
  if (number > EXTRA_CHALLENGE_TOTAL) number = 1;

  currentChallenge = number;

  challengeMoves = 0;
  challengeSeconds = 0;
  challengeStarted = false;
  challengeSolved = false;

  stopChallengeTimer();

  updateChallengeUI();

  if (challengeTitle) {
    challengeTitle.textContent =
      `CHALLENGE ${String(number).padStart(2, "0")}`;
  }

  createVideoPuzzle(number);
}


/* =========================================================
   CREATE VIDEO PUZZLE
   ========================================================= */

function createVideoPuzzle(number) {

  if (!challengePuzzleGrid) return;

  challengePuzzleGrid.innerHTML = "";

  challengeTiles = [];

  /*
     One video element is used as the source.
     The nine tiles will display different portions
     of the same video using CSS object positioning.
  */

  challengeVideo = document.createElement("video");

  challengeVideo.src = `image/challenge${number}.webm`;

  challengeVideo.muted = true;
  challengeVideo.loop = true;
  challengeVideo.autoplay = true;
  challengeVideo.playsInline = true;
  challengeVideo.preload = "auto";

  challengeVideo.style.position = "fixed";
  challengeVideo.style.width = "1px";
  challengeVideo.style.height = "1px";
  challengeVideo.style.opacity = "0";
  challengeVideo.style.pointerEvents = "none";

  document.body.appendChild(challengeVideo);

  challengeVideo.addEventListener(
    "loadeddata",
    () => {

      /*
         Start the video.
      */
      challengeVideo.play().catch(() => {});

      buildChallengeTiles();

      shuffleChallengeTiles();

      updateChallengeUI();
    },
    { once: true }
  );

  challengeVideo.addEventListener("error", () => {

    console.error(
      `Unable to load Extra Challenge video:
image/challenge${number}.webm`
    );

    if (challengeTitle) {
      challengeTitle.textContent =
        `CHALLENGE ${String(number).padStart(2, "0")}`;
    }
  });

  /*
     Force loading in case browser has not started
     loading the video automatically.
  */
  challengeVideo.load();
}


/* =========================================================
   BUILD 3 × 3 VIDEO TILES
   ========================================================= */

function buildChallengeTiles() {

  challengePuzzleGrid.innerHTML = "";

  challengeTiles = [];

  for (let i = 0; i < 9; i++) {

    const tile = document.createElement("div");

    tile.className = "tile challenge-video-tile";

    tile.dataset.correctPosition = i;
    tile.dataset.currentPosition = i;

    /*
       Keep the video visible through the tile.
    */
    const video = document.createElement("video");

    video.src = challengeVideo.src;

    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "auto";

    /*
       All tile videos use the same timeline.
    */
    video.currentTime = challengeVideo.currentTime || 0;

    /*
       Video fills the tile.
    */
    video.style.width = "300%";
    video.style.height = "300%";
    video.style.maxWidth = "none";
    video.style.maxHeight = "none";
    video.style.position = "absolute";

    video.style.objectFit = "cover";

    /*
       Calculate the position of this piece.

       0 = top-left
       1 = top-center
       2 = top-right
       3 = middle-left
       ...
       8 = bottom-right
    */

    const row = Math.floor(i / 3);
    const col = i % 3;

    video.style.left = `${-col * 100}%`;
    video.style.top = `${-row * 100}%`;

    /*
       Tile container needs to hide the other
       portions of the video.
    */

    tile.style.position = "relative";
    tile.style.overflow = "hidden";

    tile.appendChild(video);

    challengePuzzleGrid.appendChild(tile);

    challengeTiles.push(tile);

    /*
       Start tile video.
    */
    video.play().catch(() => {});
  }

  synchronizeChallengeVideos();
}


/* =========================================================
   SYNCHRONIZE ALL VIDEO TILES
   ========================================================= */

function synchronizeChallengeVideos() {

  if (!challengeVideo) return;

  const masterTime = challengeVideo.currentTime;

  challengeTiles.forEach(tile => {

    const video = tile.querySelector("video");

    if (!video) return;

    try {
      video.currentTime = masterTime;
    } catch (error) {
      /* Browser may temporarily block seeking. */
    }

    video.play().catch(() => {});
  });
}


/*
   Keep the nine videos synchronized with the hidden
   master video.
*/

setInterval(() => {

  if (
    !challengeVideo ||
    challengeVideo.paused ||
    challengeVideo.readyState < 2
  ) {
    return;
  }

  const masterTime = challengeVideo.currentTime;

  challengeTiles.forEach(tile => {

    const video = tile.querySelector("video");

    if (!video) return;

    /*
       Only correct meaningful drift.
    */
    if (Math.abs(video.currentTime - masterTime) > 0.08) {

      try {
        video.currentTime = masterTime;
      } catch (error) {}
    }

    if (video.paused) {
      video.play().catch(() => {});
    }
  });

}, 200);


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffleChallengeTiles() {

  if (challengeTiles.length !== 9) return;

  /*
     Fisher-Yates shuffle.
  */

  let shuffled;

  do {

    shuffled = [...challengeTiles];

    for (let i = shuffled.length - 1; i > 0; i--) {

      const j = Math.floor(Math.random() * (i + 1));

      [shuffled[i], shuffled[j]] =
        [shuffled[j], shuffled[i]];
    }

  } while (isChallengeSolvedOrder(shuffled));

  challengePuzzleGrid.innerHTML = "";

  shuffled.forEach((tile, position) => {

    tile.dataset.currentPosition = position;

    challengePuzzleGrid.appendChild(tile);

  });

  challengeTiles = shuffled;

  challengeSolved = false;
}


/* =========================================================
   CHECK SOLVED ORDER
   ========================================================= */

function isChallengeSolvedOrder(tiles) {

  return tiles.every((tile, index) => {

    return Number(tile.dataset.correctPosition) === index;

  });
}


/* =========================================================
   TILE SWAPPING
   ========================================================= */

challengePuzzleGrid?.addEventListener("click", event => {

  const tile = event.target.closest(".challenge-video-tile");

  if (!tile) return;

  if (challengeSolved) return;

  const clickedIndex =
    challengeTiles.indexOf(tile);

  if (clickedIndex === -1) return;

  /*
     Start timer on first move.
  */

  if (!challengeStarted) {

    challengeStarted = true;

    startChallengeTimer();
  }

  /*
     Find another tile to swap with.

     For now this uses adjacent tiles so the puzzle
     behaves like a proper sliding-style puzzle.
  */

  const possibleMoves =
    getAdjacentChallengePositions(clickedIndex);

  if (possibleMoves.length === 0) return;

  /*
     Choose an adjacent tile.

     If you want tap-to-select + tap-to-swap later,
     we can change this.
  */

  const swapIndex =
    possibleMoves[
      Math.floor(Math.random() * possibleMoves.length)
    ];

  swapChallengeTiles(clickedIndex, swapIndex);
});


/* =========================================================
   GET ADJACENT TILE POSITIONS
   ========================================================= */

function getAdjacentChallengePositions(index) {

  const row = Math.floor(index / 3);
  const col = index % 3;

  const positions = [];

  if (row > 0) {
    positions.push(index - 3);
  }

  if (row < 2) {
    positions.push(index + 3);
  }

  if (col > 0) {
    positions.push(index - 1);
  }

  if (col < 2) {
    positions.push(index + 1);
  }

  return positions;
}


/* =========================================================
   SWAP TILES
   ========================================================= */

function swapChallengeTiles(firstIndex, secondIndex) {

  const firstTile =
    challengeTiles[firstIndex];

  const secondTile =
    challengeTiles[secondIndex];

  if (!firstTile || !secondTile) return;

  /*
     Swap array positions.
  */

  [
    challengeTiles[firstIndex],
    challengeTiles[secondIndex]
  ] = [
    challengeTiles[secondIndex],
    challengeTiles[firstIndex]
  ];

  /*
     Rebuild visual order.
  */

  challengePuzzleGrid.innerHTML = "";

  challengeTiles.forEach((tile, index) => {

    tile.dataset.currentPosition = index;

    challengePuzzleGrid.appendChild(tile);

  });

  challengeMoves++;

  updateChallengeUI();

  checkChallengeSolved();
}


/* =========================================================
   SOLVED CHECK
   ========================================================= */

function checkChallengeSolved() {

  const solved =
    challengeTiles.every((tile, index) => {

      return Number(tile.dataset.correctPosition) === index;

    });

  if (!solved) return;

  challengeSolved = true;

  stopChallengeTimer();

  /*
     Small delay so the player can see the completed
     moving image before the victory screen appears.
  */

  setTimeout(() => {

    handleChallengeVictory();

  }, 500);
}


/* =========================================================
   VICTORY
   ========================================================= */

function handleChallengeVictory() {

  console.log(
    `Extra Challenge ${currentChallenge} completed!`
  );

  /*
     If your existing victory function exists,
     use it here.

     Common possible function names can be added later.
  */

  if (typeof showVictoryScreen === "function") {

    showVictoryScreen(
      currentChallenge,
      challengeSeconds,
      challengeMoves
    );

    return;
  }

  if (typeof showVictory === "function") {

    showVictory(
      currentChallenge,
      challengeSeconds,
      challengeMoves
    );

    return;
  }

  /*
     Fallback if your existing game doesn't have
     a victory function available yet.
  */

  setTimeout(() => {

    if (currentChallenge < EXTRA_CHALLENGE_TOTAL) {

      currentChallenge++;

      loadExtraChallenge(currentChallenge);

    } else {

      alert(
        "Congratulations! You completed all 100 Extra Challenges!"
      );

    }

  }, 300);
}


/* =========================================================
   TIMER
   ========================================================= */

function startChallengeTimer() {

  stopChallengeTimer();

  challengeTimerInterval =
    setInterval(() => {

      challengeSeconds++;

      updateChallengeTimer();

    }, 1000);
}


function stopChallengeTimer() {

  if (challengeTimerInterval) {

    clearInterval(challengeTimerInterval);

    challengeTimerInterval = null;
  }
}


/* =========================================================
   UPDATE TIMER
   ========================================================= */

function updateChallengeTimer() {

  if (!challengeTimer) return;

  const minutes =
    Math.floor(challengeSeconds / 60);

  const seconds =
    challengeSeconds % 60;

  challengeTimer.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


/* =========================================================
   UPDATE UI
   ========================================================= */

function updateChallengeUI() {

  updateChallengeTimer();

  if (challengeMovesDisplay) {

    challengeMovesDisplay.textContent =
      challengeMoves;
  }
}


/* =========================================================
   SHUFFLE BUTTON
   ========================================================= */

if (challengeShuffleBtn) {

  challengeShuffleBtn.addEventListener(
    "click",
    () => {

      if (challengeSolved) return;

      shuffleChallengeTiles();

      /*
         Reset timer/moves when manually reshuffling.
      */

      challengeMoves = 0;
      challengeSeconds = 0;

      challengeStarted = false;

      stopChallengeTimer();

      updateChallengeUI();
    }
  );
}


/* =========================================================
   PREVIEW BUTTON
   ========================================================= */

if (challengePreviewBtn) {

  challengePreviewBtn.addEventListener(
    "click",
    showChallengePreview
  );
}


function showChallengePreview() {

  if (!challengeVideo) return;

  /*
     Temporarily show the complete video in the puzzle area.
  */

  challengePuzzleGrid.classList.add(
    "challenge-preview-mode"
  );

  /*
     Hide individual tiles.
  */

  challengeTiles.forEach(tile => {

    tile.style.display = "none";

  });

  const previewVideo =
    document.createElement("video");

  previewVideo.src = challengeVideo.src;

  previewVideo.muted = true;
  previewVideo.autoplay = true;
  previewVideo.loop = true;
  previewVideo.playsInline = true;

  previewVideo.className =
    "challenge-full-preview-video";

  challengePuzzleGrid.appendChild(previewVideo);

  /*
     Keep preview at the same point in the video.
  */

  previewVideo.currentTime =
    challengeVideo.currentTime;

  previewVideo.play().catch(() => {});

  /*
     Preview lasts 3 seconds.
  */

  setTimeout(() => {

    previewVideo.remove();

    challengeTiles.forEach(tile => {

      tile.style.display = "";

    });

    challengePuzzleGrid.classList.remove(
      "challenge-preview-mode"
    );

    synchronizeChallengeVideos();

  }, 3000);
}


/* =========================================================
   CLEANUP
   ========================================================= */

function destroyChallengeVideo() {

  stopChallengeTimer();

  if (challengeVideo) {

    challengeVideo.pause();

    challengeVideo.removeAttribute("src");

    challengeVideo.load();

    challengeVideo.remove();

    challengeVideo = null;
  }

  challengeTiles = [];

  if (challengePuzzleGrid) {

    challengePuzzleGrid.innerHTML = "";
  }
}


/* =========================================================
   OPTIONAL: START AT CHALLENGE 1
   ========================================================= */

currentChallenge = 1;
