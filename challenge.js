/* =========================================================
   EXTRA CHALLENGE — MOVING VIDEO PUZZLE
   challenge1.webm → challenge100.webm
   ========================================================= */

const EXTRA_CHALLENGE_TOTAL = 100;

let currentChallenge = 1;
let challengeMoves = 0;
let challengeSeconds = 0;
let challengeTimerInterval = null;

let challengeStarted = false;
let challengeSolved = false;

let challengeTiles = [];
let challengeVideo = null;

let selectedChallengeTile = null;
let previewTimeout = null;


/* =========================================================
   ELEMENTS
   ========================================================= */

const navChallenge =
  document.getElementById("navChallenge");

const challengeView =
  document.getElementById("challengeView");

const backFromChallenge =
  document.getElementById("backFromChallenge");

const challengePuzzleGrid =
  document.getElementById("challengePuzzleGrid");

const challengeTitle =
  document.getElementById("challengeTitle");

const challengeTimer =
  document.getElementById("challengeTimer");

const challengeMovesDisplay =
  document.getElementById("challengeMoves");

const challengePreviewBtn =
  document.getElementById("challengePreviewBtn");

const challengeShuffleBtn =
  document.getElementById("challengeShuffleBtn");


/* =========================================================
   NAVIGATION
   ========================================================= */

if (navChallenge) {
  navChallenge.addEventListener("click", openExtraChallenge);
}

if (backFromChallenge) {
  backFromChallenge.addEventListener(
    "click",
    closeExtraChallenge
  );
}


function openExtraChallenge() {

  if (!challengeView) return;

  document.querySelectorAll(".view").forEach(view => {
    view.classList.remove("active");
  });

  challengeView.classList.add("active");

  loadExtraChallenge(currentChallenge);
}


function closeExtraChallenge() {

  stopChallengeTimer();

  clearPreview();

  destroyChallengeVideo();

  if (challengeView) {
    challengeView.classList.remove("active");
  }

  const homeView =
    document.getElementById("homeView");

  if (homeView) {

    document.querySelectorAll(".view").forEach(view => {
      view.classList.remove("active");
    });

    homeView.classList.add("active");
  }
}


/* =========================================================
   LOAD CHALLENGE
   ========================================================= */

function loadExtraChallenge(number) {

  if (number < 1) number = 1;

  if (number > EXTRA_CHALLENGE_TOTAL) {
    number = 1;
  }

  currentChallenge = number;

  challengeMoves = 0;
  challengeSeconds = 0;

  challengeStarted = false;
  challengeSolved = false;

  selectedChallengeTile = null;

  stopChallengeTimer();
  clearPreview();
  destroyChallengeVideo();

  updateChallengeUI();

  if (challengeTitle) {

    challengeTitle.textContent =
      `CHALLENGE ${String(number).padStart(2, "0")}`;
  }

  createChallengeVideo(number);
}


/* =========================================================
   CREATE VIDEO
   ========================================================= */

function createChallengeVideo(number) {

  if (!challengePuzzleGrid) return;

  challengePuzzleGrid.innerHTML = "";

  challengeVideo =
    document.createElement("video");

  challengeVideo.src =
    `image/challenge${number}.webm`;

  challengeVideo.muted = true;
  challengeVideo.loop = true;
  challengeVideo.autoplay = true;
  challengeVideo.playsInline = true;
  challengeVideo.preload = "auto";

  /*
     Hidden master video.
     The visible puzzle tiles use this
     video's current frame.
  */

  challengeVideo.style.position = "fixed";
  challengeVideo.style.width = "1px";
  challengeVideo.style.height = "1px";
  challengeVideo.style.opacity = "0";
  challengeVideo.style.pointerEvents = "none";

  document.body.appendChild(challengeVideo);

  challengeVideo.addEventListener(
    "loadeddata",
    () => {

      challengeVideo.play().catch(() => {});

      buildChallengePuzzle();

      shuffleChallengePuzzle();

    },
    { once: true }
  );

  challengeVideo.addEventListener(
    "error",
    () => {

      console.error(
        `Unable to load image/challenge${number}.webm`
      );

      if (challengeTitle) {

        challengeTitle.textContent =
          `CHALLENGE ${String(number).padStart(2, "0")}`;
      }
    }
  );

  challengeVideo.load();
}


