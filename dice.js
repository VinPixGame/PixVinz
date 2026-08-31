let currentCoins = parseFloat(localStorage.getItem('pixvinz_coins')) || 950.00;
document.getElementById('coinCount').innerText = currentCoins.toFixed(2);

let recentHistory = [12.50, 74.12, 45.00, 91.05, 30.22, 65.80];
let isRollOver = true; 
let lastSliderSoundVal = 47;
let isRolling = false;
let gameMode = 'manual'; // 'manual' or 'auto'
let isAutoRunning = false;
let autoInterval = null;
let rollsRemaining = 0;

let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    try {
        initAudio();
        if (!audioCtx) return;

        let osc = audioCtx.createOscillator();
        let gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        let now = audioCtx.currentTime;

        if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(150, now + 0.05);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } 
        else if (type === 'slide') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(120, now + 0.02);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.02);
            osc.start(now);
            osc.stop(now + 0.02);
        }
        else if (type === 'win') {
            [523.25, 659.25, 783.99, 1046.50].forEach((freq, index) => {
                let o = audioCtx.createOscillator();
                let g = audioCtx.createGain();
                o.connect(g);
                g.connect(audioCtx.destination);
                o.type = 'triangle';
                o.frequency.setValueAtTime(freq, now + index * 0.08);
                g.gain.setValueAtTime(0.2, now + index * 0.08);
                g.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.3);
                o.start(now + index * 0.08);
                o.stop(now + index * 0.08 + 0.3);
            });
        } 
        else if (type === 'lose') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.2);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        }
    } catch (e) {
        console.log("Audio blocked.");
    }
}

function switchMode(mode) {
    if (isAutoRunning) return;
    gameMode = mode;
    let manualTab = document.getElementById('manualTab');
    let autoTab = document.getElementById('autoTab');
    let autoControls = document.getElementById('autoControls');
    let betBtn = document.getElementById('betBtn');

    if (mode === 'manual') {
        manualTab.classList.add('active');
        autoTab.classList.remove('active');
        autoControls.style.display = 'none';
        betBtn.innerText = "ROLL";
    } else {
        autoTab.classList.add('active');
        manualTab.classList.remove('active');
        autoControls.style.display = 'flex';
        betBtn.innerText = "START AUTO ROLL";
    }
}

function toggleRollMode() {
    isRollOver = !isRollOver;
    document.getElementById('modeLabel').innerText = isRollOver ? "Roll Over 🔄" : "Roll Under 🔄";
    updateSlider(document.getElementById('rollSlider').value);
}

function onSliderDrag(val) {
    let numVal = parseInt(val);
    if (Math.abs(numVal - lastSliderSoundVal) >= 2) {
        playSound('slide');
        lastSliderSoundVal = numVal;
    }
    updateSlider(val);
}

function updateSlider(val) {
    let threshold = parseFloat(val);
    let winChance = isRollOver ? (100 - threshold) : threshold;
    if (winChance < 1) winChance = 1;
    if (winChance > 98) winChance = 98;

    let multiplier = (99 / winChance).toFixed(4);

    document.getElementById('rollOverVal').innerText = threshold.toFixed(2);
    document.getElementById('winChanceVal').innerText = winChance.toFixed(2) + '%';
    document.getElementById('multiplierVal').innerText = multiplier + 'x';

    let trackBg = document.getElementById('sliderTrackBg');
    let successTrack = document.getElementById('successTrack');

    if (isRollOver) {
        trackBg.style.background = '#ef4444';
        successTrack.style.background = '#22c55e';
        successTrack.style.left = 'unset';
        successTrack.style.right = '0';
        successTrack.style.width = (100 - threshold) + '%';
        successTrack.style.borderRadius = '0 7px 7px 0';
    } else {
        trackBg.style.background = '#ef4444';
        successTrack.style.background = '#22c55e';
        successTrack.style.right = 'unset';
        successTrack.style.left = '0';
        successTrack.style.width = threshold + '%';
        successTrack.style.borderRadius = '7px 0 0 7px';
    }

    updateProfit();
}

function updateProfit() {
    let bet = parseFloat(document.getElementById('betAmountInput').value) || 0;
    let mult = parseFloat(document.getElementById('multiplierVal').innerText);
    let profit = (bet * mult) - bet;
    document.getElementById('profitVal').innerText = profit.toFixed(2) + ' Coins';
}

document.getElementById('betAmountInput').addEventListener('input', updateProfit);

function showNotEnoughBalanceError(customText = "Not enough balance") {
    let errEl = document.getElementById('errorMsg');
    errEl.innerText = customText;
    errEl.classList.add('show');
    setTimeout(() => {
        errEl.classList.remove('show');
    }, 2000);
}

function halveBet() {
    let input = document.getElementById('betAmountInput');
    let val = Math.max(1, Math.floor(parseFloat(input.value) / 2));
    input.value = val;
    updateProfit();
}

function doubleBet() {
    let input = document.getElementById('betAmountInput');
    let currentBet = parseFloat(input.value) || 0;
    let doubled = currentBet * 2;

    if (doubled > currentCoins) {
        if (currentCoins <= 0) {
            input.value = 0;
        } else {
            input.value = currentCoins;
        }
        showNotEnoughBalanceError();
    } else {
        input.value = doubled;
    }
    updateProfit();
}

