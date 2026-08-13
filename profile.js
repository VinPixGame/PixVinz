// Function to return to the main home page safely
function goHome() {
    window.location.href = 'index.html';
}

// Load saved profile data when the page opens
document.addEventListener('DOMContentLoaded', () => {
    const savedName = localStorage.getItem('vinpix_username');
    const savedAvatar = localStorage.getItem('vinpix_avatar');

    if (savedName) {
        document.getElementById('username-input').value = savedName;
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
            // Temporarily store the base64 string until saved
            window.tempAvatarData = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Save profile data into localStorage
document.getElementById('save-profile-btn').addEventListener('click', () => {
    const username = document.getElementById('username-input').value.trim();
    const statusEl = document.getElementById('save-status');

    if (!username) {
        statusEl.style.color = '#ff5252';
        statusEl.textContent = 'Please enter a player name!';
        return;
    }

    localStorage.setItem('vinpix_username', username);
    
    if (window.tempAvatarData) {
        localStorage.setItem('vinpix_avatar', window.tempAvatarData);
    }

    statusEl.style.color = '#4caf50';
    statusEl.textContent = 'Profile saved successfully!';

    setTimeout(() => {
        statusEl.textContent = '';
    }, 2500);
});
