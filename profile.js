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
    return localStorage.getItem('vinpix_username') || 'Cardo';
}

function getUserKey(keyName) {
    const username = getCurrentUsername();
    return `${username}_${keyName}`;
}

function goHome() {
    localStorage.setItem('skipLoading', 'true');
    
    if (typeof showView === 'function') {
        showView('home');
    } else {
        const homeViewElement = document.getElementById('homeView') || window.parent.document.getElementById('homeView');
        if (homeViewElement && typeof window.parent.showView === 'function') {
            window.parent.showView('home');
        } else {
            window.location.href = 'index.html';
        }
    }
}

// --- SAFE CLOUD SYNC ---
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

        const currentLevel = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 3;
        const totalCoins = parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 150;
        const avatar = localStorage.getItem(getUserKey('vinpix_avatar')) || '';

        // Calculate current XP dynamically using your progression function
        const puzzlesSolved = Math.max(0, currentLevel - 1);
        const playerProgression = calculateLevelAndXp(puzzlesSolved);
        const currentXpVal = playerProgression.currentXp;

        const userDocRef = doc(db, "players", username);
        await setDoc(userDocRef, {
            username: username,
            displayName: displayName,
            level: currentLevel,
            xp: currentXpVal,
            coins: totalCoins,
            avatar: avatar,
            lastUpdated: new Date()
        }, { merge: true });
    } catch (error) {
        console.warn("Cloud sync skipped or failed safely:", error);
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
        currentXp: totalXpEarned > 0 ? totalXpEarned : 1100, 
        maxXp: cumulativeXpRequired > 0 ? cumulativeXpRequired : 1500
    };
}

function updateXpProgress() {
    const currentUsername = getCurrentUsername();
    let currentLevelVal = parseInt(localStorage.getItem(currentUsername + '_currentLevel')) || 3;

    const puzzlesSolved = Math.max(0, currentLevelVal - 1);
    const playerProgression = calculateLevelAndXp(puzzlesSolved);
    const progressPercent = Math.min(100, (playerProgression.currentXp / playerProgression.maxXp) * 100);

    const levelBadge = document.getElementById('displayLevelBadge');
    const xpText = document.getElementById('displayXpText');
    const xpBarFill = document.getElementById('displayXpBarFill');

    if (levelBadge) levelBadge.textContent = `LEVEL ${playerProgression.level}`;
    if (xpText) xpText.textContent = `${playerProgression.currentXp.toLocaleString()} / ${playerProgression.maxXp.toLocaleString()} XP`;
    if (xpBarFill) xpBarFill.style.width = `${progressPercent}%`;
}

// --- LOAD & DISPLAY GLOBAL RANK ON PROFILE ---
async function loadProfileGlobalRank() {
    const rankValueEl = document.querySelector('.global-rank-indicator .rank-value') || document.getElementById('displayGlobalRank');
    if (!rankValueEl) return;

    rankValueEl.textContent = '...';

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

// --- DYNAMIC BADGE CHECKER (CUSTOM RULES) ---
function checkAndUnlockBadges() {
    const prefix = getCurrentUsername() + '_';

    const currentLevel = parseInt(localStorage.getItem(prefix + 'currentLevel')) || 1;
    const currentCoins = parseInt(localStorage.getItem(prefix + 'totalCoins')) || 0;
    
    let maxCoinsEarned = parseInt(localStorage.getItem(prefix + 'maxCoinsEarned')) || currentCoins;
    if (currentCoins > maxCoinsEarned) {
        maxCoinsEarned = currentCoins;
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

    const badges = {
        badgeFirstStep: currentLevel > 1,
        badgeSpeedThunder: beatSpeedThunder,
        badgeCoinCollector: maxCoinsEarned >= 500,
        badgePixVinzElite: currentLevel >= 50,
        badgePixVinzMaster: currentLevel >= 75,
        badgePixVinzGrandMaster: currentLevel >= 100,
        badgePixVinzMythic: currentLevel >= 150,
        badgePixVinzMythicalGlory: currentLevel >= 200
    };

    for (const [badgeId, isUnlocked] of Object.entries(badges)) {
        const badgeElement = document.getElementById(badgeId);
        if (badgeElement) {
            if (isUnlocked) {
                badgeElement.classList.remove('locked');
                badgeElement.classList.add('unlocked');
            } else {
                badgeElement.classList.remove('unlocked');
                badgeElement.classList.add('locked');
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const avatarLoader = document.getElementById('avatarLoader');
    if (avatarLoader) avatarLoader.style.display = 'none';

    let initialName = 'Cardo';
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj && userObj.displayName) {
            initialName = userObj.displayName;
        } else if (userObj && userObj.username) {
            initialName = userObj.username;
        }
    } catch (e) {}

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
    checkAndUnlockBadges();
    
    // Fetch and display global rank on profile open
    loadProfileGlobalRank();
    
    // Automatically push accurate computed XP to cloud on profile page open
    saveUserDataToCloud();
});

const editModal = document.getElementById('editNameModal');
const openModalBtn = document.getElementById('openEditNameModal');
const closeModalBtn = document.getElementById('closeEditNameModal');

if (openModalBtn && editModal) {
    openModalBtn.addEventListener('click', () => editModal.classList.remove('hidden'));
}
if (closeModalBtn && editModal) {
    closeModalBtn.addEventListener('click', () => editModal.classList.add('hidden'));
}

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

        currentUser.username = currentUser.username || 'Cardo';
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





function openPlayerProfile(player, rank) {
    const modal = document.getElementById('playerProfileModal');
    if (!modal) return;
    
    document.getElementById('profileModalAvatar').src = player.avatar ? player.avatar : 'image/avatar.png';
    document.getElementById('profileModalName').textContent = player.name;
    document.getElementById('profileModalRank').textContent = `#${rank}`;
    document.getElementById('profileModalXp').textContent = `${player.xp.toLocaleString()} XP`;
    
    const badgesContainer = document.getElementById('profileModalBadges');
    badgesContainer.innerHTML = `
        <div style="background: linear-gradient(135deg, #ffd700, #ffaa00); color: #000; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 6px;">LEVEL ${player.level}</div>
        ${rank <= 3 ? `<div style="background: linear-gradient(135deg, #ff5500, #cc3300); color: #fff; font-size: 11px; font-weight: bold; padding: 4px 10px; border-radius: 6px;">TOP ${rank} 🏆</div>` : ''}
    `;
    
    modal.style.display = 'flex';
}

function closePlayerProfile() {
    const modal = document.getElementById('playerProfileModal');
    if (!modal) return;
    modal.style.display = 'none';
}

// Allow clicking outside the modal box to close it as well
window.addEventListener('click', (event) => {
    const modal = document.getElementById('playerProfileModal');
    if (event.target === modal) {
        closePlayerProfile();
    }
});
