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
    // 1. Fetch current loggedInUser object (matching Daily Reward logic)
    let loggedInUser = {};
    try {
        loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    } catch(e) {}

    let currentLevel = Number(loggedInUser.level || localStorage.getItem('currentLevel') || 1);
    let totalCoins = Number(loggedInUser.coins || localStorage.getItem('totalCoins') || 0);
    let currentXp = Number(loggedInUser.xp || localStorage.getItem('xp') || 0);

    // 2. Calculate rewards
    let tier = Math.floor((completedLevel - 1) / 10);
    let xpGained = (tier + 1) * 100;
    let coinReward = (stars || 1) * 5;

    currentXp += xpGained;
    totalCoins += coinReward;

    if (completedLevel >= currentLevel) {
        currentLevel = completedLevel + 1;
    }

    // 3. Update loggedInUser object AND raw localStorage keys
    loggedInUser.level = currentLevel;
    loggedInUser.coins = totalCoins;
    loggedInUser.xp = currentXp;

    localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    
    // Also save to individual keys to prevent UI mismatches
    localStorage.setItem(getUserKey('totalCoins'), totalCoins);
    localStorage.setItem(getUserKey('currentLevel'), currentLevel);
    localStorage.setItem(getUserKey('xp'), currentXp);
    localStorage.setItem('totalCoins', totalCoins);
    localStorage.setItem('currentLevel', currentLevel);
    localStorage.setItem('xp', currentXp);

    // 4. Update UI
    if (typeof updateCoinDisplay === 'function') updateCoinDisplay();

    // 5. Trigger cloud save using exact same pattern as Daily Reward
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
