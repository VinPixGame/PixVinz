/* coincraze.js - 3D TWO-TIER COIN PUSHER */
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

  let xpKey = 'totalXP';

  if (typeof getUserKey === 'function') {
    xpKey = getUserKey('totalXP');
  } else {
    const currentUser = JSON.parse(localStorage.getItem('loggedInUser')) || {};
    const username = currentUser.username || localStorage.getItem('vinpix_username') || 'default';
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

  /* =========================================================
     TWO-TIER DIMENSIONS
     ========================================================= */

  const upperTop = 0.14;
  const upperHeight = 0.30;

  const lowerTop = 0.48;
  const lowerHeight = 0.44;

  const EXIT_WIDTH = 76;
  const GATE_HEIGHT = 12;

  let gateOpen = false;
  let gateTimer = null;

  /* =========================================================
     MECHANICAL PARTS
     ========================================================= */

  const lowerDeck = document.createElement('div');
  lowerDeck.className = 'lower-deck';

  const lowerFloor = document.createElement('div');
  lowerFloor.className = 'lower-deck-floor';

  const lowerFront = document.createElement('div');
  lowerFront.className = 'lower-deck-front';

  lowerDeck.appendChild(lowerFloor);
  lowerDeck.appendChild(lowerFront);

  playArea.insertBefore(lowerDeck, pusherPlate);

  const upperDeck = document.createElement('div');
  upperDeck.className = 'upper-deck';

  const upperFloor = document.createElement('div');
  upperFloor.className = 'upper-deck-floor';

  const upperFront = document.createElement('div');
  upperFront.className = 'upper-deck-front';

  upperDeck.appendChild(upperFloor);
  upperDeck.appendChild(upperFront);

  playArea.insertBefore(upperDeck, pusherPlate);

  /* =========================================================
     CENTER PAYOUT HOLE
     ========================================================= */

  const exitHole = document.createElement('div');
  exitHole.className = 'coin-exit-hole';

  const exitInner = document.createElement('div');
  exitInner.className = 'coin-exit-inner';

  exitHole.appendChild(exitInner);
  playArea.appendChild(exitHole);

  const gate = document.createElement('div');
  gate.className = 'coin-exit-gate';

  const gateGlow = document.createElement('div');
  gateGlow.className = 'coin-exit-glow';

  gate.appendChild(gateGlow);
  exitHole.appendChild(gate);

  function positionMechanicalParts() {
    const width = playArea.clientWidth;
    const height = playArea.clientHeight;

    lowerDeck.style.position = 'absolute';
    lowerDeck.style.left = '5%';
    lowerDeck.style.right = '5%';
    lowerDeck.style.top = `${height * lowerTop}px`;
    lowerDeck.style.height = `${height * lowerHeight}px`;
    lowerDeck.style.zIndex = '1';

    upperDeck.style.position = 'absolute';
    upperDeck.style.left = '5%';
    upperDeck.style.right = '5%';
    upperDeck.style.top = `${height * upperTop}px`;
    upperDeck.style.height = `${height * upperHeight}px`;
    upperDeck.style.zIndex = '2';

    exitHole.style.position = 'absolute';
    exitHole.style.left = `${(width - EXIT_WIDTH) / 2}px`;
    exitHole.style.width = `${EXIT_WIDTH}px`;
    exitHole.style.height = `${EXIT_WIDTH * 0.62}px`;
    exitHole.style.bottom = '3%';
    exitHole.style.zIndex = '50';

    gate.style.position = 'absolute';
    gate.style.left = '5%';
    gate.style.width = '90%';
    gate.style.height = `${GATE_HEIGHT}px`;
    gate.style.top = '50%';
    gate.style.transform = gateOpen
      ? 'translateY(-50%) scaleY(0.15)'
      : 'translateY(-50%) scaleY(1)';
    gate.style.transformOrigin = 'center center';
    gate.style.zIndex = '51';
  }

  positionMechanicalParts();

  window.addEventListener('resize', positionMechanicalParts);

  /* =========================================================
     GATE
     ========================================================= */

  function setGateState(open) {
    gateOpen = open;

    gate.classList.toggle('gate-open', open);
    gate.classList.toggle('gate-closed', !open);

    gate.style.transform = open
      ? 'translateY(-50%) scaleY(0.15)'
      : 'translateY(-50%) scaleY(1)';
  }

  function startGateCycle() {
    if (gateTimer) {
      clearTimeout(gateTimer);
    }

    setGateState(false);

    function cycle() {
      setGateState(true);

      gateTimer = setTimeout(() => {
        setGateState(false);

        gateTimer = setTimeout(
          cycle,
          1500
        );
      }, 1100);
    }

    gateTimer = setTimeout(
      cycle,
      1500
    );
  }

  startGateCycle();

  /* =========================================================
     AUDIO
     ========================================================= */

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

  /* =========================================================
     BALANCE / XP
     ========================================================= */

  function updateBalanceDisplay() {
    if (coinCountEl) {
      coinCountEl.textContent =
        coinCount.toFixed(2);
    }

    localStorage.setItem(
      coinKey,
      coinCount
    );
  }

  function updateXP() {
    localStorage.setItem(
      xpKey,
      xpCount
    );
  }

  updateBalanceDisplay();
  updateXP();

  const storageItemsKey =
    `coincraze_active_items_${coinKey}`;

  const spendingKey =
    `coincraze_spending_${coinKey}`;

  let spendingProgress =
    parseFloat(
      localStorage.getItem(spendingKey)
    ) || 0;

  /* =========================================================
     SAVE / LOAD
     ========================================================= */

  function saveGameState() {
    const stateData =
      activeItems
        .filter(item =>
          item.state !== 'payout'
        )
        .map(item => ({
          x: item.x,
          y: item.y,
          vx: 0,
          vy: 0,
          type: item.type,
          value: item.value,
          sizeClass: item.sizeClass,
          deck: item.deck,
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
    localStorage.getItem(
      storageItemsKey
    );

  if (savedItemsJson) {
    try {
      const parsed =
        JSON.parse(savedItemsJson);

      if (
        Array.isArray(parsed) &&
        parsed.length
      ) {
        parsed.forEach(data => {
          const deck =
            data.deck === 'upper'
              ? 'upper'
              : 'lower';

          const height =
            playArea.clientHeight;

          let y =
            Number(data.y) || 20;

          if (deck === 'upper') {
            y =
              Math.min(
                y,
                height *
                  (upperTop + upperHeight) -
                  NORMAL_COIN_RADIUS
              );
          } else {
            y =
              Math.min(
                y,
                height *
                  (lowerTop + lowerHeight) -
                  NORMAL_COIN_RADIUS
              );
          }

          spawnItem(
            Number(data.x) || 20,
            y,
            data.type || 'coin',
            Number(data.value) || 5,
            data.sizeClass || 'medium',
            false,
            'resting',
            deck
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
    const width =
      playArea.clientWidth;

    const height =
      playArea.clientHeight;

    const lowerFloorY =
      height *
        (lowerTop + lowerHeight) -
      14;

    const radius =
      NORMAL_COIN_RADIUS;

    for (let i = 0; i < 24; i++) {
      let x = radius;
      let y = lowerFloorY - radius;
      let valid = false;

      for (
        let attempt = 0;
        attempt < 150;
        attempt++
      ) {
        x =
          radius +
          Math.random() *
          Math.max(
            1,
            width -
              radius * 2
          );

        y =
          height * 0.57 +
          Math.random() *
            height * 0.22;

        valid = true;

        for (
          const other of activeItems
        ) {
          if (other.deck !== 'lower') {
            continue;
          }

          const dx =
            x - other.x;

          const dy =
            y - other.y;

          const d =
            Math.sqrt(
              dx * dx +
              dy * dy
            );

          if (
            d <
            (radius +
              other.radius) *
              0.78
          ) {
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
        'resting',
        'lower'
      );
    }

    saveGameState();
  }

  /* =========================================================
     SHAKE
     ========================================================= */

  function addShakeEnergy(amount) {
    shakeEnergy =
      Math.min(
        100,
        shakeEnergy + amount
      );

    if (shakeBarFill) {
      shakeBarFill.style.width =
        `${shakeEnergy}%`;
    }

    if (shakeBtn) {
      shakeBtn.textContent =
        `⚡ SHAKE (${Math.floor(shakeEnergy)}%)`;

      if (shakeEnergy >= 100) {
        shakeBtn.removeAttribute(
          'disabled'
        );

        shakeBtn.classList.add(
          'ready'
        );
      }
    }
  }

  /* =========================================================
     PUSHER MOVEMENT
     ========================================================= */

  let pusherZ = 0;
  let pusherDirection = 1;

  /*
     Much slower than the previous version.
  */
  const PUSHER_SPEED = 0.72;
  const MAX_PUSH_DISTANCE = 70;

  let lastTime =
    performance.now();

  let saveClock = 0;

  function updatePusher(now) {
    let dt =
      (now - lastTime) /
      16.6666667;

    lastTime = now;

    if (!isFinite(dt)) {
      dt = 1;
    }

    dt = Math.min(dt, 1.5);

    /*
       The pusher physically travels across
       the upper tray.
    */

    pusherZ +=
      PUSHER_SPEED *
      pusherDirection *
      dt;

    if (
      pusherZ >=
      MAX_PUSH_DISTANCE
    ) {
      pusherZ =
        MAX_PUSH_DISTANCE;

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

    const subSteps = 4;

    for (
      let s = 0;
      s < subSteps;
      s++
    ) {
      updatePhysics(
        dt / subSteps,
        playArea.clientWidth,
        playArea.clientHeight
      );
    }

    saveClock += dt;

    if (saveClock >= 90) {
      saveClock = 0;
      saveGameState();
    }

    requestAnimationFrame(
      updatePusher
    );
  }

  requestAnimationFrame(
    updatePusher
  );

  /* =========================================================
     PHYSICS
     ========================================================= */

  function updatePhysics(
    dt,
    width,
    height
  ) {
    const upperFloor =
      height *
        (upperTop + upperHeight) -
      14;

    const lowerFloor =
      height *
        (lowerTop + lowerHeight) -
      14;

    const upperFront =
      upperFloor;

    const lowerFront =
      lowerFloor;

    const exitCenter =
      width / 2;

    const exitHalf =
      EXIT_WIDTH / 2;

    /* =====================================================
       FALLING COINS
       ===================================================== */

    for (const item of activeItems) {
      if (
        item.state !== 'falling' &&
        item.state !== 'transition'
      ) {
        continue;
      }

      item.vy +=
        0.9 * dt;

      if (item.vy > 15) {
        item.vy = 15;
      }

      item.x +=
        item.vx * dt;

      item.y +=
        item.vy * dt;

      /*
         Solid side walls.
      */

      const leftWall =
        item.radius + 2;

      const rightWall =
        width -
        item.radius -
        2;

      if (
        item.x <
        leftWall
      ) {
        item.x =
          leftWall;

        item.vx = 0;
      }

      if (
        item.x >
        rightWall
      ) {
        item.x =
          rightWall;

        item.vx = 0;
      }

      /*
         FALLING FROM ABOVE

         A newly dropped coin can ONLY land
         on the upper deck.
      */

      if (
        item.deck === 'upper'
      ) {
        if (
          item.y +
            item.radius >=
          upperFloor
        ) {
          item.y =
            upperFloor -
            item.radius;

          item.vy = 0;
          item.vx = 0;
          item.state =
            'resting';
        }
      }

      /*
         FALLING FROM UPPER TO LOWER

         It lands on the LOWER deck.
      */

      else if (
        item.deck === 'transition'
      ) {
        if (
          item.y +
            item.radius >=
          lowerFloor
        ) {
          item.y =
            lowerFloor -
            item.radius;

          item.vy = 0;
          item.vx = 0;
          item.state =
            'resting';
          item.deck =
            'lower';
        }
      }

      renderItem(item);
    }

    /* =====================================================
       UPPER PUSHER
       ===================================================== */

    /*
       The pusher plate starts at the rear
       of the upper deck and travels toward
       the front.

       RESTING COINS HAVE NO GRAVITY.

       They only move when the pusher
       physically contacts them.
    */

    const pusherTop =
      height * upperTop +
      pusherZ;

    const pusherHeight =
      Math.max(
        24,
        Math.min(
          34,
          height * 0.055
        )
      );

    const pusherBottom =
      pusherTop +
      pusherHeight;

    for (const item of activeItems) {
      if (
        item.state !== 'resting' ||
        item.deck !== 'upper'
      ) {
        continue;
      }

      /*
         Keep the coin firmly supported
         by the upper tray.
      */

      if (
        item.y +
          item.radius >
        upperFloor
      ) {
        item.y =
          upperFloor -
          item.radius;

        item.vy = 0;
      }

      /*
         PHYSICAL PUSH CONTACT

         Only the forward-moving pusher
         is allowed to push the coin.

         Returning pusher does NOTHING.
      */

      if (
        pusherDirection > 0
      ) {
        const coinFront =
          item.y -
          item.radius;

        if (
          coinFront <=
            pusherBottom + 2 &&
          item.y +
            item.radius >=
            pusherTop
        ) {
          const pushAmount =
            PUSHER_SPEED *
            dt *
            2.4;

          item.y +=
            pushAmount;

          item.vy =
            pushAmount /
            Math.max(
              dt,
              0.001
            );

          /*
             The coin has reached the
             front edge of the upper tray.

             ONLY THE PUSHER can cause
             this transition.
          */

          if (
            item.y +
              item.radius >=
            upperFront
          ) {
            item.y =
              upperFront -
              item.radius +
              4;

            item.state =
              'transition';

            item.deck =
              'transition';

            item.vy =
              Math.max(
                2.5,
                item.vy
              );

            item.vx *= 0.15;
          }
        }
      }

      renderItem(item);
    }

    /* =====================================================
       UPPER COIN PILE
       ===================================================== */

    resolveDeckCollisions(
      activeItems.filter(
        item =>
          item.state === 'resting' &&
          item.deck === 'upper'
      ),
      upperFloor,
      width
    );

    /* =====================================================
       LOWER DECK
       ===================================================== */

    const lowerItems =
      activeItems.filter(
        item =>
          item.state === 'resting' &&
          item.deck === 'lower'
      );

    /*
       CRITICAL:

       There is NO gravity here.

       There is NO automatic downward
       movement here.

       Lower coins stay exactly where
       they are unless another physical
       force moves them.
    */

    for (const item of lowerItems) {
      item.vx *=
        Math.pow(
          0.82,
          dt
        );

      item.vy = 0;

      if (
        Math.abs(item.vx) <
        0.003
      ) {
        item.vx = 0;
      }

      item.x +=
        item.vx * dt;

      /*
         Solid left wall.
      */

      if (
        item.x <
        item.radius + 2
      ) {
        item.x =
          item.radius + 2;

        item.vx = 0;
      }

      /*
         Solid right wall.
      */

      if (
        item.x >
        width -
          item.radius -
          2
      ) {
        item.x =
          width -
          item.radius -
          2;

        item.vx = 0;
      }

      /*
         Solid LOWER FLOOR.

         Nothing moves toward the hole
         simply because it exists.
      */

      if (
        item.y >
        lowerFront -
          item.radius
      ) {
        item.y =
          lowerFront -
          item.radius;

        item.vy = 0;
      }

      renderItem(item);
    }

    resolveDeckCollisions(
      lowerItems,
      lowerFront,
      width
    );

    /* =====================================================
       PUSH LOWER PILE ONLY DURING
       THE FORWARD PUSH CYCLE
       ===================================================== */

    if (
      pusherDirection > 0 &&
      pusherZ >
        MAX_PUSH_DISTANCE * 0.72
    ) {
      /*
         This represents the physical transfer
         of pressure from the upper moving
         mechanism into the lower pile.

         It is NOT gravity.

         It only happens while the pusher
         is actually moving forward.
      */

      const transferStrength =
        PUSHER_SPEED *
        dt *
        0.9;

      const lowerPushZone =
        lowerTop * height;

      for (
        const item of lowerItems
      ) {
        if (
          item.y >
          lowerPushZone
        ) {
          item.vx +=
            (exitCenter -
              item.x) *
            transferStrength *
            0.012;
        }
      }
    }

    /* =====================================================
       PAYOUT
       ===================================================== */

    for (
      let i =
        activeItems.length - 1;
      i >= 0;
      i--
    ) {
      const item =
        activeItems[i];

      if (
        item.state !==
        'resting' ||
        item.deck !==
        'lower'
      ) {
        continue;
      }

      /*
         Only a coin physically sitting
         directly over the center hole
         can enter it.
      */

      const distanceFromCenter =
        Math.abs(
          item.x -
          exitCenter
        );

      const insideHole =
        distanceFromCenter <
        exitHalf -
        item.radius * 0.25;

      const atHoleEdge =
        item.y +
          item.radius >=
        height -
          EXIT_WIDTH * 0.5;

      if (
        insideHole &&
        atHoleEdge &&
        gateOpen
      ) {
        triggerPayout(item);
      }
    }
  }

  /* =========================================================
     DECK COLLISION / PILING
     ========================================================= */

  function resolveDeckCollisions(
    items,
    floor,
    width
  ) {
    /*
       Smaller physical collision radius than
       visual radius lets coins visibly overlap
       and pile instead of forming perfectly
       separated circles.
    */

    const collisionScale = 0.78;

    for (
      let pass = 0;
      pass < 4;
      pass++
    ) {
      for (
        let i = 0;
        i < items.length;
        i++
      ) {
        const a =
          items[i];

        for (
          let j = i + 1;
          j < items.length;
          j++
        ) {
          const b =
            items[j];

          let dx =
            b.x - a.x;

          let dy =
            b.y - a.y;

          let distance =
            Math.sqrt(
              dx * dx +
              dy * dy
            );

          if (
            distance <
            0.001
          ) {
            dx = 0.01;
            dy = 0;
            distance = 0.01;
          }

          const physicalA =
            a.radius *
            collisionScale;

          const physicalB =
            b.radius *
            collisionScale;

          const minimum =
            physicalA +
            physicalB;

          if (
            distance >=
            minimum
          ) {
            continue;
          }

          const nx =
            dx /
            distance;

          const ny =
            dy /
            distance;

          const overlap =
            minimum -
            distance;

          /*
             Very gentle separation.
             This allows visible piling.
          */

          const correction =
            overlap *
            0.48;

          a.x -=
            nx *
            correction;

          a.y -=
            ny *
            correction;

          b.x +=
            nx *
            correction;

          b.y +=
            ny *
            correction;

          /*
             No vertical bouncing.
             This prevents the unwanted
             up/down oscillation.
          */

          a.vy = 0;
          b.vy = 0;

          /*
             Transfer only horizontal
             movement between coins.
          */

          const relativeVx =
            b.vx -
            a.vx;

          if (
            relativeVx !== 0
          ) {
            const transfer =
              relativeVx *
              0.08;

            a.vx +=
              transfer;

            b.vx -=
              transfer;
          }
        }
      }

      /*
         Keep every coin supported
         by its deck floor.
      */

      for (
        const item of items
      ) {
        if (
          item.y +
            item.radius >
          floor
        ) {
          item.y =
            floor -
            item.radius;

          item.vy = 0;
        }

        if (
          item.x <
          item.radius + 2
        ) {
          item.x =
            item.radius + 2;

          item.vx = 0;
        }

        if (
          item.x >
          width -
            item.radius -
            2
        ) {
          item.x =
            width -
            item.radius -
            2;

          item.vx = 0;
        }
      }
    }

    for (
      const item of items
    ) {
      renderItem(item);
    }
  }

  /* =========================================================
     RENDER
     ========================================================= */

  function renderItem(item) {
    if (!item.element) {
      return;
    }

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
      item.type === 'xp'
        ? '40'
        : '30';
  }

  /* =========================================================
     DROP COIN
     ========================================================= */

  if (dropCoinBtn) {
    dropCoinBtn.addEventListener(
      'click',
      () => {
        if (
          coinCount <
          DROP_COST
        ) {
          playSound('error');

          alert(
            'Not enough coins! Check your balance.'
          );

          return;
        }

        playSound('drop');

        coinCount -=
          DROP_COST;

        updateBalanceDisplay();

        spendingProgress +=
          DROP_COST;

        while (
          spendingProgress >=
          200
        ) {
          spendingProgress -=
            200;

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
          'falling',
          'upper'
        );
      }
    );
  }

  /* =========================================================
     XP TIMER
     ========================================================= */

  const XP_TIMER_KEY =
    `coincraze_last_xp_${coinKey}`;

  function checkXPTimer() {
    const now =
      Date.now();

    const lastXP =
      parseInt(
        localStorage.getItem(
          XP_TIMER_KEY
        )
      ) || now;

    if (
      !localStorage.getItem(
        XP_TIMER_KEY
      )
    ) {
      localStorage.setItem(
        XP_TIMER_KEY,
        now.toString()
      );

      return;
    }

    if (
      now - lastXP >=
      180000
    ) {
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
     XP
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
      'falling',
      'upper'
    );

    playSound('win');
  }

  /* =========================================================
     SHAKE
     ========================================================= */

  if (shakeBtn) {
    shakeBtn.addEventListener(
      'click',
      () => {
        if (
          shakeEnergy <
          100
        ) {
          return;
        }

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

        activeItems.forEach(
          item => {
            if (
              item.state ===
              'resting'
            ) {
              /*
                 Shake is an intentional force,
                 not natural gravity.
              */

              item.vx +=
                (Math.random() -
                  0.5) * 5;
            }
          }
        );

        saveGameState();

        shakeEnergy = 0;

        if (shakeBarFill) {
          shakeBarFill.style.width =
            '0%';
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
      }
    );
  }

  /* =========================================================
     SPAWN
     ========================================================= */

  function spawnItem(
    startX,
    startY,
    type,
    value,
    sizeClass,
    isFalling,
    initialState,
    deck
  ) {
    const itemEl =
      document.createElement(
        'div'
      );

    let size;
    let radius;

    if (
      type === 'xp'
    ) {
      size = XP_SIZE;
      radius = XP_RADIUS;

      itemEl.className =
        'pusher-item xp-bonus';

      const xpImg =
        document.createElement(
          'img'
        );

      xpImg.src =
        'image/xp.png';

      xpImg.alt = '';

      xpImg.draggable =
        false;

      xpImg.style.width =
        '100%';

      xpImg.style.height =
        '100%';

      xpImg.style.objectFit =
        'contain';

      xpImg.style.display =
        'block';

      xpImg.style.pointerEvents =
        'none';

      itemEl.appendChild(
        xpImg
      );
    }

    else if (
      type === 'diamond'
    ) {
      size = 52;
      radius = 23;

      itemEl.className =
        'pusher-item diamond large';

      itemEl.textContent =
        '💎';
    }

    else {
      size =
        NORMAL_COIN_SIZE;

      radius =
        NORMAL_COIN_RADIUS;

      itemEl.className =
        'pusher-item coin medium';

      itemEl.style.backgroundImage =
        "url('image/coin.png')";

      itemEl.style.backgroundSize =
        '100% 100%';

      itemEl.style.backgroundRepeat =
        'no-repeat';

      itemEl.style.backgroundPosition =
        'center';

      itemEl.style.border =
        '0';

      itemEl.style.padding =
        '0';

      itemEl.style.margin =
        '0';
    }

    itemEl.style.position =
      'absolute';

    itemEl.style.width =
      `${size}px`;

    itemEl.style.height =
      `${size}px`;

    itemEl.style.minWidth =
      `${size}px`;

    itemEl.style.minHeight =
      `${size}px`;

    itemEl.style.maxWidth =
      `${size}px`;

    itemEl.style.maxHeight =
      `${size}px`;

    itemEl.style.pointerEvents =
      'none';

    playArea.appendChild(
      itemEl
    );

    const itemData = {
      element: itemEl,

      id:
        `${Date.now()}_${Math.random()}`,

      x: startX,
      y: startY,

      vx: 0,
      vy: 0,

      size,
      radius,

      type,
      value,
      sizeClass,

      deck:
        deck || 'lower',

      state:
        initialState ||
        (
          isFalling
            ? 'falling'
            : 'resting'
        )
    };

    if (isFalling) {
      itemData.vy =
        type === 'xp'
          ? 8
          : 9;

      itemData.vx =
        (Math.random() - 0.5) *
        0.15;
    }

    activeItems.push(
      itemData
    );

    renderItem(
      itemData
    );
  }

  /* =========================================================
     PAYOUT
     ========================================================= */

  function triggerPayout(
    itemData
  ) {
    if (
      itemData.state ===
      'payout'
    ) {
      return;
    }

    itemData.state =
      'payout';

    itemData.element.classList.add(
      'payout'
    );

    if (
      itemData.type ===
      'xp'
    ) {
      xpCount +=
        itemData.value;

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
      coinCount +=
        itemData.value;

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
      if (
        itemData.element
      ) {
        itemData.element.remove();
      }

      activeItems =
        activeItems.filter(
          item =>
            item !== itemData
        );

      saveGameState();
    }, 180);
  }

  /* =========================================================
     FLOATING SCORE
     ========================================================= */

  function showFloatingScore(
    x,
    y,
    value
  ) {
    const floatText =
      document.createElement(
        'div'
      );

    floatText.className =
      'floating-score';

    floatText.textContent =
      value;

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

    playArea.appendChild(
      floatText
    );

    requestAnimationFrame(
      () => {
        floatText.style.transition =
          'transform 0.4s ease-out, opacity 0.4s ease-out';

        floatText.style.transform =
          'translate(-50%, -80%)';

        floatText.style.opacity =
          '0';
      }
    );

    setTimeout(() => {
      floatText.remove();
    }, 450);
  }

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
