// ==========================================
// PIXVINZ - PLAYER STAT SCRIPT
// FIRESTORE XP SYNCED WITH LOGIN + PROFILE
// ==========================================

// ==========================================
// USER HELPERS
// ==========================================

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
    return `${username}_${keyName}`;
}


// ==========================================
// GET CURRENT XP
// ==========================================

function getCurrentXp() {
    const username = getCurrentUsername();

    if (!username) {
        return 0;
    }

    const xpKey = `${username}_xp`;

    // 1. Preferred source: user-specific XP local cache
    const storedXp = Number(localStorage.getItem(xpKey));

    if (Number.isFinite(storedXp) && storedXp >= 0) {
        return storedXp;
    }

    // 2. Fallback: logged-in session
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser'));

        const sessionXp = Number(userObj?.xp);

        if (Number.isFinite(sessionXp) && sessionXp >= 0) {
            localStorage.setItem(xpKey, String(sessionXp));
            return sessionXp;
        }
    } catch (e) {}

    return 0;
}


// ==========================================
// SET CURRENT XP
// ==========================================

function setCurrentXp(xp) {
    const username = getCurrentUsername();

    if (!username) {
        return;
    }

    const safeXp = Math.max(0, Number(xp) || 0);

    // Save to user-specific localStorage
    localStorage.setItem(`${username}_xp`, String(safeXp));

    // Keep loggedInUser synchronized
    try {
        const userObj = JSON.parse(localStorage.getItem('loggedInUser')) || {};

        userObj.xp = safeXp;

        localStorage.setItem(
            'loggedInUser',
            JSON.stringify(userObj)
        );
    } catch (e) {}

    return safeXp;
}


// ==========================================
// ADD XP
// ==========================================

function addXp(amount) {
    const xpAmount = Number(amount) || 0;

    if (xpAmount <= 0) {
        return getCurrentXp();
    }

    const currentXp = getCurrentXp();
    const newXp = currentXp + xpAmount;

    setCurrentXp(newXp);

    console.log(
        `XP updated: ${currentXp} + ${xpAmount} = ${newXp}`
    );

    return newXp;
}


// Make available globally
window.getCurrentXp = getCurrentXp;
window.setCurrentXp = setCurrentXp;
window.addXp = addXp;


// ==========================================
// CURRENT LEVEL
// ==========================================

function getCurrentLevel() {
    const username = getCurrentUsername();

    if (!username) {
        return 1;
    }

    return Math.max(
        1,
        parseInt(
            localStorage.getItem(`${username}_currentLevel`)
        ) || 1
    );
}

function setCurrentLevel(level) {
    const username = getCurrentUsername();

    if (!username) {
        return;
    }

    const safeLevel = Math.max(1, Number(level) || 1);

    localStorage.setItem(
        `${username}_currentLevel`,
        String(safeLevel)
    );

    // Keep session object synchronized
    try {
        const userObj = JSON.parse(
            localStorage.getItem('loggedInUser')
        ) || {};

        userObj.level = safeLevel;

        localStorage.setItem(
            'loggedInUser',
            JSON.stringify(userObj)
        );
    } catch (e) {}

    return safeLevel;
}


// ==========================================
// CURRENT COINS
// ==========================================

function getCurrentCoins() {
    const username = getCurrentUsername();

    if (!username) {
        return 0;
    }

    return Math.max(
        0,
        parseInt(
            localStorage.getItem(`${username}_totalCoins`)
        ) || 0
    );
}

function setCurrentCoins(coins) {
    const username = getCurrentUsername();

    if (!username) {
        return;
    }

    const safeCoins = Math.max(0, Number(coins) || 0);

    localStorage.setItem(
        `${username}_totalCoins`,
        String(safeCoins)
    );

    try {
        const userObj = JSON.parse(
            localStorage.getItem('loggedInUser')
        ) || {};

        userObj.coins = safeCoins;

        localStorage.setItem(
            'loggedInUser',
            JSON.stringify(userObj)
        );
    } catch (e) {}

    return safeCoins;
}


