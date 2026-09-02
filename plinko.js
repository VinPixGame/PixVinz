document.addEventListener('DOMContentLoaded', () => {
  // Storage & Balance Setup
  const currentUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
  const username = currentUser.username || localStorage.getItem('vinpix_username') || 'default';
  const coinKey = `${username}_totalCoins`;

  let coinCount = parseFloat(localStorage.getItem(coinKey)) || 500;
  let currentBet = 10;

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

  // Bet Controls
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

  // Canvas Setup
  const canvas = document.getElementById('plinkoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const arena = document.getElementById('plinkoArena');

  function resizeCanvas() {
    if (arena) {
      canvas.width = arena.clientWidth;
      canvas.height = arena.clientHeight;
    }
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Plinko Board Layout Configuration
  const rows = 8;
  const pegRadius = 4;
  const ballRadius = 7;
  
  // Slot Multipliers at the bottom (Left to Right)
  const multipliers = [10, 5, 2, 0.5, 0.2, 0.5, 2, 5, 10];
  const slotColors = ['#ff0844', '#ff7300', '#ffd700', '#00f2fe', '#4facfe', '#00f2fe', '#ffd700', '#ff7300', '#ff0844'];

  let activeBalls = [];

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

      const startX = canvas.width / 2 + (Math.random() - 0.5) * 12;
      const startY = 15;

      activeBalls.push({
        x: startX,
        y: startY,
        vx: (Math.random() - 0.5) * 1.8,
        vy: 0,
        color: '#ff0844'
      });
    });
  }

  // Enhanced Web Audio API Sound Generator
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    return audioCtx;
  }

  function playSound(type) {
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
        // Crisp arcade peg bounce sound with varying pitch
        osc.type = 'sine';
        const randomPitch = 550 + Math.random() * 350;
        osc.frequency.setValueAtTime(randomPitch, now);
        osc.frequency.exponentialRampToValueAtTime(randomPitch * 0.5, now + 0.04);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'win') {
        // Triumphant multi-tone chime for slot landing
        osc.type = 'square';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.setValueAtTime(90, now + 0.08);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }
    } catch(e) {}
  }

  // Main Physics & Render Loop
  function updatePhysics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const startYGrid = 50;
    const rowHeight = (h - 130) / rows;
    const colSpacing = w / (rows + 3);

    // Draw Pegs (Nails)
    ctx.fillStyle = '#ffffff';
    for (let r = 0; r < rows; r++) {
      const pegsInRow = r + 3;
      const rowWidth = (pegsInRow - 1) * colSpacing;
      const startX = (w - rowWidth) / 2;
      const y = startYGrid + r * rowHeight;

      for (let c = 0; c < pegsInRow; c++) {
        const x = startX + c * colSpacing;
        ctx.beginPath();
        ctx.arc(x, y, pegRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

// Inside updatePhysics(), right after clearing the canvas and before drawing pegs, add:

    const w = canvas.width;
    const h = canvas.height;
    
    // --- Running Marquee Lights around the Boarder ---
    const lightSpacing = 16; // Distance between each light bulb
    const bulbRadius = 3;
    const time = Date.now() * 0.005; // Speed of the chase effect
    const offset = Math.floor(time) % 2; // Alternating state

    // Perimeter coordinates
    let lightIndex = 0;
    
    // Top Edge
    for (let x = 10; x < w - 10; x += lightSpacing) {
      drawMarqueeBulb(x, 8, lightIndex + offset);
      lightIndex++;
    }
    // Right Edge
    for (let y = 8; y < h - 8; y += lightSpacing) {
      drawMarqueeBulb(w - 8, y, lightIndex + offset);
      lightIndex++;
    }
    // Bottom Edge
    for (let x = w - 10; x > 10; x -= lightSpacing) {
      drawMarqueeBulb(x, h - 8, lightIndex + offset);
      lightIndex++;
    }
    // Left Edge
    for (let y = h - 8; y > 8; y -= lightSpacing) {
      drawMarqueeBulb(8, y, lightIndex + offset);
      lightIndex++;
    }
    
    // Draw Slots at Bottom
    const slotWidth = w / multipliers.length;
    const slotY = h - 45;
    for (let i = 0; i < multipliers.length; i++) {
      ctx.fillStyle = slotColors[i];
      ctx.fillRect(i * slotWidth + 2, slotY, slotWidth - 4, 38);
      ctx.fillStyle = '#0b091a';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${multipliers[i]}x`, i * slotWidth + slotWidth / 2, slotY + 24);
    }

    // Update & Render Balls
    for (let i = activeBalls.length - 1; i >= 0; i--) {
      let ball = activeBalls[i];
      ball.vy += 0.35; // Gravity
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall collisions
      if (ball.x - ballRadius < 0) {
        ball.x = ballRadius;
        ball.vx *= -0.6;
      } else if (ball.x + ballRadius > w) {
        ball.x = w - ballRadius;
        ball.vx *= -0.6;
      }

      // Peg collisions check
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
            playSound('peg'); // Trigger dynamic peg impact sound
            const overlap = (ballRadius + pegRadius) - dist;
            const nx = dx / dist;
            const ny = dy / dist;
            
            ball.x += nx * overlap;
            ball.y += ny * overlap;

            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx = (ball.vx - 2 * dot * nx) * 0.6 + (Math.random() - 0.5) * 1.5;
            ball.vy = (ball.vy - 2 * dot * ny) * 0.6;
          }
        }
      }

      // Check Slot Payout
      if (ball.y >= slotY) {
        const slotIndex = Math.floor(ball.x / slotWidth);
        const clampedIndex = Math.max(0, Math.min(multipliers.length - 1, slotIndex));
        const mult = multipliers[clampedIndex];

        const payout = currentBet * mult;
        coinCount += payout;
        updateDisplay();
        playSound('win');

        activeBalls.splice(i, 1);
        continue;
      }

 

      // Draw Glowing Gold Ball
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner highlight for a polished 3D metallic sphere look
      ctx.fillStyle = '#fff9e6';
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 2, ballRadius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#b38f00';
      ctx.lineWidth = 1;
      ctx.stroke();

    requestAnimationFrame(updatePhysics);
  }

  requestAnimationFrame(updatePhysics);
});


function drawMarqueeBulb(x, y, index) {
    // Alternate between rich amber gold and deep neon purple
    const isGold = index % 2 === 0;
    const bulbColor = isGold ? '#ffaa00' : '#b026ff';
    const glowColor = isGold ? '#ffd700' : '#da70d6';

    ctx.save();
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 6;
    ctx.fillStyle = bulbColor;
    ctx.beginPath();
    ctx.arc(x, y, bulbRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}


// Add difficulty management logic in plinko.js

let currentDifficulty = 'normal';

// Configuration based on difficulty (rows and multipliers)
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

// Hook up difficulty buttons event listeners
const diffBtns = document.querySelectorAll('.diff-btn');
diffBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    diffBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentDifficulty = btn.getAttribute('data-diff');
    playSound('click');
  });
});

// Inside your updatePhysics function, reference rows & multipliers dynamically:
function updatePhysics() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const config = difficultyConfigs[currentDifficulty];
  const rows = config.rows;
  const multipliers = config.multipliers;
  const slotColors = config.slotColors;

  const w = canvas.width;
  const h = canvas.height;
  const startYGrid = 30;
  const rowHeight = (h - 110) / rows;
  const colSpacing = w / (rows + 3.2);

  // Draw Glowing Pegs
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
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // Draw Slots at Bottom
  const slotWidth = w / multipliers.length;
  const slotY = h - 35;
  for (let i = 0; i < multipliers.length; i++) {
    ctx.fillStyle = slotColors[i];
    ctx.fillRect(i * slotWidth + 1, slotY, slotWidth - 2, 32);
    
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.strokeRect(i * slotWidth + 1, slotY, slotWidth - 2, 32);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(`${multipliers[i]}x`, i * slotWidth + slotWidth / 2, slotY + 20);
    ctx.shadowBlur = 0;
  }

