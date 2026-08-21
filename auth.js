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

    // 4. Username Availability Check
    const regUser = document.getElementById('regUser');
    const indicator = document.getElementById('regUserIndicator');
    if (regUser && indicator) {
        regUser.addEventListener('input', () => {
            const val = regUser.value.trim().toLowerCase();
            regUser.value = val;

            if (!validateUsername(val)) {
                indicator.innerText = '❌ (Min 6 chars, lowercase & number)';
                indicator.style.color = '#ff4d4d';
                return;
            }

            const users = JSON.parse(localStorage.getItem('pixvinz_users') || '{}');
            if (users[val]) {
                indicator.innerText = '❌ Taken';
                indicator.style.color = '#ff4d4d';
            } else {
                indicator.innerText = '✔ Available';
                indicator.style.color = '#2ecc71';
            }
        });
    }

    // 5. Register Submit
    document.getElementById('registerForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('regUser').value.trim().toLowerCase();
        const pass = document.getElementById('regPass').value;
        const passConfirm = document.getElementById('regPassConfirm').value;
        const errElem = document.getElementById('regError');

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

        const users = JSON.parse(localStorage.getItem('pixvinz_users') || '{}');
        if (users[username]) {
            if (errElem) errElem.innerText = "Username already exists!";
            return;
        }

        const newUser = { username, password: pass };
        users[username] = newUser;
        localStorage.setItem('pixvinz_users', JSON.stringify(users));
        localStorage.setItem('loggedInUser', JSON.stringify(newUser));
        localStorage.setItem('skipLoading', 'true');

        window.location.href = 'index.html';
    });

    // 6. Login Submit
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUser').value.trim().toLowerCase();
        const pass = document.getElementById('loginPass').value;
        const errElem = document.getElementById('loginError');

        const users = JSON.parse(localStorage.getItem('pixvinz_users') || '{}');
        const user = users[username];

        if (user && user.password === pass) {
            localStorage.setItem('loggedInUser', JSON.stringify(user));
            localStorage.setItem('skipLoading', 'true');
            window.location.href = 'index.html';
        } else {
            if (errElem) errElem.innerText = "Invalid username or password!";
        }
    });
});
