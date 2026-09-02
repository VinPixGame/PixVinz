document.addEventListener('DOMContentLoaded', () => {
  let coinCount = parseFloat(localStorage.getItem('pixvinz_coins')) || 0;
  const coinCountEl = document.getElementById('coinCount');
  const playArea = document.getElementById('playArea');
  const pusherPlate = document.getElementById('pusherPlate');
  const dropCoinBtn = document.getElementById('dropCoinBtn');
  const shakeBtn = document.getElementById('shakeBtn');
  const shakeBarFill = document.getElementById('shakeBarFill');
  const pusherContainer = document.getElementById('pusherContainer');

  const DROP_COST = 5.00;
  let shakeEnergy = 0; // 0 to 100

  let activeCoins = [];

  updateBalanceDisplay();

  // 1. PRE-LOAD COINS & DIAMONDS ON THE PUSHER PLATE
  function initPreloadedItems() {
    const playWidth = playArea.clientWidth;
    // Spawn a mix of pre-existing standard coins, big coins, and diamonds on the plate
    for (let i = 0; i < 22; i++) {
      const rx = Math.random() * (playWidth - 60) + 30;
      const ry = Math.random() * 80 + 40; // sits on the pusher plate zone
      
      let type = 'coin-standard';
      let value = 15;
      let sizeClass = 'medium';

      const rand = Math.random();
      if (rand > 0.85) {
        type = 'diamond';
        value = 50;
        sizeClass = Math.random() > 0.5 ? 'large' : 'medium';
      } else if (rand > 0.6) {
        sizeClass = 'large';
        value = 25;
      } else if (rand < 0.2) {
        sizeClass = 'small';
        value = 10;
      }

      spawnItem(rx, ry, type, value, sizeClass, false);
    }
  }

  function updateBalanceDisplay() {
    coinCountEl.textContent = coinCount.toFixed(2);
    localStorage.setItem('pixvinz_coins', coinCount);
  }

  function addShakeEnergy(amount) {
    shakeEnergy = Math.min(100, shakeEnergy + amount);
    shakeBarFill.style.width = `${shakeEnergy}%`;
    shakeBtn.textContent = `⚡ SHAKE (${Math.floor(shakeEnergy)}%)`;

    if (shakeEnergy >= 100) {
      shakeBtn.removeAttribute('disabled');
      shakeBtn.classList.add('ready');
    }
  }

  // 2. MECHANICAL PUSHER ANIMATION LOOP
  let pusherZ = 0;
  let pusherDirection = 1;
  const pusherSpeed = 0.8;
  const maxPushDistance = 85;

  function updatePusher() {
    pusherZ += pusherSpeed * pusherDirection;
    if (pusherZ > maxPushDistance || pusherZ < 0) {
      pusherDirection *= -1;
    }
    pusherPlate.style.transform = `translate(-50%, ${pusherZ}px)`;

    const pusherRect = pusherPlate.getBoundingClientRect();
    const playAreaHeight = playArea.clientHeight;

    activeCoins.forEach(item => {
      if (item.state === 'resting') {
        const itemRect = item.element.getBoundingClientRect();
        
        // Push items forward when the plate moves forward
        if (pusherDirection > 0 && itemRect.bottom >= pusherRect.top && itemRect.top <= pusherRect.bottom) {
          item.y += pusherSpeed * 0.75;
          item.element.style.top = `${item.y}px`;
        }

        // Check if item crossed the front winning edge
        if (item.y >= playAreaHeight - 45) {
          triggerPayout(item);
        }
      }
    });

    requestAnimationFrame(updatePusher);
  }

  requestAnimationFrame(updatePusher);

  // 3. DROP COIN ACTION
  dropCoinBtn.addEventListener('click', () => {
    if (coinCount < DROP_COST) {
      if (typeof playSound === 'function') playSound('error');
      alert("Not enough coins! Check your balance.");
      return;
    }

    if (typeof playSound === 'function') playSound('drop');
    coinCount -= DROP_COST;
    updateBalanceDisplay();
    addShakeEnergy(8); // Building shake power with each drop

    const playWidth = playArea.clientWidth;
    const randomX = Math.random() * (playWidth - 60) + 30;
    
    // Chance to drop a diamond or standard coin
    let type = 'coin-standard';
    let value = 15;
    let sizeClass = 'medium';
    const rand = Math.random();
    if (rand > 0.9) {
      type = 'diamond';
      value = 50;
      sizeClass = 'large';
    } else if (rand > 0.7) {
      value = 25;
      sizeClass = 'large';
    } else if (rand < 0.25) {
      value = 10;
      sizeClass = 'small';
    }

    spawnItem(randomX, 10, type, value, sizeClass, true);
  });

  // 4. SHAKE MACHINE ACTION
  shakeBtn.addEventListener('click', () => {
    if (shakeEnergy < 100) return;

    if (typeof playSound === 'function') playSound('win');
    pusherContainer.classList.add('shake-anim');
    setTimeout(() => pusherContainer.classList.remove('shake-anim'), 500);

    // Jolt all resting items forward randomly to create winning cascades
    activeCoins.forEach(item => {
      if (item.state === 'resting') {
        item.y += Math.random() * 35 + 15;
        item.element.style.top = `${item.y}px`;
      }
    });

    shakeEnergy = 0;
    shakeBarFill.style.width = '0%';
    shakeBtn.textContent = `⚡ SHAKE (0%)`;
    shakeBtn.setAttribute('disabled', 'true');
    shakeBtn.classList.remove('ready');
  });

  function spawnItem(startX, startY, type, value, sizeClass, isFalling) {
    const itemEl = document.createElement('div');
    itemEl.className = `pusher-item ${type} ${sizeClass}`;
    itemEl.style.left = `${startX - 15}px`;
    itemEl.style.top = `${startY}px`;
    playArea.appendChild(itemEl);

    const itemData = {
      element: itemEl,
      x: startX - 15,
      y: startY,
      value: value,
      state: isFalling ? 'falling' : 'resting'
    };

    if (!isFalling) {
      itemEl.classList.add('landed');
    }

    activeCoins.push(itemData);

    if (isFalling) {
      let velocityY = 2;
      const targetY = playArea.clientHeight * 0.22; // Lands on pusher plate

      function fall() {
        if (itemData.state === 'falling') {
          if (itemData.y < targetY) {
            velocityY += 0.7;
            itemData.y += velocityY;
            itemData.element.style.top = `${itemData.y}px`;
            requestAnimationFrame(fall);
          } else {
            itemData.y = targetY;
            itemData.element.style.top = `${targetY}px`;
            itemData.element.classList.add('landed');
            itemData.state = 'resting';
          }
        }
      }
      requestAnimationFrame(fall);
    }
  }

  function triggerPayout(itemData) {
    if (itemData.state === 'payout') return;
    itemData.state = 'payout';

    itemData.element.classList.add('payout');
    coinCount += itemData.value;
    updateBalanceDisplay();

    if (typeof playSound === 'function') playSound('win');

    // Show floating green point indicator like a real arcade game
    showFloatingScore(itemData.x, playArea.clientHeight - 50, itemData.value);

    setTimeout(() => {
      itemData.element.remove();
      activeCoins = activeCoins.filter(c => c !== itemData);
    }, 600);
  }

  function showFloatingScore(x, y, value) {
    const floatText = document.createElement('div');
    floatText.className = 'floating-score';
    floatText.textContent = `+${value}`;
    floatText.style.left = `${x}px`;
    floatText.style.top = `${y}px`;
    playArea.appendChild(floatText);

    setTimeout(() => {
      floatText.remove();
    }, 800);
  }

  // Initialize preloaded items on load
  initPreloadedItems();
});
