// playerstat.js - Fully synchronized with profile.js & script.js

function getCurrentUsername() {
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
        if (userObj && userObj.username) {
            return userObj.username;
        }
    } catch (e) {}
    return localStorage.getItem('vinpix_username') || '';
}

function getUserKey(keyName) {
    const username = getCurrentUsername();
    return username ? `${username}_${keyName}` : keyName;
}

function getCurrentLevel() {
    return parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;
}

function updateCoinDisplay() {
    const totalCoins = parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0;
    const coinElem = document.getElementById('coinCount');
    if (coinElem) {
        coinElem.innerText = totalCoins;
    }
}

async function fetchUserDataFromFirestore() {
    try {
        const username = getCurrentUsername();
        if (!username) {
            return;
        }
        
        if (window.pixvinzDb && window.pixvinzDb.db) {
            const { db, doc, getDoc } = window.pixvinzDb;
            const userRef = doc(db, "players", username);
            const docSnap = await getDoc(userRef);
            
            if (docSnap.exists()) {
                const cloudData = docSnap.data();
                
                const localLevel = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;
                const localCoins = parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0;
                
                // Keep the highest level (prevents resetting to level 1)
                const cloudLevel = cloudData.level || 1;
                if (cloudLevel > localLevel) {
                    localStorage.setItem(getUserKey('currentLevel'), cloudLevel);
                } else if (localLevel > cloudLevel) {
                    if (typeof saveUserDataToCloud === 'function') {
                        await saveUserDataToCloud();
                    }
                }
                
                // Keep the highest coin balance
                const cloudCoins = cloudData.coins || 0;
                if (cloudCoins > localCoins) {
                    localStorage.setItem(getUserKey('totalCoins'), cloudCoins);
                }
            }
        }
    } catch (err) {
        console.warn("Cloud fetch warning (safely bypassed):", err);
    } finally {
        // Always update the display, even if cloud fetch fails
        updateCoinDisplay();
    }
}


function earnCoins(amount) {
    const key = getUserKey('totalCoins');
    let totalCoins = (parseInt(localStorage.getItem(key)) || 0) + amount;
    localStorage.setItem(key, totalCoins);
    updateCoinDisplay();
    saveUserDataToCloud(); // Auto-sync to cloud when coins change!
}

// Safely deducts coins for purchases (returns true if successful, false if broke)
function spendCoins(amount) {
    const key = getUserKey('totalCoins');
    let currentCoins = parseInt(localStorage.getItem(key)) || 0;

    if (currentCoins < amount) {
        return false; 
    }

    currentCoins -= amount;
    localStorage.setItem(key, currentCoins);
    updateCoinDisplay();
    saveUserDataToCloud(); // Auto-sync to cloud when coins change!
    return true; 
} // <-- FIXED: Added closing bracket here!

// Handles victory, saves with profile.js keys, and triggers profile sync if available
async function handleLevelVictory(completedLevel, stars, finalMoves, finalTimeStr) {
    const totalCoinsKey = getUserKey('totalCoins');
    const currentLevelKey = getUserKey('currentLevel');

    let totalCoins = parseInt(localStorage.getItem(totalCoinsKey)) || 0;
    let maxUnlocked = parseInt(localStorage.getItem(currentLevelKey)) || 1;

    let targetCoins = stars * 5;
    totalCoins += targetCoins;
    localStorage.setItem(totalCoinsKey, totalCoins);

    let nextLevelToUnlock = maxUnlocked;
    if (completedLevel >= maxUnlocked) {
        nextLevelToUnlock = completedLevel + 1;
        localStorage.setItem(currentLevelKey, nextLevelToUnlock);
    }

    // Save individual level stats using the username prefix
    if (finalMoves !== undefined) {
        localStorage.setItem(getUserKey(`levelMoves_${completedLevel}`), finalMoves);
    }
    if (finalTimeStr !== undefined) {
        localStorage.setItem(getUserKey(`levelTime_${completedLevel}`), finalTimeStr);
    }

    updateCoinDisplay();

    const modal = document.getElementById('victoryModal') || document.getElementById('winModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    // Trigger profile.js cloud sync function if it exists
    if (typeof saveUserDataToCloud === 'function') {
         saveUserDataToCloud();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    updateCoinDisplay();
  await   fetchUserDataFromFirestore();
});
