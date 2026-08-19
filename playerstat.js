// playerstat.js - Safe & Crash-Proof Player Data Manager

window.currentPlayerData = {
    totalCoins: parseInt(localStorage.getItem('totalCoins')) || 0,
    currentLevel: parseInt(localStorage.getItem('currentLevel')) || 1,
    levelCoins: {},
    xp: parseInt(localStorage.getItem('xp')) || 0
};

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('loggedInUser'));
    } catch (e) {
        return null;
    }
}

function updateCoinDisplay() {
    const totalCoins = parseInt(localStorage.getItem('totalCoins')) || window.currentPlayerData.totalCoins || 0;
    const coinElem = document.getElementById('coinCount');
    if (coinElem) {
        coinElem.innerText = totalCoins;
    }
}

async function fetchUserDataFromFirestore() {
    const user = getCurrentUser();
    if (!user || !user.username) {
        updateCoinDisplay();
        return;
    }
    
    try {
        if (window.db && window.doc && window.getDoc) {
            const userRef = window.doc(window.db, "users", user.username);
            const docSnap = await window.getDoc(userRef);
            
            if (docSnap.exists()) {
                const cloudData = docSnap.data();
                window.currentPlayerData = {
                    totalCoins: cloudData.totalCoins !== undefined ? cloudData.totalCoins : window.currentPlayerData.totalCoins,
                    currentLevel: cloudData.currentLevel !== undefined ? cloudData.currentLevel : window.currentPlayerData.currentLevel,
                    levelCoins: cloudData.levelCoins || {},
                    xp: cloudData.xp || 0
                };
                localStorage.setItem('totalCoins', window.currentPlayerData.totalCoins);
                localStorage.setItem('currentLevel', window.currentPlayerData.currentLevel);
            }
        }
    } catch (err) {
        console.error("Cloud fetch warning (using local fallback):", err);
    }
    
    updateCoinDisplay();
    if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
}

async function earnCoins(amount) {
    window.currentPlayerData.totalCoins = (parseInt(localStorage.getItem('totalCoins')) || 0) + amount;
    localStorage.setItem('totalCoins', window.currentPlayerData.totalCoins);
    updateCoinDisplay();

    const user = getCurrentUser();
    if (user && user.username && window.db && window.updateDoc) {
        try {
            const userRef = window.doc(window.db, "users", user.username);
            await window.updateDoc(userRef, { totalCoins: window.currentPlayerData.totalCoins });
        } catch (error) {
            console.error("Error saving coins:", error);
        }
    }
}

async function spendCoins(amount) {
    let currentCoins = parseInt(localStorage.getItem('totalCoins')) || window.currentPlayerData.totalCoins || 0;

    if (currentCoins < amount) {
        return false; 
    }

    currentCoins -= amount;
    window.currentPlayerData.totalCoins = currentCoins;
    localStorage.setItem('totalCoins', currentCoins);
    updateCoinDisplay();

    const user = getCurrentUser();
    if (user && user.username && window.db && window.updateDoc) {
        try {
            const userRef = window.doc(window.db, "users", user.username);
            await window.updateDoc(userRef, { totalCoins: currentCoins });
        } catch (error) {
            console.error("Error updating spent coins:", error);
        }
    }
    
    return true; 
}

function getCurrentLevel() {
    return parseInt(localStorage.getItem('currentLevel')) || window.currentPlayerData.currentLevel || 1;
}

async function handleLevelVictory(completedLevel, stars) {
    const user = getCurrentUser();
    
    let totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
    let maxUnlocked = parseInt(localStorage.getItem('currentLevel')) || 1;

    let targetCoins = stars * 5;
    let newCoinsEarned = targetCoins; // Give coins for win

    totalCoins += newCoinsEarned;
    localStorage.setItem('totalCoins', totalCoins);
    window.currentPlayerData.totalCoins = totalCoins;

    let nextLevelToUnlock = maxUnlocked;
    if (completedLevel >= maxUnlocked) {
        nextLevelToUnlock = completedLevel + 1;
        localStorage.setItem('currentLevel', nextLevelToUnlock);
        window.currentPlayerData.currentLevel = nextLevelToUnlock;
    }

    updateCoinDisplay();
    
    const modal = document.getElementById('victoryModal');
    if (modal) modal.classList.remove('hidden');
    if (typeof startConfetti === 'function') startConfetti();

    if (user && user.username && window.db && window.setDoc) {
        try {
            const userRef = window.doc(window.db, "users", user.username);
            await window.setDoc(userRef, {
                totalCoins: totalCoins,
                currentLevel: nextLevelToUnlock,
                [`levelCoins_${completedLevel}`]: targetCoins
            }, { merge: true });
        } catch (err) {
            console.error("Error saving victory to cloud:", err);
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    updateCoinDisplay();
    await fetchUserDataFromFirestore();
});