/* =========================================================
   BUILD 3 × 3 PUZZLE
   ========================================================= */

function buildChallengePuzzle() {

  if (!challengePuzzleGrid) return;

  challengePuzzleGrid.innerHTML = "";

  challengeTiles = [];

  for (let correctPosition = 0; correctPosition < 9; correctPosition++) {

    const tile =
      document.createElement("div");

    tile.className =
      "tile challenge-video-tile";

    tile.dataset.correctPosition =
      correctPosition;

    tile.dataset.currentPosition =
      correctPosition;

    /*
       The tile displays the moving video
       through a video element.
    */

    const video =
      document.createElement("video");

    video.src =
      challengeVideo.src;

    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "auto";

    video.style.position = "absolute";

    video.style.width = "300%";
    video.style.height = "300%";

    video.style.maxWidth = "none";
    video.style.maxHeight = "none";

    video.style.objectFit = "cover";

    /*
       Correct location of this piece.
    */

    const row =
      Math.floor(correctPosition / 3);

    const col =
      correctPosition % 3;

    video.style.left =
      `${-col * 100}%`;

    video.style.top =
      `${-row * 100}%`;

    tile.style.position = "relative";
    tile.style.overflow = "hidden";
    tile.style.cursor = "pointer";

    tile.appendChild(video);

    challengePuzzleGrid.appendChild(tile);

    challengeTiles.push(tile);

    video.play().catch(() => {});
  }

  synchronizeChallengeVideos();
}


/* =========================================================
   SYNCHRONIZE VIDEO TILES
   ========================================================= */

function synchronizeChallengeVideos() {

  if (!challengeVideo) return;

  const masterTime =
    challengeVideo.currentTime;

  challengeTiles.forEach(tile => {

    const video =
      tile.querySelector("video");

    if (!video) return;

    try {
      video.currentTime = masterTime;
    } catch (error) {}

    video.play().catch(() => {});
  });
}


/* =========================================================
   KEEP VIDEO SYNCHRONIZED
   ========================================================= */

setInterval(() => {

  if (!challengeVideo) return;

  if (
    challengeVideo.paused ||
    challengeVideo.readyState < 2
  ) {
    return;
  }

  const masterTime =
    challengeVideo.currentTime;

  challengeTiles.forEach(tile => {

    const video =
      tile.querySelector("video");

    if (!video) return;

    if (
      Math.abs(
        video.currentTime - masterTime
      ) > 0.08
    ) {

      try {
        video.currentTime = masterTime;
      } catch (error) {}
    }

    if (video.paused) {
      video.play().catch(() => {});
    }
  });

}, 200);


/* =========================================================
   SHUFFLE PUZZLE
   ========================================================= */

function shuffleChallengePuzzle() {

  if (challengeTiles.length !== 9) return;

  let shuffled;

  do {

    shuffled =
      [...challengeTiles];

    for (
      let i = shuffled.length - 1;
      i > 0;
      i--
    ) {

      const j =
        Math.floor(
          Math.random() * (i + 1)
        );

      [
        shuffled[i],
        shuffled[j]
      ] = [
        shuffled[j],
        shuffled[i]
      ];
    }

  } while (
    isChallengeSolvedOrder(shuffled)
  );

  challengeTiles =
    shuffled;

  challengePuzzleGrid.innerHTML = "";

  challengeTiles.forEach(
    (tile, index) => {

      tile.dataset.currentPosition =
        index;

      tile.classList.remove(
        "selected"
      );

      challengePuzzleGrid.appendChild(tile);
    }
  );

  selectedChallengeTile = null;
  challengeSolved = false;
}


