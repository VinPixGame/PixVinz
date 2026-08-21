// ==========================================
// PIXVINZ - PROFILE SCRIPT (ROBUST & SYNCED)
// ==========================================

function getCurrentUsername() {
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj && userObj.username) {
            return userObj.username;
        }
    } catch (e) {}
    return localStorage.getItem('vinpix_username') || '';
}

function getUserKey(keyName) {
    const username = getCurrentUsername();
    return `${username}_${keyName}`;
}

function goHome() {
    localStorage.setItem('skipLoading', 'true');
    
    if (typeof showView === 'function') {
        showView('home');     
        fetchUserDataFromFirestore();
        
    } else {
        const homeViewElement = document.getElementById('homeView') || window.parent.document.getElementById('homeView');
        if (homeViewElement && typeof window.parent.showView === 'function') {
            window.parent.showView('home');
        } else {
            window.location.href = 'index.html';
        }
    }
}

// --- SAFE CLOUD SYNC (UPLOAD) ---
async function saveUserDataToCloud() {
    try {
        if (!window.pixvinzDb || !window.pixvinzDb.db) return;
        const { db, doc, setDoc } = window.pixvinzDb;
        const username = getCurrentUsername();
        if (!username) return;

        let displayName = username;
        try {
            const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
            if (userObj && userObj.displayName) displayName = userObj.displayName;
        } catch (e) {}

        const currentLevel = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;
        const totalCoins = parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0;
        const avatar = localStorage.getItem(getUserKey('vinpix_avatar')) || '';

        const puzzlesSolved = Math.max(0, currentLevel - 1);
        const playerProgression = calculateLevelAndXp(puzzlesSolved);
        const currentXpVal = playerProgression.currentXp;

        // GRAB LOCAL DAILY REWARD STATE TO UPLOAD TO CLOUD
        const dailyStorageKey = getDailyStorageKey();
        const dailyDataStr = localStorage.getItem(dailyStorageKey);
        const dailyRewardState = dailyDataStr ? JSON.parse(dailyDataStr) : { streak: 0, lastClaimDate: "" };

        const userDocRef = doc(db, "players", username);
        await setDoc(userDocRef, {
            username: username,
            displayName: displayName,
            level: currentLevel,
            xp: currentXpVal,
            coins: totalCoins,
            avatar: avatar,
            dailyRewardState: dailyRewardState, // <-- Saves the claim status to cloud!
            lastUpdated: new Date()
        }, { merge: true });
    } catch (error) {
        console.warn("Cloud sync skipped or failed safely:", error);
    }
}

// --- FETCH & SYNC FROM FIRESTORE (DOWNLOAD) ---
async function fetchUserDataFromFirestore() {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!currentUser || !currentUser.authUid) return;

    try {
        if (typeof db !== 'undefined' && typeof doc === 'function' && typeof getDoc === 'function') {
            const userDocRef = doc(db, "users", currentUser.authUid);
            const userSnap = await getDoc(userDocRef);

            if (userSnap.exists()) {
                const cloudData = userSnap.data();
                
                const updatedUser = {
                    ...currentUser,
                    username: cloudData.username || currentUser.username,
                    displayName: cloudData.displayName || currentUser.displayName,
                    coins: cloudData.coins !== undefined ? cloudData.coins : currentUser.coins,
                    xp: cloudData.xp !== undefined ? cloudData.xp : currentUser.xp,
                    level: cloudData.level !== undefined ? cloudData.level : currentUser.level,
                    avatar: cloudData.avatar || currentUser.avatar,
                    dailyRewardState: cloudData.dailyRewardState || currentUser.dailyRewardState
                };
                
                localStorage.setItem('loggedInUser', JSON.stringify(updatedUser));
                
                // SYNC DAILY REWARD STATE DOWN TO THIS DEVICE'S PROPER KEY
                if (cloudData.dailyRewardState) {
                    localStorage.setItem(getDailyStorageKey(), JSON.stringify(cloudData.dailyRewardState));
                    if (typeof checkDailyRewardStatus === 'function') {
                        checkDailyRewardStatus();
                    }
                }
                
                if (typeof updateProfileUI === 'function') {
                    updateProfileUI();
                }
                
                console.log("Profile and daily rewards successfully synced from Firestore!");
            }
        }
    } catch (err) {
        console.error("Failed to fetch data from Firestore:", err);
    }
}


