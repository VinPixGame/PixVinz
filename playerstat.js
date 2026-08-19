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
    const username = getCurrentUsername();
    if (!username) {
        updateCoinDisplay();
        return;
    }
    
    try {
        if (window.db && window.doc && window.getDoc) {
            const userRef = window.doc(window.db, "players", username);
            const docSnap = await window.getDoc(userRef);
            
            if (docSnap.exists()) {
                const cloudData = docSnap.data();
                if (cloudData.coins !== undefined) {
                    localStorage.setItem(getUserKey('totalCoins'), cloudData.coins);
                }
                if (cloudData.level !== undefined) {
                    localStorage.setItem(getUserKey('currentLevel'), cloudData.level);
                }
            }
        }
    } catch (err) {
        console.error("Cloud fetch warning (using local fallback):", err);
    }
    
    updateCoinDisplay();
}

async function earnCoins(amount) {
    const key = getUserKey('totalCoins');
    let totalCoins = (parseInt(localStorage.getItem(key)) || 0) + amount;
    localStorage.setItem(key, totalCoins);
    updateCoinDisplay();
}

async function spendCoins(amount) {
    const key = getUserKey('totalCoins');
    let currentCoins = parseInt(localStorage.getItem(key)) || 0;

    if (currentCoins < amount) {
        return false; 
    }

    currentCoins -= amount;
    localStorage.setItem(key, currentCoins);
    updateCoinDisplay();
    return true; 
}

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

    // Trigger profile.js cloud sync function if it exists
    if (typeof saveUserDataToCloud === 'function') {
        await saveUserDataToCloud();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    updateCoinDisplay();
    await fetchUserDataFromFirestore();
});
