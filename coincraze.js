/* coincraze.js - FAST PHYSICS, BIG COINS, XP BONUS, NO LAG */
document.addEventListener('DOMContentLoaded', () => {
  let coinKey = 'totalCoins';

  if (typeof getUserKey === 'function') {
    coinKey = getUserKey('totalCoins');
  } else {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
    const username =
      currentUser.username ||
      localStorage.getItem('vinpix_username') ||
      'default';

    coinKey = `${username}_totalCoins`;
  }

  let coinCount = parseFloat(localStorage.getItem(coinKey)) || 0;

  let xpKey = 'totalXP';

  if (typeof getUserKey === 'function') {
    xpKey = getUserKey('totalXP');
  } else {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
    const username =
      currentUser.username ||
      localStorage.getItem('vinpix_username') ||
      'default';

    xpKey = `${username}_totalXP`;
  }

  let xpCount = parseFloat(localStorage.getItem(xpKey)) || 0;

  const coinCountEl = document.getElementById('coinCount');
  const playArea = document.getElementById('playArea');
  const pusherPlate = document.getElementById('pusherPlate');
  const dropCoinBtn = document.getElementById('dropCoinBtn');
  const shakeBtn = document.getElementById('shakeBtn');
  const shakeBarFill = document.getElementById('shakeBarFill');
  const pusherContainer = document.getElementById('pusherContainer');
  const backBtn = document.getElementById('backBtn');

  if (!playArea) return;

  const DROP_COST = 5;
  const NORMAL_COIN_SIZE = 40;
  const XP_SIZE = 58;
  const NORMAL_COIN_RADIUS = NORMAL_COIN_SIZE * 0.46;
  const XP_RADIUS = XP_SIZE * 0.44;
  const XP_REWARD = 200;

  let shakeEnergy = 0;
  let activeItems = [];

  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }

    return audioCtx;
  }

  window.playSound = function(type) {
    try {
      const ctx = getAudioContext();

      if (!ctx) return;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

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
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);
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

  function updateXP() {
    localStorage.setItem(xpKey, xpCount);
  }

  updateBalanceDisplay();
  updateXP();

  const storageItemsKey =
    `coincraze_active_items_${coinKey}`;

  const spendingKey =
    `coincraze_spending_${coinKey}`;

  let spendingProgress =
    parseFloat(localStorage.getItem(spendingKey)) || 0;

  /* =========================================================
     SAVE / LOAD
     ========================================================= */

  function saveGameState() {
    const stateData = activeItems
      .filter(item => item.state !== 'payout')
      .map(item => ({
        x: item.x,
        y: item.y,
        vx: 0,
        vy: 0,
        type: item.type,
        value: item.value,
        sizeClass: item.sizeClass,
        state: 'resting'
      }));

    try {
      localStorage.setItem(
        storageItemsKey,
        JSON.stringify(stateData)
      );
    } catch (e) {}
  }

  const savedItemsJson =
    localStorage.getItem(storageItemsKey);

  if (savedItemsJson) {
    try {
      const parsedItems =
        JSON.parse(savedItemsJson);

      if (Array.isArray(parsedItems) &&
          parsedItems.length > 0) {

        parsedItems.forEach(itemData => {
          spawnItem(
            Number(itemData.x) || 20,
            Number(itemData.y) || 20,
            itemData.type || 'coin',
            Number(itemData.value) || 5,
            itemData.sizeClass || 'medium',
            false,
            'resting'
          );
        });
      } else {
        initPreloadedItems();
      }
    } catch (e) {
      initPreloadedItems();
    }
  } else {
    initPreloadedItems();
  }

  function initPreloadedItems() {
    const width = playArea.clientWidth;
    const height = playArea.clientHeight;

    const radius = NORMAL_COIN_RADIUS;

    /*
      Start the existing pile in the lower section.
      Coins are placed without overlapping.
    */

    for (let i = 0; i < 24; i++) {
      let x = radius;
      let y = height * 0.48;
      let valid = false;

      for (let attempt = 0; attempt < 80; attempt++) {
        x =
          radius +
          Math.random() *
          Math.max(1, width - radius * 2);

        y =
          height * 0.58 +
          Math.random() *
          (height * 0.22);

        valid = true;

        for (const other of activeItems) {
          const dx = x - other.x;
          const dy = y - other.y;
          const d =
            Math.sqrt(dx * dx + dy * dy);

          if (d < radius + other.radius + 1) {
            valid = false;
            break;
          }
        }

        if (valid) break;
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

  /* =========================================================
     SHAKE ENERGY
     ========================================================= */

  function addShakeEnergy(amount) {
    shakeEnergy =
      Math.min(100, shakeEnergy + amount);

    if (shakeBarFill) {
      shakeBarFill.style.width =
        `${shakeEnergy}%`;
    }

    if (shakeBtn) {
      shakeBtn.textContent =
        `⚡ SHAKE (${Math.floor(shakeEnergy)}%)`;

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

  const PUSHER_SPEED = 4.8;
  const MAX_PUSH_DISTANCE = 30;

  let lastTime = performance.now();
  let saveClock = 0;

  function updatePusher(now) {
    let dt =
      (now - lastTime) / 16.6666667;

    lastTime = now;

    if (!isFinite(dt)) {
      dt = 1;
    }

    dt = Math.min(dt, 1.5);

    pusherZ +=
      PUSHER_SPEED *
      pusherDirection *
      dt;

    if (pusherZ >= MAX_PUSH_DISTANCE) {
      pusherZ = MAX_PUSH_DISTANCE;
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

    /*
      Use small physics steps.
      This prevents fast coins from tunneling
      through each other.
    */

    const subSteps = 2;
    const stepDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      updatePhysics(
        stepDt,
        playArea.clientWidth,
        playArea.clientHeight
      );
    }

    saveClock += dt;

    /*
      NEVER save every frame.
      Saving localStorage continuously causes
      unnecessary mobile lag.
    */

    if (saveClock >= 90) {
      saveClock = 0;
      saveGameState();
    }

    requestAnimationFrame(updatePusher);
  }

  requestAnimationFrame(updatePusher);

  /* =========================================================
     PHYSICS
     ========================================================= */

  function updatePhysics(dt, width, height) {
    const items = activeItems.filter(
      item =>
        item.state === 'resting' ||
        item.state === 'falling'
    );

    /*
      FAST FALLING COINS / XP
    */

    for (const item of items) {
      if (item.state !== 'falling') continue;

      item.vy +=
        (item.type === 'xp' ? 1.35 : 1.55) * dt;

      if (item.vy > 26) {
        item.vy = 26;
      }

      item.x += item.vx * dt;
      item.y += item.vy * dt;

      if (item.x < item.radius) {
        item.x = item.radius;
        item.vx =
          Math.abs(item.vx) * 0.35;
      }

      if (item.x > width - item.radius) {
        item.x = width - item.radius;
        item.vx =
          -Math.abs(item.vx) * 0.35;
      }

      /*
        The coin becomes active as soon as
        it reaches the playfield.
      */

      const entryY =
        Math.max(
          item.radius + 2,
          height * 0.12
        );

      if (item.y >= entryY) {
        item.state = 'resting';

        /*
          Keep forward momentum.
        */

        item.vy *= 0.45;
        item.vy += 1.5;
      }

      renderItem(item);
    }

    /*
      PUSHER CONTACT
    */

    const plateCenterY =
      height * 0.14 +
      pusherZ +
      18;

    const plateBottomY =
      plateCenterY + 18;

    if (pusherDirection > 0) {
      for (const item of items) {
        if (item.state !== 'resting') continue;

        /*
          Contact zone immediately below
          the moving pusher.
        */

        const distance =
          Math.abs(
            item.y - plateBottomY
          );

        if (distance <
            item.radius + 10) {

          /*
            Strong forward impulse.
            This is velocity, not fake position movement.
          */

          item.vy +=
            PUSHER_SPEED *
            0.95 *
            dt;

          /*
            Slight random lateral impulse
            keeps the pile organic.
          */

          item.vx +=
            (Math.random() - 0.5) *
            0.035;
        }
      }
    }

    /*
      SPATIAL HASH

      Instead of checking every coin against
      every other coin, only nearby coins are checked.

      This is important for mobile performance.
    */

    const cellSize = NORMAL_COIN_SIZE + 8;
    const grid = new Map();

    function gridKey(gx, gy) {
      return `${gx},${gy}`;
    }

    for (const item of items) {
      if (item.state !== 'resting') continue;

      const gx =
        Math.floor(item.x / cellSize);

      const gy =
        Math.floor(item.y / cellSize);

      const key = gridKey(gx, gy);

      let bucket = grid.get(key);

      if (!bucket) {
        bucket = [];
        grid.set(key, bucket);
      }

      bucket.push(item);
    }

    /*
      MULTIPLE COLLISION PASSES

      This allows:
      A -> B -> C -> D

      to propagate during the same frame.
    */

    for (let pass = 0; pass < 3; pass++) {
      for (const a of items) {
        if (a.state !== 'resting') continue;

        const agx =
          Math.floor(a.x / cellSize);

        const agy =
          Math.floor(a.y / cellSize);

        for (let gx = agx - 1; gx <= agx + 1; gx++) {
          for (let gy = agy - 1; gy <= agy + 1; gy++) {

            const bucket =
              grid.get(gridKey(gx, gy));

            if (!bucket) continue;

            for (const b of bucket) {
              if (a === b) continue;
              if (b.state !== 'resting') continue;

              /*
                Avoid processing the same pair
                twice in the same pass.
              */

              if (a.id > b.id) continue;

              let dx = b.x - a.x;
              let dy = b.y - a.y;

              let distanceSq =
                dx * dx + dy * dy;

              if (distanceSq < 0.000001) {
                dx = 0.01;
                dy = 0;
                distanceSq = 0.0001;
              }

              const distance =
                Math.sqrt(distanceSq);

              /*
                ROUND EDGE COLLISION

                The square image itself does NOT
                define the collision.

                Only the circular radius does.
              */

              const minimumDistance =
                a.radius + b.radius;

              if (distance >= minimumDistance) {
                continue;
              }

              const nx =
                dx / distance;

              const ny =
                dy / distance;

              const overlap =
                minimumDistance - distance;

              /*
                Separate both coins equally.
                This prevents visual penetration.
              */

              const correction =
                overlap * 0.51;

              a.x -= nx * correction;
              a.y -= ny * correction;

              b.x += nx * correction;
              b.y += ny * correction;

              /*
                RELATIVE VELOCITY

                This is what creates the domino effect.
              */

              const rvx =
                b.vx - a.vx;

              const rvy =
                b.vy - a.vy;

              const normalVelocity =
                rvx * nx +
                rvy * ny;

              /*
                Only collide if moving toward
                each other.
              */

              if (normalVelocity < 0) {
                /*
                  Low bounce = heavy arcade coin.
                */

                const restitution = 0.12;

                const impulse =
                  -(1 + restitution) *
                  normalVelocity /
                  2;

                const ix =
                  impulse * nx;

                const iy =
                  impulse * ny;

                a.vx -= ix;
                a.vy -= iy;

                b.vx += ix;
                b.vy += iy;
              }

              /*
                EDGE FRICTION

                Transfers sideways movement
                when coins hit at an angle.
              */

              const tx = -ny;
              const ty = nx;

              const tangentVelocity =
                rvx * tx +
                rvy * ty;

              const friction =
                tangentVelocity * 0.045;

              a.vx += friction * tx;
              a.vy += friction * ty;

              b.vx -= friction * tx;
              b.vy -= friction * ty;

              /*
                Tiny collision damping keeps the
                pile stable without making it sluggish.
              */

              a.vx *= 0.997;
              a.vy *= 0.997;

              b.vx *= 0.997;
              b.vy *= 0.997;
            }
          }
        }
      }
    }

    /*
      MOVE RESTING ITEMS
    */

    for (const item of items) {
      if (item.state !== 'resting') continue;

      item.x += item.vx * dt;
      item.y += item.vy * dt;

      /*
        VERY LOW friction.
        Coins keep their momentum and continue
        pushing neighboring coins.
      */

      item.vx *=
        Math.pow(0.965, dt);

      item.vy *=
        Math.pow(0.975, dt);

      /*
        Stop microscopic movement.
      */

      if (Math.abs(item.vx) < 0.012) {
        item.vx = 0;
      }

      if (Math.abs(item.vy) < 0.012) {
        item.vy = 0;
      }

      /*
        Velocity safety limit.
      */

      const maxVelocity = 22;

      item.vx =
        Math.max(
          -maxVelocity,
          Math.min(maxVelocity, item.vx)
        );

      item.vy =
        Math.max(
          -maxVelocity,
          Math.min(maxVelocity, item.vy)
        );

      /*
        LEFT WALL
      */

      if (item.x < item.radius) {
        item.x = item.radius;
        item.vx =
          Math.abs(item.vx) * 0.42;
      }

      /*
        RIGHT WALL
      */

      if (item.x > width - item.radius) {
        item.x =
          width - item.radius;

        item.vx =
          -Math.abs(item.vx) * 0.42;
      }

      /*
        TOP WALL
      */

      if (item.y < item.radius) {
        item.y = item.radius;
        item.vy =
          Math.abs(item.vy) * 0.20;
      }

      /*
        PAYOUT EDGE
      */

      if (
        item.y >=
        height - item.radius * 0.55
      ) {
        triggerPayout(item);
        continue;
      }

      renderItem(item);
    }
  }

  /* =========================================================
     RENDER ITEM
     ========================================================= */

  function renderItem(item) {
    /*
      x/y represent the CENTER of the item.
      This makes circular collision geometry
      match the visual coin exactly.
    */

    item.element.style.left =
      `${item.x - item.radius}px`;

    item.element.style.top =
      `${item.y - item.radius}px`;

    item.element.style.width =
      `${item.size}px`;

    item.element.style.height =
      `${item.size}px`;

    item.element.style.minWidth =
      `${item.size}px`;

    item.element.style.minHeight =
      `${item.size}px`;

    item.element.style.maxWidth =
      `${item.size}px`;

    item.element.style.maxHeight =
      `${item.size}px`;

    item.element.style.zIndex =
      item.type === 'xp' ? '20' : '10';
  }

  /* =========================================================
     DROP COIN
     ========================================================= */

  if (dropCoinBtn) {
    dropCoinBtn.addEventListener('click', () => {
      if (coinCount < DROP_COST) {
        playSound('error');
        alert(
          'Not enough coins! Check your balance.'
        );
        return;
      }

      playSound('drop');

      coinCount -= DROP_COST;
      updateBalanceDisplay();

      /*
        Track every coin spent.
      */

      spendingProgress += DROP_COST;

      while (spendingProgress >= 200) {
        spendingProgress -= 200;
        spawnBonusXP();
      }

      localStorage.setItem(
        spendingKey,
        spendingProgress
      );

      addShakeEnergy(6);

      const width =
        playArea.clientWidth;

      const randomX =
        NORMAL_COIN_RADIUS +
        Math.random() *
        Math.max(
          1,
          width -
          NORMAL_COIN_RADIUS * 2
        );

      spawnItem(
        randomX,
        NORMAL_COIN_RADIUS + 2,
        'coin',
        5,
        'medium',
        true,
        'falling'
      );
    });
  }

  /* =========================================================
     XP TIMER - EVERY 3 MINUTES
     ========================================================= */

  const XP_TIMER_KEY =
    `coincraze_last_xp_${coinKey}`;

  function checkXPTimer() {
    const now = Date.now();

    const lastXP =
      parseInt(
        localStorage.getItem(XP_TIMER_KEY)
      ) || now;

    /*
      First visit starts the timer.
    */

    if (!localStorage.getItem(XP_TIMER_KEY)) {
      localStorage.setItem(
        XP_TIMER_KEY,
        now.toString()
      );

      return;
    }

    if (now - lastXP >= 180000) {
      localStorage.setItem(
        XP_TIMER_KEY,
        now.toString()
      );

      spawnBonusXP();
    }
  }

  checkXPTimer();

  setInterval(
    checkXPTimer,
    5000
  );

  /* =========================================================
     XP BONUS
     ========================================================= */

  function spawnBonusXP() {
    const width =
      playArea.clientWidth;

    const randomX =
      XP_RADIUS +
      Math.random() *
      Math.max(
        1,
        width -
        XP_RADIUS * 2
      );

    spawnItem(
      randomX,
      XP_RADIUS + 2,
      'xp',
      XP_REWARD,
      'xp',
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
        pusherContainer.classList.add(
          'shake-anim'
        );

        setTimeout(() => {
          pusherContainer.classList.remove(
            'shake-anim'
          );
        }, 300);
      }

      /*
        Actual physical shake impulse.
      */

      activeItems.forEach(item => {
        if (item.state === 'resting') {
          item.vx +=
            (Math.random() - 0.5) * 7;

          item.vy +=
            Math.random() * 6 + 3;
        }
      });

      saveGameState();

      shakeEnergy = 0;

      if (shakeBarFill) {
        shakeBarFill.style.width = '0%';
      }

      shakeBtn.textContent =
        '⚡ SHAKE (0%)';

      shakeBtn.setAttribute(
        'disabled',
        'true'
      );

      shakeBtn.classList.remove(
        'ready'
      );
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
    const itemEl =
      document.createElement('div');

    let size;
    let radius;

    if (type === 'xp') {
      size = XP_SIZE;
      radius = XP_RADIUS;

      itemEl.className =
        'pusher-item xp-bonus';

      itemEl.style.backgroundImage =
        "url('image/xp.png')";

      itemEl.style.backgroundSize =
        'contain';

      itemEl.style.backgroundRepeat =
        'no-repeat';

      itemEl.style.backgroundPosition =
        'center';

      itemEl.style.fontSize = '0';
    }

    else if (type === 'diamond') {
      size = 52;
      radius = 23;

      itemEl.className =
        'pusher-item diamond large';

      itemEl.textContent = '💎';
    }

    else {
      size = NORMAL_COIN_SIZE;
      radius = NORMAL_COIN_RADIUS;

      itemEl.className =
        'pusher-item coin medium';

      itemEl.style.backgroundImage =
        "url('image/coin.png')";

      itemEl.style.backgroundSize =
        'contain';

      itemEl.style.backgroundRepeat =
        'no-repeat';

      itemEl.style.backgroundPosition =
        'center';

      itemEl.style.border = '0';
      itemEl.style.padding = '0';
      itemEl.style.margin = '0';
    }

    itemEl.style.position = 'absolute';
    itemEl.style.width = `${size}px`;
    itemEl.style.height = `${size}px`;
    itemEl.style.minWidth = `${size}px`;
    itemEl.style.minHeight = `${size}px`;
    itemEl.style.maxWidth = `${size}px`;
    itemEl.style.maxHeight = `${size}px`;
    itemEl.style.pointerEvents = 'none';

    playArea.appendChild(itemEl);

    const itemData = {
      element: itemEl,

      id:
        `${Date.now()}_${Math.random()}`,

      x: startX,
      y: startY,

      vx: 0,
      vy: 0,

      size: size,
      radius: radius,

      type: type,
      value: value,
      sizeClass: sizeClass,

      state:
        initialState ||
        (isFalling
          ? 'falling'
          : 'resting')
    };

    /*
      Fast initial drop.
    */

    if (isFalling) {
      itemData.vy =
        type === 'xp'
          ? 13
          : 15;

      itemData.vx =
        (Math.random() - 0.5) * 1.2;
    }

    activeItems.push(itemData);

    renderItem(itemData);
  }

  /* =========================================================
     PAYOUT
     ========================================================= */

  function triggerPayout(itemData) {
    if (
      itemData.state === 'payout'
    ) {
      return;
    }

    itemData.state = 'payout';

    itemData.element.classList.add(
      'payout'
    );

    if (itemData.type === 'xp') {
      xpCount += itemData.value;
      updateXP();

      playSound('win');

      showFloatingScore(
        itemData.x,
        Math.max(
          20,
          itemData.y - 10
        ),
        `+${itemData.value} XP`
      );
    }

    else {
      coinCount += itemData.value;
      updateBalanceDisplay();

      playSound('win');

      showFloatingScore(
        itemData.x,
        Math.max(
          20,
          itemData.y - 10
        ),
        `+${itemData.value}`
      );
    }

    setTimeout(() => {
      if (itemData.element) {
        itemData.element.remove();
      }

      activeItems =
        activeItems.filter(
          item => item !== itemData
        );

      saveGameState();
    }, 180);
  }

  /* =========================================================
     FLOATING WIN INDICATOR
     ========================================================= */

  function showFloatingScore(
    x,
    y,
    value
  ) {
    const floatText =
      document.createElement('div');

    floatText.className =
      'floating-score';

    floatText.textContent =
      value;

    /*
      Force the reward indicator above:
      coins
      XP
      frame
      pusher
      and other game objects.
    */

    floatText.style.position =
      'absolute';

    floatText.style.left =
      `${x}px`;

    floatText.style.top =
      `${y}px`;

    floatText.style.zIndex =
      '999999';

    floatText.style.pointerEvents =
      'none';

    floatText.style.transform =
      'translate(-50%, -50%)';

    floatText.style.whiteSpace =
      'nowrap';

    floatText.style.visibility =
      'visible';

    playArea.appendChild(
      floatText
    );

    /*
      Move it upward while keeping it
      above the complete playfield.
    */

    requestAnimationFrame(() => {
      floatText.style.transition =
        'transform 0.4s ease-out, opacity 0.4s ease-out';

      floatText.style.transform =
        'translate(-50%, -80%)';

      floatText.style.opacity =
        '0';
    });

    setTimeout(() => {
      if (floatText) {
        floatText.remove();
      }
    }, 450);
  }

  /*
    Save when leaving the page.
  */

  window.addEventListener(
    'beforeunload',
    saveGameState
  );

  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) {
        saveGameState();
      }
    }
  );
});
