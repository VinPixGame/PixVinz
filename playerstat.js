// playerstat.js - Fully synchronized with profile.js & auth.js

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

function earnCoins(amount) {
    const key = getUserKey('totalCoins');
    let totalCoins = (parseInt(localStorage.getItem(key)) || 0) + amount;
    localStorage.setItem(key, totalCoins);

    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        if (userObj) {
            userObj.coins = totalCoins;
            localStorage.setItem('loggedInUser', JSON.stringify(userObj));
        }
    } catch (e) {}

    updateCoinDisplay();
    if (typeof window.saveUserDataToCloud === 'function') {
        window.saveUserDataToCloud();
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

    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        if (userObj) {
            userObj.coins = currentCoins;
            localStorage.setItem('loggedInUser', JSON.stringify(userObj));
        }
    } catch (e) {}

    updateCoinDisplay();
    if (typeof window.saveUserDataToCloud === 'function') {
        window.saveUserDataToCloud();
    }
    return true; 
} 

async function handleLevelVictory(completedLevel, stars, finalMoves, finalTimeStr) {
    const totalCoinsKey = getUserKey('totalCoins');
    const currentLevelKey = getUserKey('currentLevel');
    const xpKey = getUserKey('xp');

    let totalCoins = parseInt(localStorage.getItem(totalCoinsKey)) || 0;
    let maxUnlocked = parseInt(localStorage.getItem(currentLevelKey)) || 1;
    let currentXp = parseInt(localStorage.getItem(xpKey)) || 0;

    let tier = Math.floor((completedLevel - 1) / 10);
    let xpGained = (tier + 1) * 100;
    let coinReward = (stars || 1) * 5;

    // 1. Calculate new values
    currentXp += xpGained;
    totalCoins += coinReward;

    let nextLevelToUnlock = maxUnlocked;
    if (completedLevel >= maxUnlocked) {
        nextLevelToUnlock = completedLevel + 1;
    }

    // 2. Write straight to key-value LocalStorage
    localStorage.setItem(xpKey, currentXp);
    localStorage.setItem(totalCoinsKey, totalCoins);
    localStorage.setItem(currentLevelKey, nextLevelToUnlock);

    if (finalMoves !== undefined) {
        localStorage.setItem(getUserKey(`levelMoves_${completedLevel}`), finalMoves);
    }
    if (finalTimeStr !== undefined) {
        localStorage.setItem(getUserKey(`levelTime_${completedLevel}`), finalTimeStr);
    }

    // 3. Update loggedInUser JSON object
    try {
        const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        loggedInUser.xp = currentXp;
        loggedInUser.coins = totalCoins;
        loggedInUser.level = nextLevelToUnlock;
        localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    } catch (e) {}

    // 4. Update UI
    updateCoinDisplay();

    const modal = document.getElementById('victoryModal') || document.getElementById('winModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }

    // 5. Direct push to cloud
    if (typeof window.saveUserDataToCloud === 'function') {
        await window.saveUserDataToCloud();
    }
}
document.addEventListener('DOMContentLoaded', async () => {
    updateCoinDisplay();
    if (typeof fetchUserDataFromFirestore === 'function') {
        await fetchUserDataFromFirestore();
    }
});
