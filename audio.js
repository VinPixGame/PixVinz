const AudioManager = {
  bgmMain: null,
  bgmGame: null,
  victoryAudio: null,
  ctx: null,
  
  musicEnabled: localStorage.getItem('musicEnabled') !== 'false',
  sfxEnabled: localStorage.getItem('sfxEnabled') !== 'false',

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  },

  setMusic(enabled) {
    this.musicEnabled = enabled;
    localStorage.setItem('musicEnabled', enabled);
    if (!enabled) {
      this.stopBGM();
    } else {
      this.playMain();
    }
  },

  setSFX(enabled) {
    this.sfxEnabled = enabled;
    localStorage.setItem('sfxEnabled', enabled);
  },

  stopBGM() {
    if (this.bgmMain) { this.bgmMain.pause(); this.bgmMain.currentTime = 0; }
    if (this.bgmGame) { this.bgmGame.pause(); this.bgmGame.currentTime = 0; }
  },

  // Homepage and any menu pages
  playMain() {
    if (!this.musicEnabled) return;
    if (this.bgmGame) {
      this.bgmGame.pause();
      this.bgmGame.currentTime = 0;
    }
    if (!this.bgmMain) {
      this.bgmMain = new Audio('sounds/main.mp3');
      this.bgmMain.loop = true;
    }
    if (this.bgmMain.paused) {
      this.bgmMain.play().catch(e => console.log('BGM Main play blocked or missing: sounds/main.mp3'));
    }
  },

  // Game page only when playing the puzzle
  playGame() {
    if (!this.musicEnabled) return;
    if (this.bgmMain) {
      this.bgmMain.pause();
      this.bgmMain.currentTime = 0;
    }
    if (!this.bgmGame) {
      this.bgmGame = new Audio('sounds/bgmusic.mp3');
      this.bgmGame.loop = true;
    }
    if (this.bgmGame.paused) {
      this.bgmGame.play().catch(e => console.log('BGM Game play blocked or missing: sounds/bgmusic.mp3'));
    }
  },

  playSelect() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch(e) {}
  },

  playShuffle() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch(e) {}
  },

  playClick() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch(e) {}
  },

  playVictory(levelNum) {
    if (!this.sfxEnabled) return;
    if (this.victoryAudio) {
      this.victoryAudio.pause();
      this.victoryAudio.currentTime = 0;
    }
    const soundIndex = ((levelNum - 1) % 10) + 1;
    this.victoryAudio = new Audio(`sounds/victory${soundIndex}.mp3`);
    this.victoryAudio.play().catch(err => console.log("Victory audio missing or blocked:", err));
  }
};
