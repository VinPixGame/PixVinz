// ==========================================
// PIXVINZ - PROFILE SCRIPT (CLOUD & LOCAL SYNCED)
// ==========================================

// --- HELPER FUNCTION FOR USER-SPECIFIC KEYS ---
function getCurrentUsername() {
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj && userObj.username) {
            return userObj.username;
        }
    } catch (e) {}
    return '';
}

function getUserKey(keyName) {
    const username = getCurrentUsername();
    if (!username) return keyName;
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

// --- FIRESTORE CLOUD SYNC HELPER ---
async function saveUserDataToCloud() {
    const username = getCurrentUsername();
    if (!username || !window.pixvinzDb) return;

    const { db, doc, setDoc } = window.pixvinzDb;
    try {
        let displayName = username;
        try {
            const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
            if (userObj && userObj.displayName) displayName = userObj.displayName;
        } catch (e) {}

        const currentLevel = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;
        const totalCoins = parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0;
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
        console.error("Error saving profile data to cloud:", error);
    }
}

async function loadUserDataFromCloud(username) {
    if (!window.pixvinzDb || !username) return;
    const { db, doc, getDoc } = window.pixvinzDb;
    try {
        const userDocRef = doc(db, "players", username);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.displayName) {
                try {
                    let userObj = JSON.parse(localStorage.getItem('loggedInUser')) || {};
                    userObj.displayName = data.displayName;
                    localStorage.setItem('loggedInUser', JSON.stringify(userObj));

                    let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || {};
                    if (registeredUsers[username]) {
                        registeredUsers[username].displayName = data.displayName;
                        localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                    }
                } catch (e) {}
            }
            if (data.level) localStorage.setItem(`${username}_currentLevel`, data.level);
            if (data.coins !== undefined) localStorage.setItem(`${username}_totalCoins`, data.coins);
            if (data.avatar) localStorage.setItem(`${username}_vinpix_avatar`, data.avatar);
        }
    } catch (error) {
        console.error("Error loading profile data from cloud:", error);
    }
}

// Function to compute level and cumulative XP based on your exact milestone system
function calculateLevelAndXp(totalPuzzlesSolved) {
    let totalXpEarned = 0;
    for (let i = 1; i <= totalPuzzlesSolved; i++) {
        let lvlForPuzzle = Math.floor((i - 1) / 5) + 1;
        let tier = Math.floor((lvlForPuzzle - 1) / 10);
        let xpPerPuzzle = (tier + 1) * 100;
        totalXpEarned += xpPerPuzzle;
    }

    let currentLevel = 1;
    let cumulativeXpRequired = 500;
    
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
        currentXp: totalXpEarned,
        maxXp: cumulativeXpRequired
    };
}

// Function to update XP and Level progress on the UI
function updateXpProgress() {
    const currentUsername = getCurrentUsername();

    let currentLevelVal = 1;
    if (currentUsername) {
        currentLevelVal = parseInt(localStorage.getItem(currentUsername + '_currentLevel')) || 1;
    } else {
        currentLevelVal = parseInt(localStorage.getItem('currentLevel')) || 1;
    }

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

// Load saved profile data and auto-populate display name & avatar
document.addEventListener('DOMContentLoaded', async () => {
    const username = getCurrentUsername();
    if (username) {
        await loadUserDataFromCloud(username);
    }

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
        initialName = localStorage.getItem('vinpix_username') || 'Vinz';
    }

    const nameDisplay = document.getElementById('displayPlayerName');
    if (nameDisplay) nameDisplay.innerText = initialName;

    const inputElem = document.getElementById('username-input');
    if (inputElem) inputElem.value = initialName;

    const savedAvatar = localStorage.getItem(getUserKey('vinpix_avatar')) || localStorage.getItem('vinpix_avatar');
    if (savedAvatar) {
        const previewElem = document.getElementById('avatar-preview');
        if (previewElem) previewElem.src = savedAvatar;
    }

    updateXpProgress();
});

// Modal Elements & Triggers
const editModal = document.getElementById('editNameModal');
const openModalBtn = document.getElementById('openEditNameModal');
const closeModalBtn = document.getElementById('closeEditNameModal');

if (openModalBtn && editModal) {
    openModalBtn.addEventListener('click', () => {
        editModal.classList.remove('hidden');
    });
}

if (closeModalBtn && editModal) {
    closeModalBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });
}

// Handle image upload, conversion to Base64, and cloud sync
const avatarInput = document.getElementById('avatar-input');
if (avatarInput) {
    avatarInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(e) {
                const previewElem = document.getElementById('avatar-preview');
                if (previewElem) previewElem.src = e.target.result;
                
                localStorage.setItem(getUserKey('vinpix_avatar'), e.target.result);
                await saveUserDataToCloud();
            };
            reader.readAsDataURL(file);
        }
    });
}

// Save profile name data into localStorage and sync to Firebase cloud
const saveProfileBtn = document.getElementById('save-profile-btn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', async () => {
        const newDisplayName = document.getElementById('username-input').value.trim();
        const statusEl = document.getElementById('save-status');

        if (!newDisplayName) {
            if (statusEl) {
                statusEl.style.color = '#ff5252';
                statusEl.textContent = 'Please enter a player name!';
            }
            return;
        }

        let currentUser = null;
        try {
            currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
        } catch (e) {}

        if (!currentUser || !currentUser.username) {
            if (statusEl) {
                statusEl.style.color = '#ff5252';
                statusEl.textContent = 'Error: Not logged in properly!';
            }
            return;
        }

        currentUser.displayName = newDisplayName;
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser));

        try {
            let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || {};
            if (registeredUsers[currentUser.username]) {
                registeredUsers[currentUser.username].displayName = newDisplayName;
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
            }
        } catch (e) {}

        localStorage.setItem('vinpix_username', newDisplayName);

        const nameDisplay = document.getElementById('displayPlayerName');
        if (nameDisplay) nameDisplay.innerText = newDisplayName;

        if (statusEl) {
            statusEl.style.color = '#4caf50';
            statusEl.textContent = 'Saving to cloud...';
        }

        await saveUserDataToCloud();

        if (statusEl) {
            statusEl.style.color = '#4caf50';
            statusEl.textContent = 'Name updated successfully!';
        }

        setTimeout(() => {
            if (statusEl) statusEl.textContent = '';
            if (editModal) editModal.classList.add('hidden');
        }, 1200);
    });
}
