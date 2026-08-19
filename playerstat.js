// playerstat.js - Handles all cloud-synced player data (Coins, Levels, & Firestore)

// --- 1. GLOBAL IN-MEMORY CACHE ---
window.currentPlayerData = {
    totalCoins: 0,
    currentLevel: 1,
    levelCoins: {}, // Stores coins earned per level: { 1: 15, 2: 10 }
    xp: 0
};

// --- 2. UI DISPLAY UPDATER ---
function updateCoinDisplay() {
    const totalCoins = window.currentPlayerData.totalCoins || 0;
    const coinElem = document.getElementById('coinCount');
    if (coinElem) {
        coinElem.innerText = totalCoins;
    }
}

// --- 3. FETCH CLOUD DATA ON LOAD ---
async function fetchUserDataFromFirestore() {
    const user = getCurrentUser();
    if (!user || !user.username) return;
    
    try {
        const userRef = doc(db, "users", user.username);
        const docSnap = await getDoc(userRef);
        
        if (docSnap.exists()) {
            const cloudData = docSnap.data();
            window.currentPlayerData = {
                totalCoins: cloudData.totalCoins !== undefined ? cloudData.totalCoins : 0,
                currentLevel: cloudData.currentLevel !== undefined ? cloudData.currentLevel : 1,
                levelCoins: cloudData.levelCoins || {},
                xp: cloudData.xp || 0
            };
        } else {
            window.currentPlayerData = { totalCoins: 0, currentLevel: 1, levelCoins: {}, xp: 0 };
        }
        
        // Refresh UI with loaded data
        updateCoinDisplay();
        if (typeof updateLevelDisplay === 'function') updateLevelDisplay();
        
    } catch (err) {
        console.error("Error fetching from Firestore:", err);
    }
}

// --- 4. EARN COINS (General use) ---
async function earnCoins(amount) {
    window.currentPlayerData.totalCoins = (window.currentPlayerData.totalCoins || 0) + amount;
    updateCoinDisplay();

    const user = getCurrentUser();
    if (user && user.username) {
        try {
            const userRef = doc(db, "users", user.username);
            await updateDoc(userRef, {
                totalCoins: window.currentPlayerData.totalCoins
            });
            console.log("Earned coins saved to Firestore!");
        } catch (error) {
            console.error("Error saving earned coins:", error);
        }
    }
}

// --- 5. SPEND COINS ---
async function spendCoins(amount) {
    const currentCoins = window.currentPlayerData.totalCoins || 0;

    if (currentCoins < amount) {
        console.log("Not enough coins to spend!");
        return false; 
    }

    window.currentPlayerData.totalCoins = currentCoins - amount;
    updateCoinDisplay();

    const user = getCurrentUser();
    if (user && user.username) {
        try {
            const userRef = doc(db, "users", user.username);
            await updateDoc(userRef, {
                totalCoins: window.currentPlayerData.totalCoins
            });
            console.log("Spent coins updated in Firestore!");
        } catch (error) {
            console.error("Error updating spent coins:", error);
        }
    }
    
    return true; 
}

// --- 6. LEVEL & STAR HELPERS ---
function getCurrentLevel() {
    return window.currentPlayerData.currentLevel || 1;
}

function getLevelStars(levelNumber, isSolved) {
    const levelCoinsMap = window.currentPlayerData.levelCoins || {};
    const levelCoins = levelCoinsMap[levelNumber] || 0;
    return Math.min(3, Math.floor(levelCoins / 5)) || (isSolved ? 3 : 0);
}

// --- 7. LEVEL VICTORY & PROGRESSION HANDLER ---
async function handleLevelVictory(completedLevel, stars) {
    const user = getCurrentUser();
    if (!user || !user.username) return;

    if (!window.currentPlayerData.levelCoins) {
        window.currentPlayerData.levelCoins = {};
    }

    const currentLevelCoins = window.currentPlayerData.levelCoins[completedLevel] || 0;
    let targetCoins = stars * 5; 
    let newCoinsEarned = 0;
    let totalCoins = window.currentPlayerData.totalCoins || 0;

    if (targetCoins > currentLevelCoins) {
        newCoinsEarned = targetCoins - currentLevelCoins;
        window.currentPlayerData.levelCoins[completedLevel] = targetCoins;

        totalCoins += newCoinsEarned;
        window.currentPlayerData.totalCoins = totalCoins;
    }

    let maxUnlocked = window.currentPlayerData.currentLevel || 1;
    let nextLevelToUnlock = maxUnlocked;
    if (completedLevel >= maxUnlocked) {
        nextLevelToUnlock = completedLevel + 1;
        window.currentPlayerData.currentLevel = nextLevelToUnlock;
    }

    // Refresh UI & Show Victory Modal
    updateCoinDisplay();
    const modal = document.getElementById('victoryModal');
    if (modal) modal.classList.remove('hidden');
    if (typeof startConfetti === 'function') startConfetti();

    // Sync all updates directly to Firestore
    try {
        const userRef = doc(db, "users", user.username);
        await updateDoc(userRef, {
            totalCoins: window.currentPlayerData.totalCoins,
            currentLevel: window.currentPlayerData.currentLevel,
            levelCoins: window.currentPlayerData.levelCoins
        });
        console.log("Victory stats saved to Firestore!");
    } catch (err) {
        console.error("Error updating Firestore on victory:", err);
    }
}

// --- 8. PREVIEW BUTTON LOGIC ---
let previewTimer = null;
let countdownInterval = null;

function closePreviewModal() {
    const modal = document.getElementById('imageModal');
    if (modal) modal.classList.add('hidden');
    if (previewTimer) clearTimeout(previewTimer);
    if (countdownInterval) clearInterval(countdownInterval);
}

document.addEventListener('DOMContentLoaded', () => {
    const previewBtn = document.getElementById('previewBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', async () => {
            if (typeof AudioManager !== 'undefined') AudioManager.playClick();

            let totalCoins = window.currentPlayerData.totalCoins || 0;
            const previewCost = 5;

            if (totalCoins < previewCost) {
                alert("Not enough coins! You need 5 coins to preview the image.");
                return;
            }

            // Deduct coins using the spendCoins function built above
            await spendCoins(previewCost);
            console.log("Preview coins deducted and saved!");
        });
    }
});


// Add this at the bottom of playerstat.js
document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserDataFromFirestore();
});
