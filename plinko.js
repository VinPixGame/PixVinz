document.addEventListener('DOMContentLoaded', () => {
  // --- Active User & Key Helpers ---
  function getActiveUserPrefix() {
    let username = '';
    try {
      const userObj = JSON.parse(localStorage.getItem('loggedInUser'));
      if (userObj && userObj.username) username = userObj.username;
    } catch (e) {}
    if (!username) username = localStorage.getItem('vinpix_username') || '';
    return username ? `${username}_` : '';
  }

  let prefix = getActiveUserPrefix();
  let coinKey = `${prefix}totalCoins`;
  let xpKey = `${prefix}totalXp`;

  let coinCount = parseFloat(localStorage.getItem(coinKey)) || 500;
  let xpCount = parseInt(localStorage.getItem(xpKey), 10) || 0;
  
  let currentBet = 10;
  let currentDifficulty = 'normal';
  let currentRows = 16; 
  let lastDropTime = 0;

  const coinCountEl = document.getElementById('coinCount');
  const currentBetValEl = document.getElementById('currentBetVal');
  const dropBallBtn = document.getElementById('dropBallBtn');
  const decreaseBetBtn = document.getElementById('decreaseBetBtn');
  const increaseBetBtn = document.getElementById('increaseBetBtn');

  const rowsInput = document.getElementById('rowsInput');
  const rowsDisplay = document.getElementById('rowsDisplay');

  // Cyan-Blue XP Display Target (Injects if not present in HTML)
  let xpCountEl = document.getElementById('xpCountDisplay');
  if (!xpCountEl) {
    const xpContainer = document.createElement('div');
    xpContainer.style.cssText = 'color: #00f2fe; font-weight: bold; font-size: 16px; margin-top: 10px; text-align: center; font-family: sans-serif;';
    xpContainer.innerHTML = 'XP: <span id="xpCountDisplay">0</span>';
    
    const arena = document.getElementById('plinkoArena') || document.body;
    arena.parentNode.insertBefore(xpContainer, arena.nextSibling);
    xpCountEl = document.getElementById('xpCountDisplay');
  }

  if (rowsInput) {
    rowsInput.value = currentRows;
    if (rowsDisplay) rowsDisplay.textContent = currentRows;

    rowsInput.addEventListener('input', (e) => {
      currentRows = parseInt(e.target.value, 10);
      if (rowsDisplay) rowsDisplay.textContent = currentRows;
      playSound('click');
    });
  }

  function updateDisplay() {
    prefix = getActiveUserPrefix();
    coinKey = `${prefix}totalCoins`;
    xpKey = `${prefix}totalXp`;

    if (coinCountEl) coinCountEl.textContent = coinCount.toFixed(2);
    if (currentBetValEl) currentBetValEl.textContent = currentBet;
    if (xpCountEl) xpCountEl.textContent = xpCount.toLocaleString();

    localStorage.setItem(coinKey, coinCount);
    localStorage.setItem(xpKey, xpCount);

    if (typeof updateProfileStats === 'function') updateProfileStats();
    if (typeof window.saveUserDataToCloud === 'function') window.saveUserDataToCloud();
  }
  updateDisplay();

  if (decreaseBetBtn) {
    decreaseBetBtn.addEventListener('click', () => {
      currentBet = Math.max(5, currentBet - 5);
      updateDisplay();
      playSound('click');
    });
  }

  if (increaseBetBtn) {
    increaseBetBtn.addEventListener('click', () => {
      currentBet = Math.min(100, currentBet + 5);
      updateDisplay();
      playSound('click');
    });
  }

  const diffBtns = document.querySelectorAll('.diff-btn');
  diffBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      diffBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentDifficulty = btn.getAttribute('data-diff');
      playSound('click');
    });
  });

  const canvas = document.getElementById('plinkoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const arena = document.getElementById('plinkoArena');

  function resizeCanvas() {
    if (arena && canvas) {
      canvas.width = arena.clientWidth;
      canvas.height = arena.clientHeight;
    }
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  setTimeout(resizeCanvas, 50);

  const multiplierTables = {
    normal: {
      8:  [3.0, 1.5, 1.0, 0.7, 0.4, 0.7, 1.0, 1.5, 3.0],
      9:  [3.5, 1.8, 1.2, 0.7, 0.4, 0.4, 0.7, 1.2, 1.8, 3.5],
      10: [4.0, 2.0, 1.5, 1.0, 0.7, 0.4, 0.7, 1.0, 1.5, 2.0, 4.0],
      11: [5.0, 2.2, 1.5, 1.0, 0.7, 0.4, 0.4, 0.7, 1.0, 1.5, 2.2, 5.0],
      12: [6.0, 2.5, 1.8, 1.2, 1.0, 0.7, 0.4, 0.7, 1.0, 1.2, 1.8, 2.5, 6.0],
      13: [7.0, 3.0, 2.0, 1.5, 1.0, 0.7, 0.4, 0.4, 0.7, 1.0, 1.5, 2.0, 3.0, 7.0],
      14: [8.0, 3.5, 2.0, 1.5, 1.0, 0.7, 0.4, 0.2, 0.4, 0.7, 1.0, 1.5, 2.0, 3.5, 8.0],
      15: [9.0, 4.0, 2.5, 1.8, 1.2, 1.0, 0.7, 0.4, 0.4, 0.7, 1.0, 1.2, 1.8, 2.5, 4.0, 9.0],
      16: [10.0, 5.0, 3.0, 2.0, 1.5, 1.0, 0.7, 0.4, 0.2, 0.4, 0.7, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0]
    },
    medium: {
      8:  [8.0, 3.0, 1.5, 0.8, 0.3, 0.8, 1.5, 3.0, 8.0],
      9:  [10.0, 3.5, 1.8, 0.8, 0.5, 0.5, 0.8, 1.8, 3.5, 10.0],
      10: [12.0, 4.0, 2.0, 1.0, 0.5, 0.3, 0.5, 1.0, 2.0, 4.0, 12.0],
      11: [15.0, 4.5, 2.2, 1.2, 0.8, 0.3, 0.3, 0.8, 1.2, 2.2, 4.5, 15.0],
      12: [18.0, 5.0, 2.5, 1.5, 0.8, 0.5, 0.3, 0.5, 0.8, 1.5, 2.5, 5.0, 18.0],
      13: [20.0, 8.0, 3.0, 1.5, 0.8, 0.5, 0.3, 0.3, 0.5, 0.8, 1.5, 3.0, 8.0, 20.0],
      14: [22.0, 10.0, 3.5, 2.0, 1.0, 0.8, 0.5, 0.2, 0.5, 0.8, 1.0, 2.0, 3.5, 10.0, 22.0],
      15: [25.0, 12.0, 4.0, 2.5, 1.2, 0.8, 0.5, 0.3, 0.3, 0.5, 0.8, 1.2, 2.5, 4.0, 12.0, 25.0],
      16: [29.0, 15.0, 5.0, 3.0, 1.5, 0.8, 0.5, 0.3, 0.2, 0.3, 0.5, 0.8, 1.5, 3.0, 5.0, 15.0, 29.0]
    },
    hard: {
      8:  [29.0, 4.0, 1.5, 0.2, 0.1, 0.2, 1.5, 4.0, 29.0],
      9:  [43.0, 7.0, 2.0, 0.2, 0.1, 0.1, 0.2, 2.0, 7.0, 43.0],
      10: [76.0, 10.0, 3.0, 0.2, 0.2, 0.1, 0.2, 0.2, 3.0, 10.0, 76.0],
      11: [120.0, 14.0, 5.0, 1.0, 0.2, 0.1, 0.1, 0.2, 1.0, 5.0, 14.0, 120.0],
      12: [170.0, 24.0, 8.0, 1.0, 0.2, 0.2, 0.1, 0.2, 0.2, 1.0, 8.0, 24.0, 170.0],
      13: [260.0, 37.0, 10.0, 3.0, 0.2, 0.2, 0.1, 0.1, 0.2, 0.2, 3.0, 10.0, 37.0, 260.0],
      14: [420.0, 56.0, 10.0, 3.0, 1.0, 0.2, 0.2, 0.1, 0.2, 0.2, 1.0, 3.0, 10.0, 56.0, 420.0],
      15: [620.0, 80.0, 10.0, 3.0, 1.0, 0.2, 0.2, 0.1, 0.1, 0.2, 0.2, 1.0, 3.0, 10.0, 80.0, 620.0],
      16: [1000.0, 100.0, 10.0, 3.0, 1.0, 0.2, 0.2, 0.2, 0.1, 0.2, 0.2, 0.2, 1.0, 3.0, 10.0, 100.0, 1000.0]
    }
  };

  const colorPalette = [
    '#7b1fa2', '#9c27b0', '#ff0844', '#ff4500', '#ff7300', 
    '#ffa500', '#ffd700', '#00f2fe', '#3a7bd5', '#3a7bd5'
  ];

  function getSlotColors(multipliers) {
    const len = multipliers.length;
    const mid = Math.floor(len / 2);
    return multipliers.map((_, idx) => {
      const distFromCenter = Math.abs(idx - mid);
      const colorIndex = Math.min(distFromCenter, colorPalette.length - 1);
      return colorPalette[colorIndex];
    });
  }

  const pegRadius = 3.5;
  const ballRadius = 5.5;
  let activeBalls = [];
  let jarFlashUntil = [];

  if (dropBallBtn) {
    dropBallBtn.addEventListener('click', () => {
      const now = Date.now();
      if (now - lastDropTime < 80) return;
      lastDropTime = now;

      if (coinCount < currentBet) {
        playSound('error');
        alert('Not enough coins!');
        return;
      }
      coinCount -= currentBet;
      updateDisplay();
      playSound('drop');

      const startX = canvas.width / 2;
      const startY = 15;

      activeBalls.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 0.1,
        vy: 0,
        bet: currentBet
      });
    });
  }

  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    return audioCtx;
  }

  function playSound(type, index = 0) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'drop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.02);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
        osc.start(now);
        osc.stop(now + 0.02);
      } else if (type === 'peg') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.01);
        gain.gain.setValueAtTime(0.008, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);
        osc.start(now);
        osc.stop(now + 0.01);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'jar') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440 + index * 20, now);
        gain.gain.setValueAtTime(2.0, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch(e) {}
  }

  function drawMarqueeBulb(x, y, colorType) {
    if (colorType === 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(50, 30, 70, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const isGold = colorType === 1;
    const bulbColor = isGold ? '#ffaa00' : '#b026ff';
    const glowColor = isGold ? '#ffd700' : '#da70d6';

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 8;
    ctx.fillStyle = bulbColor;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function updatePhysics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rows = currentRows;
    const multipliers = multiplierTables[currentDifficulty][rows];
    const slotColors = getSlotColors(multipliers);

    const w = canvas.width;
    const h = canvas.height;

    // 1. Marquee Bulbs
    const lightSpacing = 16; 
    let perimeterCoords = [];
    
    for (let x = 10; x < w - 10; x += lightSpacing) perimeterCoords.push({x: x, y: 8});
    for (let y = 8; y < h - 8; y += lightSpacing) perimeterCoords.push({x: w - 8, y: y});
    for (let x = w - 10; x > 10; x -= lightSpacing) perimeterCoords.push({x: x, y: h - 8});
    for (let y = h - 8; y > 8; y -= lightSpacing) perimeterCoords.push({x: 8, y: y});

    const totalBulbs = perimeterCoords.length;
    const speed = 0.008; 
    const shift = Math.floor(Date.now() * speed) % totalBulbs;
    const trainLength = 6; 

    for (let i = 0; i < totalBulbs; i++) {
      let distanceFromHead = (i - shift + totalBulbs) % totalBulbs;
      let state = 0; 
      if (distanceFromHead < trainLength) {
        state = (distanceFromHead % 2 === 0) ? 1 : 2;
      }
      drawMarqueeBulb(perimeterCoords[i].x, perimeterCoords[i].y, state);
    }
   
    // 2. Peg Grid
    const startYGrid = 35;
    const rowHeight = (h - 120) / rows;
    const colSpacing = (w - 40) / (rows + 1);
    
    for (let r = 0; r < rows; r++) {
      const pegsInRow = r + 3;
      const rowWidth = (pegsInRow - 1) * colSpacing;
      const startX = (w - rowWidth) / 2;
      const y = startYGrid + r * rowHeight;

      for (let c = 0; c < pegsInRow; c++) {
        const x = startX + c * colSpacing;
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // 3. Glass Jar Slots
    const slotWidth = w / multipliers.length;
    const slotY = h - 30;
    const jarTop = h - 70;
    const jarBottom = h - 8;

    for (let i = 0; i < multipliers.length; i++) {
      const x = i * slotWidth;
      const centerX = x + slotWidth / 2;
      const jarWidth = Math.min(slotWidth - 2, 38);
      const left = centerX - jarWidth / 2;

      const glassGradient = ctx.createLinearGradient(left, jarTop, left + jarWidth, jarTop);
      glassGradient.addColorStop(0, 'rgba(255,255,255,0.25)');
      glassGradient.addColorStop(0.2, 'rgba(255,255,255,0.08)');
      glassGradient.addColorStop(0.5, 'rgba(255,255,255,0.02)');
      glassGradient.addColorStop(0.8, 'rgba(255,255,255,0.08)');
      glassGradient.addColorStop(1, 'rgba(255,255,255,0.22)');

      ctx.save();
      ctx.fillStyle = glassGradient;
      ctx.strokeStyle = slotColors[i] || '#ff0844';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.roundRect(left, jarTop + 8, jarWidth, jarBottom - jarTop - 8, 5);
      ctx.fill();
      ctx.stroke();

      const coinColor = slotColors[i] || '#ff0844';
      for (let c = 0; c < 3; c++) {
        const coinX = left + 4 + c * 5;
        const coinY = jarBottom - 6;

        ctx.fillStyle = coinColor;
        ctx.beginPath();
        ctx.arc(coinX, coinY, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      ctx.fillStyle = '#5a351d';
      ctx.strokeStyle = '#d49a45';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.roundRect(centerX - 8, jarTop - 2, 16, 6, 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#d99b45';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 7, jarTop + 8);
      ctx.lineTo(centerX + 7, jarTop + 8);
      ctx.stroke();

      const isJackpot = multipliers[i] === 1000;

      if (isJackpot) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffe066';
        ctx.font = 'bold 9px sans-serif';
      } else {
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px sans-serif';
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (multipliers[i] >= 100) {
        const letters = ['1', '0', '0', ...(multipliers[i] === 1000 ? ['0'] : []), 'X'];
        const startY = jarTop + 16;
        const lineGap = 7;
        
        letters.forEach((char, idx) => {
          ctx.fillText(char, centerX, startY + idx * lineGap);
        });
      } else {
        ctx.fillText(`${multipliers[i]}x`, centerX, jarTop + 32);
      }

      ctx.shadowBlur = 0;
      ctx.restore();

      if (jarFlashUntil[i] && Date.now() < jarFlashUntil[i]) {
        ctx.save();
        ctx.shadowColor = slotColors[i];
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.strokeStyle = slotColors[i];
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(left, jarTop + 8, jarWidth, jarBottom - jarTop - 8, 5);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. Physics Engine
    for (let i = activeBalls.length - 1; i >= 0; i--) {
      let ball = activeBalls[i];

      ball.vy += 0.85; 
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ballRadius < 8) {
        ball.x = 8 + ballRadius;
        ball.vx *= -0.5;
      } else if (ball.x + ballRadius > w - 8) {
        ball.x = w - 8 - ballRadius;
        ball.vx *= -0.5;
      }

      for (let r = 0; r < rows; r++) {
        const pegsInRow = r + 3;
        const rowWidth = (pegsInRow - 1) * colSpacing;
        const startX = (w - rowWidth) / 2;
        const y = startYGrid + r * rowHeight;

        for (let c = 0; c < pegsInRow; c++) {
          const px = startX + c * colSpacing;
          const py = y;
          const dx = ball.x - px;
          const dy = ball.y - py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < ballRadius + pegRadius) {
            playSound('peg');
            const overlap = (ballRadius + pegRadius) - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            
            ball.x += nx * overlap;
            ball.y += ny * overlap;

            const dot = ball.vx * nx + ball.vy * ny;
            const scatter = (Math.random() - 0.5) * 0.5;
            ball.vx = (ball.vx - 1.8 * dot * nx) * 0.75 + scatter;
            ball.vy = (ball.vy - 1.8 * dot * ny) * 0.75;
          }
        }
      }

      if (ball.y >= slotY) {
        const slotIndex = Math.floor(ball.x / slotWidth);
        const clampedIndex = Math.max(0, Math.min(multipliers.length - 1, slotIndex));
        const mult = multipliers[clampedIndex];

        // Coin calculation
        coinCount += ball.bet * mult;

        // XP calculation (Bet x Multiplier, max cap 17,500)
        const rawXp = Math.floor(ball.bet * mult);
        const xpGained = Math.min(rawXp, 17500);
        xpCount += xpGained;

        // Save & trigger updates
        updateDisplay();
        jarFlashUntil[clampedIndex] = Date.now() + 350;
        playSound('jar', clampedIndex);
        activeBalls.splice(i, 1);
        continue;
      }

      // Render Ball
      ctx.save();
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff9e6';
      ctx.beginPath();
      ctx.arc(ball.x - 1.5, ball.y - 1.5, ballRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    requestAnimationFrame(updatePhysics);
  }

  requestAnimationFrame(updatePhysics);
});
