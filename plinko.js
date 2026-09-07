document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
  const username = currentUser.username || localStorage.getItem('vinpix_username') || 'default';
  const coinKey = `${username}_totalCoins`;

  let coinCount = parseFloat(localStorage.getItem(coinKey)) || 500;
  let currentBet = 10;
  let currentDifficulty = 'normal'; // normal (low), medium, hard (high)
  let currentRows = 16; // Default to 16 rows
  let lastDropTime = 0;

  const coinCountEl = document.getElementById('coinCount');
  const currentBetValEl = document.getElementById('currentBetVal');
  const dropBallBtn = document.getElementById('dropBallBtn');
  const decreaseBetBtn = document.getElementById('decreaseBetBtn');
  const increaseBetBtn = document.getElementById('increaseBetBtn');

  // Row selection UI elements
  const rowsInput = document.getElementById('rowsInput');
  const rowsDisplay = document.getElementById('rowsDisplay');

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
    if (coinCountEl) coinCountEl.textContent = coinCount.toFixed(2);
    if (currentBetValEl) currentBetValEl.textContent = currentBet;
    localStorage.setItem(coinKey, coinCount);
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

  // DYNAMIC MULTIPLIER GENERATOR FOR 8 TO 16 ROWS
  // Mirrored from Stake risk/row matrices
  const multiplierTables = {
  normal: {
    8:  [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    9:  [5.6, 2, 1.6, 1, 0.7, 0.7, 1, 1.6, 2, 5.6],
    10: [8.9, 3, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 3, 8.9],
    11: [8.4, 3, 1.9, 1.3, 1, 0.7, 0.7, 1, 1.3, 1.9, 3, 8.4],
    12: [10, 3, 1.6, 1.4, 1.1, 1, 0.5, 1, 1.1, 1.4, 1.6, 3, 10],
    13: [8.1, 4, 3, 1.9, 1.2, 0.9, 0.7, 0.7, 0.9, 1.2, 1.9, 3, 4, 8.1],
    14: [7.1, 4, 1.9, 1.4, 1.3, 1.1, 1, 0.5, 1, 1.1, 1.3, 1.4, 1.9, 4, 7.1],
    15: [15, 8, 3, 2, 1.5, 1.1, 1, 0.7, 0.7, 1, 1.1, 1.5, 2, 3, 8, 15],
    16: [16, 9, 2, 1.4, 1.2, 1.1, 1, 0.5, 0.5, 0.5, 1, 1.1, 1.2, 1.4, 2, 9, 16] // 17 items
  },
  medium: {
    8:  [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    9:  [18, 4, 1.7, 0.9, 0.5, 0.5, 0.9, 1.7, 4, 18],
    10: [22, 5, 2, 1.4, 0.6, 0.4, 0.6, 1.4, 2, 5, 22],
    11: [24, 6, 3, 1.8, 0.7, 0.5, 0.5, 0.7, 1.8, 3, 6, 24],
    12: [33, 11, 4, 2, 1.1, 0.6, 0.3, 0.6, 1.1, 2, 4, 11, 33],
    13: [37, 11, 4, 2.5, 1.2, 0.8, 0.4, 0.4, 0.8, 1.2, 2.5, 4, 11, 37],
    14: [58, 15, 7, 4, 1.9, 1, 0.5, 0.3, 0.5, 1, 1.9, 4, 7, 15, 58],
    15: [88, 18, 11, 5, 3, 1.3, 0.5, 0.3, 0.3, 0.5, 1.3, 3, 5, 11, 18, 88],
    16: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 0.3, 0.5, 1, 1.5, 3, 5, 10, 41, 110] // 17 items
  },
  hard: {
    8:  [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29],
    9:  [43, 7, 2, 0.6, 0.2, 0.2, 0.6, 2, 7, 43],
    10: [76, 10, 3, 0.9, 0.3, 0.2, 0.3, 0.9, 3, 10, 76],
    11: [120, 14, 5.2, 1.4, 0.4, 0.2, 0.2, 0.4, 1.4, 5.2, 14, 120],
    12: [170, 24, 8.1, 2, 0.7, 0.2, 0.2, 0.2, 0.7, 2, 8.1, 24, 170],
    13: [260, 37, 11, 4, 1, 0.2, 0.2, 0.2, 0.2, 1, 4, 11, 37, 260],
    14: [420, 56, 18, 5, 1.9, 0.3, 0.2, 0.2, 0.2, 0.3, 1.9, 5, 18, 56, 420],
    15: [620, 83, 27, 8, 3, 0.5, 0.2, 0.2, 0.2, 0.2, 0.5, 3, 8, 27, 83, 620],
    16: [1000, 100, 26, 9, 4, 2, 0.5, 0.3, 0.2, 0.3, 0.5, 2, 4, 9, 26, 100, 1000] // 17 items
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
        vy: 0
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
  // Short percussive click so fast drops don't stack into a drone
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.03);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  osc.start(now);
  osc.stop(now + 0.03);
}
      } else if (type === 'peg') {
        osc.type = 'sine';
        const randomPitch = 550 + Math.random() * 350;
        osc.frequency.setValueAtTime(randomPitch, now);
        osc.frequency.exponentialRampToValueAtTime(randomPitch * 0.5, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
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
        gain.gain.setValueAtTime(1.85, now);
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
   
    const startYGrid = 35;
    const rowHeight = (h - 120) / rows;
    const colSpacing = (w - 40) / (rows + 1);
    
    // Draw Peg Grid (Dynamic Rows)
    for (let r = 0; r < rows; r++) {
      const pegsInRow = r + 3;
      const rowWidth = (pegsInRow - 1) * colSpacing;
      const startX = (w - rowWidth) / 2;
      const y = startYGrid + r * rowHeight;

      for (let c = 0; c < pegsInRow; c++) {
        const x = startX + c * colSpacing;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 3;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }


// Draw Glass Jar Slots
const slotWidth = w / multipliers.length;
const slotY = h - 30;
const jarTop = h - 70;
const jarBottom = h - 8;

for (let i = 0; i < multipliers.length; i++) {
  const x = i * slotWidth;
  const centerX = x + slotWidth / 2;
  const jarWidth = Math.min(slotWidth - 2, 38);
  const left = centerX - jarWidth / 2;

  // Glass Jar Body
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

  // Stacked Coins inside Jar
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

  // Wooden Lid
  ctx.fillStyle = '#5a351d';
  ctx.strokeStyle = '#d49a45';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.roundRect(centerX - 8, jarTop - 2, 16, 6, 2);
  ctx.fill();
  ctx.stroke();

  // Jar Rope
  ctx.strokeStyle = '#d99b45';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - 7, jarTop + 8);
  ctx.lineTo(centerX + 7, jarTop + 8);
  ctx.stroke();

  // Multiplier Label (Updated Vertical + Gold Glow)
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

  // Landing Flash Effect
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
    

    
    // Ball Physics Engine
    for (let i = activeBalls.length - 1; i >= 0; i--) {
      let ball = activeBalls[i];

      ball.vy += 0.38;
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ballRadius < 8) {
        ball.x = 8 + ballRadius;
        ball.vx *= -0.3;
      } else if (ball.x + ballRadius > w - 8) {
        ball.x = w - 8 - ballRadius;
        ball.vx *= -0.3;
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
            const scatter = (Math.random() - 0.5) * 0.2;
            ball.vx = (ball.vx - 2 * dot * nx) * 0.45 + scatter;
            ball.vy = (ball.vy - 2 * dot * ny) * 0.45;
          }
        }
      }

      if (ball.y >= slotY) {
        const slotIndex = Math.floor(ball.x / slotWidth);
        const clampedIndex = Math.max(0, Math.min(multipliers.length - 1, slotIndex));
        const mult = multipliers[clampedIndex];

        coinCount += currentBet * mult;
        updateDisplay();
        jarFlashUntil[clampedIndex] = Date.now() + 350;
        playSound('jar', clampedIndex);
        activeBalls.splice(i, 1);
        continue;
      }

      // Draw Gold Ball
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff9e6';
      ctx.beginPath();
      ctx.arc(ball.x - 1.5, ball.y - 1.5, ballRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(updatePhysics);
  }

  requestAnimationFrame(updatePhysics);
});