function applyAvatarToUI(avatarData) {
    const avatarLoader = document.getElementById('avatarLoader');
    if (!avatarData) {
        if (avatarLoader) avatarLoader.style.display = 'none';
        return;
    }
    
    const previewElem = document.getElementById('avatar-preview');
    if (previewElem) previewElem.src = avatarData;

    const headerImg = document.getElementById('profileHeaderImg');
    const headerFallback = document.getElementById('profileIconFallback');
    if (headerImg) {
        headerImg.src = avatarData;
        headerImg.style.display = 'block';
    }
    if (headerFallback) {
        headerFallback.style.display = 'none';
    }

    const homeIconImgs = document.querySelectorAll('#homeAvatarPreview, .home-avatar-icon, .user-avatar-display');
    homeIconImgs.forEach(img => {
        img.src = avatarData;
    });

    if (avatarLoader) avatarLoader.style.display = 'none';
}

function calculateLevelAndXp(totalPuzzlesSolved) {
    let totalXpEarned = 0;
    for (let i = 1; i <= totalPuzzlesSolved; i++) {
        let lvlForPuzzle = Math.floor((i - 1) / 5) + 1;
        let tier = Math.floor((lvlForPuzzle - 1) / 10);
        let xpPerPuzzle = (tier + 1) * 100;
        totalXpEarned += xpPerPuzzle;
    }

    // Add any stored bonus XP (e.g. from daily rewards)
    const currentUsername = typeof getCurrentUsername === 'function' ? getCurrentUsername() : '';
    const xpStoreKey = currentUsername ? currentUsername + '_bonusXp' : 'bonusXp';
    let bonusXp = parseInt(localStorage.getItem(xpStoreKey)) || 0;
    totalXpEarned += bonusXp;

    let currentLevel = 3; 
    let cumulativeXpRequired = 1500;
    let accumulated = 0;
    
    for (let lvl = 1; lvl <= 200; lvl++) {
        let tier = Math.floor((lvl - 1) / 10);
        let xpNeededForThisLevel = (tier + 1) * 500;
        accumulated += xpNeededForThisLevel;
        
        if (totalXpEarned >= accumulated) {
            currentLevel = lvl + 1;
        } else {
            currentLevel = lvl;
            cumulativeXpRequired = accumulated;
            break;
        }
    }

    return {
        level: currentLevel,
        currentXp: totalXpEarned > 0 ? totalXpEarned : 0, 
        maxXp: cumulativeXpRequired > 0 ? cumulativeXpRequired : 1500
    };
}

// --- UPDATE COINS AND LEVEL UI STATS ---
function updateProfileStats() {
    const prefix = getCurrentUsername() ? getCurrentUsername() + '_' : '';
    const totalCoins = parseInt(localStorage.getItem(prefix + 'totalCoins')) || 0;
    const currentLevelVal = parseInt(localStorage.getItem(prefix + 'currentLevel')) || 1;

    const profileCoinsEl = document.getElementById('profileCoins');
    const profileLevelEl = document.getElementById('profileLevel');

    if (profileCoinsEl) profileCoinsEl.textContent = totalCoins;
    if (profileLevelEl) profileLevelEl.textContent = currentLevelVal;
}

function updateXpProgress() {
    const currentUsername = getCurrentUsername();
    let currentLevelVal = parseInt(localStorage.getItem(currentUsername ? currentUsername + '_currentLevel' : 'currentLevel')) || 1;

    const puzzlesSolved = Math.max(0, currentLevelVal - 1);
    const playerProgression = calculateLevelAndXp(puzzlesSolved);
    const progressPercent = Math.min(100, (playerProgression.currentXp / playerProgression.maxXp) * 100);

    const levelNumEl = document.querySelector('#displayLevelBadge .xp-level-num');
    const xpText = document.getElementById('displayXpText');
    const xpBarFill = document.getElementById('displayXpBarFill');

    if (levelNumEl) levelNumEl.textContent = playerProgression.level;
    if (xpText) xpText.textContent = `${playerProgression.currentXp.toLocaleString()} / ${playerProgression.maxXp.toLocaleString()} XP`;
    if (xpBarFill) xpBarFill.style.width = `${progressPercent}%`;

    updateProfileStats();
}

