/* =========================================================
   PIXVINZ - APPLICATION FLOW
   ========================================================= */


/* =========================================================
   SCREEN REFERENCES
   ========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const authScreen =
    document.getElementById("authScreen");

const homeScreen =
    document.getElementById("homeScreen");

const levelsScreen =
    document.getElementById("levelsScreen");

const collectionsScreen =
    document.getElementById("collectionsScreen");

const settingsScreen =
    document.getElementById("settingsScreen");


/* =========================================================
   AUTH REFERENCES
   ========================================================= */

const loginTab =
    document.getElementById("loginTab");

const registerTab =
    document.getElementById("registerTab");

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const loginMessage =
    document.getElementById("loginMessage");

const registerMessage =
    document.getElementById("registerMessage");


/* =========================================================
   PLAYER REFERENCES
   ========================================================= */

const displayNameElement =
    document.getElementById("displayName");

const coinCountElement =
    document.getElementById("coinCount");

const levelCoinCountElement =
    document.getElementById("levelCoinCount");

const soundButton =
    document.getElementById("soundButton");

const soundState =
    document.getElementById("soundState");

const levelGrid =
    document.getElementById("levelGrid");

const collectionGrid =
    document.getElementById("collectionGrid");

const aboutModal =
    document.getElementById("aboutModal");


/* =========================================================
   STORAGE KEYS
   ========================================================= */

const USERS_KEY =
    "pixvinz_users";

const CURRENT_USER_KEY =
    "pixvinz_current_user";

const PLAYER_DATA_PREFIX =
    "pixvinz_player_";


/* =========================================================
   PLAYER DATA
   ========================================================= */

function createDefaultPlayerData() {

    const levels = {};

    for (
        let level = 1;
        level <= TOTAL_LEVELS;
        level++
    ) {

        levels[level] = {

            unlocked:
                level === 1,

            completed:
                false,

            stars:
                0,

            bestTime:
                null,

            bestMoves:
                null,

            coinsEarned:
                0
        };
    }


    return {

        coins: 0,

        lastPlayedLevel: 1,

        soundEnabled: true,

        levels
    };
}


/* =========================================================
   USER STORAGE
   ========================================================= */

function getUsers() {

    try {

        return JSON.parse(
            localStorage.getItem(USERS_KEY)
        ) || {};

    } catch {

        return {};
    }
}


function saveUsers(users) {

    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );
}


function getCurrentUsername() {

    return localStorage.getItem(
        CURRENT_USER_KEY
    );
}


/* =========================================================
   PLAYER STORAGE
   ========================================================= */

function getPlayerData(username) {

    const key =
        PLAYER_DATA_PREFIX + username;


    try {

        const saved =
            localStorage.getItem(key);


        if (!saved) {

            const data =
                createDefaultPlayerData();

            savePlayerData(
                username,
                data
            );

            return data;
        }


        const data =
            JSON.parse(saved);


        /*
         * Safety migration:
         * If we add levels in the future,
         * old accounts receive them automatically.
         */

        for (
            let level = 1;
            level <= TOTAL_LEVELS;
            level++
        ) {

            if (!data.levels[level]) {

                data.levels[level] = {

                    unlocked:
                        level === 1,

                    completed:
                        false,

                    stars:
                        0,

                    bestTime:
                        null,

                    bestMoves:
                        null,

                    coinsEarned:
                        0
                };
            }
        }


        /*
         * Level 1 must always be available.
         */

        data.levels[1].unlocked =
            true;


        savePlayerData(
            username,
            data
        );


        return data;

    } catch {

        const data =
            createDefaultPlayerData();

        savePlayerData(
            username,
            data
        );

        return data;
    }
}


function savePlayerData(
    username,
    data
) {

    localStorage.setItem(
        PLAYER_DATA_PREFIX + username,
        JSON.stringify(data)
    );
}


/* =========================================================
   CURRENT PLAYER
   ========================================================= */

let currentUsername =
    getCurrentUsername();

let currentPlayer =
    currentUsername
        ? getPlayerData(currentUsername)
        : null;


/* =========================================================
   SCREEN MANAGEMENT
   ========================================================= */

function showScreen(screen) {

    const screens = [

        loadingScreen,
        authScreen,
        homeScreen,
        levelsScreen,
        collectionsScreen,
        settingsScreen
    ];


    screens.forEach(element => {

        if (element) {
            element.classList.add("hidden");
        }

    });


    if (screen) {
        screen.classList.remove("hidden");
    }
}


/* =========================================================
   DISPLAY NAME
   ========================================================= */

function getDisplayName() {

    const users =
        getUsers();

    const user =
        users[currentUsername];


    return user?.displayName ||
        "Player";
}


/* =========================================================
   UPDATE PLAYER UI
   ========================================================= */

