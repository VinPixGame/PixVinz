function goHome() {
    localStorage.setItem('skipLoading', 'true');
    // If your app uses a single-page view switcher function, use it here:
    if (typeof showView === 'function') {
        showView('homeView');
    } else {
        window.location.href = 'index.html';
    }
}

// Function to load dynamic stats and XP from localStorage
function loadPlayerStats() {
    let currentUsername = 'Vinz';
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj && userObj.username) {
            currentUsername = userObj.username;
        }
    } catch (e) {}

    // Fetch or initialize user stats object tied to this username
    const statsKey = 'user_stats_' + currentUsername;
    const userData = JSON.parse(localStorage.getItem(statsKey)) || {
        totalWins: 86,
        puzzlesSolved: 245,
        bestStreak: 17,
        accuracy: 98,
        totalXp: 2450
    };

    // Level and XP Calculation logic
    const maxXp = 5000;
    const currentLevel = Math.floor(userData.totalXp / maxXp) + 1;
    const currentXpInLevel = userData.totalXp % maxXp;
    const progressPercent = Math.min(100, (currentXpInLevel / maxXp) * 100);

    // Update DOM Stats Grid Elements if they exist
    const winsEl = document.getElementById('stat-wins');
    const puzzlesEl = document.getElementById('stat-puzzles');
    const streakEl = document.getElementById('stat-streak');
    const accuracyEl = document.getElementById('stat-accuracy');

    if (winsEl) winsEl.textContent = userData.totalWins;
    if (puzzlesEl) puzzlesEl.textContent = userData.puzzlesSolved;
    if (streakEl) streakEl.textContent = userData.bestStreak;
    if (accuracyEl) accuracyEl.textContent = userData.accuracy + '%';

    // Update XP Bar and Level indicator dynamically if elements match
    const levelBadgeEl = document.getElementById('displayLevelBadge');
    const xpTextEl = document.getElementById('displayXpText');
    const xpBarFillEl = document.getElementById('displayXpBarFill');

    if (levelBadgeEl) levelBadgeEl.textContent = `LEVEL ${currentLevel}`;
    if (xpTextEl) xpTextEl.textContent = `${currentXpInLevel.toLocaleString()} / ${maxXp.toLocaleString()} XP`;
    if (xpBarFillEl) xpBarFillEl.style.width = `${progressPercent}%`;
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

    // Load dynamic player stats and progression metrics
    loadPlayerStats();
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
