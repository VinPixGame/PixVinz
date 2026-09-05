document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
  const username = currentUser.username || localStorage.getItem('vinpix_username') || 'default';
  const coinKey = `${username}_totalCoins`;

  let coinCount = parseFloat(localStorage.getItem(coinKey)) || 500;
  let currentBet = 10;
  let currentDifficulty = 'normal';

  const coinCountEl = document.getElementById('coinCount');
  const currentBetValEl = document.getElementById('currentBetVal');
  const dropBallBtn = document.getElementById('dropBallBtn');
  const decreaseBetBtn = document.getElementById('decreaseBetBtn');
  const increaseBetBtn = document.getElementById('increaseBetBtn');

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

  const difficultyConfigs = {
    normal: {
      rows: 8,
      multipliers: [10, 5, 2, 0.5, 0.2, 0.5, 2, 5, 10],
      slotColors: ['#ff0844', '#ff7300', '#ffd700', '#00f2fe', '#4facfe', '#00f2fe', '#ffd700', '#ff7300', '#ff0844']
    },
    medium: {
      rows: 10,
      multipliers: [20, 10, 5, 2, 0.5, 0.2, 0.5, 2, 5, 10, 20],
      slotColors: ['#ff0844', '#ff4500', '#ff7300', '#ffd700', '#00f2fe', '#4facfe', '#00f2fe', '#ffd700', '#ff7300', '#ff4500', '#ff0844']
    },
    hard: {
      rows: 12,
      multipliers: [50, 25, 10, 5, 1, 0.2, 0.1, 0.2, 1, 5, 10, 25, 50],
      slotColors: ['#9c27b0', '#ff0844', '#ff4500', '#ff7300', '#ffd700', '#00f2fe', '#4facfe', '#00f2fe', '#ffd700', '#ff7300', '#ff4500', '#ff0844', '#9c27b0']
    }
  };

  const pegRadius = 4;
  const ballRadius = 7.5;
  let activeBalls = [];
  let jarFlashUntil = [];

  if (dropBallBtn) {
    dropBallBtn.addEventListener('click', () => {
      if (coinCount < currentBet) {
        playSound('error');
        alert('Not enough coins!');
        return;
      }
      coinCount -= currentBet;
      updateDisplay();
      playSound('drop');

      const startX = canvas.width / 2 + (Math.random() - 0.5) * 10;
      const startY = 20;

      activeBalls.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 1.5,
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
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.12);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'peg') {
        osc.type = 'sine';
        const randomPitch = 550 + Math.random() * 350;
        osc.frequency.setValueAtTime(randomPitch, now);
        osc.frequency.exponentialRampToValueAtTime(randomPitch * 0.5, now + 0.04);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.06);
        osc.frequency.setValueAtTime(783.99, now + 0.12);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);


        
            } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'jar') {
        const pianoNotes = [
          261.63, 293.66, 329.63, 349.23, 392.00,
          440.00, 493.88, 523.25, 587.33, 659.25,
          698.46, 783.99, 880.00
        ];

        osc.type = 'sine';
        osc.frequency.setValueAtTime(pianoNotes[index] || 523.25, now);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      
      }
    } catch(e) {}
  }

  function drawMarqueeBulb(x, y, colorType) {
    if (colorType === 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(50, 30, 70, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    const isGold = colorType === 1;
    const bulbColor = isGold ? '#ffaa00' : '#b026ff';
    const glowColor = isGold ? '#ffd700' : '#da70d6';

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.fillStyle = bulbColor;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function updatePhysics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const config = difficultyConfigs[currentDifficulty];
    const rows = config.rows;
    const multipliers = config.multipliers;
    const slotColors = config.slotColors;

    const w = canvas.width;
    const h = canvas.height;

    const lightSpacing = 18; 
    let perimeterCoords = [];
    
    for (let x = 12; x < w - 12; x += lightSpacing) perimeterCoords.push({x: x, y: 10});
    for (let y = 10; y < h - 10; y += lightSpacing) perimeterCoords.push({x: w - 10, y: y});
    for (let x = w - 12; x > 12; x -= lightSpacing) perimeterCoords.push({x: x, y: h - 10});
    for (let y = h - 10; y > 10; y -= lightSpacing) perimeterCoords.push({x: 10, y: y});

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
   
    const startYGrid = 45;
    const rowHeight = (h - 150) / rows;
    
    // Adjusted colSpacing to stretch pegs wide and align perfectly with slot count (rows + 1)
    const colSpacing = (w - 50) / (rows + 1);
    
    // Draw Pegs
    for (let r = 0; r < rows; r++) {
      const pegsInRow = r + 3;
      const rowWidth = (pegsInRow - 1) * colSpacing;
      const startX = (w - rowWidth) / 2;
      const y = startYGrid + r * rowHeight;

      for (let c = 0; c < pegsInRow; c++) {
        const x = startX + c * colSpacing;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Draw Glass Jar Slots
const slotWidth = w / multipliers.length;
const slotY = h - 35;
const jarTop = h - 78;
const jarBottom = h - 5;

for (let i = 0; i < multipliers.length; i++) {
  const x = i * slotWidth;
  const centerX = x + slotWidth / 2;
  const jarWidth = Math.min(slotWidth - 8, 48);
  const left = centerX - jarWidth / 2;

  // Jar glass
  const glassGradient = ctx.createLinearGradient(left, jarTop, left + jarWidth, jarTop);
  glassGradient.addColorStop(0, 'rgba(255,255,255,0.28)');
  glassGradient.addColorStop(0.18, 'rgba(255,255,255,0.08)');
  glassGradient.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  glassGradient.addColorStop(0.82, 'rgba(255,255,255,0.10)');
  glassGradient.addColorStop(1, 'rgba(255,255,255,0.25)');

  ctx.save();

  // Jar glow
  ctx.shadowColor = slotColors[i];
  ctx.shadowBlur = 0;

  ctx.fillStyle = glassGradient;
  ctx.strokeStyle = slotColors[i];
  ctx.lineWidth = 2;

  // Rounded jar body
  ctx.beginPath();
  ctx.roundRect(
    left,
    jarTop + 10,
    jarWidth,
    jarBottom - jarTop - 10,
    8
  );
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Coins inside jar
  const coinColor = slotColors[i];

  for (let c = 0; c < 5; c++) {
    const coinX = left + 8 + (c % 3) * 10;
    const coinY = jarBottom - 9 - Math.floor(c / 3) * 7;

    ctx.fillStyle = coinColor;
    ctx.beginPath();
    ctx.arc(coinX, coinY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Jar neck
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(centerX - 10, jarTop + 2, 20, 12);

  ctx.strokeStyle = slotColors[i];
  ctx.strokeRect(centerX - 10, jarTop + 2, 20, 12);

  // Wooden lid
  ctx.fillStyle = '#5a351d';
  ctx.strokeStyle = '#d49a45';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(centerX - 12, jarTop - 2, 24, 8, 3);
  ctx.fill();
  ctx.stroke();

  // Rope around jar neck
  ctx.strokeStyle = '#d99b45';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(centerX - 11, jarTop + 10);
  ctx.lineTo(centerX + 11, jarTop + 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX - 9, jarTop + 13);
  ctx.lineTo(centerX + 9, jarTop + 13);
  ctx.stroke();

  // Glass highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(left + 7, jarTop + 20);
  ctx.lineTo(left + 7, jarBottom - 15);
  ctx.stroke();

  // Multiplier
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 5;

  ctx.fillText(
    `${multipliers[i]}x`,
    centerX,
    jarTop + 39
  );

    ctx.shadowBlur = 0;
  ctx.restore();

  // Landing flash
  if (jarFlashUntil[i] && Date.now() < jarFlashUntil[i]) {
    ctx.save();

    ctx.shadowColor = slotColors[i];
    ctx.shadowBlur = 28;

    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.strokeStyle = slotColors[i];
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.roundRect(
      left,
      jarTop + 10,
      jarWidth,
      jarBottom - jarTop - 10,
      8
    );
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

    // Update Balls
    for (let i = activeBalls.length - 1; i >= 0; i--) {
      let ball = activeBalls[i];
      ball.vy += currentDifficulty === 'hard' ? 0.65 : 0.55;
      ball.x += ball.vx;
      ball.y += ball.vy;

      if (ball.x - ballRadius < 0) {
        ball.x = ballRadius;
        ball.vx *= -0.6;
      } else if (ball.x + ballRadius > w) {
        ball.x = w - ballRadius;
        ball.vx *= -0.6;
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
            ball.vx = (ball.vx - 2 * dot * nx) * 0.45 + (Math.random() - 0.5) * 0.45;
            ball.vy = (ball.vy - 2 * dot * ny) * 0.6;
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
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#fff9e6';
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 2, ballRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#b38f00';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    requestAnimationFrame(updatePhysics);
  }

  requestAnimationFrame(updatePhysics);
});