/* =========================================================
   CHECK SOLVED ORDER
   ========================================================= */

function isChallengeSolvedOrder(
  tiles
) {

  return tiles.every(
    (tile, index) => {

      return (
        Number(
          tile.dataset.correctPosition
        ) === index
      );

    }
  );
}


/* =========================================================
   TILE SELECTION
   ========================================================= */

if (challengePuzzleGrid) {

  challengePuzzleGrid.addEventListener(
    "click",
    event => {

      const tile =
        event.target.closest(
          ".challenge-video-tile"
        );

      if (!tile) return;

      if (challengeSolved) return;

      /*
         First tap = select.
      */

      if (!selectedChallengeTile) {

        selectedChallengeTile =
          tile;

        tile.classList.add(
          "selected"
        );

        return;
      }

      /*
         Tapping the same tile cancels selection.
      */

      if (
        selectedChallengeTile === tile
      ) {

        tile.classList.remove(
          "selected"
        );

        selectedChallengeTile = null;

        return;
      }

      /*
         Second tap = swap.
      */

      const firstIndex =
        challengeTiles.indexOf(
          selectedChallengeTile
        );

      const secondIndex =
        challengeTiles.indexOf(tile);

      if (
        firstIndex === -1 ||
        secondIndex === -1
      ) {
        selectedChallengeTile = null;
        return;
      }

      /*
         Start timer on first actual move.
      */

      if (!challengeStarted) {

        challengeStarted = true;

        startChallengeTimer();
      }

      swapChallengeTiles(
        firstIndex,
        secondIndex
      );

      selectedChallengeTile = null;
    }
  );
}


/* =========================================================
   SWAP TILES
   ========================================================= */

function swapChallengeTiles(
  firstIndex,
  secondIndex
) {

  const firstTile =
    challengeTiles[firstIndex];

  const secondTile =
    challengeTiles[secondIndex];

  if (!firstTile || !secondTile) {
    return;
  }

  [
    challengeTiles[firstIndex],
    challengeTiles[secondIndex]
  ] = [
    challengeTiles[secondIndex],
    challengeTiles[firstIndex]
  ];

  challengePuzzleGrid.innerHTML = "";

  challengeTiles.forEach(
    (tile, index) => {

      tile.dataset.currentPosition =
        index;

      tile.classList.remove(
        "selected"
      );

      challengePuzzleGrid.appendChild(
        tile
      );
    }
  );

  challengeMoves++;

  updateChallengeUI();

  checkChallengeSolved();
}


/* =========================================================
   CHECK IF SOLVED
   ========================================================= */

function checkChallengeSolved() {

  const solved =
    challengeTiles.every(
      (tile, index) => {

        return (
          Number(
            tile.dataset.correctPosition
          ) === index
        );

      }
    );

  if (!solved) return;

  challengeSolved = true;

  stopChallengeTimer();

  /*
     Small delay so the player can see
     the completed moving video.
  */

  setTimeout(
    handleChallengeVictory,
    700
  );
}


/* =========================================================
   VICTORY
   ========================================================= */

function handleChallengeVictory() {

  console.log(
    `Extra Challenge ${currentChallenge} completed!`
  );

  /*
     Use your existing victory system
     if your game already has one.
  */

  if (
    typeof showVictoryScreen ===
    "function"
  ) {

    showVictoryScreen(
      currentChallenge,
      challengeSeconds,
      challengeMoves
    );

    return;
  }

  if (
    typeof showVictory ===
    "function"
  ) {

    showVictory(
      currentChallenge,
      challengeSeconds,
      challengeMoves
    );

    return;
  }

  /*
     Fallback.
  */

  if (
    currentChallenge <
    EXTRA_CHALLENGE_TOTAL
  ) {

    currentChallenge++;

    loadExtraChallenge(
      currentChallenge
    );

  } else {

    alert(
      "Congratulations! You completed all 100 Extra Challenges!"
    );
  }
}


/* =========================================================
   TIMER
   ========================================================= */

