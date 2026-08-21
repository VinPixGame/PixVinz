// --- LOCAL STORAGE BRIDGE (Firebase Removed) ---
window.pixvinzDb = null;

document.addEventListener('DOMContentLoaded', () => {
    // Force load/preload all logo videos across the document upon opening
    const logoVideos = document.querySelectorAll('video#logoVideo, video#loadingLogo, .auth-logo video, .about-logo video');
    logoVideos.forEach(video => {
        video.load();
        video.play().catch(() => {});
    });

    // --- 1. LOADING SCREEN & 6-SECOND GUARANTEED PRELOADER ---
    const loadingView = document.getElementById('loadingView');
    
    // If there is no loadingView on this page (like in auth.html), skip this block entirely!
    if (!loadingView) return;

    const skipLoading = localStorage.getItem('skipLoading') === 'true';
    const percentageElem = document.getElementById('loadingPercentage');
    const barFillElem = document.getElementById('loadingBarFill');

    async function finishLoading() {
        localStorage.removeItem('skipLoading');
        
        const storedUser = localStorage.getItem('loggedInUser');
        let currentUser = null;
        if (storedUser) {
            try {
                currentUser = JSON.parse(storedUser);
            } catch (e) {
                currentUser = null;
            }
        }

        if (currentUser) {
            const homeView = document.getElementById('homeView');
            const mainHeader = document.getElementById('mainHeader');

            if (loadingView) loadingView.classList.remove('active');
            if (homeView) homeView.classList.add('active');
            if (mainHeader) mainHeader.classList.remove('hidden');

            if (typeof playMainBGM === 'function') playMainBGM();
        } else {
            window.location.href = 'auth.html';
        }
    }
      
    if (skipLoading) {
        finishLoading();
    } else {
        const startTime = Date.now();
        const minLoadingTime = 6000;

        if (percentageElem) percentageElem.innerText = '1%';
        if (barFillElem) barFillElem.style.width = '1%';

        const checkCompletion = () => {
            const elapsedTime = Date.now() - startTime;
            let percent = Math.floor((elapsedTime / minLoadingTime) * 100);
            
            if (percent < 1) percent = 1;
            if (percent > 100) percent = 100;

            if (percentageElem) percentageElem.innerText = `${percent}%`;
            if (barFillElem) barFillElem.style.width = `${percent}%`;

            if (elapsedTime >= minLoadingTime) {
                if (percentageElem) percentageElem.innerText = '100%';
                if (barFillElem) barFillElem.style.width = '100%';
                setTimeout(finishLoading, 200);
            } else {
                setTimeout(checkCompletion, 100);
            }
        };

        setTimeout(checkCompletion, 100);
    }
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

// --- LEADERBOARD LOGIC (Local Storage Version) ---
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

    // Pull mock player info from localStorage or current user
    if (currentUsername) {
        const currentUser = JSON.parse(localStorage.getItem('loggedInUser')) || {
            username: currentUsername,
            displayName: currentUsername,
            coins: 0,
            xp: 0,
            level: 1,
            avatar: ''
        };
        players.push({
            username: currentUser.username,
            name: currentUser.displayName || currentUser.username,
            coins: currentUser.coins || 0,
            xp: currentUser.xp || 0,
            level: currentUser.level || 1,
            avatar: currentUser.avatar || ''
        });
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

    players.forEach((player, index) => {
        const rank = index + 1;
        let rankBadgeHTML = `<span style="min-width: 48px; text-align: center; font-weight: bold; font-size: 16px; color: #aaa;">#${rank}</span>`;
        let specialStyle = '';
        let frameStyle = 'border: 2px solid rgba(255,255,255,0.2);';
        const avatarSrc = player.avatar ? player.avatar : 'image/avatar.png';

        const avatarHTML = `
            <div style="position: relative; width: 48px; height: 48px; margin: 0 14px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <img src="${avatarSrc}" alt="${player.name}" class="leaderboard-avatar-img" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; cursor: pointer; ${frameStyle}">
            </div>
        `;

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