function updatePlayerUI() {

    if (!currentPlayer) {
        return;
    }


    displayNameElement.textContent =
        getDisplayName();


    coinCountElement.textContent =
        currentPlayer.coins;


    levelCoinCountElement.textContent =
        currentPlayer.coins;


    soundState.textContent =
        currentPlayer.soundEnabled
            ? "ON"
            : "OFF";
}


/* =========================================================
   CREATE LEVEL CARD
   ========================================================= */

function createLevelCard(level) {

    const data =
        currentPlayer.levels[level];


    const status =
        getLevelStatus(
            currentPlayer,
            level
        );


    const levelInfo =
        getLevel(level);


    const card =
        document.createElement("button");


    card.className =
        `level-card ${status}`;


    card.dataset.level =
        level;


    /* -----------------------------------------------------
       LOCKED
    ----------------------------------------------------- */

    if (status === "locked") {

        card.innerHTML = `

            <span class="level-lock">
                🔒
            </span>

            <span class="level-number">
                ${level}
            </span>

            <span class="level-status">
                LOCKED
            </span>

        `;


        card.disabled = true;


        return card;
    }


    /* -----------------------------------------------------
       UNLOCKED / COMPLETED
    ----------------------------------------------------- */

    const stars =
        data.stars > 0
            ? "★".repeat(data.stars) +
              "☆".repeat(3 - data.stars)
            : "☆☆☆";


    const time =
        data.bestTime !== null
            ? formatTime(data.bestTime)
            : "--:--";


    const moves =
        data.bestMoves !== null
            ? data.bestMoves
            : "--";


    card.innerHTML = `

        <span class="level-number">
            ${String(level).padStart(2, "0")}
        </span>

        <span class="level-size">
            ${levelInfo.size} × ${levelInfo.size}
        </span>

        <span class="level-stars">
            ${stars}
        </span>

        <span class="level-stats">
            ${time}
            <span>•</span>
            ${moves} moves
        </span>

    `;


    card.addEventListener(
        "click",
        () => {

            startLevel(level);

        }
    );


    return card;
}


/* =========================================================
   RENDER LEVEL GRID
   ========================================================= */

function renderLevelGrid() {

    if (!levelGrid || !currentPlayer) {
        return;
    }


    levelGrid.innerHTML = "";


    for (
        let level = 1;
        level <= TOTAL_LEVELS;
        level++
    ) {

        const card =
            createLevelCard(level);

        levelGrid.appendChild(card);
    }
}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(seconds) {

    if (
        seconds === null ||
        seconds === undefined
    ) {

        return "--:--";
    }


    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        seconds % 60;


    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remainingSeconds).padStart(2, "0")
    );
}


/* =========================================================
   START LEVEL
   ========================================================= */

function startLevel(level) {

    const data =
        currentPlayer.levels[level];


    /*
     * Security check:
     * Never allow a locked level to start.
     */

    if (
        !data ||
        !data.unlocked
    ) {

        return;
    }


    currentPlayer.lastPlayedLevel =
        level;


    savePlayerData(
        currentUsername,
        currentPlayer
    );


    /*
     * The actual puzzle page will be
     * connected in Stage 3.
     */

    window.location.href =
        `game.html?level=${level}`;
}


/* =========================================================
   HOME PLAY BUTTON
   ========================================================= */

document
    .getElementById("playButton")
    .addEventListener(
        "click",
        () => {

            if (!currentPlayer) {
                return;
            }


            const level =
                getLastPlayableLevel(
                    currentPlayer
                );


            startLevel(level);
        }
    );


/* =========================================================
   AUTH TAB SWITCHING
   ========================================================= */

loginTab.addEventListener(
    "click",
    () => {

        loginTab.classList.add("active");
        registerTab.classList.remove("active");

        loginForm.classList.remove("hidden");
        registerForm.classList.add("hidden");

        loginMessage.textContent = "";
        registerMessage.textContent = "";
    }
);


registerTab.addEventListener(
    "click",
    () => {

        registerTab.classList.add("active");
        loginTab.classList.remove("active");

        registerForm.classList.remove("hidden");
        loginForm.classList.add("hidden");

        loginMessage.textContent = "";
        registerMessage.textContent = "";
    }
);


/* =========================================================
   CREATE ACCOUNT
   ========================================================= */

registerForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        registerMessage.textContent = "";


        const username =
            document
                .getElementById("registerUsername")
                .value
                .trim()
                .toLowerCase();


        const displayName =
            document
                .getElementById("registerDisplayName")
                .value
                .trim();


        const password =
            document
                .getElementById("registerPassword")
                .value;


        if (username.length < 3) {

            registerMessage.textContent =
                "Username must be at least 3 characters.";

            return;
        }


        if (!displayName) {

            registerMessage.textContent =
                "Please enter a display name.";

            return;
        }


        if (password.length < 6) {

            registerMessage.textContent =
                "Password must be at least 6 characters.";

            return;
        }


        const users =
            getUsers();


        if (users[username]) {

            registerMessage.textContent =
                "That username already exists.";

            return;
        }


        users[username] = {

            username,
            displayName
        };


        saveUsers(users);


        const playerData =
            createDefaultPlayerData();


        savePlayerData(
            username,
            playerData
        );


        localStorage.setItem(
            CURRENT_USER_KEY,
            username
        );


        currentUsername =
            username;

        currentPlayer =
            playerData;


        registerForm.reset();


        updatePlayerUI();

        showScreen(homeScreen);
    }
);


