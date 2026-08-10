const AudioManager = {
  bgMusic: new Audio('sound/bgmusic.mp3'),
  mainMusic: new Audio('sound/main.mp3'),
  clickSound: new Audio('sound/click.mp3'),
  selectSound: new Audio('sound/select.mp3'),
  shuffleSound: new Audio('sound/shuffle.mp3'),
  isUnlocked: false,

  init() {
    this.bgMusic.loop = true;
    this.mainMusic.loop = true;

    const unlockAudio = () => {
      if (!this.isUnlocked) {
        this.isUnlocked = true;
        if (window.location.pathname.includes('game.html')) {
          this.playGame();
        } else {
          this.playMain();
        }
        document.removeEventListener('click', unlockAudio);
        document.removeEventListener('touchstart', unlockAudio);
      }
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
  },

  playClick() {
    this._playSound(this.clickSound);
  },

  playSelect() {
    this._playSound(this.selectSound);
  },

  playShuffle() {
    this._playSound(this.shuffleSound);
  },

  playVictory(level) {
    // Cycles victory1.mp3 to victory10.mp3 every 10 levels
    const victoryIndex = ((level - 1) % 10) + 1;
    const victoryAudio = new Audio(`sound/victory${victoryIndex}.mp3`);
    this.bgMusic.pause();
    this._playSound(victoryAudio);
  },

  playMain() {
    this.bgMusic.pause();
    if (localStorage.getItem('soundEnabled') !== 'false') {
      this.mainMusic.play().catch(() => {});
    }
  },

  playGame() {
    this.mainMusic.pause();
    if (localStorage.getItem('soundEnabled') !== 'false') {
      this.bgMusic.play().catch(() => {});
    }
  },

  _playSound(audioObj) {
    if (localStorage.getItem('soundEnabled') !== 'false') {
      const clone = audioObj.cloneNode();
      clone.play().catch(() => {});
    }
  }
};

AudioManager.init();
