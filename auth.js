// ==========================================
// PIXVINZ - AUTH SCRIPT
// FIRESTORE LOGIN + PROFILE SYNC
// ==========================================

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. VIEW SWITCHING
    // ==========================================

    const views = {
        login: document.getElementById('loginView'),
        register: document.getElementById('registerView')
    };

    function showView(targetView) {

        Object.values(views).forEach(v => {
            if (v) {
                v.classList.remove('active');
            }
        });

        if (views[targetView]) {
            views[targetView].classList.add('active');
        }
    }

    showView('login');

    document.getElementById('toRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        showView('register');
    });

    document.getElementById('toLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        showView('login');
    });


    // ==========================================
    // 2. FORMAT VALIDATIONS
    // ==========================================

    function validateUsername(user) {
        return /^(?=.*[0-9])(?=.*[a-z])[a-z0-9]{6,}$/.test(user);
    }

    function validatePassword(pass) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/.test(pass);
    }


    // ==========================================
    // 3. PASSWORD TOGGLE
    // ==========================================

    function setupToggle(inputId, btnId) {

        const input = document.getElementById(inputId);
        const btn = document.getElementById(btnId);

        if (input && btn) {

            btn.addEventListener('click', () => {

                input.type =
                    input.type === 'password'
                        ? 'text'
                        : 'password';

                btn.innerText =
                    input.type === 'password'
                        ? 'Show'
                        : 'Hide';
            });
        }
    }

    setupToggle('loginPass', 'toggleLoginPass');
    setupToggle('regPass', 'toggleRegPass');
    setupToggle('regPassConfirm', 'toggleRegPassConfirm');


    // ==========================================
    // 4. REAL-TIME USERNAME AVAILABILITY
    // ==========================================

    const regUser = document.getElementById('regUser');
    const indicator = document.getElementById('regUserIndicator');
    const requirement = document.getElementById('regUserRequirement');

    if (regUser && indicator && requirement) {

        regUser.addEventListener('input', async () => {

            const val =
                regUser.value
                    .trim()
                    .toLowerCase();

            regUser.value = val;

            // EMPTY
            if (val === '') {

                indicator.innerText = '';
                requirement.classList.remove('show');

                return;
            }

            // INVALID FORMAT
            if (!validateUsername(val)) {

                indicator.innerText = '';
                requirement.classList.add('show');

                return;
            }

            // VALID FORMAT
            requirement.classList.remove('show');

            try {

                if (window.pixvinzDb) {

                    const {
                        db,
                        doc,
                        getDoc
                    } = window.pixvinzDb;

                    const userDocRef =
                        doc(
                            db,
                            'players',
                            val
                        );

                    const snap =
                        await getDoc(
                            userDocRef
                        );

                    if (snap.exists()) {

                        indicator.innerText =
                            '❌ Taken';

                        indicator.style.color =
                            '#ff4d4d';

                    } else {

                        indicator.innerText =
                            '✔ Available';

                        indicator.style.color =
                            '#2ecc71';
                    }

                } else {

                    indicator.innerText =
                        '⚠️ Database offline';

                    indicator.style.color =
                        '#f39c12';
                }

            } catch (err) {

                indicator.innerText =
                    '✔ Available';

                indicator.style.color =
                    '#2ecc71';
            }
        });
    }


    // ==========================================
    // 5. PASSWORD VALIDATION
    // ==========================================

    const regPass =
        document.getElementById('regPass');

    const regPassConfirm =
        document.getElementById('regPassConfirm');


    if (regPass) {

        const passwordRule =
            document.createElement('p');

        passwordRule.id =
            'regPassRule';

        passwordRule.innerText =
            '❌ 6–12 characters, uppercase, lowercase & number';

        passwordRule.style.margin =
            '5px 0 10px';

        passwordRule.style.fontSize =
            '12px';

        passwordRule.style.fontWeight =
            'bold';

        passwordRule.style.color =
            '#ff4d4d';

        passwordRule.style.textAlign =
            'left';

        passwordRule.style.display =
            'none';

        passwordRule.style.pointerEvents =
            'none';

        const passwordGroup =
            regPass.closest('.input-group');

        if (passwordGroup) {

            passwordGroup.insertAdjacentElement(
                'afterend',
                passwordRule
            );
        }

        regPass.addEventListener('input', () => {

            const value =
                regPass.value;

            if (value.length === 0) {

                passwordRule.style.display =
                    'none';

            } else if (!validatePassword(value)) {

                passwordRule.innerText =
                    '❌ 6–12 characters, uppercase, lowercase & number';

                passwordRule.style.display =
                    'block';

            } else {

                passwordRule.style.display =
                    'none';
            }

            if (
                regPassConfirm &&
                regPassConfirm.value.length > 0
            ) {

                updatePasswordMatch();
            }
        });
    }


    // ==========================================
    // 6. REPEAT PASSWORD VALIDATION
    // ==========================================

    if (regPassConfirm) {

        const confirmRule =
            document.createElement('p');

        confirmRule.id =
            'regPassConfirmRule';

        confirmRule.innerText =
            '❌ Passwords do not match';

        confirmRule.style.margin =
            '5px 0 10px';

        confirmRule.style.fontSize =
            '12px';

        confirmRule.style.fontWeight =
            'bold';

        confirmRule.style.color =
            '#ff4d4d';

        confirmRule.style.textAlign =
            'left';

        confirmRule.style.display =
            'none';

        confirmRule.style.pointerEvents =
            'none';

        const confirmGroup =
            regPassConfirm.closest(
                '.input-group'
            );

        if (confirmGroup) {

            confirmGroup.insertAdjacentElement(
                'afterend',
                confirmRule
            );
        }

        regPassConfirm.addEventListener(
            'input',
            () => {
                updatePasswordMatch();
            }
        );


        function updatePasswordMatch() {

            const password =
                regPass
                    ? regPass.value
                    : '';

            const confirmation =
                regPassConfirm.value;

            if (confirmation.length === 0) {

                confirmRule.style.display =
                    'none';

                return;
            }

            if (password !== confirmation) {

                confirmRule.innerText =
                    '❌ Passwords do not match';

                confirmRule.style.display =
                    'block';

            } else {

                confirmRule.style.display =
                    'none';
            }
        }
    }


    // ==========================================
    // 7. REGISTER
    // FIREBASE AUTH + FIRESTORE
    // ==========================================

    document
        .getElementById('registerForm')
        ?.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();

                const username =
                    document
                        .getElementById('regUser')
                        .value
                        .trim()
                        .toLowerCase();

                const displayNameInput =
                    document
                        .getElementById('regDisplayName')
                        .value
                        .trim();

                const pass =
                    document
                        .getElementById('regPass')
                        .value;

                const passConfirm =
                    document
                        .getElementById('regPassConfirm')
                        .value;

                const errElem =
                    document.getElementById(
                        'regError'
                    );

                const submitBtn =
                    e.target.querySelector(
                        'button[type="submit"]'
                    );


                // --------------------------------------
                // VALIDATE USERNAME
                // --------------------------------------

                if (!validateUsername(username)) {

                    if (errElem) {
                        errElem.innerText =
                            "Invalid username format!";
                    }

                    return;
                }


                // --------------------------------------
                // VALIDATE PASSWORD
                // --------------------------------------

                if (!validatePassword(pass)) {

                    if (errElem) {
                        errElem.innerText =
                            "Invalid password format!";
                    }

                    return;
                }


                // --------------------------------------
                // CONFIRM PASSWORD
                // --------------------------------------

                if (pass !== passConfirm) {

                    if (errElem) {
                        errElem.innerText =
                            "Passwords do not match!";
                    }

                    return;
                }


                const originalBtnText =
                    submitBtn
                        ? submitBtn.innerText
                        : "REGISTER";


                if (submitBtn) {

                    submitBtn.disabled =
                        true;

                    submitBtn.innerText =
                        "Creating account...";
                }


                try {

                    // --------------------------------------
                    // FIREBASE CONNECTION
                    // --------------------------------------

                    if (
                        !window.pixvinzDb ||
                        !window.pixvinzAuth
                    ) {

                        if (errElem) {
                            errElem.innerText =
                                "Firebase connection not available.";
                        }

                        if (submitBtn) {

                            submitBtn.disabled =
                                false;

                            submitBtn.innerText =
                                originalBtnText;
                        }

                        return;
                    }


                    const {
                        db,
                        doc,
                        getDoc,
                        setDoc
                    } = window.pixvinzDb;


                    const {
                        auth,
                        createUserWithEmailAndPassword
                    } = window.pixvinzAuth;


                    // --------------------------------------
                    // CHECK USERNAME
                    // --------------------------------------

                    const userDocRef =
                        doc(
                            db,
                            'players',
                            username
                        );

                    const userSnapshot =
                        await getDoc(
                            userDocRef
                        );


                    if (userSnapshot.exists()) {

                        if (errElem) {

                            errElem.innerText =
                                "Username is already taken!";
                        }

                        if (submitBtn) {

                            submitBtn.disabled =
                                false;

                            submitBtn.innerText =
                                originalBtnText;
                        }

                        return;
                    }


                    // --------------------------------------
                    // CREATE FIREBASE AUTH ACCOUNT
                    // --------------------------------------

                    const dummyEmail =
                        `${username}@pixvinz.com`;

                    const userCredential =
                        await createUserWithEmailAndPassword(
                            auth,
                            dummyEmail,
                            pass
                        );

                    const uid =
                        userCredential.user.uid;


                    // ======================================
                    // NEW USER DATA
                    // ======================================

                    const newUserData = {

                        username:
                            username,

                        uid:
                            uid,

                        displayName:
                            displayNameInput,

                        avatar:
                            "",

                        coins:
                            0,

                        level:
                            1,

                        // IMPORTANT:
                        // XP is its own Firestore field
                        xp:
                            0,

                        // Challenge
                        challenge:
                            null,

                        // IMPORTANT:
                        // MATCHES profiles.js
                        dailyRewardState: {
                            streak: 0,
                            lastClaimDate: "",
                            lastClaimTimestamp: 0
                        },

                        password:
                            pass,

                        createdAt:
                            new Date()
                    };


                    // --------------------------------------
                    // SAVE NEW USER TO FIRESTORE
                    // --------------------------------------

                    await setDoc(
                        userDocRef,
                        newUserData
                    );


                    // ======================================
                    // CLEAR OLD LOCAL SESSION DATA
                    // ======================================

                    localStorage.clear();


                    // ======================================
                    // SAVE SESSION
                    // ======================================

                    localStorage.setItem(
                        'loggedInUser',
                        JSON.stringify(
                            newUserData
                        )
                    );

                    localStorage.setItem(
                        'skipLoading',
                        'true'
                    );


                    const prefix =
                        username + '_';


                    // ======================================
                    // COINS
                    // ======================================

                    localStorage.setItem(
                        prefix + 'totalCoins',
                        String(
                            newUserData.coins
                        )
                    );


                    // ======================================
                    // LEVEL
                    // ======================================

                    localStorage.setItem(
                        prefix + 'currentLevel',
                        String(
                            newUserData.level
                        )
                    );


                    // ======================================
                    // XP
                    // IMPORTANT:
                    // USE "_xp", NOT "_currentXpVal"
                    // ======================================

                    localStorage.setItem(
                        prefix + 'xp',
                        String(
                            newUserData.xp
                        )
                    );


                    // ======================================
                    // CHALLENGE
                    // ======================================

                    localStorage.setItem(
                        prefix + 'currentChallenge',
                        JSON.stringify(
                            newUserData.challenge
                        )
                    );


                    // ======================================
                    // AVATAR
                    // ======================================

                    localStorage.setItem(
                        prefix + 'vinpix_avatar',
                        newUserData.avatar
                    );


                    // ======================================
                    // DAILY REWARD STATE
                    // MATCHES profiles.js
                    // ======================================

                    localStorage.setItem(
                        `pixvinz_daily_${username}`,
                        JSON.stringify(
                            newUserData.dailyRewardState
                        )
                    );


                    if (errElem) {
                        errElem.innerText = "";
                    }


                    // --------------------------------------
                    // GO TO GAME
                    // --------------------------------------

                    window.location.href =
                        'index.html';

                } catch (err) {

                    console.error(
                        "Registration error:",
                        err
                    );

                    if (errElem) {

                        errElem.innerText =
                            "Registration error: " +
                            err.message;
                    }

                    if (submitBtn) {

                        submitBtn.disabled =
                            false;

                        submitBtn.innerText =
                            originalBtnText;
                    }
                }
            }
        );


    // ==========================================
    // 8. LOGIN
    // FIRESTORE VERIFICATION + DATA FETCH
    // ==========================================

    document
        .getElementById('loginForm')
        ?.addEventListener(
            'submit',
            async (e) => {

                e.preventDefault();


                const username =
                    document
                        .getElementById('loginUser')
                        .value
                        .trim()
                        .toLowerCase();


                const pass =
                    document
                        .getElementById('loginPass')
                        .value;


                const errElem =
                    document.getElementById(
                        'loginError'
                    );


                const submitBtn =
                    e.target.querySelector(
                        'button[type="submit"]'
                    );


                const originalBtnText =
                    submitBtn
                        ? submitBtn.innerText
                        : "LOG IN";


                if (submitBtn) {

                    submitBtn.disabled =
                        true;

                    submitBtn.innerText =
                        "Signing in...";
                }


                try {

                    // --------------------------------------
                    // FIRESTORE CHECK
                    // --------------------------------------

                    if (!window.pixvinzDb) {

                        if (errElem) {

                            errElem.innerText =
                                "Database connection not available.";
                        }

                        if (submitBtn) {

                            submitBtn.disabled =
                                false;

                            submitBtn.innerText =
                                originalBtnText;
                        }

                        return;
                    }


                    const {
                        db,
                        doc,
                        getDoc
                    } = window.pixvinzDb;


                    const userDocRef =
                        doc(
                            db,
                            'players',
                            username
                        );


                    const snap =
                        await getDoc(
                            userDocRef
                        );


                    if (
                        snap.exists()
                    ) {

                        const userData =
                            snap.data();


                        // --------------------------------------
                        // VERIFY PASSWORD
                        // --------------------------------------

                        if (
                            userData.password ===
                            pass
                        ) {


                            // ==================================
                            // FETCH LATEST FIRESTORE DATA
                            // ==================================

                            const freshUserData = {

                                username:
                                    userData.username ||
                                    username,

                                uid:
                                    userData.uid ||
                                    "",

                                displayName:
                                    userData.displayName ||
                                    "",

                                avatar:
                                    userData.avatar ||
                                    "",

                                coins:
                                    Number(
                                        userData.coins ?? 0
                                    ),

                                level:
                                    Number(
                                        userData.level ?? 1
                                    ),

                                // ==================================
                                // XP
                                // DIRECTLY FROM FIRESTORE
                                // ==================================

                                xp:
                                    Number(
                                        userData.xp ?? 0
                                    ),

                                challenge:
                                    userData.challenge ??
                                    null,

                                // ==================================
                                // DAILY REWARD STATE
                                // MATCHES profiles.js
                                // ==================================

                                dailyRewardState:
                                    userData.dailyRewardState ||
                                    {
                                        streak: 0,
                                        lastClaimDate: "",
                                        lastClaimTimestamp: 0
                                    }
                            };


                            // ==================================
                            // CLEAR PREVIOUS USER CACHE
                            // ==================================

                            localStorage.clear();


                            // ==================================
                            // SAVE LOGIN SESSION
                            // ==================================

                            localStorage.setItem(
                                'loggedInUser',
                                JSON.stringify(
                                    freshUserData
                                )
                            );


                            localStorage.setItem(
                                'skipLoading',
                                'true'
                            );


                            const prefix =
                                username + '_';


                            // ==================================
                            // COINS
                            // ==================================

                            localStorage.setItem(
                                prefix + 'totalCoins',
                                String(
                                    freshUserData.coins
                                )
                            );


                            // ==================================
                            // LEVEL
                            // ==================================

                            localStorage.setItem(
                                prefix + 'currentLevel',
                                String(
                                    freshUserData.level
                                )
                            );


                            // ==================================
                            // XP
                            // IMPORTANT:
                            // SAME KEY USED BY profiles.js
                            // AND playerstat.js
                            // ==================================

                            localStorage.setItem(
                                prefix + 'xp',
                                String(
                                    freshUserData.xp
                                )
                            );


                            // ==================================
                            // CHALLENGE
                            // ==================================

                            localStorage.setItem(
                                prefix + 'currentChallenge',
                                JSON.stringify(
                                    freshUserData.challenge
                                )
                            );


                            // ==================================
                            // AVATAR
                            // ==================================

                            localStorage.setItem(
                                prefix + 'vinpix_avatar',
                                freshUserData.avatar
                            );


                            // ==================================
                            // DAILY REWARD STATE
                            // IMPORTANT:
                            // NO "dailyrewards" FIELD
                            // ==================================

                            localStorage.setItem(
                                `pixvinz_daily_${username}`,
                                JSON.stringify(
                                    freshUserData.dailyRewardState
                                )
                            );


                            // ==================================
                            // LOG
                            // ==================================

                            console.log(
                                "PixVinz Firestore player data loaded:",
                                {
                                    username:
                                        freshUserData.username,

                                    xp:
                                        freshUserData.xp,

                                    coins:
                                        freshUserData.coins,

                                    level:
                                        freshUserData.level,

                                    challenge:
                                        freshUserData.challenge,

                                    avatar:
                                        freshUserData.avatar,

                                    dailyRewardState:
                                        freshUserData.dailyRewardState
                                }
                            );


                            if (errElem) {
                                errElem.innerText = "";
                            }


                            // ==================================
                            // GO TO GAME
                            // ==================================

                            window.location.href =
                                'index.html';

                            return;
                        }
                    }


                    // ==================================
                    // INVALID LOGIN
                    // ==================================

                    if (errElem) {

                        errElem.innerText =
                            "Invalid username or password!";
                    }


                    if (submitBtn) {

                        submitBtn.disabled =
                            false;

                        submitBtn.innerText =
                            originalBtnText;
                    }


                } catch (err) {

                    console.error(
                        "Login error:",
                        err
                    );

                    if (errElem) {

                        errElem.innerText =
                            "Login error occurred: " +
                            err.message;
                    }


                    if (submitBtn) {

                        submitBtn.disabled =
                            false;

                        submitBtn.innerText =
                            originalBtnText;
                    }
                }
            }
        );
});


