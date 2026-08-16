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
        showView('homeView');
    } else {
        window.location.href = 'index.html';
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

        const userDocRef = doc(db, "players", username);
        await setDoc(userDocRef, {
            username: username,
            displayName: displayName,
            level: currentLevel,
            coins: totalCoins,
            avatar: avatar,
            lastUpdated: new Date()
        }, { merge: true });
    } catch (error) {
        console.warn("Cloud sync skipped or failed safely:", error);
    }
}

// Function to sync avatar to Profile Preview AND Homepage Header Icon
function applyAvatarToUI(avatarData) {
    const avatarLoader = document.getElementById('avatarLoader');
    if (!avatarData) {
        if (avatarLoader) avatarLoader.style.display = 'none';
        return;
    }
    
    // 1. Update Profile page preview
    const previewElem = document.getElementById('avatar-preview');
    if (previewElem) previewElem.src = avatarData;

    // 2. Update Homepage Header Avatar Image & hide fallback emoji
    const headerImg = document.getElementById('profileHeaderImg');
    const headerFallback = document.getElementById('profileIconFallback');
    if (headerImg) {
        headerImg.src = avatarData;
        headerImg.style.display = 'block';
    }
    if (headerFallback) {
        headerFallback.style.display = 'none';
    }

    // 3. General homepage avatar updates (if any other wrappers exist)
    const homeIconImgs = document.querySelectorAll('#homeAvatarPreview, .home-avatar-icon, .user-avatar-display');
    homeIconImgs.forEach(img => {
        img.src = avatarData;
    });

    // Ensure loader is hidden after applying UI
    if (avatarLoader) avatarLoader.style.display = 'none';
}

// Compute Level & XP
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

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    const avatarLoader = document.getElementById('avatarLoader');
    if (avatarLoader) avatarLoader.style.display = 'none'; // Ensure loader is hidden on load

    const username = getCurrentUsername();
    
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

    // Load saved avatar from localStorage or fallback to default new-user avatar
    const savedAvatar = localStorage.getItem(getUserKey('vinpix_avatar')) || localStorage.getItem('vinpix_avatar');
    if (savedAvatar) {
        applyAvatarToUI(savedAvatar);
    } else {
        applyAvatarToUI('image/avatar.png');
    }

    updateXpProgress();
});

// Modal Elements & Triggers
const editModal = document.getElementById('editNameModal');
const openModalBtn = document.getElementById('openEditNameModal');
const closeModalBtn = document.getElementById('closeEditNameModal');

if (openModalBtn && editModal) {
    openModalBtn.addEventListener('click', () => editModal.classList.remove('hidden'));
}
if (closeModalBtn && editModal) {
    closeModalBtn.addEventListener('click', () => editModal.classList.add('hidden'));
}

// Handle Image Gallery Upload with Resizing, Guaranteed Loading & Sync Completion
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
                    // Compress image to max 300x300 pixels to prevent exceeding Firestore/LocalStorage limits
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
                    localStorage.setItem('vinpix_avatar', compressedBase64);

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

// Save Name functionality
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
