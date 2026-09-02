document.addEventListener('DOMContentLoaded', () => {
  let coinCount = parseFloat(localStorage.getItem('pixvinz_coins')) || 0;
  const coinCountEl = document.getElementById('coinCount');
  const playArea = document.getElementById('playArea');
  const pusherPlate = document.getElementById('pusherPlate');
  const dropCoinBtn = document.getElementById('dropCoinBtn');

  const DROP_COST = 5.00;
  const WIN_REWARD = 15.00;

  let activeCoins = [];

  updateBalanceDisplay();

  function updateBalanceDisplay() {
    coinCountEl.textContent = coinCount.toFixed(2);
    localStorage.setItem('pixvinz_coins', coinCount);
  }

  // Pusher plate movement loop
  let pusherZ = 0;
  let pusherDirection = 1;
  const pusherSpeed = 1.2;
  const maxPushDistance = 55;

  function updatePusher() {
    pusherZ += pusherSpeed * pusherDirection;
    if (pusherZ > maxPushDistance || pusherZ < 0) {
      pusherDirection *= -1;
    }
    pusherPlate.style.transform = `translate(-50%, ${pusherZ}px)`;

    const pusherRect = pusherPlate.getBoundingClientRect();
    const playAreaRect = playArea.getBoundingClientRect();

    activeCoins.forEach(coin => {
      if (coin.state === 'resting') {
        const coinRect = coin.element.getBoundingClientRect();
        
        // Push coins forward if they intersect with the moving plate
        if (coinRect.bottom >= pusherRect.top && coinRect.top <= pusherRect.bottom &&
            coinRect.right >= pusherRect.left && coinRect.left <= pusherRect.right) {
          coin.y += pusherSpeed * pusherDirection * 0.5;
          coin.element.style.top = `${coin.y}px`;
        }

        // Check if coin crossed the front winning edge
        if (coin.y >= playArea.clientHeight - 45) {
          triggerPayout(coin);
        }
      }
    });

    requestAnimationFrame(updatePusher);
  }

  requestAnimationFrame(updatePusher);

  // Trigger drop action via dedicated button
  dropCoinBtn.addEventListener('click', () => {
    if (coinCount < DROP_COST) {
      if (typeof playSound === 'function') playSound('error');
      alert("Not enough coins! Win more or check your balance.");
      return;
    }

    if (typeof playSound === 'function') playSound('click');
    coinCount -= DROP_COST;
    updateBalanceDisplay();

    // Spawn randomly across the upper drop slot width
    const playWidth = playArea.clientWidth;
    const randomX = Math.random() * (playWidth - 60) + 30;
    const startY = 10;

    spawnCoin(randomX, startY);
  });

  function spawnCoin(startX, startY) {
    const coinEl = document.createElement('div');
    coinEl.className = 'pusher-coin';
    coinEl.style.left = `${startX - 15}px`;
    coinEl.style.top = `${startY}px`;
    playArea.appendChild(coinEl);

    const coinData = {
      element: coinEl,
      x: startX - 15,
      y: startY,
      state: 'falling'
    };
    activeCoins.push(coinData);

    let velocityY = 2;
    const targetY = playArea.clientHeight * 0.32; // Lands on upper tray shelf

    function fall() {
      if (coinData.state === 'falling') {
        if (coinData.y < targetY) {
          velocityY += 0.7;
          coinData.y += velocityY;
          coinData.element.style.top = `${coinData.y}px`;
          requestAnimationFrame(fall);
        } else {
          coinData.y = targetY;
          coinData.element.style.top = `${targetY}px`;
          coinData.element.classList.add('landed');
          coinData.state = 'resting';
        }
      }
    }

    requestAnimationFrame(fall);
  }

  function triggerPayout(coinData) {
    if (coinData.state === 'payout') return;
    coinData.state = 'payout';

    coinData.element.classList.add('payout');
    coinCount += WIN_REWARD;
    updateBalanceDisplay();

    if (typeof playSound === 'function') playSound('win');

    setTimeout(() => {
      coinData.element.remove();
      activeCoins = activeCoins.filter(c => c !== coinData);
    }, 600);
  }
});
