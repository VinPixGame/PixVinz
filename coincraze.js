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

  // Web Audio Synthesizer
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
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'drop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(160, now + 0.12);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(659.25, now + 0.06);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(90, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
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
    
    // Preload pile of standard coins below the pusher plate
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * (playWidth - 40) + 20;
      const ry = playHeight * 0.52 + Math.random() * (playHeight * 0.38);
      
      let sizeClass = 'medium';
      let value = 15;
      const rand = Math.random();
      if (rand > 0.7) { sizeClass = 'large'; value = 25; }
      else if (rand < 0.3) { sizeClass = 'small'; value = 10; }

      spawnItem(rx, ry, 'coin', value, sizeClass, false, 'resting');
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

  // Fast Pusher Mechanism with Real Physics Collision
  let pusherZ = 0;
  let pusherDirection = 1;
  const pusherSpeed = 1.6; // Much faster speed
  const maxPushDistance = 50;

  function updatePusher() {
    pusherZ += pusherSpeed * pusherDirection;
    if (pusherZ > maxPushDistance || pusherZ < 0) {
      pusherDirection *= -1;
    }
    pusherPlate.style.transform = `translateX(-50%) translateY(${pusherZ}px)`;

    const playAreaHeight = playArea.clientHeight;
    const pusherEdgeY = (playAreaHeight * 0.34) + pusherZ + 60; // Front edge of moving pusher plate
    let stateChanged = false;

    activeItems.forEach(item => {
      if (item.state === 'resting') {
        // Real physics: Coins below/touching the pusher plate only move when struck by the moving pusher
        if (pusherDirection > 0 && item.y <= pusherEdgeY + 8 && item.y >= pusherEdgeY - 14) {
          item.y += pusherSpeed * 1.2;
          item.element.style.top = `${item.y}px`;
          stateChanged = true;
        }

        // Check chain collisions with neighboring items
        activeItems.forEach(other => {
          if (other !== item && other.state === 'resting') {
            const dx = item.x - other.x;
            const dy = item.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 28 && other.y > item.y) {
              // Push forward slightly if pressed by another coin
              item.y += 0.15;
              item.element.style.top = `${item.y}px`;
              stateChanged = true;
            }
          }
        });

        // Payout line trigger
        if (item.y >= playAreaHeight - 40) {
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

  // Manual Coin Drop: COINS ONLY (No Diamonds)
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
    const randomX = Math.random() * (playWidth - 40) + 20;
    
    let sizeClass = 'medium';
    let value = 15;
    const rand = Math.random();
    if (rand > 0.75) { sizeClass = 'large'; value = 25; }
    else if (rand < 0.3) { sizeClass = 'small'; value = 10; }

    spawnItem(randomX, 10, 'coin', value, sizeClass, true, 'falling');
  });

  // 3-Minute Automated Rare Diamond Bonus Drop Timer
  const DIAMOND_TIMER_KEY = `coincraze_last_diamond_${coinKey}`;
  setInterval(() => {
    const now = Date.now();
    const lastDiamondTime = parseInt(localStorage.getItem(DIAMOND_TIMER_KEY)) || 0;
    // 3 minutes = 180,000 ms
    if (now - lastDiamondTime >= 180000) {
      localStorage.setItem(DIAMOND_TIMER_KEY, now.toString());
      spawnBonusDiamond();
    }
  }, 10000);

  function spawnBonusDiamond() {
    const playWidth = playArea.clientWidth;
    const randomX = Math.random() * (playWidth - 40) + 20;
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
        item.y += Math.random() * 22 + 8;
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
    itemEl.style.left = `${startX - 15}px`;
    itemEl.style.top = `${startY}px`;
    playArea.appendChild(itemEl);

    const itemData = {
      element: itemEl,
      x: startX - 15,
      y: startY,
      type: type,
      value: value,
      sizeClass: sizeClass,
      state: initialState || (isFalling ? 'falling' : 'resting')
    };

    activeItems.push(itemData);

    if (isFalling) {
      let velocityY = 2;
      const targetY = playArea.clientHeight * 0.48; // Fast drop landing safely behind pile

      function fall() {
        if (itemData.state === 'falling') {
          if (itemData.y < targetY) {
            velocityY += 1.2; // Snappy fast drop speed
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
    showFloatingScore(itemData.x, playArea.clientHeight - 35, itemData.value);

    setTimeout(() => {
      itemData.element.remove();
      activeItems = activeItems.filter(i => i !== itemData);
      saveGameState();
    }, 500);
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
    }, 700);
  }
});
