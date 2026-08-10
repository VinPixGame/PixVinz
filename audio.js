const AudioManager = {
  bgMusic: new Audio(),
  mainMusic: new Audio(),

  init() {
    this.bgMusic.src = 'sound/bgmusic.mp3';
    this.bgMusic.loop = true;

    this.mainMusic.src = 'image/main.mp3';
    this.mainMusic.loop = true;
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

  stopAll() {
    this.mainMusic.pause();
    this.bgMusic.pause();
  }
};

AudioManager.init();