function renderHistory(latestRoll) {
    recentHistory.push(latestRoll);
    if (recentHistory.length > 6) {
        recentHistory.shift();
    }

    let bar = document.getElementById('historyBar');
    bar.innerHTML = '';
    let threshold = parseFloat(document.getElementById('rollOverVal').innerText);

    recentHistory.forEach((roll) => {
        let pill = document.createElement('div');
        pill.className = 'history-pill';
        let won = isRollOver ? (roll > threshold) : (roll < threshold);
        if (won) {
            pill.classList.add('win');
        }
        pill.innerText = roll.toFixed(2);
        bar.appendChild(pill);
    });
}

function handleMainButtonClick() {
    if (gameMode === 'manual') {
        executeManualRoll();
    } else {
        if (!isAutoRunning) {
            startAutoRoll();
        } else {
            stopAutoRoll();
        }
    }
}

function executeManualRoll() {
    if (isRolling) return;

    let betAmount = parseFloat(document.getElementById('betAmountInput').value);
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > currentCoins) {
        showNotEnoughBalanceError();
        return;
    }

    isRolling = true;
    let betBtn = document.getElementById('betBtn');
    betBtn.innerText = "ROLLING...";
    betBtn.disabled = true;

    currentCoins -= betAmount;
    document.getElementById('coinCount').innerText = currentCoins.toFixed(2);

    setTimeout(() => {
        let threshold = parseFloat(document.getElementById('rollOverVal').innerText);
        let multiplier = parseFloat(document.getElementById('multiplierVal').innerText);

        let rolledNum = Math.random() * 100;
        let isWin = isRollOver ? (rolledNum > threshold) : (rolledNum < threshold);

        let cube = document.getElementById('floatingCube');
        cube.style.display = 'block';
        cube.style.left = rolledNum + '%';
        cube.innerText = rolledNum.toFixed(2);

        if (isWin) {
            cube.className = "floating-cube-indicator win";
            let payout = betAmount * multiplier;
            currentCoins += payout;
            playSound('win');
        } else {
            cube.className = "floating-cube-indicator lose";
            playSound('lose');
        }

        document.getElementById('coinCount').innerText = currentCoins.toFixed(2);
        localStorage.setItem('pixvinz_coins', currentCoins);

        renderHistory(rolledNum);

        betBtn.innerText = "ROLL";
        betBtn.disabled = false;
        isRolling = false;
    }, 300);
}

function startAutoRoll() {
    let betAmount = parseFloat(document.getElementById('betAmountInput').value);
    if (isNaN(betAmount) || betAmount <= 0 || betAmount > currentCoins) {
        showNotEnoughBalanceError();
        return;
    }

    rollsRemaining = parseInt(document.getElementById('autoRollsInput').value) || 10;
    let speed = parseInt(document.getElementById('autoSpeedInput').value) || 400;

    isAutoRunning = true;
    let betBtn = document.getElementById('betBtn');
    betBtn.classList.add('stop-auto');
    betBtn.innerText = `STOP AUTO (${rollsRemaining})`;

    autoInterval = setInterval(() => {
        if (rollsRemaining <= 0 || currentCoins < betAmount) {
            stopAutoRoll();
            if (currentCoins < betAmount) showNotEnoughBalanceError("Stopped: Low balance");
            return;
        }

        rollsRemaining--;
        betBtn.innerText = `STOP AUTO (${rollsRemaining})`;

        currentCoins -= betAmount;
        document.getElementById('coinCount').innerText = currentCoins.toFixed(2);

        let threshold = parseFloat(document.getElementById('rollOverVal').innerText);
        let multiplier = parseFloat(document.getElementById('multiplierVal').innerText);

        let rolledNum = Math.random() * 100;
        let isWin = isRollOver ? (rolledNum > threshold) : (rolledNum < threshold);

        let cube = document.getElementById('floatingCube');
        cube.style.display = 'block';
        cube.style.left = rolledNum + '%';
        cube.innerText = rolledNum.toFixed(2);

        let onWinPct = parseFloat(document.getElementById('onWinInput').value) || 0;
        let onLossPct = parseFloat(document.getElementById('onLossInput').value) || 0;

        if (isWin) {
            cube.className = "floating-cube-indicator win";
            let payout = betAmount * multiplier;
            currentCoins += payout;
            playSound('win');
            if (onWinPct !== 0) {
                betAmount = betAmount * (1 + (onWinPct / 100));
            }
        } else {
            cube.className = "floating-cube-indicator lose";
            playSound('lose');
            if (onLossPct !== 0) {
                betAmount = betAmount * (1 + (onLossPct / 100));
            }
        }

        if (betAmount < 0.01) betAmount = 0.01;
        if (betAmount > currentCoins && currentCoins > 0) {
            betAmount = currentCoins;
        }
        document.getElementById('betAmountInput').value = betAmount.toFixed(2);
        updateProfit();

        document.getElementById('coinCount').innerText = currentCoins.toFixed(2);
        localStorage.setItem('pixvinz_coins', currentCoins);

        renderHistory(rolledNum);

        if (rollsRemaining <= 0) {
            stopAutoRoll();
        }
    }, speed);
}

function stopAutoRoll() {
    clearInterval(autoInterval);
    isAutoRunning = false;
    let betBtn = document.getElementById('betBtn');
    betBtn.classList.remove('stop-auto');
    betBtn.innerText = "START AUTO ROLL";
}

updateSlider(47);
