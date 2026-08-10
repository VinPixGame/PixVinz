/* =========================================================
   PIXVINZ — GAME.JS
   Mobile-first sliding puzzle
   ========================================================= */

(() => {
  "use strict";

  const CONFIG = {
    size: 3,
    shuffleMoves: 80,
    coinReward: 25,

    images: [
      "images/level1.jpeg",
      "images/level2.jpeg",
      "images/level3.jpeg",
      "images/level4.jpeg",
      "images/level5.jpeg",
      "images/level6.jpeg"
    ]
  };

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const dom = {
    board: $("#gameBoard, .game-board, [data-game-board]"),
    shuffle: $("#shuffleBtn, #shuffleButton, [data-action='shuffle']"),

    moves: $("#moves, #moveCount, [data-stat='moves']"),
    time: $("#timer, #time, [data-stat='time']"),
    coins: $("#coins, #coinCount, [data-stat='coins']"),

    progress: $("#progress, #progressBar, [data-progress]"),

    collection:
      $("#collection, .collection-grid, [data-collection]"),

    victory:
      $("#victoryModal, #winModal, [data-victory-modal]"),

    victoryMoves:
      $("#victoryMoves, [data-victory='moves']"),

    victoryTime:
      $("#victoryTime, [data-victory='time']"),

    victoryCoins:
      $("#victoryCoins, [data-victory='coins']"),

    playAgain:
      $("#playAgain, #nextPuzzle, [data-action='play-again']"),

    closeVictory:
      $("#closeVictory, [data-action='close-victory']"),

    image:
      $("#puzzleImage, [data-puzzle-image]")
  };

  const STORAGE = {
    coins: "pixvinz_coins",
    solved: "pixvinz_solved",
    puzzle: "pixvinz_current_puzzle",
    bestTime: "pixvinz_best_time"
  };

  let state = {
    puzzleIndex:
      Number(localStorage.getItem(STORAGE.puzzle)) || 0,

    coins:
      Number(localStorage.getItem(STORAGE.coins)) || 0,

    solved:
      Number(localStorage.getItem(STORAGE.solved)) || 0,

    moves: 0,
    seconds: 0,

    started: false,
    locked: false,

    timerId: null,
    tiles: []
  };

  /* -------------------------------------------------------
     IMAGE
  ------------------------------------------------------- */

  function getImages() {
    if (
      Array.isArray(window.PIXVINZ_IMAGES) &&
      window.PIXVINZ_IMAGES.length
    ) {
      return window.PIXVINZ_IMAGES;
    }

    return CONFIG.images;
  }

  function getCurrentImage() {
    const images = getImages();

    return images[
      state.puzzleIndex % images.length
    ];
  }

  /* -------------------------------------------------------
     STORAGE
  ------------------------------------------------------- */

  function saveState() {
    localStorage.setItem(
      STORAGE.coins,
      String(state.coins)
    );

    localStorage.setItem(
      STORAGE.solved,
      String(state.solved)
    );

    localStorage.setItem(
      STORAGE.puzzle,
      String(state.puzzleIndex)
    );
  }

  /* -------------------------------------------------------
     TIMER
  ------------------------------------------------------- */

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return (
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );
  }

  function startTimer() {
    if (state.timerId || state.locked) return;

    state.started = true;

    state.timerId = setInterval(() => {
      state.seconds++;
      updateStats();
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
  }

  /* -------------------------------------------------------
     STATS
  ------------------------------------------------------- */

  function updateStats() {
    if (dom.moves) {
      dom.moves.textContent = state.moves;
    }

    if (dom.time) {
      dom.time.textContent =
        formatTime(state.seconds);
    }

    if (dom.coins) {
      dom.coins.textContent = state.coins;
    }

    const total =
      Math.max(getImages().length, 1);

    const percent = Math.min(
      100,
      Math.round(
        (state.solved / total) * 100
      )
    );

    if (dom.progress) {
      dom.progress.style.setProperty(
        "--progress",
        `${percent}%`
      );

      if ("value" in dom.progress) {
        dom.progress.value = percent;
      }
    }

    document
      .querySelectorAll("[data-stat='solved']")
      .forEach(el => {
        el.textContent = state.solved;
      });

    document
      .querySelectorAll("[data-stat='progress']")
      .forEach(el => {
        el.textContent = `${percent}%`;
      });
  }

  /* -------------------------------------------------------
     PUZZLE LOGIC
  ------------------------------------------------------- */

  function solvedBoard() {
    return Array.from(
      {
        length:
          CONFIG.size * CONFIG.size
      },
      (_, index) => index
    );
  }

  function getNeighbors(position) {
    const result = [];

    const row =
      Math.floor(position / CONFIG.size);

    const column =
      position % CONFIG.size;

    if (row > 0) {
      result.push(
        position - CONFIG.size
      );
    }

    if (row < CONFIG.size - 1) {
      result.push(
        position + CONFIG.size
      );
    }

    if (column > 0) {
      result.push(position - 1);
    }

    if (column < CONFIG.size - 1) {
      result.push(position + 1);
    }

    return result;
  }

  function isSolved() {
    return state.tiles.every(
      (value, index) =>
        value === index
    );
  }

  function shuffleBoard() {
    state.tiles = solvedBoard();

    let blank =
      state.tiles.length - 1;

    let previous = -1;

    for (
      let i = 0;
      i < CONFIG.shuffleMoves;
      i++
    ) {
      let choices =
        getNeighbors(blank)
          .filter(
            position =>
              position !== previous
          );

      if (!choices.length) {
        choices =
          getNeighbors(blank);
      }

      const target =
        choices[
          Math.floor(
            Math.random() *
            choices.length
          )
        ];

      [
        state.tiles[blank],
        state.tiles[target]
      ] = [
        state.tiles[target],
        state.tiles[blank]
      ];

      previous = blank;
      blank = target;
    }

    if (isSolved()) {
      const target =
        getNeighbors(blank)[0];

      [
        state.tiles[blank],
        state.tiles[target]
      ] = [
        state.tiles[target],
        state.tiles[blank]
      ];
    }
  }

  /* -------------------------------------------------------
     BOARD
  ------------------------------------------------------- */

  function renderBoard() {
    if (!dom.board) return;

    dom.board.innerHTML = "";

    dom.board.style.setProperty(
      "--grid-size",
      CONFIG.size
    );

    const fragment =
      document.createDocumentFragment();

    const lastTile =
      CONFIG.size * CONFIG.size - 1;

    state.tiles.forEach(
      (tileValue, position) => {

        const tile =
          document.createElement("button");

        tile.type = "button";

        tile.className =
          "puzzle-tile";

        tile.dataset.position =
          position;

        tile.dataset.value =
          tileValue;

        if (tileValue === lastTile) {

          tile.classList.add(
            "is-empty"
          );

          tile.disabled = true;

        } else {

          const row =
            Math.floor(
              tileValue /
              CONFIG.size
            );

          const column =
            tileValue %
            CONFIG.size;

          tile.style.backgroundImage =
            `url("${getCurrentImage()}")`;

          const percentage =
            100 /
            (CONFIG.size - 1);

          tile.style.backgroundPosition =
            `${column * percentage}% ${row * percentage}%`;

          tile.addEventListener(
            "click",
            () => moveTile(position)
          );
        }

        fragment.appendChild(tile);
      }
    );

    dom.board.appendChild(
      fragment
    );
  }

  /* -------------------------------------------------------
     MOVE
  ------------------------------------------------------- */

  function moveTile(position) {
    if (state.locked) return;

    const blank =
      state.tiles.indexOf(
        CONFIG.size *
        CONFIG.size -
        1
      );

    if (
      !getNeighbors(blank)
        .includes(position)
    ) {
      return;
    }

    if (!state.started) {
      startTimer();
    }

    [
      state.tiles[blank],
      state.tiles[position]
    ] = [
      state.tiles[position],
      state.tiles[blank]
    ];

    state.moves++;

    renderBoard();
    updateStats();

    if (isSolved()) {
      finishPuzzle();
    }
  }

  /* -------------------------------------------------------
     NEW GAME
  ------------------------------------------------------- */

  function newPuzzle() {
    stopTimer();

    state.moves = 0;
    state.seconds = 0;

    state.started = false;
    state.locked = false;

    shuffleBoard();

    renderBoard();
    updateStats();

    if (dom.image) {
      dom.image.src =
        getCurrentImage();
    }

    closeVictory();
  }

  /* -------------------------------------------------------
     VICTORY
  ------------------------------------------------------- */

  function finishPuzzle() {
    state.locked = true;

    stopTimer();

    const reward =
      CONFIG.coinReward +
      Math.max(
        0,
        15 -
        Math.floor(
          state.moves / 10
        )
      );

    state.coins += reward;
    state.solved++;

    const best =
      Number(
        localStorage.getItem(
          STORAGE.bestTime
        )
      ) || 0;

    if (
      !best ||
      state.seconds < best
    ) {
      localStorage.setItem(
        STORAGE.bestTime,
        String(state.seconds)
      );
    }

    saveState();
    updateStats();
    renderCollection();

    if (dom.victoryMoves) {
      dom.victoryMoves.textContent =
        state.moves;
    }

    if (dom.victoryTime) {
      dom.victoryTime.textContent =
        formatTime(state.seconds);
    }

    if (dom.victoryCoins) {
      dom.victoryCoins.textContent =
        `+${reward}`;
    }

    openVictory();
  }

  function openVictory() {
    if (!dom.victory) return;

    dom.victory.hidden = false;

    requestAnimationFrame(() => {
      dom.victory.classList.add(
        "is-open"
      );
    });

    document.body.classList.add(
      "modal-open"
    );
  }

  function closeVictory() {
    if (!dom.victory) return;

    dom.victory.classList.remove(
      "is-open"
    );

    dom.victory.hidden = true;

    document.body.classList.remove(
      "modal-open"
    );
  }

  /* -------------------------------------------------------
     NEXT PUZZLE
  ------------------------------------------------------- */

  function nextPuzzle() {
    const images = getImages();

    state.puzzleIndex =
      (
        state.puzzleIndex + 1
      ) % images.length;

    saveState();
    newPuzzle();
  }

  /* -------------------------------------------------------
     COLLECTION
  ------------------------------------------------------- */

  function renderCollection() {
    if (!dom.collection) return;

    const images = getImages();

    dom.collection.innerHTML = "";

    images.forEach(
      (src, index) => {

        const item =
          document.createElement("button");

        item.type = "button";

        item.className =
          "collection-item";

        item.classList.toggle(
          "is-current",
          index === state.puzzleIndex
        );

        item.classList.toggle(
          "is-unlocked",
          index <= state.solved
        );

        const image =
          document.createElement("img");

        image.src = src;

        image.alt =
          `PixVinz Puzzle ${index + 1}`;

        image.loading = "lazy";

        const label =
          document.createElement("span");

        label.textContent =
          index <= state.solved
            ? `Puzzle ${index + 1}`
            : `Locked ${index + 1}`;

        item.appendChild(image);
        item.appendChild(label);

        if (index <= state.solved) {
          item.addEventListener(
            "click",
            () => {

              state.puzzleIndex =
                index;

              saveState();

              newPuzzle();
            }
          );
        }

        dom.collection.appendChild(
          item
        );
      }
    );

    document
      .querySelectorAll(
        "[data-collection-progress]"
      )
      .forEach(el => {
        el.textContent =
          `${Math.min(
            state.solved,
            images.length
          )} / ${images.length}`;
      });
  }

  /* -------------------------------------------------------
     KEYBOARD
  ------------------------------------------------------- */

  function keyboardControls(event) {
    if (state.locked) return;

    const blank =
      state.tiles.indexOf(
        CONFIG.size *
        CONFIG.size -
        1
      );

    const row =
      Math.floor(
        blank / CONFIG.size
      );

    const column =
      blank % CONFIG.size;

    let target = -1;

    if (
      event.key === "ArrowUp" &&
      row <
        CONFIG.size - 1
    ) {
      target =
        blank + CONFIG.size;
    }

    if (
      event.key === "ArrowDown" &&
      row > 0
    ) {
      target =
        blank - CONFIG.size;
    }

    if (
      event.key === "ArrowLeft" &&
      column <
        CONFIG.size - 1
    ) {
      target =
        blank + 1;
    }

    if (
      event.key === "ArrowRight" &&
      column > 0
    ) {
      target =
        blank - 1;
    }

    if (target >= 0) {
      event.preventDefault();
      moveTile(target);
    }
  }

  /* -------------------------------------------------------
     EVENTS
  ------------------------------------------------------- */

  function bindEvents() {

    if (dom.shuffle) {
      dom.shuffle.addEventListener(
        "click",
        newPuzzle
      );
    }

    if (dom.playAgain) {
      dom.playAgain.addEventListener(
        "click",
        nextPuzzle
      );
    }

    if (dom.closeVictory) {
      dom.closeVictory.addEventListener(
        "click",
        closeVictory
      );
    }

    if (dom.victory) {
      dom.victory.addEventListener(
        "click",
        event => {
          if (
            event.target ===
            dom.victory
          ) {
            closeVictory();
          }
        }
      );
    }

    document.addEventListener(
      "keydown",
      keyboardControls
    );
  }

  /* -------------------------------------------------------
     MOBILE VIEWPORT FIT
  ------------------------------------------------------- */

  function updateViewportHeight() {

    const viewportHeight =
      window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;

    document.documentElement.style.setProperty(
      "--pv-vh",
      `${viewportHeight}px`
    );
  }

  /* -------------------------------------------------------
     PUBLIC API
  ------------------------------------------------------- */

  window.PixVinz = {

    newGame: newPuzzle,

    shuffle: newPuzzle,

    nextPuzzle,

    setPuzzle(index) {
      const images = getImages();

      if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= images.length
      ) {
        return;
      }

      state.puzzleIndex = index;

      saveState();
      newPuzzle();
    },

    getState() {
      return {
        ...state,
        tiles: [
          ...state.tiles
        ]
      };
    }
  };

  /* -------------------------------------------------------
     INIT
  ------------------------------------------------------- */

  function init() {

    updateViewportHeight();

    if (!dom.board) {
      console.warn(
        "PixVinz: game board not found."
      );
      return;
    }

    bindEvents();
    renderCollection();
    newPuzzle();

    window.addEventListener(
      "resize",
      updateViewportHeight,
      { passive: true }
    );

    if (
      window.visualViewport
    ) {
      window.visualViewport.addEventListener(
        "resize",
        updateViewportHeight,
        { passive: true }
      );
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();