/* =========================================================
   SIGN IN
   ========================================================= */

loginForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        loginMessage.textContent = "";


        const username =
            document
                .getElementById("loginUsername")
                .value
                .trim()
                .toLowerCase();


        const password =
            document
                .getElementById("loginPassword")
                .value;


        const users =
            getUsers();


        if (!users[username]) {

            loginMessage.textContent =
                "Account not found.";

            return;
        }


        /*
         * Temporary local-development login.
         * Proper authentication will be implemented
         * before production release.
         */

        localStorage.setItem(
            CURRENT_USER_KEY,
            username
        );


        currentUsername =
            username;

        currentPlayer =
            getPlayerData(username);


        loginForm.reset();


        updatePlayerUI();

        showScreen(homeScreen);
    }
);


/* =========================================================
   LEVELS BUTTON
   ========================================================= */

document
    .getElementById("levelsButton")
    .addEventListener(
        "click",
        () => {

            renderLevelGrid();

            showScreen(levelsScreen);
        }
    );


/* =========================================================
   COLLECTIONS BUTTON
   ========================================================= */

document
    .getElementById("collectionsButton")
    .addEventListener(
        "click",
        () => {

            renderCollections();

            showScreen(collectionsScreen);
        }
    );


/* =========================================================
   SETTINGS BUTTON
   ========================================================= */

document
    .getElementById("settingsButton")
    .addEventListener(
        "click",
        () => {

            showScreen(settingsScreen);
        }
    );


/* =========================================================
   BACK BUTTONS
   ========================================================= */

document
    .querySelectorAll("[data-back]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    document.getElementById(
                        button.dataset.back
                    );


                if (target) {
                    showScreen(target);
                }
            }
        );
    });


/* =========================================================
   SOUND
   ========================================================= */

soundButton.addEventListener(
    "click",
    () => {

        if (!currentPlayer) {
            return;
        }


        currentPlayer.soundEnabled =
            !currentPlayer.soundEnabled;


        savePlayerData(
            currentUsername,
            currentPlayer
        );


        updatePlayerUI();
    }
);


/* =========================================================
   ABOUT
   ========================================================= */

document
    .getElementById("aboutButton")
    .addEventListener(
        "click",
        () => {

            aboutModal.classList.remove(
                "hidden"
            );
        }
    );


document
    .querySelectorAll("[data-close]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const modal =
                    document.getElementById(
                        button.dataset.close
                    );


                if (modal) {

                    modal.classList.add(
                        "hidden"
                    );
                }
            }
        );
    });


aboutModal.addEventListener(
    "click",
    event => {

        if (
            event.target === aboutModal
        ) {

            aboutModal.classList.add(
                "hidden"
            );
        }
    }
);


/* =========================================================
   COLLECTIONS
   ========================================================= */

function renderCollections() {

    if (!collectionGrid || !currentPlayer) {
        return;
    }


    collectionGrid.innerHTML = "";


    let completedCount = 0;


    for (
        let level = 1;
        level <= TOTAL_LEVELS;
        level++
    ) {

        const data =
            currentPlayer.levels[level];


        if (
            !data ||
            !data.completed
        ) {

            continue;
        }


        completedCount++;


        const levelInfo =
            getLevel(level);


        const item =
            document.createElement("div");


        item.className =
            "collection-item";


        item.innerHTML = `

            <img
                src="${levelInfo.image}"
                alt="Level ${level}"
                loading="lazy"
            >

            <div class="collection-level">
                Level ${level}
            </div>

        `;


        collectionGrid.appendChild(item);
    }


    if (completedCount === 0) {

        collectionGrid.innerHTML = `

            <div class="empty-collection">

                <div>
                    ✨
                </div>

                <p>
                    Complete puzzles to build
                    your collection.
                </p>

            </div>

        `;
    }
}


/* =========================================================
   LOGOUT
   ========================================================= */

document
    .getElementById("logoutButton")
    .addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                CURRENT_USER_KEY
            );


            currentUsername = null;
            currentPlayer = null;


            showScreen(authScreen);
        }
    );


/* =========================================================
   APPLICATION START
   ========================================================= */

function startApplication() {

    setTimeout(
        () => {

            if (currentUsername) {

                currentPlayer =
                    getPlayerData(
                        currentUsername
                    );


                updatePlayerUI();

                showScreen(homeScreen);

            } else {

                showScreen(authScreen);
            }

        },
        3500
    );
}


startApplication();
