// Game State & Storage
let gameState = {
    coins: 160,
    currentLevel: 12,
    xp: 2450,
    streak: 17,
    wins: 86,
    puzzlesSolved: 245,
    soundEnabled: true,
    claimedDay1: true
};

// Load saved data if available
if (localStorage.getItem('pixvinz_state')) {
    gameState = JSON.parse(localStorage.getItem('pixvinz_state'));
}

function saveState() {
    localStorage.setItem('pixvinz_state', JSON.stringify(gameState));
    updateUIValues();
}

// Sound Manager
const sounds = {
    click: new Audio('sounds/click.mp3'),
    select: new Audio('sounds/select.mp3'),
    shuffle: new Audio('sounds/shuffle.mp3'),
    exchange: new Audio('sounds/exchange.mp3'),
    bgmusic: new Audio('sounds/bgmusic.mp3')
};

function playSound(soundName) {
    if (!gameState.soundEnabled) return;
    if (sounds[soundName]) {
        sounds[soundName].currentTime = 0;
        sounds[soundName].play().catch(e => console.log("Audio play blocked by browser:", e));
    }
}

// Background Music toggle
sounds.bgmusic.loop = true;
function toggleBgMusic(enable) {
    if (enable && gameState.soundEnabled) {
        sounds.bgmusic.play().catch(e => console.log("BG Music blocked"));
    } else {
        sounds.bgmusic.pause();
    }
}

// Logo Webm Video Controller
function handleLogoVideo(action = 'play') {
    const logoVideo = document.getElementById('logo-video');
    if (!logoVideo) return;

    if (action === 'play') {
        logoVideo.currentTime = 0;
        logoVideo.play().catch(e => console.log("Logo video autoplay blocked:", e));
    } else if (action === 'pause') {
        logoVideo.pause();
    }
}

// Screen Switcher
function switchScreen(screenName) {
    if (screenName !== 'loading') {
        playSound('click');
    }
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const target = document.getElementById(`screen-${screenName}`);
    if (target) {
        target.classList.add('active');
    }

    // Toggle Bottom Navigation visibility (hide on loading screen, show everywhere else)
    const navBar = document.getElementById('bottom-nav-bar');
    if (navBar) {
        navBar.style.display = (screenName === 'loading') ? 'none' : 'flex';
    }

    // Highlight bottom nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeNav = document.getElementById(`nav-${screenName}`);
    if (activeNav) {
        activeNav.classList.add('active');
    }

    // If switching to home, replay the logo animation if desired
    if (screenName === 'home') {
        handleLogoVideo('play');
    }

    window.scrollTo(0, 0);
}

// Generate Levels 1 to 200 dynamically
function renderLevels() {
    const grid = document.getElementById('levels-grid-container');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 1; i <= 200; i++) {
        const node = document.createElement('div');
        node.className = 'level-node';
        
        if (i < gameState.currentLevel) {
            node.classList.add('completed');
            node.innerHTML = `${i}<br>⭐3`;
            node.onclick = () => selectLevel(i);
        } else if (i === gameState.currentLevel) {
            node.classList.add('current');
            node.innerHTML = `${i}<br>⭐3`;
            node.onclick = () => selectLevel(i);
        } else {
            node.classList.add('locked');
            node.innerHTML = `${i}<br>🔒`;
            node.onclick = () => { playSound('click'); alert("Complete previous levels to unlock!"); };
        }
        grid.appendChild(node);
    }
}

function selectLevel(lvlNum) {
    playSound('select');
    alert(`Loading Level ${lvlNum}! Using image/level${lvlNum}.jpeg`);
    // Here you can load image/level${lvlNum}.jpeg into your puzzle game canvas/board
}

// Claim Daily Reward
function claimReward(day) {
    playSound('exchange');
    if (day === 1 && !gameState.claimedDay1) {
        gameState.claimedDay1 = true;
        gameState.coins += 50;
        saveState();
        alert("Claimed 50 Coins!");
        location.reload();
    } else {
        alert("Already claimed or not available yet!");
    }
}

// Update UI Text elements from state
function updateUIValues() {
    document.querySelectorAll('.user-coins').forEach(el => el.innerText = `🪙 ${gameState.coins}`);
    document.querySelectorAll('.user-level-text').forEach(el => el.innerText = `Level ${gameState.currentLevel}`);
}

// Initialize on load with a 5-second natural loading screen sequence
window.onload = () => {
    updateUIValues();
    renderLevels();

    // 1. Show Loading Screen Window first
    switchScreen('loading');
    handleLogoVideo('play');

    let currentProgress = 0;
    const totalDuration = 5000; // Exactly 5 seconds
    const intervalTime = 50;    // Update step frequency
    const increment = (intervalTime / totalDuration) * 100;

    const progressFill = document.getElementById('loading-progress-fill');
    const percentageText = document.getElementById('loading-percentage-text');

    const loadingInterval = setInterval(() => {
        currentProgress += increment;

        if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(loadingInterval);

            // 2. Automatically transition to Home Page window after 5 seconds
            switchScreen('home');
        }

        // Update progress visuals naturally
        if (progressFill) progressFill.style.width = `${currentProgress}%`;
        if (percentageText) percentageText.innerText = `${Math.floor(currentProgress)}%`;

    }, intervalTime);
    
    // Wire settings toggles
    const musicToggle = document.getElementById('setting-music');
    if (musicToggle) {
        musicToggle.checked = gameState.soundEnabled;
        musicToggle.onchange = (e) => {
            gameState.soundEnabled = e.target.checked;
            toggleBgMusic(gameState.soundEnabled);
            saveState();
        };
    }
};
