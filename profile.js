// Import Firebase SDK modules from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

// Initialize Firebase App Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPFmx35ClB3c5vGBtv8rzVAiTK4rcwAik",
  authDomain: "pixvinz2026.firebaseapp.com",
  projectId: "pixvinz2026",
  storageBucket: "pixvinz2026.firebasestorage.app",
  messagingSenderId: "45609077809",
  appId: "1:45609077809:web:575611e46acda9f64c5910",
  measurementId: "G-W7FSERE8ZJ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentCloudUser = null;

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

window.goHome = function() {
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

// Function to update XP and Level progress on the UI & check dynamic badges
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
    const totalCoins = parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0;
    
    const playerProgression = calculateLevelAndXp(puzzlesSolved);
    const progressPercent = Math.min(100, (playerProgression.currentXp / playerProgression.maxXp) * 100);

    const levelBadge = document.getElementById('displayLevelBadge');
    const xpText = document.getElementById('displayXpText');
    const xpBarFill = document.getElementById('displayXpBarFill');

    if (levelBadge) levelBadge.textContent = `LEVEL ${playerProgression.level}`;
    if (xpText) xpText.textContent = `${playerProgression.currentXp.toLocaleString()} / ${playerProgression.maxXp.toLocaleString()} XP`;
    if (xpBarFill) xpBarFill.style.width = `${progressPercent}%`;

    // --- DYNAMIC BADGE CHECKER ---
    const badgeFirstStep = document.getElementById('badgeFirstStep');
    const badgeCoinCollector = document.getElementById('badgeCoinCollector');

    if (puzzlesSolved >= 1 && badgeFirstStep) {
        badgeFirstStep.classList.remove('locked');
        badgeFirstStep.classList.add('unlocked');
    }
    if (totalCoins >= 500 && badgeCoinCollector) {
        badgeCoinCollector.classList.remove('locked');
        badgeCoinCollector.classList.add('unlocked');
    }
}

// --- FIREBASE AUTH STATE LISTENER & INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    const editModal = document.getElementById('editNameModal');
    const openModalBtn = document.getElementById('openEditNameModal');
    const closeModalBtn = document.getElementById('closeEditNameModal');
    const nameDisplay = document.getElementById('displayPlayerName');
    const inputElem = document.getElementById('username-input');
    const previewElem = document.getElementById('avatar-preview');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const statusEl = document.getElementById('save-status');
    const avatarInput = document.getElementById('avatar-input');

    // 1. Authenticate and pull user data from Firestore
    onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
                const userDocRef = doc(db, "users", firebaseUser.uid);
                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    const data = userDoc.data();
                    currentCloudUser = {
                        uid: firebaseUser.uid,
                        username: data.username || "Vinz",
                        displayName: data.displayName || data.username || "Vinz"
                    };
                    
                    // Cache to localStorage
                    localStorage.setItem('loggedInUser', JSON.stringify(currentCloudUser));
                    localStorage.setItem(getUserKey('currentLevel'), data.level || 1);
                    localStorage.setItem(getUserKey('totalCoins'), data.coins || 0);

                    // Populate UI
                    const activeName = currentCloudUser.displayName || currentCloudUser.username;
                    if (nameDisplay) nameDisplay.innerText = activeName;
                    if (inputElem) inputElem.value = activeName;

                    if (data.avatarUrl && previewElem) {
                        previewElem.src = data.avatarUrl;
                        localStorage.setItem(getUserKey('vinpix_avatar'), data.avatarUrl);
                    }
                }
            } catch (err) {
                console.error("Error fetching user data from Firestore: ", err);
            }
        } else {
            // Local fallback if logged out
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

            if (nameDisplay) nameDisplay.innerText = initialName;
            if (inputElem) inputElem.value = initialName;
        }

        // Load user-specific avatar cache if available
        const savedAvatar = localStorage.getItem(getUserKey('vinpix_avatar')) || localStorage.getItem('vinpix_avatar');
        if (savedAvatar && previewElem) {
            previewElem.src = savedAvatar;
        }

        // Update XP progression and level badges
        updateXpProgress();
    });

    // Modal Triggers
    if (openModalBtn && editModal) {
        openModalBtn.addEventListener('click', () => {
            editModal.classList.remove('hidden');
        });
    }

    if (closeModalBtn && editModal) {
        closeModalBtn.addEventListener('click', () => {
            editModal.classList.add('hidden');
            if (statusEl) statusEl.textContent = '';
        });
    }

    // Handle image upload, conversion to Base64, and sync to Firestore / LocalStorage
    if (avatarInput) {
        avatarInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const base64Image = e.target.result;
                    if (previewElem) previewElem.src = base64Image;
                    
                    // Save locally
                    localStorage.setItem(getUserKey('vinpix_avatar'), base64Image);

                    // Sync avatar to Cloud Firestore if logged in
                    if (currentCloudUser) {
                        try {
                            const userDocRef = doc(db, "users", currentCloudUser.uid);
                            await setDoc(userDocRef, { avatarUrl: base64Image }, { merge: true });
                        } catch (err) {
                            console.error("Error saving avatar to Firestore: ", err);
                        }
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Save profile name data securely into localStorage & Cloud Firestore
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', async () => {
            const newDisplayName = inputElem.value.trim();

            if (!newDisplayName) {
                if (statusEl) {
                    statusEl.style.color = '#ff5252';
                    statusEl.textContent = 'Please enter a player name!';
                }
                return;
            }

            let currentUser = currentCloudUser;
            try {
                if (!currentUser) {
                    currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
                }
            } catch (e) {}

            if (!currentUser || !currentUser.username) {
                if (statusEl) {
                    statusEl.style.color = '#ff5252';
                    statusEl.textContent = 'Error: Not logged in properly!';
                }
                return;
            }

            // 1. Update display name in local object
            currentUser.displayName = newDisplayName;
            localStorage.setItem('loggedInUser', JSON.stringify(currentUser));

            // 2. Sync name update to Cloud Firestore
            if (currentCloudUser) {
                try {
                    const userDocRef = doc(db, "users", currentCloudUser.uid);
                    const leaderboardDocRef = doc(db, "leaderboard", currentCloudUser.uid);

                    await setDoc(userDocRef, { displayName: newDisplayName }, { merge: true });
                    await setDoc(leaderboardDocRef, { displayName: newDisplayName }, { merge: true });
                } catch (e) {
                    console.error("Error syncing profile name to Firestore: ", e);
                }
            }

            // 3. Save legacy tracking key if used elsewhere
            localStorage.setItem('vinpix_username', newDisplayName);

            // 4. Update UI text instantly
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
});
