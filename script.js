document.addEventListener('DOMContentLoaded', () => {
  AudioManager.playMain();
  updateCoinDisplay();

  const views = {
    home: document.getElementById('homeView'),
    levels: document.getElementById('levelsView'),
    collections: document.getElementById('collectionsView')
  };

  const currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;

  function updateCoinDisplay() {
    const totalCoins = parseInt(localStorage.getItem('totalCoins')) || 0;
    const coinElem = document.getElementById('coinCount');
    if (coinElem) {
      coinElem.innerText = totalCoins;
    }
  }

  function switchView(viewName) {
    updateCoinDisplay();
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
  }

  document.getElementById('playBtn').addEventListener('click', () => {
    AudioManager.playClick();
    window.location.href = `game.html?level=${currentLevel}`;
  });

  document.getElementById('navLevels').addEventListener('click', () => {
    AudioManager.playClick();
    renderLevels();
    switchView('levels');
  });

  document.getElementById('navCollections').addEventListener('click', () => {
    AudioManager.playClick();
    renderCollections();
    switchView('collections');
  });

  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      AudioManager.playClick();
      switchView('home');
    });
  });

  function renderLevels() {
    const grid = document.getElementById('levelsGrid');
    grid.innerHTML = '';
    
    for (let i = 1; i <= 200; i++) {
      const btn = document.createElement('div');
      const isUnlocked = i <= currentLevel;
      
      btn.className = `level-btn ${isUnlocked ? 'unlocked' : 'locked'}`;
      
      if (isUnlocked) {
        btn.innerHTML = `<div class="level-num">${i.toString().padStart(2, '0')}</div><div class="stars">★★★</div>`;
        btn.addEventListener('click', () => {
          AudioManager.playClick();
          window.location.href = `game.html?level=${i}`;
        });
      } else {
        btn.innerHTML = `<div class="level-num" style="opacity:0.4">${i.toString().padStart(2, '0')}</div><div class="lock-icon">🔒</div>`;
      }
      grid.appendChild(btn);
    }

    document.getElementById('unlockInfoText').innerText = 
      `COMPLETE LEVEL ${currentLevel.toString().padStart(2, '0')} TO UNLOCK LEVEL ${(currentLevel + 1).toString().padStart(2, '0')}`;
  }

  function renderCollections() {
    const grid = document.getElementById('collectionsGrid');
    grid.innerHTML = '';
    
    // Shows all completed/solved level images
    for (let i = 1; i < currentLevel; i++) {
      const item = document.createElement('div');
      item.className = 'collection-item';
      
      item.innerHTML = `
        <img src="image/level${i}.jpeg" alt="Level ${i}">
        <div class="collection-badge">LEVEL ${i.toString().padStart(2, '0')}</div>
      `;

      // Tap to open enlarged popup modal
      item.addEventListener('click', () => {
        AudioManager.playClick();
        openImageModal(i);
      });

      grid.appendChild(item);
    }
  }

  function openImageModal(levelNum) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalPreviewImg');
    const modalTitle = document.getElementById('modalLevelTitle');

    modalTitle.innerText = `LEVEL ${levelNum.toString().padStart(2, '0')}`;
    modalImg.src = `image/level${levelNum}.jpeg`;

    modal.classList.remove('hidden');
  }

  function closeImageModal() {
    AudioManager.playClick();
    document.getElementById('imageModal').classList.add('hidden');
  }

  document.getElementById('closeImageModal').addEventListener('click', closeImageModal);
  document.getElementById('imageModal').addEventListener('click', (e) => {
    if (e.target.id === 'imageModal' || e.target.id === 'modalPreviewImg') {
      closeImageModal();
    }
  });
});