// ==========================================
// EARN COINS
// ==========================================

window.earnCoins = function(amount) {
    const coinAmount = Number(amount) || 0;

    if (coinAmount <= 0) {
        return getCurrentCoins();
    }

    const currentCoins = getCurrentCoins();
    const newCoins = currentCoins + coinAmount;

    setCurrentCoins(newCoins);

    if (typeof updateCoinDisplay === 'function') {
        updateCoinDisplay();
    }

    console.log(
        `Coins updated: ${currentCoins} + ${coinAmount} = ${newCoins}`
    );

    return newCoins;
};


// ==========================================
// SAVE USER DATA TO FIRESTORE
// ==========================================

window.saveUserDataToCloud = async function() {
    try {
        if (!window.pixvinzDb || !window.pixvinzDb.db) {
            console.warn("Firestore is not available.");
            return;
        }

        const {
            db,
            doc,
            setDoc
        } = window.pixvinzDb;

        const username = getCurrentUsername();

        if (!username) {
            console.warn("No username available for cloud save.");
            return;
        }

        // --------------------------------------
        // GET SESSION DATA
        // --------------------------------------

        let userObj = {};

        try {
            userObj = JSON.parse(
                localStorage.getItem('loggedInUser')
            ) || {};
        } catch (e) {}

        const displayName =
            userObj.displayName ||
            username;

        // --------------------------------------
        // LEVEL
        // --------------------------------------

        const currentLevel =
            Math.max(
                1,
                parseInt(
                    localStorage.getItem(
                        `${username}_currentLevel`
                    )
                ) || Number(userObj.level) || 1
            );

        // --------------------------------------
        // XP
        // IMPORTANT:
        // NEVER calculate XP from level.
        // --------------------------------------

        let currentXpVal =
            Number(
                localStorage.getItem(
                    `${username}_xp`
                )
            );

        if (!Number.isFinite(currentXpVal)) {
            currentXpVal = Number(userObj.xp);
        }

        if (!Number.isFinite(currentXpVal)) {
            currentXpVal = 0;
        }

        currentXpVal = Math.max(0, currentXpVal);

        // --------------------------------------
        // COINS
        // --------------------------------------

        const totalCoins =
            Math.max(
                0,
                parseInt(
                    localStorage.getItem(
                        `${username}_totalCoins`
                    )
                ) || Number(userObj.coins) || 0
            );

        // --------------------------------------
        // AVATAR
        // --------------------------------------

        const avatar =
            localStorage.getItem(
                `${username}_vinpix_avatar`
            ) ||
            userObj.avatar ||
            '';

        // --------------------------------------
        // CHALLENGE
        // --------------------------------------

        const currentChallenge =
            parseInt(
                localStorage.getItem(
                    `${username}_currentChallenge`
                )
            ) || 1;

        // --------------------------------------
        // SAVE TO FIRESTORE
        // --------------------------------------

        const userDocRef =
            doc(db, "players", username);

        await setDoc(
            userDocRef,
            {
                username: username,
                displayName: displayName,

                // Level stays independent
                level: currentLevel,

                // XP is independently persisted
                xp: currentXpVal,

                coins: totalCoins,
                avatar: avatar,
                challenge: currentChallenge,

                lastUpdated: new Date()
            },
            {
                merge: true
            }
        );

        // --------------------------------------
        // KEEP LOCAL SESSION IN SYNC
        // --------------------------------------

        localStorage.setItem(
            `${username}_xp`,
            String(currentXpVal)
        );

        localStorage.setItem(
            `${username}_currentLevel`,
            String(currentLevel)
        );

        localStorage.setItem(
            `${username}_totalCoins`,
            String(totalCoins)
        );

        try {
            userObj.xp = currentXpVal;
            userObj.level = currentLevel;
            userObj.coins = totalCoins;

            localStorage.setItem(
                'loggedInUser',
                JSON.stringify(userObj)
            );
        } catch (e) {}

        console.log(
            "Player data saved to Firestore:",
            {
                username,
                level: currentLevel,
                xp: currentXpVal,
                coins: totalCoins
            }
        );

    } catch (error) {
        console.error(
            "Failed to save player data to Firestore:",
            error
        );
    }
};


