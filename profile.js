// Function to return to the main home page safely without showing the loader
function goHome() {
    localStorage.setItem('skipLoading', 'true');
    window.location.href = 'index.html';
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
