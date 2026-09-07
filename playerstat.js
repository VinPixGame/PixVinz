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
                const localXp = parseInt(localStorage.getItem(getUserKey('totalXp'))) || 0;
                
                // Sync XP down if cloud XP is available
                if (cloudData.xp !== undefined && cloudData.xp > localXp) {
                    localStorage.setItem(getUserKey('totalXp'), cloudData.xp);
                }

                // Keep the highest level
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
                } else if (localCoins > cloudCoins) {
                    if (typeof saveUserDataToCloud === 'function') {
                        await saveUserDataToCloud();
                    }
                }
            }
        }
    } catch (err) {
        console.warn("Cloud fetch warning (safely bypassed):", err);
    } finally {
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
} 

// Handles victory, saves with profile.js keys, and triggers profile sync if available
async function handleLevelVictory(completedLevel, stars, finalMoves, finalTimeStr) {
    const totalCoinsKey = getUserKey('totalCoins');
    const currentLevelKey = getUserKey('currentLevel');
    const totalXpKey = getUserKey('totalXp');

    let totalCoins = parseInt(localStorage.getItem(totalCoinsKey)) || 0;
    let maxUnlocked = parseInt(localStorage.getItem(currentLevelKey)) || 1;
    let currentXp = parseInt(localStorage.getItem(totalXpKey)) || 0;

    // 1. Award Coins
    let targetCoins = stars * 5;
    totalCoins += targetCoins;
    localStorage.setItem(totalCoinsKey, totalCoins);

    // 2. Award XP (100 XP per level victory)
    let xpEarned = 100;
    currentXp += xpEarned;
    localStorage.setItem(totalXpKey, currentXp);

    // 3. Unlock Next Level
    let nextLevelToUnlock = maxUnlocked;
    if (completedLevel >= maxUnlocked) {
        nextLevelToUnlock = completedLevel + 1;
        localStorage.setItem(currentLevelKey, nextLevelToUnlock);
    }

    // Save individual level stats
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

    // Trigger profile.js cloud sync function
    if (typeof saveUserDataToCloud === 'function') {
        await saveUserDataToCloud();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    updateCoinDisplay();
    await fetchUserDataFromFirestore();
});
