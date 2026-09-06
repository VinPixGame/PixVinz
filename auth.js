// ============================================================
// PIXVINZ AUTH.JS
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    // ========================================================
    // FIREBASE
    // ========================================================

    if (!window.pixvinzDb || !window.pixvinzAuth) {
        console.error("PixVinz Firebase is not initialized.");
        return;
    }

    const { db, doc, getDoc, setDoc } = window.pixvinzDb;
    const { auth, createUserWithEmailAndPassword } =
        window.pixvinzAuth;


    // ========================================================
    // VIEWS
    // ========================================================

    const loginView = document.getElementById("loginView");
    const registerView = document.getElementById("registerView");

    const toRegister = document.getElementById("toRegister");
    const toLogin = document.getElementById("toLogin");


    // ========================================================
    // SWITCH TO REGISTER
    // ========================================================

    if (toRegister) {

        toRegister.addEventListener("click", (e) => {

            e.preventDefault();

            loginView.classList.remove("active");
            registerView.classList.add("active");

            loginView.style.display = "none";
            registerView.style.display = "block";

        });

    }


    // ========================================================
    // SWITCH TO LOGIN
    // ========================================================

    if (toLogin) {

        toLogin.addEventListener("click", (e) => {

            e.preventDefault();

            registerView.classList.remove("active");
            loginView.classList.add("active");

            registerView.style.display = "none";
            loginView.style.display = "block";

        });

    }


    // ========================================================
    // USERNAME VALIDATION
    // ========================================================

    function validateUsername(username) {

        return /^(?=.*[0-9])(?=.*[a-z])[a-z0-9]{6,}$/.test(
            username
        );

    }


    // ========================================================
    // PASSWORD VALIDATION
    // ========================================================

    function validatePassword(password) {

        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/.test(
            password
        );

    }


    // ========================================================
    // PASSWORD TOGGLE FUNCTION
    // ========================================================

    function setupPasswordToggle(inputId, buttonId) {

        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);

        if (!input || !button) return;

        button.addEventListener("click", () => {

            if (input.type === "password") {

                input.type = "text";
                button.textContent = "Hide";

            } else {

                input.type = "password";
                button.textContent = "Show";

            }

        });

    }


    // ========================================================
    // ALL THREE PASSWORD TOGGLES
    // ========================================================

    setupPasswordToggle(
        "loginPass",
        "toggleLoginPass"
    );

    setupPasswordToggle(
        "regPass",
        "toggleRegPass"
    );

    setupPasswordToggle(
        "regPassConfirm",
        "toggleRegPassConfirm"
    );


    // ========================================================
    // REGISTER ELEMENTS
    // ========================================================

    const regDisplayName =
        document.getElementById("regDisplayName");

    const regUser =
        document.getElementById("regUser");

    const regPass =
        document.getElementById("regPass");

    const regPassConfirm =
        document.getElementById("regPassConfirm");

    const regUserIndicator =
        document.getElementById("regUserIndicator");

    const regUserRequirement =
        document.getElementById("regUserRequirement");

    const regPassIndicator =
        document.getElementById("regPassIndicator");

    const regError =
        document.getElementById("regError");


    // ========================================================
    // USERNAME INPUT
    // ========================================================

    if (regUser) {

        regUser.addEventListener("input", async () => {

            let username =
                regUser.value.trim().toLowerCase();

            regUser.value = username;


            // ----------------------------------------------
            // EMPTY
            // ----------------------------------------------

            if (!username) {

                if (regUserIndicator) {
                    regUserIndicator.textContent = "";
                }

                if (regUserRequirement) {

                    regUserRequirement.textContent =
                        "❌ Min 6 characters, lowercase letters & at least 1 number";

                }

                return;
            }


            // ----------------------------------------------
            // FORMAT CHECK
            // ----------------------------------------------

            if (!validateUsername(username)) {

                if (regUserIndicator) {
                    regUserIndicator.textContent = "❌";
                }

                if (regUserRequirement) {

                    regUserRequirement.textContent =
                        "❌ Min 6 characters, lowercase letters & at least 1 number";

                }

                return;
            }


            // ----------------------------------------------
            // FORMAT VALID
            // ----------------------------------------------

            if (regUserIndicator) {
                regUserIndicator.textContent = "⏳";
            }

            if (regUserRequirement) {

                regUserRequirement.textContent =
                    "Checking username...";

            }


            // ----------------------------------------------
            // FIRESTORE CHECK
            // ----------------------------------------------

            try {

                const userDocRef =
                    doc(db, "players", username);

                const snap =
                    await getDoc(userDocRef);


                if (snap.exists()) {

                    if (regUserIndicator) {
                        regUserIndicator.textContent = "❌";
                    }

                    if (regUserRequirement) {

                        regUserRequirement.textContent =
                            "❌ Username is already taken";

                    }

                } else {

                    if (regUserIndicator) {
                        regUserIndicator.textContent = "✅";
                    }

                    if (regUserRequirement) {

                        regUserRequirement.textContent =
                            "✅ Username is available";

                    }

                }

            } catch (error) {

                console.error(
                    "Username check error:",
                    error
                );

                if (regUserIndicator) {
                    regUserIndicator.textContent = "⚠️";
                }

                if (regUserRequirement) {

                    regUserRequirement.textContent =
                        "Unable to check username";

                }

            }

        });

    }


    // ========================================================
    // PASSWORD REQUIREMENT
    // ========================================================

    if (regPass) {

        regPass.addEventListener("input", () => {

            const password =
                regPass.value;


            if (!regPassIndicator) return;


            if (!password) {

                regPassIndicator.style.display = "none";
                regPassIndicator.textContent = "";

                return;
            }


            regPassIndicator.style.display = "block";


            if (!validatePassword(password)) {

                regPassIndicator.style.color =
                    "#ff4d4d";

                regPassIndicator.textContent =
                    "❌ 6-12 chars, uppercase, lowercase & number required";

            } else {

                regPassIndicator.style.color =
                    "#4cff88";

                regPassIndicator.textContent =
                    "✅ Password requirements met";

            }

        });

    }


    // ========================================================
    // LOGIN FORM
    // ========================================================

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", async (e) => {

            e.preventDefault();


            const loginUser =
                document.getElementById("loginUser");

            const loginPass =
                document.getElementById("loginPass");

            const loginError =
                document.getElementById("loginError");


            const username =
                loginUser.value.trim().toLowerCase();

            const password =
                loginPass.value;


            // ----------------------------------------------
            // CLEAR ERROR
            // ----------------------------------------------

            if (loginError) {
                loginError.textContent = "";
            }


            // ----------------------------------------------
            // BASIC VALIDATION
            // ----------------------------------------------

            if (!username || !password) {

                if (loginError) {

                    loginError.textContent =
                        "Please enter your username and password.";

                }

                return;
            }


            try {

                // ------------------------------------------
                // FETCH PLAYER FROM FIRESTORE
                // ------------------------------------------

                const userDocRef =
                    doc(db, "players", username);

                const snap =
                    await getDoc(userDocRef);


                if (!snap.exists()) {

                    if (loginError) {

                        loginError.textContent =
                            "Username or password is incorrect.";

                    }

                    return;
                }


                const userData =
                    snap.data();


                // ------------------------------------------
                // PASSWORD CHECK
                // ------------------------------------------
                //
                // This preserves your existing login system.
                //

                if (
                    userData.password &&
                    userData.password !== password
                ) {

                    if (loginError) {

                        loginError.textContent =
                            "Username or password is incorrect.";

                    }

                    return;
                }


                // ==================================================
                // GET THE LATEST PLAYER DATA FROM FIRESTORE
                // ==================================================

                const freshUserData = {

                    username:
                        userData.username || username,

                    uid:
                        userData.uid || "",

                    displayName:
                        userData.displayName || "",


                    // ----------------------------------------------
                    // AVATAR
                    // ----------------------------------------------

                    avatar:
                        userData.avatar || "",


                    // ----------------------------------------------
                    // COINS
                    // ----------------------------------------------

                    coins:
                        Number(userData.coins ?? 0),


                    // ----------------------------------------------
                    // LEVEL
                    // ----------------------------------------------

                    level:
                        Number(userData.level ?? 1),


                    // ----------------------------------------------
                    // XP
                    // ----------------------------------------------

                    xp:
                        Number(userData.xp ?? 0),


                    // ----------------------------------------------
                    // CHALLENGE
                    // ----------------------------------------------

                    challenge:
                        userData.challenge ?? null,


                    // ----------------------------------------------
                    // DAILY REWARDS
                    // ----------------------------------------------

                    dailyrewards:
                        userData.dailyrewards || {
                            streak: 0,
                            lastClaimDate: ""
                        }

                };


                // ==================================================
                // CLEAR OLD LOCAL DATA
                // ==================================================

                localStorage.clear();


                // ==================================================
                // SAVE LOGGED-IN USER
                // ==================================================

                localStorage.setItem(
                    "loggedInUser",
                    JSON.stringify(freshUserData)
                );


                localStorage.setItem(
                    "skipLoading",
                    "true"
                );


                // ==================================================
                // PLAYER PREFIX
                // ==================================================

                const prefix =
                    username + "_";


                // ==================================================
                // SAVE COINS
                // ==================================================

                localStorage.setItem(
                    prefix + "totalCoins",
                    String(freshUserData.coins)
                );


                // ==================================================
                // SAVE LEVEL
                // ==================================================

                localStorage.setItem(
                    prefix + "currentLevel",
                    String(freshUserData.level)
                );


                // ==================================================
                // SAVE XP
                // ==================================================

                localStorage.setItem(
                    prefix + "xp",
                    String(freshUserData.xp)
                );


                // ==================================================
                // SAVE CHALLENGE
                // ==================================================

                localStorage.setItem(
                    prefix + "currentChallenge",
                    JSON.stringify(
                        freshUserData.challenge
                    )
                );


                // ==================================================
                // SAVE AVATAR
                // ==================================================

                localStorage.setItem(
                    prefix + "vinpix_avatar",
                    freshUserData.avatar
                );


                // ==================================================
                // SAVE DAILY REWARDS
                // ==================================================

                localStorage.setItem(
                    "pixvinz_daily_" + username,
                    JSON.stringify(
                        freshUserData.dailyrewards
                    )
                );


                // ==================================================
                // DEBUG
                // ==================================================

                console.log(
                    "================================="
                );

                console.log(
                    "PIXVINZ PLAYER LOADED"
                );

                console.log(
                    "Username:",
                    freshUserData.username
                );

                console.log(
                    "Display Name:",
                    freshUserData.displayName
                );

                console.log(
                    "Coins:",
                    freshUserData.coins
                );

                console.log(
                    "XP:",
                    freshUserData.xp
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

                console.log(
                    "================================="
                );


                // ==================================================
                // GO TO GAME
                // ==================================================

                window.location.href =
                    "index.html";


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                if (loginError) {

                    loginError.textContent =
                        "Unable to log in. Please try again.";

                }

            }

        });

    }


    // ========================================================
    // REGISTER FORM
    // ========================================================

    const registerForm =
        document.getElementById("registerForm");


    if (registerForm) {

        registerForm.addEventListener("submit", async (e) => {

            e.preventDefault();


            // ----------------------------------------------
            // VALUES
            // ----------------------------------------------

            const displayName =
                regDisplayName.value.trim();

            const username =
                regUser.value.trim().toLowerCase();

            const password =
                regPass.value;

            const confirmPassword =
                regPassConfirm.value;


            // ----------------------------------------------
            // CLEAR ERROR
            // ----------------------------------------------

            if (regError) {
                regError.textContent = "";
            }


            // ----------------------------------------------
            // DISPLAY NAME
            // ----------------------------------------------

            if (!displayName) {

                regError.textContent =
                    "Please enter a display name.";

                return;
            }


            // ----------------------------------------------
            // USERNAME
            // ----------------------------------------------

            if (!validateUsername(username)) {

                regError.textContent =
                    "Username must contain
