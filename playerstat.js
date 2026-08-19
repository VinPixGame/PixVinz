// playerstat.js - Handles all cloud-synced player data (Coins, XP, Levels, Avatar)

// In-memory cache so your game can read stats instantly without hitting Firestore every frame
window.currentPlayerData = {
    totalCoins: 0,
    level: 1,
    xp: 0
    // add other stats here as needed
};

// Update the coin count on the screen
function updateCoinDisplay() {
    const totalCoins = window.currentPlayerData.totalCoins || 0;
    const coinElem = document.getElementById('coinCount');
    if (coinElem) {
        coinElem.innerText = totalCoins;
    }
}

// Earn coins and sync to Firestore
async function earnCoins(amount) {
    window.currentPlayerData.totalCoins = (window.currentPlayerData.totalCoins || 0) + amount;
    updateCoinDisplay();

    const loggedInUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (loggedInUser && loggedInUser.displayName) {
        try {
            const db = firebase.firestore();
            await db.collection('players').doc(loggedInUser.displayName).update({
                totalCoins: window.currentPlayerData.totalCoins
            });
            console.log("Earned coins saved to Firestore!");
        } catch (error) {
            console.error("Error saving earned coins:", error);
        }
    }
}

// Spend coins and sync to Firestore
async function spendCoins(amount) {
    const currentCoins = window.currentPlayerData.totalCoins || 0;

    if (currentCoins < amount) {
        console.log("Not enough coins to spend!");
        return false; 
    }

    window.currentPlayerData.totalCoins = currentCoins - amount;
    updateCoinDisplay();

    const loggedInUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (loggedInUser && loggedInUser.displayName) {
        try {
            const db = firebase.firestore();
            await db.collection('players').doc(loggedInUser.displayName).update({
                totalCoins: window.currentPlayerData.totalCoins
            });
            console.log("Spent coins updated in Firestore!");
        } catch (error) {
            console.error("Error updating spent coins:", error);
        }
    }
    
    return true; 
}





// --- 1. CLOUD-SYNCED DATA CONTAINER ---
window.currentPlayerData = window.currentPlayerData || {
    totalCoins: 0,
    currentLevel: 1,
    levelCoins: {} // Stores coins earned per level, e.g., { 1: 10, 2: 5 }
};

// --- 2. COIN DISPLAY & MANAGEMENT ---
function updateCoinDisplay() {
    const totalCoins = window.currentPlayerData.totalCoins || 0;
    const coinElem = document.getElementById('coinCount');
    if (coinElem) {
        coinElem.innerText = totalCoins;
    }
}

async function earnCoins(amount) {
    window.currentPlayerData.totalCoins = (window.currentPlayerData.totalCoins || 0) + amount;
    updateCoinDisplay();

    const loggedInUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (loggedInUser && loggedInUser.displayName) {
        try {
            const db = firebase.firestore();
            await db.collection('players').doc(loggedInUser.displayName).update({
                totalCoins: window.currentPlayerData.totalCoins
            });
        } catch (error) {
            console.error("Error saving earned coins:", error);
        }
    }
}

// --- 3. LEVEL & STAR HELPERS (Replaces localStorage level lookups) ---
function getCurrentLevel() {
    return window.currentPlayerData.currentLevel || 1;
}

function getLevelStars(levelNumber, isSolved) {
    const levelCoinsMap = window.currentPlayerData.levelCoins || {};
    const levelCoins = levelCoinsMap[levelNumber] || 0;
    return Math.min(3, Math.floor(levelCoins / 5)) || (isSolved ? 3 : 0);
}

// --- 4. CLOUD SYNC HANDLER (Replaces localStorage freshData loop) ---
function applyFreshCloudData(freshData) {
    if (!freshData) return;

    if (!window.currentPlayerData) {
        window.currentPlayerData = {};
    }

    // Map incoming Firestore fields to memory
    if (freshData.coins !== undefined) {
        window.currentPlayerData.totalCoins = freshData.coins;
    }
    if (freshData.level !== undefined) {
        window.currentPlayerData.currentLevel = freshData.level;
    }
    if (freshData.levelCoins !== undefined) {
        window.currentPlayerData.levelCoins = freshData.levelCoins;
    }

    // Refresh UI elements automatically
    updateCoinDisplay();
    
    // Call any other UI refreshters you might have here if needed
    if (typeof updateLevelDisplay === 'function') {
        updateLevelDisplay();
    }
}

