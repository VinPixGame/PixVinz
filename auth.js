// --- 2. AUTHENTICATION & FORM NAVIGATION ---
  const toRegBtn = document.getElementById('toRegister');
  if (toRegBtn) {
    toRegBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      showView('register');
    });
  }

  const toLogBtn = document.getElementById('toLogin');
  if (toLogBtn) {
    toLogBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();
      showView('login');
    });
  }

  function validateUsernameFormat(username) {
    const regex = /^(?=.*[0-9])(?=.*[a-z])[a-z0-9]{6,}$/;
    return regex.test(username);
  }

  function validatePasswordFormat(password) {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,12}$/;
    return regex.test(password);
  }

  const regUserField = document.getElementById('regUser');
  let usernameIndicator = document.getElementById('regUserIndicator');
  if (regUserField && !usernameIndicator) {
    usernameIndicator = document.createElement('span');
    usernameIndicator.id = 'regUserIndicator';
    usernameIndicator.style.marginLeft = '8px';
    regUserField.parentNode.appendChild(usernameIndicator);
  }

  if (regUserField) {
    regUserField.addEventListener('input', async () => {
      const val = regUserField.value.trim().toLowerCase();
      regUserField.value = val;

      if (!validateUsernameFormat(val)) {
        usernameIndicator.innerText = '❌ (Min 6 chars, lowercase & number)';
        usernameIndicator.style.color = '#ff4d4d';
        return;
      }

      try {
        if (window.pixvinzDb) {
          const { db, doc, getDoc } = window.pixvinzDb;
          const userDocRef = doc(db, 'players', val);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            usernameIndicator.innerText = '❌ Username already taken!';
            usernameIndicator.style.color = '#ff4d4d';
          } else {
            usernameIndicator.innerText = '✔ Available';
            usernameIndicator.style.color = '#2ecc71';
          }
        } else {
          usernameIndicator.innerText = '⚠️ Database offline';
          usernameIndicator.style.color = '#f39c12';
        }
      } catch (err) {
        usernameIndicator.innerText = '✔ Available';
        usernameIndicator.style.color = '#2ecc71';
      }
    });
  }

  function setupPasswordToggle(passwordInputId, toggleBtnId) {
    const passInput = document.getElementById(passwordInputId);
    const toggleBtn = document.getElementById(toggleBtnId);
    if (passInput && toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (passInput.type === 'password') {
          passInput.type = 'text';
          toggleBtn.innerText = 'Hide';
        } else {
          passInput.type = 'password';
          toggleBtn.innerText = 'Show';
        }
      });
    }
  }
setupPasswordToggle('regPass', 'toggleRegPass');
  setupPasswordToggle('loginPass', 'toggleLoginPass');

  const regForm = document.getElementById('registerForm');
  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();

      const displayName = document.getElementById('regDisplayName').value.trim();
      const username = document.getElementById('regUser').value.trim().toLowerCase();
      const pass = document.getElementById('regPass').value;
      const passConfirm = document.getElementById('regPassConfirm').value;
      const errElem = document.getElementById('regError');

      if (!validateUsernameFormat(username)) {
        if (errElem) errElem.innerText = "Username must be at least 6 characters and contain lowercase letters and numbers!";
        return;
      }

      if (!validatePasswordFormat(pass)) {
        if (errElem) errElem.innerText = "Password must be 6-12 characters and include at least one Uppercase letter, one lowercase letter, and one number!";
        return;
      }

      if (pass !== passConfirm) {
        if (errElem) errElem.innerText = "Passwords do not match!";
        return;
      }

      try {
        if (!window.pixvinzDb) {
          if (errElem) errElem.innerText = "Database connection not available.";
          return;
        }

        const { db, doc, getDoc, setDoc } = window.pixvinzDb;
        const userDocRef = doc(db, 'players', username);
        const userSnapshot = await getDoc(userDocRef);

        if (userSnapshot.exists()) {
          if (errElem) errElem.innerText = "Username is already taken or registered!";
          return;
        }

        const dummyEmail = `${username}@pixvinz.com`;
        let authUid = '';
        
        const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, pass);
        authUid = userCredential.user.uid;

        const newUserData = {
          username: username,
          displayName: displayName,
          xp: 0,
          coins: 0,
          avatar: '',
          level: 1,
          password: pass,
          authUid: authUid,
          dailyRewardState: {
            streak: 0,
            lastClaimDate: ''
          },
          createdAt: new Date(),
          lastUpdated: new Date()
        };

        await setDoc(userDocRef, newUserData);

        // Fetch and load the freshly created user via global state manager
        await window.GameState.refreshUserData(username);

        if (errElem) errElem.innerText = "";
        showView('home');
        playMainBGM();
      } catch (err) {
        if (errElem) errElem.innerText = "Registration error: " + err.message;
      }
    });
  }

const logForm = document.getElementById('loginForm');
  if (logForm) {
    logForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (typeof AudioManager !== 'undefined') AudioManager.playClick();

      const username = document.getElementById('loginUser').value.trim().toLowerCase();
      const pass = document.getElementById('loginPass').value;
      const errElem = document.getElementById('loginError');

      try {
        let userData = null;
        if (window.pixvinzDb) {
          const { db, doc, getDoc } = window.pixvinzDb;
          const userDocRef = doc(db, 'players', username);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            userData = snap.data();
          }
        } else {
          if (errElem) errElem.innerText = "Database connection not available.";
          return;
        }

        if (userData && userData.password === pass) {
          // 1. Fetch fresh data and populate everything using our global state manager
          await window.GameState.refreshUserData(username);

          if (errElem) errElem.innerText = "";
          
          showView('home');
          playMainBGM();
        } else {
          if (errElem) errElem.innerText = "Invalid username or password!";
        }
      } catch (err) {
        if (errElem) errElem.innerText = "Login error occurred: " + err.message;
      }
    });
  }