// ==========================================
// PIXVINZ PWA INSTALL
// ==========================================

let deferredInstallPrompt = null;


window.addEventListener(
    "beforeinstallprompt",
    (event) => {

        event.preventDefault();

        deferredInstallPrompt =
            event;

        console.log(
            "PixVinz install prompt is ready."
        );
    }
);


async function installPixVinz() {

    if (!deferredInstallPrompt) {

        alert(
            "PixVinz is not ready to install yet.\n\n" +
            "If you're using Android Chrome, try opening PixVinz " +
            "from the website and wait a few seconds."
        );

        return;
    }


    deferredInstallPrompt.prompt();


    const result =
        await deferredInstallPrompt.userChoice;


    console.log(
        "PixVinz install result:",
        result.outcome
    );


    deferredInstallPrompt =
        null;
}


// ==========================================
// INSTALL BUTTONS
// ==========================================

const installButtons = [

    document.getElementById(
        "install-app-btn-login"
    ),

    document.getElementById(
        "install-app-btn-register"
    )
];


installButtons.forEach(
    (button) => {

        if (!button) {
            return;
        }

        button.addEventListener(
            "click",
            installPixVinz
        );
    }
);


// ==========================================
// APP INSTALLED
// ==========================================

window.addEventListener(
    "appinstalled",
    () => {

        console.log(
            "PixVinz installed successfully!"
        );

        deferredInstallPrompt =
            null;
    }
);


// ==========================================
// SERVICE WORKER
// ==========================================

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register(
                    "/PixVinz/sw.js"
                )
                .then(
                    (registration) => {

                        console.log(
                            "PixVinz Service Worker registered:",
                            registration.scope
                        );
                    }
                )
                .catch(
                    (error) => {

                        console.error(
                            "PixVinz Service Worker registration failed:",
                            error
                        );
                    }
                );
        }
    );
}
