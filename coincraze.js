// coincraze.js - Core Game Logic

document.addEventListener('DOMContentLoaded', () => {
  // Balance management using localStorage (matching main app)
  let coinCount = parseFloat(localStorage.getItem('pixvinz_coins')) || 950.00;
  const coinCountEl = document.getElementById('coinCount');
  const playArea = document.getElementById('playArea');

  // Initialize display
  updateBalanceDisplay();

  function updateBalanceDisplay() {
    coinCountEl.textContent = coinCount.toFixed(2);
    localStorage.setItem('pixvinz_coins', coinCount);
  }

  // Handle dropping a coin on click/tap inside the play area
  playArea.addEventListener('click', (e) => {
    const dropCost = 5.00; // Cost to drop a coin

    if (coinCount < dropCost) {
      alert("Not enough coins! Win more or visit the shop.");
      return;
    }

    // Deduct cost and update UI
    coinCount -= dropCost;
    updateBalanceDisplay();

    // Get click position relative to the play area
    const rect = playArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Only allow drops in the upper portion of the play area
    if (y > rect.height * 0.4) return; 

    spawnCoin(x, y);
  });

  function spawnCoin(startX, startY) {
    const coin = document.createElement('div');
    coin.className = 'pusher-coin';
    coin.style.left = `${startX - 15}px`;
    coin.style.top = `${startY - 15}px`;
    
    playArea.appendChild(coin);

    // Simple physics / gravity animation down towards the tray
    let currentY = startY;
    let velocityY = 2;
    const targetY = playArea.clientHeight * 0.75; // Tray drop point

    function fall() {
      if (currentY < targetY) {
        velocityY += 0.6; // gravity acceleration
        currentY += velocityY;
        coin.style.top = `${currentY}px`;
        requestAnimationFrame(fall);
      } else {
        // Landed on the tray - simulate pushing forward or payout chance
        coin.style.top = `${targetY}px`;
        coin.classList.add('landed');
        
        // Example: simulate random win collection after resting on the pusher
        setTimeout(() => {
          if (Math.random() > 0.6) { // 40% chance to push over the edge
            triggerPayout(coin);
          }
        }, 1500);
      }
    }

    requestAnimationFrame(fall);
  }

  function triggerPayout(coinElem) {
    coinElem.classList.add('payout');
    
    // Animate toward bottom edge and add reward
    coinCount += 15.00; // Payout reward
    updateBalanceDisplay();

    setTimeout(() => {
      coinElem.remove();
    }, 600);
  }
});
