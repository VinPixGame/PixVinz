/* coincraze.js - Behind-Pusher Drop, Omnidirectional Domino Physics, 3D Playfield */
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
    
    for (let i = 0; i < 20; i++) {
      const rx = Math.random() * (playWidth - 28) + 4;
      const ry = playHeight * 0.35 + Math.random() * (playHeight * 0.50);
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
  const pusherSpeed = 1.1;
  const maxPushDistance = 30;

  function updatePusher() {
    pusherZ += pusherSpeed * pusherDirection;
    if (pusherZ > maxPushDistance || pusherZ < 0) {
      pusherDirection *= -1;
    }
    pusherPlate.style.transform = `translateX(-50%) translateY(${pusherZ}px)`;

    const playAreaHeight = playArea.clientHeight;
    let stateChanged = false;

    // Omnidirectional Domino Physics loop across all edges
    activeItems.forEach(item => {
      if (item.state === 'resting') {
        let pushForceX = 0;
        let pushForceY = 0;

        // 1. Pusher plate collision
        if (pusherDirection > 0) {
          const itemRadius = 12;
          const plateCenterY = (playAreaHeight * 0.22) + pusherZ + 21;
          const plateTopY = plateCenterY - 21;
          const plateBottomY = plateCenterY + 21;
          
          if (item.y + itemRadius >= plateTopY && item.y - itemRadius <= plateBottomY) {
            pushForceY += pusherSpeed * 1.05;
          }
        }

        // 2. Neighboring coin domino chain collision (from all directions/edges)
        activeItems.forEach(other => {
          if (other !== item && other.state === 'resting') {
            const dx = item.x - other.x;
            const dy = item.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = 22; // collision radius threshold

            if (dist < minDist && dist > 0) {
              const overlap = minDist - dist;
              const angle = Math.atan2(dy, dx);
              pushForceX += Math.cos(angle) * overlap * 0.45;
              pushForceY += Math.sin(angle) * overlap * 0.45;
            }
          }
        });

        if (Math.abs(pushForceX) > 0.04 || Math.abs(pushForceY) > 0.04) {
          item.x += pushForceX;
          item.y += pushForceY;
          
          const playWidth = playArea.clientWidth;
          item.x = Math.max(2, Math.min(playWidth - 26, item.x));

          item.element.style.left = `${item.x}px`;
          item.element.style.top = `${item.y}px`;
          stateChanged = true;
        }

        // Payout edge trigger at the bottom tray
        if (item.y >= playAreaHeight - 24) {
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

  // Manual Coin Drop: Spawns behind the pusher plate at the top back slot
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
    const randomX = Math.random() * (playWidth - 28) + 4;
    
    // Drop target Y is safely behind the pusher plate (top back slot)
    spawnItem(randomX, 4, 'coin', 5, 'medium', true, 'falling');
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
    const randomX = Math.random() * (playWidth - 28) + 4;
    spawnItem(randomX, 4, 'diamond', 100, 'large', true, 'falling');
    playSound('win');
  }

  shakeBtn.addEventListener('click', () => {
    if (shakeEnergy < 100) return;

    playSound('win');
    pusherContainer.classList.add('shake-anim');
    setTimeout(() => pusherContainer.classList.remove('shake-anim'), 400);

    activeItems.forEach(item => {
      if (item.state === 'resting') {
        item.y += Math.random() * 14 + 4;
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
    
    if (type === 'diamond') {
      itemEl.className = `pusher-item diamond ${sizeClass}`;
      itemEl.textContent = '💎';
    } else {
      itemEl.className = `pusher-item coin ${sizeClass}`;
      itemEl.style.backgroundImage = "url('image/coin.png')";
    }

    itemEl.style.left = `${startX}px`;
    itemEl.style.top = `${startY}px`;
    playArea.appendChild(itemEl);

    const itemData = {
      element: itemEl,
      x: startX,
      y: startY,
      type: type,
      value: value,
      sizeClass: sizeClass,
      state: initialState || (isFalling ? 'falling' : 'resting')
    };

    activeItems.push(itemData);

    if (isFalling) {
      let velocityY = 1.5;
      const targetY = playArea.clientHeight * 0.28; // Lands right behind the pusher plate

      function fall() {
        if (itemData.state === 'falling') {
          if (itemData.y < targetY) {
            velocityY += 0.9;
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
    showFloatingScore(itemData.x, playArea.clientHeight - 22, itemData.value);

    setTimeout(() => {
      itemData.element.remove();
      activeItems = activeItems.filter(i => i !== itemData);
      saveGameState();
    }, 350);
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
    }, 500);
  }
});