function startChallengeTimer() {

  stopChallengeTimer();

  challengeTimerInterval =
    setInterval(() => {

      challengeSeconds++;

      updateChallengeTimer();

    }, 1000);
}


function stopChallengeTimer() {

  if (
    challengeTimerInterval
  ) {

    clearInterval(
      challengeTimerInterval
    );

    challengeTimerInterval = null;
  }
}


function updateChallengeTimer() {

  if (!challengeTimer) return;

  const minutes =
    Math.floor(
      challengeSeconds / 60
    );

  const seconds =
    challengeSeconds % 60;

  challengeTimer.textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


/* =========================================================
   UPDATE UI
   ========================================================= */

function updateChallengeUI() {

  updateChallengeTimer();

  if (challengeMovesDisplay) {

    challengeMovesDisplay.textContent =
      challengeMoves;
  }
}


/* =========================================================
   SHUFFLE BUTTON
   ========================================================= */

if (challengeShuffleBtn) {

  challengeShuffleBtn.addEventListener(
    "click",
    () => {

      if (challengeSolved) return;

      shuffleChallengePuzzle();

      challengeMoves = 0;
      challengeSeconds = 0;

      challengeStarted = false;

      stopChallengeTimer();

      updateChallengeUI();
    }
  );
}


/* =========================================================
   PREVIEW BUTTON
   ========================================================= */

if (challengePreviewBtn) {

  challengePreviewBtn.addEventListener(
    "click",
    showChallengePreview
  );
}


function showChallengePreview() {

  if (!challengeVideo) return;

  clearPreview();

  challengePuzzleGrid.classList.add(
    "challenge-preview-mode"
  );

  challengeTiles.forEach(tile => {

    tile.style.display = "none";

  });

  const previewVideo =
    document.createElement("video");

  previewVideo.src =
    challengeVideo.src;

  previewVideo.muted = true;
  previewVideo.autoplay = true;
  previewVideo.loop = true;
  previewVideo.playsInline = true;

  previewVideo.className =
    "challenge-full-preview-video";

  challengePuzzleGrid.appendChild(
    previewVideo
  );

  /*
     Start preview from the same
     point as the puzzle.
  */

  const setPreviewTime = () => {

    try {
      previewVideo.currentTime =
        challengeVideo.currentTime;
    } catch (error) {}

    previewVideo.play().catch(() => {});
  };

  if (
    previewVideo.readyState >= 2
  ) {

    setPreviewTime();

  } else {

    previewVideo.addEventListener(
      "loadeddata",
      setPreviewTime,
      { once: true }
    );
  }

  /*
     Preview for 3 seconds.
  */

  previewTimeout =
    setTimeout(() => {

      clearPreview();

      synchronizeChallengeVideos();

    }, 3000);
}


/* =========================================================
   CLEAR PREVIEW
   ========================================================= */

function clearPreview() {

  if (previewTimeout) {

    clearTimeout(
      previewTimeout
    );

    previewTimeout = null;
  }

  if (!challengePuzzleGrid) {
    return;
  }

  const preview =
    challengePuzzleGrid.querySelector(
      ".challenge-full-preview-video"
    );

  if (preview) {

    preview.pause();
    preview.remove();
  }

  challengeTiles.forEach(tile => {

    tile.style.display = "";

  });

  challengePuzzleGrid.classList.remove(
    "challenge-preview-mode"
  );
}


/* =========================================================
   CLEANUP
   ========================================================= */

function destroyChallengeVideo() {

  if (challengeVideo) {

    challengeVideo.pause();

    challengeVideo.removeAttribute(
      "src"
    );

    challengeVideo.load();

    challengeVideo.remove();

    challengeVideo = null;
  }

  challengeTiles = [];

  selectedChallengeTile = null;

  if (challengePuzzleGrid) {

    challengePuzzleGrid.innerHTML = "";
  }
}


/* =========================================================
   START AT CHALLENGE 1
   ========================================================= */

currentChallenge = 1;
