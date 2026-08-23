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
  backFromChallenge.addEventListener("click", closeExtraChallenge);
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
  if (number > EXTRA_CHALLENGE_TOTAL) number = 1;

  currentChallenge = number;

  challengeMoves = 0;
  challengeSeconds = 0;
  challengeStarted = false;
  challengeSolved = false;

  stopChallengeTimer();
  destroyChallengeVideo();

  updateChallengeUI();

  if (challengeTitle) {
    challengeTitle.textContent =
      `CHALLENGE ${String(number).padStart(2, "0")}`;
  }

  createVideoPuzzle(number);
}


/* =========================================================
   CREATE MASTER VIDEO
   ========================================================= */

function createVideoPuzzle(number) {

  if (!challengePuzzleGrid) return;

  challengePuzzleGrid.innerHTML = "";
  challengeTiles = [];

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
     The visible puzzle tiles use this video as
     their source.
  */

  challengeVideo.style.position = "fixed";
  challengeVideo.style.left = "-9999px";
  challengeVideo.style.top = "0";
  challengeVideo.style.width = "1px";
  challengeVideo.style.height = "1px";
  challengeVideo.style.opacity = "0";
  challengeVideo.style.pointerEvents = "none";

  document.body.appendChild(challengeVideo);

  challengeVideo.addEventListener(
    "loadeddata",
    () => {

      challengeVideo.play().catch(() => {});

      buildChallengeTiles();

      shuffleChallengeTiles();

      updateChallengeUI();

    },
    { once: true }
  );

  challengeVideo.addEventListener("error", () => {

    console.error(
      `Unable to load image/challenge${number}.webm`
    );

  });

  challengeVideo.load();
}


/* =========================================================
   BUILD 3 × 3 VIDEO PUZZLE
   ========================================================= */

function buildChallengeTiles() {

  if (!challengePuzzleGrid || !challengeVideo) return;

  challengePuzzleGrid.innerHTML = "";
  challengeTiles = [];

  for (let i = 0; i < 9; i++) {

    const tile =
      document.createElement("div");

    tile.className =
      "tile challenge-video-tile";

    tile.dataset.correctPosition = i;

    tile.dataset.currentPosition = i;

    /*
       Each tile contains its own video.
       Every video plays the same challenge file.
    */

    const video =
      document.createElement("video");

    video.src = challengeVideo.src;

    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = "auto";

    /*
       The video is enlarged to 300%.
       This allows each tile to display
       one third of the original video.
    */

    video.style.position = "absolute";
    video.style.width = "300%";
    video.style.height = "300%";
    video.style.maxWidth = "none";
    video.style.maxHeight = "none";
    video.style.objectFit = "cover";
    video.style.pointerEvents = "none";

    const row =
      Math.floor(i / 3);

    const col =
      i % 3;

    video.style.left =
      `${-col * 100}%`;

    video.style.top =
      `${-row * 100}%`;

    /*
       Make sure the tile clips
       everything outside itself.
    */

    tile.style.position = "relative";
    tile.style.overflow = "hidden";

    tile.appendChild(video);

    challengePuzzleGrid.appendChild(tile);

    challengeTiles.push(tile);

    video.addEventListener(
      "loadeddata",
      () => {

        if (challengeVideo) {

          try {
            video.currentTime =
              challengeVideo.currentTime;
          } catch (error) {}

        }

        video.play().catch(() => {});

      },
      { once: true }
    );
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
   KEEP VIDEO TILES SYNCHRONIZED
   ========================================================= */

const challengeVideoSync =
  setInterval(() => {

    if (
      !challengeVideo ||
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

  }, 250);


/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffleChallengeTiles() {

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

  challengePuzzleGrid.innerHTML = "";

  shuffled.forEach(
    (tile, position) => {

      tile.dataset.currentPosition =
        position;

      challengePuzzleGrid.appendChild(tile);

    }
  );

  challengeTiles = shuffled;

  challengeSolved = false;
}


/* =========================================================
   CHECK SOLVED ORDER
   ========================================================= */

function isChallengeSolvedOrder(tiles) {

  return tiles.every(
    (tile, index) =>
      Number(
        tile.dataset.correctPosition
      ) === index
  );
}


/* =========================================================
   TILE CLICK
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

      const clickedIndex =
        challengeTiles.indexOf(tile);

      if (clickedIndex === -1) return;

      /*
         Start timer on first move.
      */

      if (!challengeStarted) {

        challengeStarted = true;

        startChallengeTimer();
      }

      /*
         Keep your current behavior:
         tapping a tile swaps it with
         one random adjacent tile.
      */

      const possibleMoves =
        getAdjacentChallengePositions(
          clickedIndex
        );

      if (!possibleMoves.length) return;

      const swapIndex =
        possibleMoves[
          Math.floor(
            Math.random() *
            possibleMoves.length
          )
        ];

      swapChallengeTiles(
        clickedIndex,
        swapIndex
      );
    }
  );
}


/* =========================================================
   GET ADJACENT POSITIONS
   ========================================================= */

function getAdjacentChallengePositions(index) {

  const row =
    Math.floor(index / 3);

  const col =
    index % 3;

  const positions = [];

  if (row > 0) {
    positions.push(index - 3);
  }

  if (row < 2) {
    positions.push(index + 3);
  }

  if (col > 0) {
    positions.push(index - 1);
  }

  if (col < 2) {
    positions.push(index + 1);
  }

  return positions;
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

  if (!firstTile || !secondTile) return;

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

      challengePuzzleGrid.appendChild(tile);

    }
  );

  challengeMoves++;

  updateChallengeUI();

  checkChallengeSolved();
}


/* =========================================================
   CHECK VICTORY
   ========================================================= */

function checkChallengeSolved() {

  const solved =
    challengeTiles.every(
      (tile, index) =>
        Number(
          tile.dataset.correctPosition
        ) === index
    );

  if (!solved) return;

  challengeSolved = true;

  stopChallengeTimer();

  setTimeout(() => {

    handleChallengeVictory();

  }, 500);
}


/* =========================================================
   VICTORY
   ========================================================= */

function handleChallengeVictory() {

  console.log(
    `Extra Challenge ${currentChallenge} completed!`
  );

  /*
     Use your existing victory screen
     if one is available.
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

  if (challengeTimerInterval) {

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

      shuffleChallengeTiles();

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

  if (
    !challengeVideo ||
    !challengePuzzleGrid
  ) {
    return;
  }

  /*
     Don't allow multiple previews.
  */

  if (
    challengePuzzleGrid.querySelector(
      ".challenge-full-preview-video"
    )
  ) {
    return;
  }

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

  previewVideo.style.width = "100%";
  previewVideo.style.height = "100%";
  previewVideo.style.objectFit = "cover";
  previewVideo.style.display = "block";

  challengePuzzleGrid.appendChild(
    previewVideo
  );

  previewVideo.currentTime =
    challengeVideo.currentTime;

  previewVideo.play().catch(() => {});

  setTimeout(() => {

    previewVideo.remove();

    challengeTiles.forEach(tile => {
      tile.style.display = "";
    });

    synchronizeChallengeVideos();

  }, 3000);
}


/* =========================================================
   CLEANUP
   ========================================================= */

function destroyChallengeVideo() {

  stopChallengeTimer();

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

  if (challengePuzzleGrid) {
    challengePuzzleGrid.innerHTML = "";
  }
}


/* =========================================================
   START AT CHALLENGE 1
   ========================================================= */

currentChallenge = 1;
