/* coincraze.js - Fast Coin-Pusher Physics, Edge Collisions, Domino Momentum */
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
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.03);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
      }

      else if (type === 'drop') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.07);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      }

      else if (type === 'win') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(659.25, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }

      else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.setValueAtTime(90, now + 0.06);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
      }
    } catch (e) {}
  };

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      playSound('click');
      window.location.href = 'index.html';
    });
  }

  function updateBalanceDisplay() {
    if (coinCountEl) {
      coinCountEl.textContent = coinCount.toFixed(2);
    }

    localStorage.setItem(coinKey, coinCount);
  }

  updateBalanceDisplay();

  const storageItemsKey = `coincraze_active_items_${coinKey}`;
  const savedItemsJson = localStorage.getItem(storageItemsKey);

  if (savedItemsJson) {
    try {
      const parsedItems = JSON.parse(savedItemsJson);

      parsedItems.forEach(itemData => {
        spawnItem(
          itemData.x,
          itemData.y,
          itemData.type,
          itemData.value,
          itemData.sizeClass,
          false,
          itemData.state || 'resting'
        );
      });
    } catch (e) {
      initPreloadedItems();
    }
  } else {
    initPreloadedItems();
  }

  function saveGameState() {
    const stateData = activeItems
      .filter(item => item.state !== 'payout')
      .map(item => ({
        x: item.x,
        y: item.y,
        type: item.type,
        value: item.value,
        sizeClass: item.sizeClass,
        state: item.state === 'falling' ? 'resting' : item.state
      }));

    localStorage.setItem(storageItemsKey, JSON.stringify(stateData));
  }

  function initPreloadedItems() {
    const playWidth = playArea.clientWidth;
    const playHeight = playArea.clientHeight;

    for (let i = 0; i < 24; i++) {
      const radius = 11;

      let x;
      let y;
      let valid = false;

      for (let attempt = 0; attempt < 50 && !valid; attempt++) {
        x = radius + Math.random() * Math.max(1, playWidth - radius * 2);
        y = playHeight * 0.28 + Math.random() * (playHeight * 0.50);

        valid = true;

        for (const other of activeItems) {
          const dx = x - other.x;
          const dy = y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 21) {
            valid = false;
            break;
          }
        }
      }

      spawnItem(
        x,
        y,
        'coin',
        5,
        'medium',
        false,
        'resting'
      );
    }

    saveGameState();
  }

  function addShakeEnergy(amount) {
    shakeEnergy = Math.min(100, shakeEnergy + amount);

    if (shakeBarFill) {
      shakeBarFill.style.width = `${shakeEnergy}%`;
    }

    if (shakeBtn) {
      shakeBtn.textContent = `⚡ SHAKE (${Math.floor(shakeEnergy)}%)`;

      if (shakeEnergy >= 100) {
        shakeBtn.removeAttribute('disabled');
        shakeBtn.classList.add('ready');
      }
    }
  }

  /* =========================================================
     FAST PUSHER
     ========================================================= */

  let pusherZ = 0;
  let pusherDirection = 1;

  const pusherSpeed = 3.8;
  const maxPushDistance = 26;

  let lastTime = performance.now();
  let saveTimer = 0;

  function updatePusher(now) {
    let dt = (now - lastTime) / 16.6667;
    lastTime = now;

    if (!isFinite(dt)) dt = 1;

    dt = Math.min(dt, 2);

    pusherZ += pusherSpeed * pusherDirection * dt;

    if (pusherZ >= maxPushDistance) {
      pusherZ = maxPushDistance;
      pusherDirection = -1;
    }

    if (pusherZ <= 0) {
      pusherZ = 0;
      pusherDirection = 1;
    }

    if (pusherPlate) {
      pusherPlate.style.transform =
        `translateX(-50%) translateY(${pusherZ}px)`;
    }

    const width = playArea.clientWidth;
    const height = playArea.clientHeight;

    updatePhysics(dt, width, height);

    saveTimer += dt;

    if (saveTimer > 30) {
      saveTimer = 0;
      saveGameState();
    }

    requestAnimationFrame(updatePusher);
  }

  requestAnimationFrame(updatePusher);

  /* =========================================================
     PHYSICS ENGINE
     ========================================================= */

  function updatePhysics(dt, width, height) {
    const coins = activeItems.filter(
      item => item.state === 'resting' || item.state === 'falling'
    );

    /*
      First update falling coins.
      Falling coins are deliberately FAST.
    */

    for (const item of coins) {
      if (item.state === 'falling') {
        item.vy += 1.25 * dt;

        if (item.vy > 24) {
          item.vy = 24;
        }

        item.x += item.vx * dt;
        item.y += item.vy * dt;

        if (item.x < item.radius) {
          item.x = item.radius;
          item.vx = Math.abs(item.vx) * 0.35;
        }

        if (item.x > width - item.radius) {
          item.x = width - item.radius;
          item.vx = -Math.abs(item.vx) * 0.35;
        }

        /*
          Once the coin reaches the main playfield,
          immediately convert it into a physical coin.
        */

        const landingY = height * 0.12;

        if (item.y >= landingY) {
          item.state = 'resting';

          /*
            Give the newly dropped coin forward momentum.
            This lets it enter the pile instead of simply stopping.
          */
          item.vy = 1.5;
        }

        renderItem(item);
      }
    }

    /*
      Pusher contact.
      The pusher transfers actual velocity into the coins.
    */

    const plateY = height * 0.14 + pusherZ + 18;

    if (pusherDirection > 0) {
      for (const item of coins) {
        if (item.state !== 'resting') continue;

        const verticalDistance =
          Math.abs((item.y + item.radius) - plateY);

        if (verticalDistance < 22) {
          const force =
            pusherSpeed * 0.85 * dt;

          item.vy += force;

          /*
            Tiny sideways variation prevents the pile
            from becoming perfectly artificial.
          */
          item.vx += (Math.random() - 0.5) * 0.025;
        }
      }
    }

    /*
      EDGE-TO-EDGE CIRCULAR COIN COLLISIONS.
      
      This is the important part.

      Each coin is treated as a real circle.
      When their edges touch/overlap, the collision normal
      transfers velocity from the moving coin into the next coin.
      
      This produces:
      
      coin A -> coin B -> coin C -> coin D
      
      instead of simply moving every coin independently.
    */

    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < coins.length; i++) {
        const a = coins[i];

        if (a.state !== 'resting') continue;

        for (let j = i + 1; j < coins.length; j++) {
          const b = coins[j];

          if (b.state !== 'resting') continue;

          let dx = b.x - a.x;
          let dy = b.y - a.y;

          let distanceSq = dx * dx + dy * dy;

          if (distanceSq === 0) {
            dx = 0.01;
            dy = 0;
            distanceSq = 0.0001;
          }

          const distance = Math.sqrt(distanceSq);
          const minDistance = a.radius + b.radius;

          /*
            Coins only interact when their circular edges
            touch or overlap.
          */

          if (distance < minDistance) {
            const nx = dx / distance;
            const ny = dy / distance;

            const overlap = minDistance - distance;

            /*
              Separate the coins first.
              This prevents them from visually merging.
            */

            const separation = overlap * 0.52;

            a.x -= nx * separation;
            a.y -= ny * separation;

            b.x += nx * separation;
            b.y += ny * separation;

            /*
              Relative velocity along collision normal.
            */

            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;

            const velocityAlongNormal =
              rvx * nx + rvy * ny;

            /*
              If they are already moving apart,
              don't apply another collision impulse.
            */

            if (velocityAlongNormal < 0) {
              const restitution = 0.18;

              const impulse =
                -(1 + restitution) *
                velocityAlongNormal /
                2;

              const impulseX = impulse * nx;
              const impulseY = impulse * ny;

              a.vx -= impulseX;
              a.vy -= impulseY;

              b.vx += impulseX;
              b.vy += impulseY;
            }

            /*
              Friction through the touching edges.
              This lets angled collisions transfer sideways
              movement naturally.
            */

            const tx = -ny;
            const ty = nx;

            const tangentVelocity =
              rvx * tx + rvy * ty;

            const friction =
              tangentVelocity * 0.035;

            a.vx += friction * tx;
            a.vy += friction * ty;

            b.vx -= friction * tx;
            b.vy -= friction * ty;
          }
        }
      }
    }

    /*
      Apply movement and friction.
    */

    for (const item of coins) {
      if (item.state !== 'resting') continue;

      /*
        Movement.
      */

      item.x += item.vx * dt;
      item.y += item.vy * dt;

      /*
        Ground friction.
        Kept LOW so coins continue pushing each other.
      */

      item.vx *= Math.pow(0.91, dt);
      item.vy *= Math.pow(0.94, dt);

      /*
        Maximum velocity.
        Prevents runaway physics while retaining
        the fast arcade feeling.
      */

      const maxVelocity = 18;

      item.vx = Math.max(
        -maxVelocity,
        Math.min(maxVelocity, item.vx)
      );

      item.vy = Math.max(
        -maxVelocity,
        Math.min(maxVelocity, item.vy)
      );

      /*
        Side walls.
      */

      if (item.x < item.radius) {
        item.x = item.radius;
        item.vx = Math.abs(item.vx) * 0.42;
      }

      if (item.x > width - item.radius) {
        item.x = width - item.radius;
        item.vx = -Math.abs(item.vx) * 0.42;
      }

      /*
        Back/top boundary.
      */

      if (item.y < item.radius) {
        item.y = item.radius;
        item.vy = Math.abs(item.vy) * 0.25;
      }

      /*
        Front payout edge.
      */

      if (item.y >= height - item.radius * 0.55) {
        triggerPayout(item);
        continue;
      }

      renderItem(item);
    }
  }

  function renderItem(item) {
    item.element.style.left = `${item.x}px`;
    item.element.style.top = `${item.y}px`;
  }

  /* =========================================================
     FAST DROP
     ========================================================= */

  if (dropCoinBtn) {
    dropCoinBtn.addEventListener('click', () => {
      if (coinCount < DROP_COST) {
        playSound('error');
        alert('Not enough coins! Check your balance.');
        return;
      }

      playSound('drop');

      coinCount -= DROP_COST;
      updateBalanceDisplay();

      addShakeEnergy(6);

      const playWidth = playArea.clientWidth;

      const randomX =
        14 + Math.random() *
        Math.max(1, playWidth - 28);

      /*
        Very fast initial velocity.
        The coin immediately becomes part of the
        physics simulation.
      */

      spawnItem(
        randomX,
        2,
        'coin',
        5,
        'medium',
        true,
        'falling'
      );
    });
  }

  /* =========================================================
     BONUS DIAMOND
     ========================================================= */

  const DIAMOND_TIMER_KEY =
    `coincraze_last_diamond_${coinKey}`;

  setInterval(() => {
    const now = Date.now();

    const lastDiamondTime =
      parseInt(
        localStorage.getItem(DIAMOND_TIMER_KEY)
      ) || 0;

    if (now - lastDiamondTime >= 180000) {
      localStorage.setItem(
        DIAMOND_TIMER_KEY,
        now.toString()
      );

      spawnBonusDiamond();
    }
  }, 10000);

  function spawnBonusDiamond() {
    const playWidth = playArea.clientWidth;

    const randomX =
      14 + Math.random() *
      Math.max(1, playWidth - 28);

    spawnItem(
      randomX,
      2,
      'diamond',
      100,
      'large',
      true,
      'falling'
    );

    playSound('win');
  }

  /* =========================================================
     SHAKE
     ========================================================= */

  if (shakeBtn) {
    shakeBtn.addEventListener('click', () => {
      if (shakeEnergy < 100) return;

      playSound('win');

      if (pusherContainer) {
        pusherContainer.classList.add('shake-anim');

        setTimeout(() => {
          pusherContainer.classList.remove('shake-anim');
        }, 300);
      }

      /*
        Real shake impulse instead of simply moving
        every coin downward.
      */

      activeItems.forEach(item => {
        if (item.state === 'resting') {
          item.vx += (Math.random() - 0.5) * 5;
          item.vy += Math.random() * 5 + 2;
        }
      });

      saveGameState();

      shakeEnergy = 0;

      if (shakeBarFill) {
        shakeBarFill.style.width = '0%';
      }

      shakeBtn.textContent = '⚡ SHAKE (0%)';
      shakeBtn.setAttribute('disabled', 'true');
      shakeBtn.classList.remove('ready');
    });
  }

  /* =========================================================
     SPAWN ITEM
     ========================================================= */

  function spawnItem(
    startX,
    startY,
    type,
    value,
    sizeClass,
    isFalling,
    initialState
  ) {
    const itemEl = document.createElement('div');

    if (type === 'diamond') {
      itemEl.className =
        `pusher-item diamond ${sizeClass}`;

      itemEl.textContent = '💎';
    } else {
      itemEl.className =
        `pusher-item coin ${sizeClass}`;

      itemEl.style.backgroundImage =
        "url('image/coin.png')";
    }

    playArea.appendChild(itemEl);

    /*
      Coin radius is based on the physical coin size.
      Medium coins = 11px radius.
    */

    let radius = 11;

    if (sizeClass === 'small') {
      radius = 8;
    }

    else if (sizeClass === 'large') {
      radius = 14;
    }

    const itemData = {
      element: itemEl,

      x: startX,
      y: startY,

      vx: 0,
      vy: 0,

      radius: radius,

      type: type,
      value: value,
      sizeClass: sizeClass,

      state:
        initialState ||
        (isFalling ? 'falling' : 'resting')
    };

    /*
      Fast falling velocity.
    */

    if (isFalling) {
      itemData.vy = 10;
      itemData.vx =
        (Math.random() - 0.5) * 0.8;
    }

    activeItems.push(itemData);

    renderItem(itemData);
  }

  /* =========================================================
     PAYOUT
     ========================================================= */

  function triggerPayout(itemData) {
    if (itemData.state === 'payout') return;

    itemData.state = 'payout';

    itemData.element.classList.add('payout');

    coinCount += itemData.value;

    updateBalanceDisplay();

    playSound('win');

    showFloatingScore(
      itemData.x,
      playArea.clientHeight - 18,
      itemData.value
    );

    setTimeout(() => {
      itemData.element.remove();

      activeItems =
        activeItems.filter(
          item => item !== itemData
        );

      saveGameState();
    }, 180);
  }

  /* =========================================================
     FLOATING SCORE
     ========================================================= */

  function showFloatingScore(x, y, value) {
    const floatText =
      document.createElement('div');

    floatText.className =
      'floating-score';

    floatText.textContent =
      `+${value}`;

    floatText.style.left =
      `${x}px`;

    floatText.style.top =
      `${y}px`;

    playArea.appendChild(floatText);

    setTimeout(() => {
      floatText.remove();
    }, 400);
  }
});