// ==========================================
// FETCH USER DATA FROM FIRESTORE
// ==========================================

window.fetchPlayerDataFromFirestore = async function() {
    const username = getCurrentUsername();

    if (!username) {
        return null;
    }

    try {
        if (!window.pixvinzDb || !window.pixvinzDb.db) {
            console.warn(
                "Firestore is not available."
            );
            return null;
        }

        const {
            db,
            doc,
            getDoc
        } = window.pixvinzDb;

        const userDocRef =
            doc(db, "players", username);

        const userSnap =
            await getDoc(userDocRef);

        if (!userSnap.exists()) {
            console.warn(
                "Player document does not exist:",
                username
            );
            return null;
        }

        const cloudData =
            userSnap.data();

        // --------------------------------------
        // CLOUD LEVEL
        // --------------------------------------

        if (cloudData.level !== undefined) {
            const cloudLevel =
                Math.max(
                    1,
                    Number(cloudData.level) || 1
                );

            localStorage.setItem(
                `${username}_currentLevel`,
                String(cloudLevel)
            );
        }

        // --------------------------------------
        // CLOUD XP
        // IMPORTANT:
        // This is the authoritative XP value.
        // --------------------------------------

        if (cloudData.xp !== undefined) {
            const cloudXp =
                Math.max(
                    0,
                    Number(cloudData.xp) || 0
                );

            // User-specific local XP
            localStorage.setItem(
                `${username}_xp`,
                String(cloudXp)
            );

            // Logged-in session XP
            try {
                const userObj =
                    JSON.parse(
                        localStorage.getItem(
                            'loggedInUser'
                        )
                    ) || {};

                userObj.xp = cloudXp;

                localStorage.setItem(
                    'loggedInUser',
                    JSON.stringify(userObj)
                );
            } catch (e) {}

            console.log(
                "XP loaded from Firestore:",
                cloudXp
            );
        }

        // --------------------------------------
        // CLOUD COINS
        // --------------------------------------

        if (cloudData.coins !== undefined) {
            const cloudCoins =
                Math.max(
                    0,
                    Number(cloudData.coins) || 0
                );

            localStorage.setItem(
                `${username}_totalCoins`,
                String(cloudCoins)
            );
        }

        // --------------------------------------
        // CLOUD AVATAR
        // --------------------------------------

        if (cloudData.avatar) {
            localStorage.setItem(
                `${username}_vinpix_avatar`,
                cloudData.avatar
            );
        }

        // --------------------------------------
        // CLOUD CHALLENGE
        // --------------------------------------

        if (cloudData.challenge !== undefined) {
            localStorage.setItem(
                `${username}_currentChallenge`,
                String(cloudData.challenge)
            );
        }

        // --------------------------------------
        // UPDATE loggedInUser
        // --------------------------------------

        try {
            const userObj =
                JSON.parse(
                    localStorage.getItem(
                        'loggedInUser'
                    )
                ) || {};

            if (cloudData.username !== undefined) {
                userObj.username =
                    cloudData.username;
            }

            if (cloudData.displayName !== undefined) {
                userObj.displayName =
                    cloudData.displayName;
            }

            if (cloudData.level !== undefined) {
                userObj.level =
                    Number(cloudData.level) || 1;
            }

            if (cloudData.xp !== undefined) {
                userObj.xp =
                    Math.max(
                        0,
                        Number(cloudData.xp) || 0
                    );
            }

            if (cloudData.coins !== undefined) {
                userObj.coins =
                    Math.max(
                        0,
                        Number(cloudData.coins) || 0
                    );
            }

            if (cloudData.avatar !== undefined) {
                userObj.avatar =
                    cloudData.avatar;
            }

            localStorage.setItem(
                'loggedInUser',
                JSON.stringify(userObj)
            );

        } catch (e) {}

        // --------------------------------------
        // UPDATE UI
        // --------------------------------------

        if (typeof updateXpProgress === 'function') {
            updateXpProgress();
        }

        if (typeof updateProfileStats === 'function') {
            updateProfileStats();
        }

        if (typeof updateCoinDisplay === 'function') {
            updateCoinDisplay();
        }

        console.log(
            "Player successfully loaded from Firestore."
        );

        return cloudData;

    } catch (error) {
        console.error(
            "Failed to fetch player data from Firestore:",
            error
        );

        return null;
    }
};


