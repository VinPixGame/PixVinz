
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
    setupToggle('regPass', 'toggleRegPass');
    setupToggle('loginPass', 'toggleLoginPass');

    // 4. Real-time Firestore Username Availability Check
    const regUser = document.getElementById('regUser');
    const indicator = document.getElementById('regUserIndicator');
    if (regUser && indicator) {
        regUser.addEventListener('input', async () => {
            const val = regUser.value.trim().toLowerCase();
            regUser.value = val;

            if (!validateUsername(val)) {
                indicator.innerText = '❌ (Min 6 chars, lowercase & number)';
                indicator.style.color = '#ff4d4d';
                return;
            }

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

    // 5. Register Submit (Firebase Auth + Firestore)
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
                dailyrewards: {
                    streak: 0,
                    lastClaimDate: ""
                },
                password: pass,
                createdAt: new Date()
            };

            await setDoc(userDocRef, newUserData);

            localStorage.setItem('loggedInUser', JSON.stringify(newUserData));
            localStorage.setItem('skipLoading', 'true');

            // Map keys for consistency
            const prefix = username + '_';
            localStorage.setItem(prefix + 'totalCoins', newUserData.coins);
            localStorage.setItem(prefix + 'currentLevel', newUserData.level);
            localStorage.setItem(prefix + 'vinpix_avatar', newUserData.avatar);
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

    // 6. Login Submit (Firestore verification & progress fetch)
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
                        dailyrewards: userData.dailyrewards || { streak: 0, lastClaimDate: "" }
                    };

                    localStorage.setItem('loggedInUser', JSON.stringify(freshUserData));
                    localStorage.setItem('skipLoading', 'true');
                    
                    // Map cloud keys so new device pulls player stats properly
                    const prefix = username + '_';
                    localStorage.setItem(prefix + 'totalCoins', freshUserData.coins);
                    localStorage.setItem(prefix + 'currentLevel', freshUserData.level);
                    localStorage.setItem(prefix + 'vinpix_avatar', freshUserData.avatar);
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
