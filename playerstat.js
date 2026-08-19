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
