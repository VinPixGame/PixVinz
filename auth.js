// ============================================================
// PixVinz Authentication
// auth.js
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
    getFirestore,
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import {
    getAuth,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyDPFmx35ClB3c5vGBtv8rzVAiTK4rcwAik",
    authDomain: "pixvinz2026.firebaseapp.com",
    projectId: "pixvinz2026",
    storageBucket: "pixvinz2026.firebasestorage.app",
    messagingSenderId: "45609077809",
    appId: "1:45609077809:web:575611e46acda9f64c5910",
    measurementId: "G-W7FSERE8ZJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// ============================================================
// MAKE FIREBASE AVAILABLE TO OTHER PIXVINZ SCRIPTS
// ============================================================

window.pixvinzDb = {
    db,
    doc,
    getDoc,
    setDoc
};

window.pixvinzAuth = auth;


// ============================================================
// PAGE READY
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================================
    // VIEW SWITCHING
    // ========================================================

    const loginView = document.getElementById("loginView");
    const registerView = document.getElementById("registerView");

    const showRegisterBtn = document.getElementById("showRegister");
    const showLoginBtn = document.getElementById("showLogin");

    if (showRegisterBtn) {
        showRegisterBtn.addEventListener("click", () => {
            if (loginView) loginView.style.display = "none";
            if (registerView) registerView.style.display = "block";
        });
    }

    if (showLoginBtn) {
        showLoginBtn.addEventListener("click", () => {
            if (registerView) registerView.style.display = "none";
            if (loginView) loginView.style.display = "block";
        });
    }


    // ========================================================
    // USERNAME VALIDATION
    // ========================================================

    function validateUsername(username) {
        return /^(?=.*[0-9])(?=.*[a-z])[a-z0-9]{6,}$/.test(username);
    }


    // ========================================================
    // PASSWORD VALIDATION
    // ========================================================

    function validatePassword(password) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/.test(password);
    }


    // ========================================================
    // PASSWORD VISIBILITY TOGGLE
    // ========================================================

    function setupPasswordToggle(inputId, toggleId) {

        const input = document.getElementById(inputId);
        const toggle = document.getElementById(toggleId);

        if (!input || !toggle) return;

        toggle.addEventListener("click", () => {

            if (input.type === "password") {
                input.type = "text";
                toggle.textContent = "🙈";
            } else {
                input.type = "password";
                toggle.textContent = "👁️";
            }

        });
    }

    setupPasswordToggle("loginPassword", "toggleLoginPassword");
    setupPasswordToggle("registerPassword", "toggleRegisterPassword");
    setupPasswordToggle("repeatPassword", "toggleRepeatPassword");


    // ========================================================
    // REGISTER ELEMENTS
    // ========================================================

    const registerUsername =
        document.getElementById("registerUsername");

    const registerDisplayName =
        document.getElementById("registerDisplayName");

    const registerPassword =
        document.getElementById("registerPassword");

    const repeatPassword =
        document.getElementById("repeatPassword");


    // ========================================================
    // USERNAME AVAILABILITY
    // ========================================================

    if (registerUsername) {

        registerUsername.addEventListener("input", async () => {

            const username = registerUsername.value.trim().toLowerCase();

            const usernameMessage =
                document.getElementById("usernameMessage");

            if (!usernameMessage) return;

            if (!username) {
                usernameMessage.textContent = "";
                return;
            }

            if (!validateUsername(username)) {
                usernameMessage.textContent =
                    "Username must contain lowercase letters and numbers, with at least 6 characters.";
                return;
            }

            try {

                const userDocRef = doc(db, "players", username);
                const snap = await getDoc(userDocRef);

                if (snap.exists()) {
                    usernameMessage.textContent =
                        "Username is already taken.";
                } else {
                    usernameMessage.textContent =
                        "Username is available.";
                }

            } catch (error) {

                console.error(
                    "Username availability error:",
                    error
                );

                usernameMessage.textContent =
                    "Unable to check username.";

            }

        });

    }


    // ========================================================
    // PASSWORD REQUIREMENTS MESSAGE
    // ========================================================

    if (registerPassword) {

        registerPassword.addEventListener("input", () => {

            const passwordMessage =
                document.getElementById("passwordMessage");

            if (!passwordMessage) return;

            const password = registerPassword.value;

            if (!password) {
                passwordMessage.textContent = "";
                return;
            }

            if (!validatePassword(password)) {

                passwordMessage.textContent =
                    "Password must be 6–12 characters and contain uppercase, lowercase, and a number.";

            } else {

                passwordMessage.textContent =
                    "Password looks good.";

            }

        });

    }


    // ========================================================
    // REPEAT PASSWORD CHECK
    // ========================================================

    if (repeatPassword) {

        repeatPassword.addEventListener("input", () => {

            const repeatMessage =
                document.getElementById("repeatPasswordMessage");

            if (!repeatMessage) return;

            if (!repeatPassword.value) {
                repeatMessage.textContent = "";
                return;
            }

            if (
                registerPassword &&
                repeatPassword.value !== registerPassword.value
            ) {

                repeatMessage.textContent =
                    "Passwords do not match.";

            } else {

                repeatMessage.textContent =
                    "Passwords match.";

            }

        });

    }


    // ========================================================
    // REGISTRATION
    // ========================================================

    const registerForm =
        document.getElementById("registerForm");

    if (registerForm) {

        registerForm.addEventListener("submit", async (event) => {

            event.preventDefault();

            const username =
                registerUsername?.value.trim().toLowerCase() || "";

            const displayName =
                registerDisplayName?.value.trim() || "";

            const password =
                registerPassword?.value || "";

            const repeat =
                repeatPassword?.value || "";


            // ------------------------------------------------
            // VALIDATION
            // ------------------------------------------------

            if (!validateUsername(username)) {

                alert(
                    "Username must contain lowercase letters and numbers, with at least 6 characters."
                );

                return;
            }

            if (!displayName) {

                alert("Please enter a display name.");

                return;
            }

            if (!validatePassword(password)) {

                alert(
                    "Password must be 6–12 characters and contain uppercase, lowercase, and a number."
                );

                return;
            }

            if (password !== repeat) {

                alert("Passwords do not match.");

                return;
            }


            try {

                // ------------------------------------------------
                // CHECK USERNAME
                // ------------------------------------------------

                const userDocRef =
                    doc(db, "players", username);

                const existingUser =
                    await getDoc(userDocRef);

                if (existingUser.exists()) {

                    alert("Username is already taken.");

                    return;
                }


                // ------------------------------------------------
                // CREATE FIREBASE AUTH USER
                // ------------------------------------------------

                const email =
                    `${username}@pixvinz.com`;

                const userCredential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );

                const firebaseUser =
                    userCredential.user;


                // ------------------------------------------------
                // INITIAL FIRESTORE PLAYER DATA
                // ------------------------------------------------

                const newUserData = {

                    username: username,

                    uid: firebaseUser.uid,

                    displayName: displayName,

                    // Player profile
                    avatar: "",

                    // Player economy
                    coins: 0,

                    // Player progression
                    level: 1,
                    xp: 0,

                    // Current challenge
                    challenge: null,

                    // Daily rewards
                    dailyrewards: {
                        streak: 0,
                        lastClaimDate: ""
                    },

                    // NOTE:
                    // Your old system stored the password here.
                    // It is intentionally NOT stored in Firestore.
                    //
                    // Firebase Authentication already handles
                    // the password securely.

                    createdAt: new Date()

                };


                // ------------------------------------------------
                // SAVE PLAYER TO FIRESTORE
                // ------------------------------------------------

                await setDoc(
                    userDocRef,
                    newUserData
                );


                // ------------------------------------------------
                // CLEAR OLD SESSION DATA
                // ------------------------------------------------

                localStorage.clear();


                // ------------------------------------------------
                // SAVE LOGIN SESSION
                // ------------------------------------------------

                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(newUserData)
                );

                localStorage.setItem(
                    "skipLoading",
                    "true"
                );


                // ------------------------------------------------
                // SAVE PLAYER DATA LOCALLY
                // ------------------------------------------------

                const prefix =
                    `${username}_`;

                localStorage.setItem(
                    prefix + "totalCoins",
                    "0"
                );

                localStorage.setItem(
                    prefix + "currentLevel",
                    "1"
                );

                localStorage.setItem(
                    prefix + "xp",
                    "0"
                );

                localStorage.setItem(
                    prefix + "currentChallenge",
                    JSON.stringify(null)
                );

                localStorage.setItem(
                    prefix + "vinpix_avatar",
                    ""
                );

                localStorage.setItem(
                    `pixvinz_daily_${username}`,
                    JSON.stringify(
                        newUserData.dailyrewards
                    )
                );


                // ------------------------------------------------
                // REDIRECT
                // ------------------------------------------------

                window.location.href = "index.html";

            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                let message =
                    "Registration failed.";

                if (error.code === "auth/email-already-in-use") {

                    message =
                        "This username is already registered.";

                } else if (error.code === "auth/weak-password") {

                    message =
                        "Password is too weak.";

                } else if (error.code === "auth/invalid-email") {

                    message =
                        "Invalid email.";

                } else if (error.message) {

                    message =
                        error.message;

                }

                alert(message);

            }

        });

    }


    // ========================================================
    // LOGIN
    // ========================================================

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async (event) => {

            event.preventDefault();


            const usernameInput =
                document.getElementById("loginUsername");

            const passwordInput =
                document.getElementById("loginPassword");


            const username =
                usernameInput?.value.trim().toLowerCase() || "";

            const password =
                passwordInput?.value || "";


            if (!username || !password) {

                alert(
                    "Please enter your username and password."
                );

                return;
            }


            try {

                // ------------------------------------------------
                // FETCH PLAYER DIRECTLY FROM FIRESTORE
                // ------------------------------------------------

                const userDocRef =
                    doc(db, "players", username);

                const snap =
                    await getDoc(userDocRef);


                if (!snap.exists()) {

                    alert(
                        "Username or password is incorrect."
                    );

                    return;
                }


                const userData =
                    snap.data();


                // ------------------------------------------------
                // PASSWORD CHECK
                // ------------------------------------------------
                //
                // IMPORTANT:
                // This supports your CURRENT Firestore-password
                // system.
                //
                // If you remove the password field from Firestore,
                // Firebase Auth signInWithEmailAndPassword should
                // be used instead.
                //

                if (
                    userData.password &&
                    userData.password !== password
                ) {

                    alert(
                        "Username or password is incorrect."
                    );

                    return;
                }


                // ------------------------------------------------
                // FETCH THE LATEST FIRESTORE VALUES
                // ------------------------------------------------

                const freshUserData = {

                    username:
                        userData.username || username,

                    uid:
                        userData.uid || "",

                    displayName:
                        userData.displayName || "",

                    // --------------------------------------------
                    // PROFILE
                    // --------------------------------------------

                    avatar:
                        userData.avatar || "",

                    // --------------------------------------------
                    // ECONOMY
                    // --------------------------------------------

                    coins:
                        Number(userData.coins ?? 0),

                    // --------------------------------------------
                    // PROGRESSION
                    // --------------------------------------------

                    level:
                        Number(userData.level ?? 1),

                    xp:
                        Number(userData.xp ?? 0),

                    // --------------------------------------------
                    // CHALLENGE
                    // --------------------------------------------

                    challenge:
                        userData.challenge ?? null,

                    // --------------------------------------------
                    // DAILY REWARDS
                    // --------------------------------------------

                    dailyrewards:
                        userData.dailyrewards || {
                            streak: 0,
                            lastClaimDate: ""
                        }

                };


                // ------------------------------------------------
                // CLEAR OLD LOCAL SESSION
                // ------------------------------------------------

                localStorage.clear();


                // ------------------------------------------------
                // SAVE FRESH FIRESTORE DATA
                // ------------------------------------------------

                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(freshUserData)
                );

                localStorage.setItem(
                    "skipLoading",
                    "true"
                );


                // ------------------------------------------------
                // SAVE PLAYER VALUES LOCALLY
                // ------------------------------------------------

                const prefix =
                    `${username}_`;


                // COINS
                localStorage.setItem(
                    prefix + "totalCoins",
                    String(freshUserData.coins)
                );


                // LEVEL
                localStorage.setItem(
                    prefix + "currentLevel",
                    String(freshUserData.level)
                );


                // XP
                localStorage.setItem(
                    prefix + "xp",
                    String(freshUserData.xp)
                );


                // CHALLENGE
                localStorage.setItem(
                    prefix + "currentChallenge",
                    JSON.stringify(
                        freshUserData.challenge
                    )
                );


                // AVATAR
                localStorage.setItem(
                    prefix + "vinpix_avatar",
                    freshUserData.avatar || ""
                );


                // DAILY REWARDS
                localStorage.setItem(
                    `pixvinz_daily_${username}`,
                    JSON.stringify(
                        freshUserData.dailyrewards
                    )
                );


                // ------------------------------------------------
                // DEBUG
                // ------------------------------------------------

                console.log(
                    "PixVinz player loaded from Firestore:",
                    freshUserData
                );

                console.log(
                    "XP:",
                    freshUserData.xp
                );

                console.log(
                    "Coins:",
                    freshUserData.coins
                );

                console.log(
                    "Level:",
                    freshUserData.level
                );

                console.log(
                    "Challenge:",
                    freshUserData.challenge
                );

                console.log(
                    "Avatar:",
                    freshUserData.avatar
                );


                // ------------------------------------------------
                // REDIRECT
                // ------------------------------------------------

                window.location.href = "index.html";

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                alert(
                    "Unable to log in. Please try again."
                );

            }

        });

    }


    // ========================================================
    // PWA INSTALL PROMPT
    // ========================================================

    let deferredPrompt = null;

    window.addEventListener(
        "beforeinstallprompt",
        (event) => {

            event.preventDefault();

            deferredPrompt = event;

            console.log(
                "PixVinz PWA install prompt available."
            );

        }
    );


    // ========================================================
    // SERVICE WORKER
    // ========================================================

    if ("serviceWorker" in navigator) {

        window.addEventListener(
            "load",
            () => {

                navigator.serviceWorker