// ==========================================
// LEVEL VICTORY
// ==========================================

window.handleLevelVictory = async function(
    levelCompleted,
    moves,
    time
) {
    try {
        const username =
            getCurrentUsername();

        if (!username) {
            return;
        }

        // --------------------------------------
        // LEVEL
        // --------------------------------------

        const completedLevel =
            Math.max(
                1,
                Number(levelCompleted) || 1
            );

        const currentLevel =
            getCurrentLevel();

        // Unlock next level only if appropriate
        if (completedLevel >= currentLevel) {
            setCurrentLevel(
                completedLevel + 1
            );
        }

        // --------------------------------------
        // XP
        // --------------------------------------
        // XP must be ADDED to the existing
        // persisted XP.
        //
        // Do NOT calculate XP from level.
        // --------------------------------------

        let tier =
            Math.floor(
                (completedLevel - 1) / 10
            );

        let xpGained =
            (tier + 1) * 100;

        const oldXp =
            getCurrentXp();

        const newXp =
            oldXp + xpGained;

        setCurrentXp(newXp);

        console.log(
            `Level ${completedLevel} completed. XP: ${oldXp} + ${xpGained} = ${newXp}`
        );

        // --------------------------------------
        // COINS
        // --------------------------------------

        // Keep existing coin behavior.
        // If your original game awards coins
        // elsewhere, this does not interfere.

        // --------------------------------------
        // SAVE MOVE DATA
        // --------------------------------------

        if (
            moves !== undefined &&
            moves !== null
        ) {
            localStorage.setItem(
                `${username}_levelMoves_${completedLevel}`,
                String(moves)
            );
        }

        // --------------------------------------
        // SAVE TIME DATA
        // --------------------------------------

        if (
            time !== undefined &&
            time !== null
        ) {
            localStorage.setItem(
                `${username}_levelTime_${completedLevel}`,
                String(time)
            );
        }

        // --------------------------------------
        // UPDATE UI
        // --------------------------------------

        if (typeof updateXpProgress === 'function') {
            updateXpProgress();
        }

        if (typeof updateProfileStats === 'function') {
            updateProfileStats();
        }

        if (typeof updateCoinDisplay === 'function') {
            updateCoinDisplay();
        }

        // --------------------------------------
        // SAVE EVERYTHING TO FIRESTORE
        // --------------------------------------

        await saveUserDataToCloud();

    } catch (error) {
        console.error(
            "Error handling level victory:",
            error
        );
    }
};


// ==========================================
// LOAD PLAYER DATA WHEN PAGE LOADS
// ==========================================

document.addEventListener(
    'DOMContentLoaded',
    async () => {

        const username =
            getCurrentUsername();

        if (!username) {
            return;
        }

        // --------------------------------------
        // IMPORTANT:
        // Fetch Firestore FIRST.
        //
        // This prevents stale local XP from
        // overwriting the cloud XP.
        // --------------------------------------

        await fetchPlayerDataFromFirestore();

        // --------------------------------------
        // Refresh UI after cloud sync
        // --------------------------------------

        if (
            typeof updateXpProgress === 'function'
        ) {
            updateXpProgress();
        }

        if (
            typeof updateProfileStats === 'function'
        ) {
            updateProfileStats();
        }

        if (
            typeof updateCoinDisplay === 'function'
        ) {
            updateCoinDisplay();
        }

        console.log(
            "Player stats initialized for:",
            username
        );
    }
);
