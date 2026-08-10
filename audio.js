// Single audio instances to prevent sound overlapping
const clickSfx = new Audio('sounds/main.mp3');
const bgMusic = new Audio('sounds/bgmusic.mp3');
bgMusic.loop = true;

let soundEnabled = true;

function playClick() {
  if (!soundEnabled) return;
  clickSfx.currentTime = 0; // Reset sound position to avoid overlap
  clickSfx.play().catch(() => {});
}

function toggleSound(enabled) {
  soundEnabled = enabled;
  if (!enabled) {
    bgMusic.pause();
    clickSfx.pause();
  } else {
    bgMusic.play().catch(() => {});
  }
}
