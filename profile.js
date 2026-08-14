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

// Function to compute level and cumulative XP based on your exact milestone system
function calculateLevelAndXp(totalPuzzlesSolved) {
    // 1. Calculate total cumulative XP earned from all puzzles solved
    let totalXpEarned = 0;
    for (let i = 1; i <= totalPuzzlesSolved; i++) {
        let lvlForPuzzle = Math.floor((i - 1) / 5) + 1;
        let tier = Math.floor((lvlForPuzzle - 1) / 10);
        let xpPerPuzzle = (tier + 1) * 100;
        totalXpEarned += xpPerPuzzle;
    }

    // 2. Determine current level and cumulative milestone goal (maxXp)
    let currentLevel = 1;
    let cumulativeXpRequired = 500;
    
    let accumulated = 0;
    for (let lvl = 1; lvl <= 200; lvl++) {
        let tier = Math.floor((lvl - 1) / 10);
        let xpNeededForThisLevel = (tier + 1) * 500; // 500 for levels 1-10, 1000 for 11-20, etc.
        
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

    // Pull current level using your game's exact storage convention (<username>_currentLevel)
    let currentLevelVal = 1;
    if (currentUsername) {
        currentLevelVal = parseInt(localStorage.getItem(currentUsername + '_currentLevel')) || 1;
    } else {
        currentLevelVal = parseInt(localStorage.getItem('currentLevel')) || 1;
    }

    // Since currentLevel represents the next level to play, completed puzzles = currentLevel - 1
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
document.addEventListener('DOMContentLoaded', () => {
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

    // Set text display and modal input values
    const nameDisplay = document.getElementById('displayPlayerName');
    if (nameDisplay) nameDisplay.innerText = initialName;

    const inputElem = document.getElementById('username-input');
    if (inputElem) inputElem.value = initialName;

    // --- LOAD USER-SPECIFIC AVATAR ---
    const savedAvatar = localStorage.getItem(getUserKey('vinpix_avatar')) || localStorage.getItem('vinpix_avatar');
    if (savedAvatar) {
        const previewElem = document.getElementById('avatar-preview');
        if (previewElem) previewElem.src = savedAvatar;
    }

    // Load dynamic XP progress bar and level
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

// Handle image upload, conversion to Base64, and user-specific storage
const avatarInput = document.getElementById('avatar-input');
if (avatarInput) {
    avatarInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewElem = document.getElementById('avatar-preview');
                if (previewElem) previewElem.src = e.target.result;
                
                // Save using the user-specific key
                localStorage.setItem(getUserKey('vinpix_avatar'), e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Save profile name data into localStorage safely without breaking coins/levels
const saveProfileBtn = document.getElementById('save-profile-btn');
if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
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

        // 1. Update ONLY the displayName in loggedInUser (leaving username untouched for coins/levels)
        currentUser.displayName = newDisplayName;
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser));

        // 2. Update the registeredUsers database using the permanent username key
        try {
            let registeredUsers = JSON.parse(localStorage.getItem('registeredUsers')) || {};
            if (registeredUsers[currentUser.username]) {
                registeredUsers[currentUser.username].displayName = newDisplayName;
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
            }
        } catch (e) {}

        // 3. Save legacy tracking key if used elsewhere
        localStorage.setItem('vinpix_username', newDisplayName);

        // 4. Update UI text instantly
        const nameDisplay = document.getElementById('displayPlayerName');
        if (nameDisplay) nameDisplay.innerText = newDisplayName;

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
