function goHome() {
    localStorage.setItem('skipLoading', 'true');
    // If your app uses a single-page view switcher function, use it here:
    if (typeof showView === 'function') {
        showView('homeView');
    } else {
        window.location.href = 'index.html';
    }
}

// Function to compute level and XP based on your custom bracket system
function calculateLevelAndXp(totalPuzzlesSolved) {
    let remainingPuzzles = totalPuzzlesSolved;
    let currentLevel = 1;
    let currentXpInLevel = 0;
    let maxXpForCurrentLevel = 500;

    for (let lvl = 1; lvl <= 100; lvl++) {
        let tier = Math.floor((lvl - 1) / 10);
        let xpPerPuzzle = (tier + 1) * 100;    
        let levelXpGoal = (tier + 1) * 500;    
        let puzzlesPerLevel = 5;               

        if (remainingPuzzles >= puzzlesPerLevel) {
            remainingPuzzles -= puzzlesPerLevel;
            currentLevel = lvl + 1;
        } else {
            currentLevel = lvl;
            currentXpInLevel = remainingPuzzles * xpPerPuzzle;
            maxXpForCurrentLevel = levelXpGoal;
            break;
        }
    }

    return {
        level: currentLevel,
        currentXp: currentXpInLevel,
        maxXp: maxXpForCurrentLevel
    };
}

// Function to update XP and Level progress on the UI
function updateXpProgress() {
    let currentUsername = 'Vinz';
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj && userObj.username) {
            currentUsername = userObj.username;
        }
    } catch (e) {}

    // Pull total puzzles solved from localStorage (adjust key name if your game uses a different one)
    const puzzlesSolved = parseInt(localStorage.getItem('puzzles_solved_' + currentUsername)) || 0; 
    
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

    const savedAvatar = localStorage.getItem('vinpix_avatar');
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

// Handle image upload and conversion to Base64 to store locally
const avatarInput = document.getElementById('avatar-input');
if (avatarInput) {
    avatarInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewElem = document.getElementById('avatar-preview');
                if (previewElem) previewElem.src = e.target.result;
                localStorage.setItem('vinpix_avatar', e.target.result);
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
