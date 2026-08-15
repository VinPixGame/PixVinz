// audio.js
const AudioManager = {
  bgmMain: null,
  bgmGame: null,
  victoryAudio: null,
  
  musicEnabled: localStorage.getItem('musicEnabled') !== 'false',
  sfxEnabled: localStorage.getItem('sfxEnabled') !== 'false',

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
    if (this.bgmMain) { 
      this.bgmMain.pause(); 
      this.bgmMain.currentTime = 0; 
    }
    if (this.bgmGame) { 
      this.bgmGame.pause(); 
      this.bgmGame.currentTime = 0; 
    }
  },

  // Homepage and menu background music
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
      this.bgmMain.play().catch(e => console.log('BGM Main play blocked or missing: sounds/main.mp3', e));
    }
  },

  // Puzzle gameplay background music
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
      this.bgmGame.play().catch(e => console.log('BGM Game play blocked or missing: sounds/bgmusic.mp3', e));
    }
  },

  // Sound Effects (MP3 files from 'sounds' folder)
  playSelect() {
    if (!this.sfxEnabled) return;
    try {
      const sound = new Audio('sounds/select.mp3');
      sound.play().catch(e => console.log("Select audio error:", e));
    } catch(e) {}
  },

  playShuffle() {
    if (!this.sfxEnabled) return;
    try {
      const sound = new Audio('sounds/shuffle.mp3');
      sound.play().catch(e => console.log("Shuffle audio error:", e));
    } catch(e) {}
  },

  playClick() {
    if (!this.sfxEnabled) return;
    try {
      const sound = new Audio('sounds/click.mp3');
      sound.play().catch(e => console.log("Click audio error:", e));
    } catch(e) {}
  },

  playExchange() {
    if (!this.sfxEnabled) return;
    try {
      const sound = new Audio('sounds/exchange.mp3');
      sound.play().catch(e => console.log("Exchange audio error:", e));
    } catch(e) {}
  },

  playVictory(levelNum) {
    if (!this.sfxEnabled) return;
    if (this.victoryAudio) {
      this.victoryAudio.pause();
      this.victoryAudio.currentTime = 0;
    }
    const safeLevel = parseInt(levelNum) || 1;
    const soundIndex = ((safeLevel - 1) % 10) + 1;
    this.victoryAudio = new Audio(`sounds/victory${soundIndex}.mp3`);
    this.victoryAudio.play().catch(err => console.log("Victory audio error:", err));
  }
};