// --- LOAD & DISPLAY GLOBAL RANK ON PROFILE ---
async function loadProfileGlobalRank() {
    const rankValueEl = document.getElementById('profileGlobalRank') || document.querySelector('.global-rank-indicator .rank-value') || document.getElementById('displayGlobalRank');
    if (!rankValueEl) return;

    rankValueEl.textContent = '#--';

    const currentUsername = getCurrentUsername();
    if (!currentUsername) {
        rankValueEl.textContent = 'Unranked';
        return;
    }

    try {
        if (window.pixvinzDb) {
            const { db, collection, query, orderBy, limit, getDocs } = window.pixvinzDb;
            
            const q = query(collection(db, 'players'), orderBy('xp', 'desc'), limit(100));
            const querySnapshot = await getDocs(q);
            
            let foundRank = null;
            let currentIndex = 1;

            querySnapshot.forEach((docSnap) => {
                const uName = docSnap.id;
                const data = docSnap.data();
                
                if (uName.toLowerCase() === currentUsername.toLowerCase() || 
                    (data.username && data.username.toLowerCase() === currentUsername.toLowerCase()) ||
                    (data.displayName && data.displayName.toLowerCase() === currentUsername.toLowerCase())) {
                    foundRank = currentIndex;
                }
                currentIndex++;
            });

            if (foundRank !== null) {
                rankValueEl.textContent = `#${foundRank}`;
            } else {
                rankValueEl.textContent = 'Unranked';
            }
        } else {
            rankValueEl.textContent = 'Unranked';
        }
    } catch (err) {
        console.warn("Could not fetch global rank for profile:", err);
        rankValueEl.textContent = 'Unranked';
    }
}

