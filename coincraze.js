/* coincraze.js - Strictly Frozen Static Physics */
document.addEventListener('DOMContentLoaded', () => {
  let coinKey = 'totalCoins';
  if (typeof getUserKey === 'function') {
    coinKey = getUserKey('totalCoins');
  } else {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
    const username = currentUser.username || localStorage.getItem('vinpix_username') || 'default';
    coinKey = `${username}_totalCoins`;
  }

  let coinCount = parseFloat(localStorage.getItem(coinKey)) || 0;
  
  const coinCountEl = document.getElementById('coinCount');
  const playArea = document.getElementById('playArea');
  const pusherPlate = document.getElementById('pusherPlate');
  const dropCoinBtn = document.getElementById('dropCoinBtn');
  const shakeBtn = document.getElementById('shakeBtn');
  const shakeBarFill = document.getElementById('shakeBarFill');
  const pusherContainer = document.getElementById('pusherContainer');
  const backBtn = document.getElementById('backBtn');

  const DROP_COST = 5.00;
  let shakeEnergy = 0;
  let activeItems = [];

  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    return audioCtx;
  }

  window.playSound = function(type) {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.04);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'drop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(659.25, now + 0.06);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(90, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {}
  };

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      playSound('click');
      window.location.href = 'index.html';
    });
  }

  updateBalanceDisplay();

  const storageItemsKey = `coincraze_active_items_${coinKey}`;
  const savedItemsJson = localStorage.getItem(storageItemsKey);

  if (savedItemsJson) {
    try {
      const parsedItems = JSON.parse(savedItemsJson);
      parsedItems.forEach(itemData => {
        spawnItem(itemData.x, itemData.y, itemData.type, itemData.value, itemData.sizeClass, false, itemData.state);
      });
    } catch (e) {
      initPreloadedItems();
    }
  } else {
    initPreloadedItems();
  }

  function saveGameState() {
    const stateData = activeItems.map(item => ({
      x: item.x,
      y: item.y,
      type: item.type,
      value: item.value,
      sizeClass: item.sizeClass,
      state: item.state === 'payout' ? 'resting' : item.state
    }));
    localStorage.setItem(storageItemsKey, JSON.stringify(stateData));
  }

  function initPreloadedItems() {
    const playWidth = playArea.clientWidth;
    const playHeight = playArea.clientHeight;
    
    for (let i = 0; i < 35; i++) {
      const rx = Math.random() * (playWidth - 35) + 15;
      const ry = playHeight * 0.50 + Math.random() * (playHeight * 0.38);
      spawnItem(rx, ry, 'coin', 5, 'medium', false, 'resting');
    }
    saveGameState();
  }

  function updateBalanceDisplay() {
    if (coinCountEl) coinCountEl.textContent = coinCount.toFixed(2);
    localStorage.setItem(coinKey, coinCount);
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

  let pusherZ = 0;
  let pusherDirection = 1;
  const pusherSpeed = 1.4;
  const maxPushDistance = 45;

  function updatePusher() {
    pusherZ += pusherSpeed * pusherDirection;
    if (pusherZ > maxPushDistance || pusherZ < 0) {
      pusherDirection *= -1;
    }
    pusherPlate.style.transform = `translateX(-50%) translateY(${pusherZ}px)`;

    const playAreaHeight = playArea.clientHeight;
    const pusherFrontEdgeY = (playAreaHeight * 0.32) + pusherZ + 55;
    let stateChanged = false;

    activeItems.forEach(item => {
      if (item.state === 'resting') {
        let moved = false;

        // STRICT PHYSICS: Coins are 100% frozen unless the pusher plate is moving forward AND physically hits the coin from behind.
        if (pusherDirection > 0 && item.y >= pusherFrontEdgeY - 6 && item.y <= pusherFrontEdgeY + 4) {
          item.y += pusherSpeed;
          moved = true;
        }

        if (moved) {
          item.element.style.top = `${item.y}px`;
          stateChanged = true;
        }

        // Payout edge check
        if (item.y >= playAreaHeight - 35) {
          triggerPayout(item);
          stateChanged = true;
        }
      }
    });

    if (stateChanged) {
      saveGameState();
    }

    requestAnimationFrame(updatePusher);
  }

  requestAnimationFrame(updatePusher);

  dropCoinBtn.addEventListener('click', () => {
    if (coinCount < DROP_COST) {
      playSound('error');
      alert("Not enough coins! Check your balance.");
      return;
    }

    playSound('drop');
    coinCount -= DROP_COST;
    updateBalanceDisplay();
    addShakeEnergy(6);

    const playWidth = playArea.clientWidth;
    const randomX = Math.random() * (playWidth - 35) + 15;
    
    // Exactly ONE size, value = 5 coins
    spawnItem(randomX, 10, 'coin', 5, 'medium', true, 'falling');
  });

  const DIAMOND_TIMER_KEY = `coincraze_last_diamond_${coinKey}`;
  setInterval(() => {
    const now = Date.now();
    const lastDiamondTime = parseInt(localStorage.getItem(DIAMOND_TIMER_KEY)) || 0;
    if (now - lastDiamondTime >= 180000) {
      localStorage.setItem(DIAMOND_TIMER_KEY, now.toString());
      spawnBonusDiamond();
    }
  }, 10000);

  function spawnBonusDiamond() {
    const playWidth = playArea.clientWidth;
    const randomX = Math.random() * (playWidth - 35) + 15;
    spawnItem(randomX, 10, 'diamond', 100, 'large', true, 'falling');
    playSound('win');
  }

  shakeBtn.addEventListener('click', () => {
    if (shakeEnergy < 100) return;

    playSound('win');
    pusherContainer.classList.add('shake-anim');
    setTimeout(() => pusherContainer.classList.remove('shake-anim'), 400);

    activeItems.forEach(item => {
      if (item.state === 'resting') {
        item.y += Math.random() * 18 + 6;
        item.element.style.top = `${item.y}px`;
      }
    });

    saveGameState();

    shakeEnergy = 0;
    shakeBarFill.style.width = '0%';
    shakeBtn.textContent = `⚡ SHAKE (0%)`;
    shakeBtn.setAttribute('disabled', 'true');
    shakeBtn.classList.remove('ready');
  });

  function spawnItem(startX, startY, type, value, sizeClass, isFalling, initialState) {
    const itemEl = document.createElement('div');
    itemEl.className = `pusher-item ${sizeClass}`;
    itemEl.textContent = type === 'diamond' ? '💎' : '🪙';
    itemEl.style.left = `${startX - 14}px`;
    itemEl.style.top = `${startY}px`;
    playArea.appendChild(itemEl);

    const itemData = {
      element: itemEl,
      x: startX - 14,
      y: startY,
      type: type,
      value: value,
      sizeClass: sizeClass,
      state: initialState || (isFalling ? 'falling' : 'resting')
    };

    activeItems.push(itemData);

    if (isFalling) {
      let velocityY = 2;
      const targetY = playArea.clientHeight * 0.46;

      function fall() {
        if (itemData.state === 'falling') {
          if (itemData.y < targetY) {
            velocityY += 1.2;
            itemData.y += velocityY;
            itemData.element.style.top = `${itemData.y}px`;
            requestAnimationFrame(fall);
          } else {
            itemData.y = targetY;
            itemData.element.style.top = `${targetY}px`;
            itemData.state = 'resting';
            saveGameState();
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

    playSound('win');
    showFloatingScore(itemData.x, playArea.clientHeight - 30, itemData.value);

    setTimeout(() => {
      itemData.element.remove();
      activeItems = activeItems.filter(i => i !== itemData);
      saveGameState();
    }, 400);
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
    }, 600);
  }
});
