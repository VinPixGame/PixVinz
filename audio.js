const AudioManager = {
  bgMusic: new Audio('sound/bgmusic.mp3'),
  mainMusic: new Audio('image/main.mp3'),
  clickSound: new Audio('sound/click.mp3'),
  isUnlocked: false,

  init() {
    this.bgMusic.loop = true;
    this.mainMusic.loop = true;

    // Unlocks browser autoplay policy on the first tap anywhere
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
    if (localStorage.getItem('soundEnabled') !== 'false') {
      const click = this.clickSound.cloneNode();
      click.play().catch(() => {});
    }
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
  }
};

AudioManager.init();
