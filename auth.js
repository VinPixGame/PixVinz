document.addEventListener('DOMContentLoaded', () => {
    // 1. View Switching
    const views = {
        login: document.getElementById('loginView'),
        register: document.getElementById('registerView')
    };

    function showView(targetView) {
        Object.values(views).forEach(v => {
            if (v) v.classList.remove('active');
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


    // 2. Format Validations
    function validateUsername(user) {
        return /^(?=.*[0-9])(?=.*[a-z])[a-z0-9]{6,}$/.test(user);
    }

    function validatePassword(pass) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/.test(pass);
    }


    // 3. Password Toggle
    function setupToggle(inputId, btnId) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(btnId);

        if (input && btn) {
            btn.addEventListener('click', () => {
                input.type = input.type === 'password' ? 'text' : 'password';
                btn.innerText = input.type === 'password' ? 'Show' : 'Hide';
            });
        }
    }

    setupToggle('loginPass', 'toggleLoginPass');
    setupToggle('regPass', 'toggleRegPass');
    setupToggle('regPassConfirm', 'toggleRegPassConfirm');


    // 4. Real-time Firestore Username Availability Check
    const regUser = document.getElementById('regUser');
    const indicator = document.getElementById('regUserIndicator');
    const requirement = document.getElementById('regUserRequirement');

    if (regUser && indicator && requirement) {
        regUser.addEventListener('input', async () => {
            const val = regUser.value.trim().toLowerCase();
            regUser.value = val;

            if (val === '') {
                indicator.innerText = '';
                requirement.classList.remove('show');
                return;
            }

            if (!validateUsername(val)) {
                indicator.innerText = '';
                requirement.classList.add('show');
                return;
            }

            requirement.classList.remove('show');
            
            try {
                if (window.pixvinzDb) {
                    const { db, doc, getDoc } = window.pixvinzDb;
                    const userDocRef = doc(db, 'players', val);
                    const snap = await getDoc(userDocRef);

                    if (snap.exists()) {
                        indicator.innerText = '❌ Taken';
                        indicator.style.color = '#ff4d4d';
                    } else {
                        indicator.innerText = '✔ Available';
                        indicator.style.color = '#2ecc71';
                    }
                } else {
                    indicator.innerText = '⚠️ Database offline';
                    indicator.style.color = '#f39c12';
                }
            } catch (err) {
                indicator.innerText = '✔ Available';
                indicator.style.color = '#2ecc71';
            }
        });
    }


    // ==========================================
    // PASSWORD VALIDATION
    // ==========================================
    const regPass = document.getElementById('regPass');
    const regPassConfirm = document.getElementById('regPassConfirm');

    if (regPass) {
        const passwordRule = document.createElement('p');
        passwordRule.id = 'regPassRule';
        passwordRule.innerText = '❌ 6–12 characters, uppercase, lowercase & number';
        passwordRule.style.margin = '5px 0 10px';
        passwordRule.style.fontSize = '12px';
        passwordRule.style.fontWeight = 'bold';
        passwordRule.style.color = '#ff4d4d';
        passwordRule.style.textAlign = 'left';
        passwordRule.style.display = 'none';
        passwordRule.style.pointerEvents = 'none';

        const passwordGroup = regPass.closest('.input-group');
        if (passwordGroup) {
            passwordGroup.insertAdjacentElement('afterend', passwordRule);
        }

        regPass.addEventListener('input', () => {
            const value = regPass.value;
            if (value.length === 0) {
                passwordRule.style.display = 'none';
            } else if (!validatePassword(value)) {
                passwordRule.innerText = '❌ 6–12 characters, uppercase, lowercase & number';
                passwordRule.style.display = 'block';
            } else {
                passwordRule.style.display = 'none';
            }

            if (regPassConfirm && regPassConfirm.value.length > 0) {
                updatePasswordMatch();
            }
        });
    }


    // ==========================================
    // REPEAT PASSWORD VALIDATION
    // ==========================================
    if (regPassConfirm) {
        const confirmRule = document.createElement('p');
        confirmRule.id = 'regPassConfirmRule';
        confirmRule.innerText = '❌ Passwords do not match';
        confirmRule.style.margin = '5px 0 10px';
        confirmRule.style.fontSize = '12px';
        confirmRule.style.fontWeight = 'bold';
        confirmRule.style.color = '#ff4d4d';
        confirmRule.style.textAlign = 'left';
        confirmRule.style.display = 'none';
        confirmRule.style.pointerEvents = 'none';

        const confirmGroup = regPassConfirm.closest('.input-group');
        if (confirmGroup) {
            confirmGroup.insertAdjacentElement('afterend', confirmRule);
        }

        regPassConfirm.addEventListener('input', () => {
            updatePasswordMatch();
        });

        function updatePasswordMatch() {
            const password = regPass ? regPass.value : '';
            const confirmation = regPassConfirm.value;

            if (confirmation.length === 0) {
                confirmRule.style.display = 'none';
                return;
            }

            if (password !== confirmation) {
                confirmRule.innerText = '❌ Passwords do not match';
                confirmRule.style.display = 'block';
            } else {
                confirmRule.style.display = 'none';
            }
        }
    }


    // 5. Register Submit (Firebase Auth + Firestore Sync)
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('regUser').value.trim().toLowerCase();
        const displayNameInput = document.getElementById('regDisplayName').value.trim();
        const pass = document.getElementById('regPass').value;
        const passConfirm = document.getElementById('regPassConfirm').value;
        const errElem = document.getElementById('regError');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (!validateUsername(username)) {
            if (errElem) errElem.innerText = "Invalid username format!";
            return;
        }

        if (!validatePassword(pass)) {
            if (errElem) errElem.innerText = "Invalid password format!";
            return;
        }

        if (pass !== passConfirm) {
            if (errElem) errElem.innerText = "Passwords do not match!";
            return;
        }

        let originalBtnText = submitBtn ? submitBtn.innerText : "REGISTER";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Creating account...";
        }

        try {
            if (!window.pixvinzDb || !window.pixvinzAuth) {
                if (errElem) errElem.innerText = "Firebase connection not available.";
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                }
                return;
            }

            const { db, doc, getDoc, setDoc } = window.pixvinzDb;
            const { auth, createUserWithEmailAndPassword } = window.pixvinzAuth;

            const userDocRef = doc(db, 'players', username);
            const userSnapshot = await getDoc(userDocRef);

            if (userSnapshot.exists()) {
                if (errElem) errElem.innerText = "Username is already taken!";
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                }
                return;
            }

            const dummyEmail = `${username}@pixvinz.com`;
            const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, pass);
            const uid = userCredential.user.uid;

            const newUserData = {
                username: username,
                uid: uid,
                displayName: displayNameInput,
                avatar: "",
                coins: 0,
                level: 1,
                xp: 0,
                challenge: "",
                currentChallenge: "",
                dailyrewards: {
                    streak: 0,
                    lastClaimDate: ""
                },
                password: pass,
                createdAt: new Date()
            };

            await setDoc(userDocRef, newUserData);

            localStorage.clear();
            localStorage.setItem('loggedInUser', JSON.stringify(newUserData));
            localStorage.setItem('skipLoading', 'true');

            const prefix = username + '_';
            localStorage.setItem(prefix + 'totalCoins', newUserData.coins);
            localStorage.setItem(prefix + 'currentLevel', newUserData.level);
            localStorage.setItem(prefix + 'xp', newUserData.xp);
            localStorage.setItem(prefix + 'vinpix_avatar', newUserData.avatar);
            localStorage.setItem(prefix + 'challenge', newUserData.challenge);
            localStorage.setItem(prefix + 'currentChallenge', newUserData.currentChallenge);
            localStorage.setItem(`pixvinz_daily_${username}`, JSON.stringify(newUserData.dailyrewards));

            if (errElem) errElem.innerText = "";
            window.location.href = 'index.html';

        } catch (err) {
            if (errElem) errElem.innerText = "Registration error: " + err.message;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        }
    });


    // 6. Login Submit (Firestore Verification & LocalStorage Sync)
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('loginUser').value.trim().toLowerCase();
        const pass = document.getElementById('loginPass').value;
        const errElem = document.getElementById('loginError');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        let originalBtnText = submitBtn ? submitBtn.innerText : "LOG IN";
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "Signing in...";
        }

        try {
            if (!window.pixvinzDb) {
                if (errElem) errElem.innerText = "Database connection not available.";
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerText = originalBtnText;
                }
                return;
            }

            const { db, doc, getDoc } = window.pixvinzDb;
            const userDocRef = doc(db, 'players', username);
            const snap = await getDoc(userDocRef);

            if (snap.exists()) {
                const userData = snap.data();

                if (userData.password === pass) {
                    const freshUserData = {
                        username: userData.username,
                        uid: userData.uid,
                        displayName: userData.displayName || "",
                        avatar: userData.avatar || "",
                        coins: userData.coins ?? 0,
                        level: userData.level ?? 1,
                        xp: userData.xp ?? 0,
                        challenge: userData.challenge || "",
                        currentChallenge: userData.currentChallenge || "",
                        dailyrewards: userData.dailyrewards || { streak: 0, lastClaimDate: "" }
                    };

                    localStorage.clear();
                    localStorage.setItem('loggedInUser', JSON.stringify(freshUserData));
                    localStorage.setItem('skipLoading', 'true');

                    const prefix = username + '_';
                    localStorage.setItem(prefix + 'totalCoins', freshUserData.coins);
                    localStorage.setItem(prefix + 'currentLevel', freshUserData.level);
                    localStorage.setItem(prefix + 'xp', freshUserData.xp);
                    localStorage.setItem(prefix + 'vinpix_avatar', freshUserData.avatar);
                    localStorage.setItem(prefix + 'challenge', freshUserData.challenge);
                    localStorage.setItem(prefix + 'currentChallenge', freshUserData.currentChallenge);

                    if (freshUserData.dailyrewards) {
                        localStorage.setItem(`pixvinz_daily_${username}`, JSON.stringify(freshUserData.dailyrewards));
                    }

                    if (errElem) errElem.innerText = "";
                    window.location.href = 'index.html';
                    return;
                }
            }

            if (errElem) errElem.innerText = "Invalid username or password!";
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }

        } catch (err) {
            if (errElem) errElem.innerText = "Login error occurred: " + err.message;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = originalBtnText;
            }
        }
    });
});
