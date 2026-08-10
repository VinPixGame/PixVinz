document.addEventListener('DOMContentLoaded', () => {
  AudioManager.playMain();

  const views = {
    home: document.getElementById('homeView'),
    levels: document.getElementById('levelsView'),
    collections: document.getElementById('collectionsView')
  };

  const currentLevel = parseInt(localStorage.getItem('currentLevel')) || 1;

  function switchView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
  }

  document.getElementById('playBtn').addEventListener('click', () => {
    window.location.href = `game.html?level=${currentLevel}`;
  });

  document.getElementById('navLevels').addEventListener('click', () => {
    renderLevels();
    switchView('levels');
  });

  document.getElementById('navCollections').addEventListener('click', () => {
    renderCollections();
    switchView('collections');
  });

  document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => switchView('home'));
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
    
    for (let i = 1; i < currentLevel; i++) {
      const item = document.createElement('div');
      item.className = 'collection-item';
      item.innerHTML = `<img src="image/level${i}.jpeg" alt="Level ${i}">`;
      grid.appendChild(item);
    }
  }
});
