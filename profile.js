// Function to return to the main home page safely without showing the loader
function goHome() {
    localStorage.setItem('skipLoading', 'true');
    window.location.href = 'index.html';
}

// Load saved profile data and auto-populate sign-up display name
document.addEventListener('DOMContentLoaded', () => {
    let initialName = '';
    
    // Try grabbing from the sign-up user object first if your app uses one
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj && (userObj.username || userObj.name)) {
            initialName = userObj.username || userObj.name;
        }
    } catch (e) {}

    // Fallback to standalone storage keys used during sign-up or profile editing
    if (!initialName) {
        initialName = localStorage.getItem('vinpix_username') || localStorage.getItem('username') || localStorage.getItem('playerName') || '';
    }

    const savedAvatar = localStorage.getItem('vinpix_avatar');

    if (initialName) {
        document.getElementById('username-input').value = initialName;
        localStorage.setItem('vinpix_username', initialName); // Keep main profile key synced
    }

    if (savedAvatar) {
        document.getElementById('avatar-preview').src = savedAvatar;
    }
});

// Handle image upload and conversion to Base64 to store locally
const avatarInput = document.getElementById('avatar-input');
avatarInput.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatar-preview').src = e.target.result;
            window.tempAvatarData = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Save profile data into localStorage and sync with sign-up data
document.getElementById('save-profile-btn').addEventListener('click', () => {
    const username = document.getElementById('username-input').value.trim();
    const statusEl = document.getElementById('save-status');

    if (!username) {
        statusEl.style.color = '#ff5252';
        statusEl.textContent = 'Please enter a player name!';
        return;
    }

    // Save profile username locally
    localStorage.setItem('vinpix_username', username);

    // Also update sign-up user object if it exists so everything stays in sync
    try {
        let userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj) {
            userObj.username = username;
            localStorage.setItem('loggedInUser', JSON.stringify(userObj));
        }
    } catch (e) {}
    
    if (window.tempAvatarData) {
        localStorage.setItem('vinpix_avatar', window.tempAvatarData);
    }

    statusEl.style.color = '#4caf50';
    statusEl.textContent = 'Profile saved successfully!';

    setTimeout(() => {
        statusEl.textContent = '';
    }, 2500);
});
