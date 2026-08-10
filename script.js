let currentLevel = 1;
let moves = 0;
let timerSeconds = 0;
let timerInterval = null;
let boardState = [];
let selectedIndex = null;

function getGridSize(level) {
    if (level <= 10) return 3;
    if (level <= 20) return 4;
    if (level <= 40) return 5;
    if (level <= 60) return 6;
    return 7;
}

function startGame() {
    startLevel(currentLevel);
}

function startLevel(lvl) {
    currentLevel = lvl;
    moves = 0;
    timerSeconds = 0;
    selectedIndex = null;
    
    document.getElementById('moves').textContent = '0';
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('levelScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');

    const grid = getGridSize(lvl);
    boardState = Array.from({ length: grid * grid }, (_, i) => i);
    shuffleTiles();
    startTimer();
}

function renderBoard() {
    const board = document.getElementById('puzzleBoard');
    board.innerHTML = '';
    const grid = getGridSize(currentLevel);
    
    board.style.gridTemplateColumns = `repeat(${grid}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${grid}, 1fr)`;

    const imgPath = `image/level${currentLevel}.jpeg`;

    boardState.forEach((tileVal, idx) => {
        const tile = document.createElement('div');
        tile.className = 'tile' + (idx === selectedIndex ? ' selected' : '');
        
        const row = Math.floor(tileVal / grid);
        const col = tileVal % grid;
        const posX = grid > 1 ? (col / (grid - 1)) * 100 : 0;
        const posY = grid > 1 ? (row / (grid - 1)) * 100 : 0;

        tile.style.backgroundImage = `url('${imgPath}')`;
        tile.style.backgroundSize = `${grid * 100}% ${grid * 100}%`;
        tile.style.backgroundPosition = `${posX}% ${posY}%`;

        tile.onclick = () => handleTileTap(idx);
        board.appendChild(tile);
    });
}

function handleTileTap(idx) {
    playClick();
    if (selectedIndex === null) {
        selectedIndex = idx;
    } else if (selectedIndex === idx) {
        selectedIndex = null;
    } else {
        [boardState[selectedIndex], boardState[idx]] = [boardState[idx], boardState[selectedIndex]];
        selectedIndex = null;
        moves++;
        document.getElementById('moves').textContent = moves;
        checkWin();
    }
    renderBoard();
}

function shuffleTiles() {
    for (let i = boardState.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [boardState[i], boardState[j]] = [boardState[j], boardState[i]];
    }
    renderBoard();
}

function checkWin() {
    const win = boardState.every((val, idx) => val === idx);
    if (win) {
        clearInterval(timerInterval);
        alert(`Level Complete in ${moves} moves!`);
        quitGame();
    }
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerSeconds++;
        const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
        const s = String(timerSeconds % 60).padStart(2, '0');
        document.getElementById('timer').textContent = `${m}:${s}`;
    }, 1000);
}

function openLevels() {
    const gridEl = document.getElementById('levelGrid');
    gridEl.innerHTML = '';
    for (let i = 1; i <= 200; i++) {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        btn.textContent = i;
        btn.onclick = () => { playClick(); startLevel(i); };
        gridEl.appendChild(btn);
    }
    document.getElementById('mainMenu').classList.add('hidden');
    document.getElementById('levelScreen').classList.remove('hidden');
}

function closeLevels() {
    document.getElementById('levelScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
}

function openSettings() {
    document.getElementById('settingsPopup').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settingsPopup').classList.add('hidden');
}

function quitGame() {
    clearInterval(timerInterval);
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('mainMenu').classList.remove('hidden');
}
