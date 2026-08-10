/* =========================================================
   PIXVINZ - STAGE 1 APPLICATION FLOW
   ========================================================= */

const loadingScreen = document.getElementById("loadingScreen");
const authScreen = document.getElementById("authScreen");
const homeScreen = document.getElementById("homeScreen");
const levelsScreen = document.getElementById("levelsScreen");
const collectionsScreen = document.getElementById("collectionsScreen");
const settingsScreen = document.getElementById("settingsScreen");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginMessage = document.getElementById("loginMessage");
const registerMessage = document.getElementById("registerMessage");

const displayNameElement = document.getElementById("displayName");
const coinCountElement = document.getElementById("coinCount");
const levelCoinCountElement = document.getElementById("levelCoinCount");

const soundButton = document.getElementById("soundButton");
const soundState = document.getElementById("soundState");

const aboutModal = document.getElementById("aboutModal");


/* =========================================================
   STORAGE KEYS
   ========================================================= */

const USERS_KEY = "pixvinz_users";
const CURRENT_USER_KEY = "pixvinz_current_user";
const PLAYER_DATA_PREFIX = "pixvinz_player_";


/* =========================================================
   PLAYER DATA
   ========================================================= */

function createDefaultPlayerData() {

    const levels = {};

    for (let level = 1; level <= 200; level++) {

        levels[level] = {
            unlocked: level === 1,
            completed: false,
            stars: 0,
            bestTime: null,
            bestMoves: null,
            coinsEarned: 0
        };
    }

    return {

        coins: 0,

        lastPlayedLevel: 1,

        soundEnabled: true,

        levels: levels
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


function getPlayerData(username) {

    const key =
        PLAYER_DATA_PREFIX + username;

    try {

        const saved =
            localStorage.getItem(key);

        if (!saved) {

            const data =
                createDefaultPlayerData();

            savePlayerData(username, data);

            return data;
        }

        return JSON.parse(saved);

    } catch {

        const data =
            createDefaultPlayerData();

        savePlayerData(username, data);

        return data;
    }
}


function savePlayerData(username, data) {

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

        if (!element) return;

        element.classList.add("hidden");

    });

    screen.classList.remove("hidden");
}


/* =========================================================
   UPDATE HOME INFORMATION
   ========================================================= */

function updatePlayerUI() {

    if (!currentPlayer) return;

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


function getDisplayName() {

    const users =
        getUsers();

    const user =
        users[currentUsername];

    return user?.displayName || "Player";
}


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


        if (displayName.length < 1) {

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

            username: username,

            displayName: displayName
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
         * Stage 1 deliberately does not store
         * passwords as production authentication.
         *
         * This is only a temporary local prototype.
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
   HOME NAVIGATION
   ========================================================= */

document
    .getElementById("levelsButton")
    .addEventListener(
        "click",
        () => {

            showScreen(levelsScreen);
        }
    );


document
    .getElementById("collectionsButton")
    .addEventListener(
        "click",
        () => {

            showScreen(collectionsScreen);
        }
    );


document
    .getElementById("settingsButton")
    .addEventListener(
        "click",
        () => {

            showScreen(settingsScreen);
        }
    );


/* =========================================================
   PLAY BUTTON
   ========================================================= */

document
    .getElementById("playButton")
    .addEventListener(
        "click",
        () => {

            /*
             * Game engine will be connected here
             * in the next stage.
             */

            alert(
                "Puzzle engine coming next."
            );
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
   SOUND SETTING
   ========================================================= */

soundButton.addEventListener(
    "click",
    () => {

        if (!currentPlayer) return;

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

                modal.classList.add(
                    "hidden"
                );
            }
        );
    });


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
   ========================================================= */

aboutModal.addEventListener(
    "click",
    event => {

        if (event.target === aboutModal) {

            aboutModal.classList.add(
                "hidden"
            );
        }
    }
);


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
   INITIAL APPLICATION START
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


/* =========================================================
   START
   ========================================================= */

startApplication();
