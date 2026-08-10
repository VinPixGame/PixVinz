const AudioManager = {
  bgmMain: null,
  bgmGame: null,
  victoryAudio: null,
  
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
    }
  },

  setSFX(enabled) {
    this.sfxEnabled = enabled;
    localStorage.setItem('sfxEnabled', enabled);
  },

  stopBGM() {
    if (this.bgmMain) { this.bgmMain.pause(); }
    if (this.bgmGame) { this.bgmGame.pause(); }
  },

  playMain() {
    if (!this.musicEnabled) return;
    this.stopBGM();
    // BGM synth fallback
  },

  playGame() {
    if (!this.musicEnabled) return;
    this.stopBGM();
    // BGM synth fallback
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
    
    // Stop previous victory audio if playing
    if (this.victoryAudio) {
      this.victoryAudio.pause();
      this.victoryAudio.currentTime = 0;
    }

    // Rotates through victory1.mp3 to victory10.mp3 located in image/ folder
    const soundIndex = ((levelNum - 1) % 10) + 1;
    const soundPath = `image/victory${soundIndex}.mp3`;

    this.victoryAudio = new Audio(soundPath);
    this.victoryAudio.play().catch(err => {
      console.log("Audio play blocked or file missing:", err);
    });
  }
};
