// playerstat.js - Fully synchronized with profile.js, game.js & script.js

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

function getCurrentXp() {
    return parseInt(localStorage.getItem(getUserKey('xp'))) || 0;
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
        if (!username) return;
        
        if (window.pixvinzDb && window.pixvinzDb.db) {
            const { db, doc, getDoc } = window.pixvinzDb;
            const userRef = doc(db, "players", username);
            const docSnap = await getDoc(userRef);
            
            if (docSnap.exists()) {
                const cloudData = docSnap.data();
                
                const localLevel = parseInt(localStorage.getItem(getUserKey('currentLevel'))) || 1;
                const localCoins = parseInt(localStorage.getItem(getUserKey('totalCoins'))) || 0;
                const localXp = parseInt(localStorage.getItem(getUserKey('xp'))) || 0;
                
                // Keep highest level
                const cloudLevel = cloudData.level || 1;
                if (cloudLevel > localLevel) {
                    localStorage.setItem(getUserKey('currentLevel'), cloudLevel);
                } else if (localLevel > cloudLevel) {
                    await saveUserDataToCloud();
                }

                // Keep highest XP
                const cloudXp = cloudData.xp || 0;
                if (cloudXp > localXp) {
                    localStorage.setItem(getUserKey('xp'), cloudXp);
                }

                // Sync Coins safely (If local key doesn't exist yet, populate from cloud)
                if (localStorage.getItem(getUserKey('totalCoins')) === null && cloudData.coins !== undefined) {
                    localStorage.setItem(getUserKey('totalCoins'), cloudData.coins);
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
    if (typeof saveUserDataToCloud === 'function') {
        saveUserDataToCloud();
    }
}

function spendCoins(amount) {
    const key = getUserKey('totalCoins');
    let currentCoins = parseInt(localStorage.getItem(key)) || 0;

    if (currentCoins < amount) {
        return false; 
    }

    currentCoins -= amount;
    localStorage.setItem(key, currentCoins);
    updateCoinDisplay();
    if (typeof saveUserDataToCloud === 'function') {
        saveUserDataToCloud();
    }
    return true; 
}

// Handles victory, updates level, coins, and XP, then triggers cloud sync
async function handleLevelVictory(completedLevel, stars, finalMoves, finalTimeStr) {
    const totalCoinsKey = getUserKey('totalCoins');
    const currentLevelKey = getUserKey('currentLevel');
    const xpKey = getUserKey('xp');

    let totalCoins = parseInt(localStorage.getItem(totalCoinsKey)) || 0;
    let maxUnlocked = parseInt(localStorage.getItem(currentLevelKey)) || 1;
    let currentXp = parseInt(localStorage.getItem(xpKey)) || 0;

    // Coins & Level progress
    let targetCoins = stars * 5;
    totalCoins += targetCoins;
    localStorage.setItem(totalCoinsKey, totalCoins);

    if (completedLevel >= maxUnlocked) {
        localStorage.setItem(currentLevelKey, completedLevel + 1);
    }

    // XP progress calculation matching game tier
    let tier = Math.floor((completedLevel - 1) / 10);
    let xpGained = (tier + 1) * 100;
    currentXp += xpGained;
    localStorage.setItem(xpKey, currentXp);

    // Level-specific metrics
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

    // Explicitly await sync to ensure write completion before user changes pages
    if (typeof saveUserDataToCloud === 'function') {
        await saveUserDataToCloud();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    updateCoinDisplay();
    await fetchUserDataFromFirestore();
});
