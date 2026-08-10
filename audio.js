// Global Audio Handler
const bgAudio = new Audio('sounds/bgmusic.mp3');
bgAudio.loop = true;
let soundEnabled = true;

function playClick() {
    if (!soundEnabled) return;
    const clickAudio = new Audio('sounds/main.mp3');
    clickAudio.play().catch(() => {});
}

function toggleSound(enabled) {
    soundEnabled = enabled;
    if (!enabled) {
        bgAudio.pause();
    } else {
        bgAudio.play().catch(() => {});
    }
}