// --- UNIFIED DYNAMIC BADGE CHECKER & 3-COLUMN RENDERER ---
function checkAndUnlockBadges() {
    const badgesContainer = document.getElementById('badgesGrid');
    if (!badgesContainer) return;

    const currentUsername = getCurrentUsername();
    const prefix = currentUsername ? currentUsername + '_' : '';

    const playerLevel = parseInt(localStorage.getItem(prefix + 'currentLevel')) || 1;
    const playerCoins = parseInt(localStorage.getItem(prefix + 'totalCoins')) || 0;
    
    let maxCoinsEarned = parseInt(localStorage.getItem(prefix + 'maxCoinsEarned')) || playerCoins;
    if (playerCoins > maxCoinsEarned) {
        maxCoinsEarned = playerCoins;
        localStorage.setItem(prefix + 'maxCoinsEarned', maxCoinsEarned);
    }

    let beatSpeedThunder = false;
    for (let i = 20; i <= 30; i++) {
        const timeStr = localStorage.getItem(prefix + `levelTime_${i}`);
        if (timeStr && timeStr !== '--:--') {
            const parts = timeStr.split(':');
            if (parts.length === 2) {
                const totalSec = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                if (totalSec <= 60) {
                    beatSpeedThunder = true;
                    break;
                }
            }
        }
    }

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
            unlocked: beatSpeedThunder, 
            glowColor: '#00e5ff'
        },
        { 
            title: 'Aurelian Vault', 
            desc: 'Reached 500 coins', 
            icon: 'image/badge3.png', 
            unlocked: maxCoinsEarned >= 500, 
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

    badgesContainer.style.display = 'grid';
    badgesContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
    badgesContainer.style.gap = '6px 6px';
    badgesContainer.style.textAlign = 'center';
    badgesContainer.style.width = '100%';
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
            <div style="width: 84px; height: 84px; display: flex; align-items: center; justify-content: center; margin-bottom: 2px; filter: ${isUnlocked ? `drop-shadow(0 0 6px ${badge.glowColor}66)` : 'none'};">
                <img src="${badge.icon}" alt="${badge.title}" style="width: 100%; height: 100%; object-fit: contain; ${isUnlocked ? '' : 'filter: grayscale(100%); opacity: 0.35;'}">
            </div>
            <span class="badge-title" style="font-weight: 700; font-size: 9px; color: ${isUnlocked ? '#fff' : '#777'}; line-height: 1.1; margin-bottom: 1px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${badge.title}</span>
            <span class="badge-desc" style="font-size: 7.5px; color: ${isUnlocked ? '#bbb' : '#444'}; line-height: 1; width: 100%; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;">${badge.desc}</span>
        `;
        badgesContainer.appendChild(badgeElement);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const avatarLoader = document.getElementById('avatarLoader');
    if (avatarLoader) avatarLoader.style.display = 'none';

    let initialName = '';
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj && userObj.displayName) {
            initialName = userObj.displayName;
        } else if (userObj && userObj.username) {
            initialName = userObj.username;
        }
    } catch (e) {}

    if (!initialName) {
        initialName = localStorage.getItem('vinpix_username') || '';
    }

    const nameDisplay = document.getElementById('displayPlayerName');
    if (nameDisplay) nameDisplay.innerText = initialName;

    const inputElem = document.getElementById('username-input');
    if (inputElem) inputElem.value = initialName;

    const savedAvatar = localStorage.getItem(getUserKey('vinpix_avatar'));
    if (savedAvatar) {
        applyAvatarToUI(savedAvatar);
    } else {
        applyAvatarToUI('image/avatar.png');
    }

    updateXpProgress();
    updateProfileStats();
    checkAndUnlockBadges();
    loadProfileGlobalRank();
    saveUserDataToCloud();
});

// --- EDIT NAME MODAL HANDLERS ---
const editModal = document.getElementById('editNameModal');
const openModalBtn = document.getElementById('openEditNameModal');
const closeModalBtn = document.getElementById('closeEditNameModal');

if (openModalBtn && editModal) {
    openModalBtn.addEventListener('click', () => editModal.classList.remove('hidden'));
}
if (closeModalBtn && editModal) {
    closeModalBtn.addEventListener('click', () => editModal.classList.add('hidden'));
}

// --- AVATAR UPLOAD & COMPRESSION ---
const avatarInput = document.getElementById('avatar-input');
const avatarLoader = document.getElementById('avatarLoader');

if (avatarInput) {
    avatarInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            if (avatarLoader) avatarLoader.style.display = 'flex';

            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;
                img.onload = async function() {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 300;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

                    applyAvatarToUI(compressedBase64);
                    localStorage.setItem(getUserKey('vinpix_avatar'), compressedBase64);

                    try {
                        await saveUserDataToCloud();
                    } catch (err) {
                        console.log("Cloud upload deferred.");
                    }

                    if (avatarLoader) avatarLoader.style.display = 'none';

                    const avatarStatus = document.getElementById('avatar-status');
                    if (avatarStatus) {
                        avatarStatus.style.display = 'block';
                        setTimeout(() => {
                            avatarStatus.style.display = 'none';
                        }, 2500);
                    }
                };
            };

            reader.onerror = function() {
                if (avatarLoader) avatarLoader.style.display = 'none';
                alert("Failed to read the image file. Please try another picture.");
            };

            reader.readAsDataURL(file);
        }
    });
}

// --- SAVE PROFILE NAME HANDLER ---
const saveProfileBtn = document.getElementById('save-profile-btn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
        const nameInputEl = document.getElementById('username-input');
        const statusEl = document.getElementById('save-status');
        const newDisplayName = nameInputEl ? nameInputEl.value.trim() : '';

        if (!newDisplayName) {
            if (statusEl) {
                statusEl.style.color = '#ff5252';
                statusEl.textContent = 'Please enter a player name!';
            }
            return;
        }

        let currentUser = {};
        try {
            currentUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
        } catch (e) {}

        currentUser.username = currentUser.username || newDisplayName;
        currentUser.displayName = newDisplayName;
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
        localStorage.setItem('vinpix_username', newDisplayName);

        const nameDisplay = document.getElementById('displayPlayerName');
        if (nameDisplay) nameDisplay.innerText = newDisplayName;

        if (statusEl) {
            statusEl.style.color = '#4caf50';
            statusEl.textContent = 'Updated successfully!';
        }

        try {
            await saveUserDataToCloud();
        } catch (e) {}
        setTimeout(() => {
            if (statusEl) statusEl.textContent = '';
            if (editModal) editModal.classList.add('hidden');
        }, 1000);
    });
}




// --- 7-DAY DAILY CHECK-IN LOGIC (USER-TIED) ---
const dailyRewardsData = [
    { day: 1, coins: 15, xp: 50, label: '15 🪙' },
    { day: 2, coins: 30, xp: 100, label: '30 🪙' },
    { day: 3, coins: 50, xp: 150, label: '50 🪙' },
    { day: 4, coins: 75, xp: 200, label: '75 🪙' },
    { day: 5, coins: 100, xp: 300, label: '100 🪙' },
    { day: 6, coins: 150, xp: 400, label: '150 🪙' },
    { day: 7, coins: 300, xp: 750, label: '300 🪙 🔥' }
];

function getTodayDateString() {
    return new Date().toISOString().split('T')[0];
}

function getYesterdayDateString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

// Helper to get username-specific storage key for daily rewards
function getDailyStorageKey() {
    const username = typeof getCurrentUsername === 'function' ? getCurrentUsername() : '';
    return username ? `pixvinz_daily_${username}` : 'pixvinz_daily_guest';
}

function checkDailyRewardStatus() {
    try {
        const storageKey = getDailyStorageKey();
        let dailyState = JSON.parse(localStorage.getItem(storageKey) || '{"streak": 0, "lastClaimDate": ""}');
        const today = getTodayDateString();
        const yesterday = getYesterdayDateString();
        const badge = document.getElementById('dailyNotificationBadge');

        // Check if user missed a day -> reset streak to 0
        if (dailyState.lastClaimDate && dailyState.lastClaimDate !== today && dailyState.lastClaimDate !== yesterday) {
            dailyState.streak = 0;
            localStorage.setItem(storageKey, JSON.stringify(dailyState));
        }

        if (dailyState.lastClaimDate !== today) {
            if (badge) badge.style.display = 'inline-block';
        } else {
            if (badge) badge.style.display = 'none';
        }
    } catch (e) {}
}

window.openDailyModal = function() {
    if (typeof AudioManager !== 'undefined' && typeof AudioManager.playClick === 'function') {
        AudioManager.playClick();
    }
    renderDailyGrid();
    const modal = document.getElementById('dailyModal');
    if (modal) modal.style.display = 'flex';
};

window.closeDailyModal = function() {
    const modal = document.getElementById('dailyModal');
    if (modal) modal.style.display = 'none';
};

function renderDailyGrid() {
    const grid = document.getElementById('dailyRewardsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const storageKey = getDailyStorageKey();
    let dailyState = JSON.parse(localStorage.getItem(storageKey) || '{"streak": 0, "lastClaimDate": ""}');
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    // Reset streak if user missed a day
    if (dailyState.lastClaimDate && dailyState.lastClaimDate !== today && dailyState.lastClaimDate !== yesterday) {
        dailyState.streak = 0;
        localStorage.setItem(storageKey, JSON.stringify(dailyState));
    }

    const hasClaimedToday = dailyState.lastClaimDate === today;
    const currentDayIndex = hasClaimedToday ? dailyState.streak : dailyState.streak + 1;

    dailyRewardsData.forEach((item) => {
        const isCompleted = item.day <= dailyState.streak;
        const isCurrent = item.day === currentDayIndex && !hasClaimedToday;

        let boxBg = 'rgba(255,255,255,0.03)';
        let borderColor = 'rgba(255,215,0,0.2)';
        let textColor = '#aaa';

        if (isCompleted) {
            boxBg = 'rgba(0, 229, 255, 0.1)';
            borderColor = '#00e5ff';
            textColor = '#00e5ff';
        } else if (isCurrent) {
            boxBg = 'rgba(255, 215, 0, 0.15)';
            borderColor = '#ffd700';
            textColor = '#ffd700';
        }

        const card = document.createElement('div');
        card.style.cssText = `
            background: ${boxBg};
            border: 2px solid ${borderColor};
            border-radius: 12px;
            padding: 10px 4px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            position: relative;
        `;

        card.innerHTML = `
            <span style="font-size: 10px; font-weight: bold; color: ${textColor}; margin-bottom: 4px;">DAY ${item.day}</span>
            <span style="font-size: 14px; margin-bottom: 4px;">🎁</span>
            <span style="font-size: 11px; font-weight: 800; color: #fff;">${item.label}</span>
            ${isCompleted ? '<span style="position: absolute; top: 4px; right: 4px; font-size: 10px;">✅</span>' : ''}
        `;
        grid.appendChild(card);
    });

    const claimBtn = document.getElementById('dailyClaimBtn');
    if (claimBtn) {
        if (hasClaimedToday) {
            claimBtn.textContent = 'ALREADY CLAIMED TODAY ✓';
            claimBtn.style.background = 'rgba(255,255,255,0.1)';
            claimBtn.style.color = '#777';
            claimBtn.style.cursor = 'not-allowed';
            claimBtn.disabled = true;
        } else {
            claimBtn.textContent = `CLAIM DAY ${currentDayIndex} REWARD`;
            claimBtn.style.background = 'linear-gradient(135deg, #ffd700, #ffaa00)';
            claimBtn.style.color = '#130f2b';
            claimBtn.style.cursor = 'pointer';
            claimBtn.disabled = false;
        }
    }
}

window.claimDailyReward = async function() {
    const storageKey = getDailyStorageKey();
    let dailyState = JSON.parse(localStorage.getItem(storageKey) || '{"streak": 0, "lastClaimDate": ""}');
    const today = getTodayDateString();
    
    if (dailyState.lastClaimDate === today) return;

    let nextStreak = dailyState.streak + 1;
    if (nextStreak > 7) nextStreak = 1;

    const reward = dailyRewardsData[nextStreak - 1];

    // Add Coins & XP...
    if (typeof earnCoins === 'function') {
        earnCoins(reward.coins);
    } else {
        const coinKey = typeof getUserKey === 'function' ? getUserKey('totalCoins') : 'totalCoins';
        let totalCoins = (parseInt(localStorage.getItem(coinKey)) || 0) + reward.coins;
        localStorage.setItem(coinKey, totalCoins);
        if (typeof updateCoinDisplay === 'function') updateCoinDisplay();
    }

    try {
        const currentUsername = typeof getCurrentUsername === 'function' ? getCurrentUsername() : '';
        const xpStoreKey = currentUsername ? currentUsername + '_bonusXp' : 'bonusXp';
        let bonusXp = parseInt(localStorage.getItem(xpStoreKey)) || 0;
        bonusXp += reward.xp;
        localStorage.setItem(xpStoreKey, bonusXp);
    } catch (e) {}

    // Save daily streak state locally
    dailyState.streak = nextStreak;
    dailyState.lastClaimDate = today;
    localStorage.setItem(storageKey, JSON.stringify(dailyState));

    renderDailyGrid();
    checkDailyRewardStatus();

    if (typeof updateXpProgress === 'function') updateXpProgress();
    if (typeof updateProfileUI === 'function') updateProfileUI();
    
    // THIS SENDS THE UPDATED DAILY STATE TO THE CLOUD
    if (typeof saveUserDataToCloud === 'function') {
        saveUserDataToCloud();
    }

    showRewardToast(`🎉 Claimed Day ${nextStreak}! +${reward.coins} Coins & +${reward.xp} XP`);
};

function showRewardToast(message) {
    const existingToast = document.getElementById('customRewardToast');
    if (existingToast) existingToast.remove();

    // Find your Daily Rewards button to position the toast right above it
    const dailyButton = document.querySelector("button[onclick='openDailyModal()']");
    if (!dailyButton) return;

    // Make sure the parent container has relative positioning so the absolute toast stays anchored to it
    const parentContainer = dailyButton.parentElement;
    if (parentContainer) {
        parentContainer.style.position = 'relative';
    }

    const toast = document.createElement('div');
    toast.id = 'customRewardToast';
    toast.style.cssText = `
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(10px);
        margin-bottom: 12px;
        background: linear-gradient(135deg, #130f2b, #2b1055);
        border: 2px solid #ffd700;
        color: #fff;
        padding: 10px 20px;
        border-radius: 14px;
        font-weight: 700;
        font-size: 13px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6), 0 0 15px rgba(255,215,0,0.4);
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0;
        white-space: nowrap;
        pointer-events: none;
        transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
    `;

    toast.innerHTML = `
        <span style="font-size: 18px;">🎁</span>
        <span>${message}</span>
    `;

    // Append the toast directly inside the button's parent container, right above the button
    dailyButton.before(toast);

    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
        toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
