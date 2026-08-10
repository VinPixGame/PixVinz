/* =========================================================
   PIXVINZ PUZZLE ENGINE
   game.js

   RESPONSIBILITY:
   - Read current level
   - Load puzzle image
   - Determine grid size
   - Create/shuffle puzzle pieces
   - Handle player moves
   - Timer
   - Detect completion
   - Calculate stars
   - Display victory information

   DOES NOT:
   - Handle login
   - Handle account creation
   - Handle permanent save data
   - Handle coins database/progression
   - Handle global audio
   - Generate the 200 level list
========================================================= */

"use strict";


/* =========================================================
   GAME STATE
========================================================= */

const PixVinzGame = {

    level: 1,

    gridSize: 3,

    totalPieces: 9,

    pieces: [],

    selectedIndex: null,

    moves: 0,

    elapsedSeconds: 0,

    timerInterval: null,

    gameStarted: false,

    gameFinished: false

};


/* =========================================================
   DOM ELEMENTS
========================================================= */

const gameElements = {

    board: null,

    levelNumber: null,

    timer: null,

    moveCount: null,

    gameMessage: null,

    gameCoinCount: null,

    victoryModal: null,

    victoryImage: null,

    victoryStars: null,

    victoryTime: null,

    victoryMoves: null,

    bestTime: null,

    bestMoves: null,

    bestStars: null,

    coinsEarned: null,

    nextLevelButton: null,

    replayLevelButton: null,

    levelsButton: null,

    shuffleButton: null,

    restartButton: null,

    backButton: null,

    victoryCloseButton: null

};


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeGame
);


function initializeGame() {

    cacheGameElements();

    PixVinzGame.level = getRequestedLevel();

    PixVinzGame.gridSize =
        getGridSize(PixVinzGame.level);

    PixVinzGame.totalPieces =
        PixVinzGame.gridSize *
        PixVinzGame.gridSize;

    updateLevelDisplay();

    attachGameEvents();

    loadPuzzle();

}


/* =========================================================
   CACHE DOM
========================================================= */

function cacheGameElements() {

    gameElements.board =
        document.getElementById("puzzleBoard");

    gameElements.levelNumber =
        document.getElementById("levelNumber");

    gameElements.timer =
        document.getElementById("timer");

    gameElements.moveCount =
        document.getElementById("moveCount");

    gameElements.gameMessage =
        document.getElementById("gameMessage");

    gameElements.gameCoinCount =
        document.getElementById("gameCoinCount");

    gameElements.victoryModal =
        document.getElementById("victoryModal");

    gameElements.victoryImage =
        document.getElementById("victoryImage");

    gameElements.victoryStars =
        document.getElementById("victoryStars");

    gameElements.victoryTime =
        document.getElementById("victoryTime");

    gameElements.victoryMoves =
        document.getElementById("victoryMoves");

    gameElements.bestTime =
        document.getElementById("bestTime");

    gameElements.bestMoves =
        document.getElementById("bestMoves");

    gameElements.bestStars =
        document.getElementById("bestStars");

    gameElements.coinsEarned =
        document.getElementById("coinsEarned");

    gameElements.nextLevelButton =
        document.getElementById("nextLevelButton");

    gameElements.replayLevelButton =
        document.getElementById("replayLevelButton");

    gameElements.levelsButton =
        document.getElementById("levelsFromVictoryButton");

    gameElements.shuffleButton =
        document.getElementById("shuffleButton");

    gameElements.restartButton =
        document.getElementById("restartButton");

    gameElements.backButton =
        document.getElementById("gameBackButton");

    gameElements.victoryCloseButton =
        document.getElementById("victoryCloseButton");

}


/* =========================================================
   READ LEVEL FROM URL
========================================================= */

function getRequestedLevel() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const requestedLevel =
        Number(
            params.get("level")
        );

    if (
        !Number.isInteger(requestedLevel) ||
        requestedLevel < 1
    ) {

        return 1;
    }

    return requestedLevel;

}


/* =========================================================
   GRID SIZE
========================================================= */

function getGridSize(level) {

    if (level >= 1 && level <= 10) {
        return 3;
    }

    if (level >= 11 && level <= 20) {
        return 4;
    }

    if (level >= 21 && level <= 40) {
        return 5;
    }

    if (level >= 41 && level <= 80) {
        return 6;
    }

    return 7;

}


/* =========================================================
   IMAGE PATH
========================================================= */

function getImagePath(level) {

    return `image/level${level}.jpeg`;

}


/* =========================================================
   UPDATE LEVEL DISPLAY
========================================================= */

function updateLevelDisplay() {

    if (!gameElements.levelNumber) {
        return;
    }

    gameElements.levelNumber.textContent =
        String(
            PixVinzGame.level
        ).padStart(2, "0");

}


/* =========================================================
   LOAD PUZZLE
========================================================= */

function loadPuzzle() {

    stopTimer();

    resetGameState();

    clearBoard();

    updateTimerDisplay();

    updateMoveDisplay();

    setGameMessage("");

    createPuzzle();

}


/* =========================================================
   RESET GAME STATE
========================================================= */

function resetGameState() {

    PixVinzGame.pieces = [];

    PixVinzGame.selectedIndex = null;

    PixVinzGame.moves = 0;

    PixVinzGame.elapsedSeconds = 0;

    PixVinzGame.gameStarted = false;

    PixVinzGame.gameFinished = false;

}


/* =========================================================
   CLEAR BOARD
========================================================= */

function clearBoard() {

    if (!gameElements.board) {
        return;
    }

    gameElements.board.innerHTML = "";

}


/* =========================================================
   CREATE PUZZLE
========================================================= */

function createPuzzle() {

    const level =
        PixVinzGame.level;

    const grid =
        PixVinzGame.gridSize;

    const imagePath =
        getImagePath(level);


    /*
       Create the correct piece order.

       Example for 3x3:

       0 1 2
       3 4 5
       6 7 8
    */

    PixVinzGame.pieces =
        Array.from(
            {
                length:
                    PixVinzGame.totalPieces
            },
            (_, index) => index
        );


    /*
       Shuffle until the puzzle is
       actually different from solved.
    */

    shufflePieces();


    gameElements.board.style.gridTemplateColumns =
        `repeat(${grid}, 1fr)`;


    gameElements.board.style.gridTemplateRows =
        `repeat(${grid}, 1fr)`;


    createPuzzlePieces(imagePath);

}


/* =========================================================
   SHUFFLE PIECES
========================================================= */

function shufflePieces() {

    let attempts = 0;

    do {

        for (
            let i =
                PixVinzGame.pieces.length - 1;

            i > 0;

            i--
        ) {

            const randomIndex =
                Math.floor(
                    Math.random() * (i + 1)
                );

            [
                PixVinzGame.pieces[i],
                PixVinzGame.pieces[randomIndex]
            ] = [
                PixVinzGame.pieces[randomIndex],
                PixVinzGame.pieces[i]
            ];

        }

        attempts++;

    } while (
        isPuzzleSolved() &&
        attempts < 10
    );

}


/* =========================================================
   CREATE PUZZLE PIECES
========================================================= */

function createPuzzlePieces(imagePath) {

    const grid =
        PixVinzGame.gridSize;


    PixVinzGame.pieces.forEach(
        (pieceNumber, boardIndex) => {

            const piece =
                document.createElement("button");

            piece.type =
                "button";

            piece.className =
                "puzzle-piece";

            piece.dataset.index =
                String(boardIndex);

            piece.dataset.piece =
                String(pieceNumber);

            piece.setAttribute(
                "aria-label",
                `Puzzle piece ${pieceNumber + 1}`
            );


            /*
               Every piece displays the same
               original image.

               Background positioning determines
               which section of the image appears.
            */

            piece.style.backgroundImage =
                `url("${imagePath}")`;


            const originalRow =
                Math.floor(
                    pieceNumber / grid
                );

            const originalColumn =
                pieceNumber % grid;


            const positionX =
                grid === 1
                    ? 0
                    : (
                        originalColumn /
                        (grid - 1)
                    ) * 100;


            const positionY =
                grid === 1
                    ? 0
                    : (
                        originalRow /
                        (grid - 1)
                    ) * 100;


            piece.style.backgroundPosition =
                `${positionX}% ${positionY}%`;


            /*
               Scale the original image so that
               the correct section fills the tile.
            */

            piece.style.backgroundSize =
                `${grid * 100}% ${grid * 100}%`;


            piece.addEventListener(
                "click",
                handlePieceClick
            );


            gameElements.board.appendChild(
                piece
            );

        }
    );

}


/* =========================================================
   PIECE CLICK
========================================================= */

function handlePieceClick(event) {

    if (
        PixVinzGame.gameFinished
    ) {
        return;
    }


    const piece =
        event.currentTarget;


    const index =
        Number(
            piece.dataset.index
        );


    /*
       First selection
    */

    if (
        PixVinzGame.selectedIndex === null
    ) {

        selectPiece(index);

        startGameIfNeeded();

        return;
    }


    /*
       Clicking the same piece again
       cancels the selection.
    */

    if (
        PixVinzGame.selectedIndex === index
    ) {

        deselectPiece();

        return;
    }


    /*
       Second piece selected.
       Swap them.
    */

    swapPieces(
        PixVinzGame.selectedIndex,
        index
    );

}


/* =========================================================
   SELECT PIECE
========================================================= */

function selectPiece(index) {

    deselectPiece();

    PixVinzGame.selectedIndex =
        index;


    const piece =
        getBoardPiece(index);


    if (piece) {

        piece.classList.add(
            "selected"
        );

    }

}


/* =========================================================
   DESELECT PIECE
========================================================= */

function deselectPiece() {

    document
        .querySelectorAll(
            ".puzzle-piece.selected"
        )
        .forEach(
            piece => {
                piece.classList.remove(
                    "selected"
                );
            }
        );


    PixVinzGame.selectedIndex =
        null;

}


/* =========================================================
   GET BOARD PIECE
========================================================= */

function getBoardPiece(index) {

    return gameElements.board
        .querySelector(
            `.puzzle-piece[data-index="${index}"]`
        );

}


/* =========================================================
   SWAP PIECES
========================================================= */

function swapPieces(firstIndex, secondIndex) {

    const firstPiece =
        PixVinzGame.pieces[firstIndex];

    const secondPiece =
        PixVinzGame.pieces[secondIndex];


    PixVinzGame.pieces[firstIndex] =
        secondPiece;

    PixVinzGame.pieces[secondIndex] =
        firstPiece;


    PixVinzGame.moves++;

    updateMoveDisplay();

    deselectPiece();

    renderPiecePositions();

    checkPuzzleCompletion();

}


/* =========================================================
   RENDER PIECE POSITIONS
========================================================= */

function renderPiecePositions() {

    const grid =
        PixVinzGame.gridSize;

    const pieces =
        gameElements.board
            .querySelectorAll(
                ".puzzle-piece"
            );


    pieces.forEach(
        (piece, boardIndex) => {

            const pieceNumber =
                PixVinzGame.pieces[
                    boardIndex
                ];


            piece.dataset.piece =
                String(pieceNumber);


            const originalRow =
                Math.floor(
                    pieceNumber / grid
                );


            const originalColumn =
                pieceNumber % grid;


            const positionX =
                grid === 1
                    ? 0
                    : (
                        originalColumn /
                        (grid - 1)
                    ) * 100;


            const positionY =
                grid === 1
                    ? 0
                    : (
                        originalRow /
                        (grid - 1)
                    ) * 100;


            piece.style.backgroundPosition =
                `${positionX}% ${positionY}%`;

        }
    );

}


/* =========================================================
   START GAME
========================================================= */

function startGameIfNeeded() {

    if (
        PixVinzGame.gameStarted
    ) {
        return;
    }


    PixVinzGame.gameStarted =
        true;


    startTimer();

}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    stopTimer();


    PixVinzGame.timerInterval =
        window.setInterval(
            () => {

                if (
                    PixVinzGame.gameFinished
                ) {
                    return;
                }


                PixVinzGame.elapsedSeconds++;

                updateTimerDisplay();

            },
            1000
        );

}


/* =========================================================
   STOP TIMER
========================================================= */

function stopTimer() {

    if (
        PixVinzGame.timerInterval !== null
    ) {

        window.clearInterval(
            PixVinzGame.timerInterval
        );

        PixVinzGame.timerInterval =
            null;

    }

}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(totalSeconds) {

    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
    );

}


/* =========================================================
   UPDATE TIMER
========================================================= */

function updateTimerDisplay() {

    if (!gameElements.timer) {
        return;
    }

    gameElements.timer.textContent =
        formatTime(
            PixVinzGame.elapsedSeconds
        );

}


/* =========================================================
   UPDATE MOVES
========================================================= */

function updateMoveDisplay() {

    if (!gameElements.moveCount) {
        return;
    }

    gameElements.moveCount.textContent =
        String(
            PixVinzGame.moves
        );

}


/* =========================================================
   CHECK COMPLETION
========================================================= */

function checkPuzzleCompletion() {

    if (
        !isPuzzleSolved()
    ) {
        return;
    }


    finishPuzzle();

}


/* =========================================================
   SOLVED CHECK
========================================================= */

function isPuzzleSolved() {

    for (
        let index = 0;

        index < PixVinzGame.pieces.length;

        index++
    ) {

        if (
            PixVinzGame.pieces[index] !== index
        ) {

            return false;

        }

    }


    return true;

}


/* =========================================================
   FINISH PUZZLE
========================================================= */

function finishPuzzle() {

    if (
        PixVinzGame.gameFinished
    ) {
        return;
    }


    PixVinzGame.gameFinished =
        true;


    stopTimer();

    deselectPiece();

    markCorrectPieces();

    const stars =
        calculateStars(
            PixVinzGame.elapsedSeconds,
            PixVinzGame.moves,
            PixVinzGame.level
        );


    showVictoryScreen(
        stars
    );


    /*
       Send a clean event for save.js.

       save.js can listen to this event later
       without us duplicating its saving logic here.
    */

    document.dispatchEvent(
        new CustomEvent(
            "pixvinz:puzzleComplete",
            {
                detail: {

                    level:
                        PixVinzGame.level,

                    time:
                        PixVinzGame.elapsedSeconds,

                    moves:
                        PixVinzGame.moves,

                    stars:
                        stars

                }
            }
        )
    );

}


/* =========================================================
   MARK CORRECT PIECES
========================================================= */

function markCorrectPieces() {

    const pieces =
        gameElements.board
            .querySelectorAll(
                ".puzzle-piece"
            );


    pieces.forEach(
        (piece, index) => {

            if (
                PixVinzGame.pieces[index] === index
            ) {

                piece.classList.add(
                    "correct"
                );

            }

        }
    );

}


/* =========================================================
   STAR CALCULATION
=========================================================

   Current temporary rule:

   Level 1–50:
   3 stars = 30 sec or less AND 30 moves or less

   The remaining thresholds are intentionally
   kept conservative until we finalize your
   complete star rules.

   This function is isolated so we can edit
   the rules later without touching the
   puzzle engine.
========================================================= */

function calculateStars(
    time,
    moves,
    level
) {

    /*
       Current requested 3-star condition.
    */

    if (
        level >= 1 &&
        level <= 50 &&
        time <= 30 &&
        moves <= 30
    ) {

        return 3;

    }


    /*
       Temporary 2-star condition.

       We can finalize these thresholds
       before release.
    */

    if (
        level >= 1 &&
        level <= 50 &&
        time <= 60 &&
        moves <= 50
    ) {

        return 2;

    }


    /*
       Every completed puzzle receives
       at least one star.
    */

    return 1;

}


/* =========================================================
   STARS DISPLAY
========================================================= */

function starsToText(stars) {

    return (
        "★".repeat(stars) +
        "☆".repeat(3 - stars)
    );

}


/* =========================================================
   SHOW VICTORY SCREEN
========================================================= */

function showVictoryScreen(stars) {

    const imagePath =
        getImagePath(
            PixVinzGame.level
        );


    if (gameElements.victoryImage) {

        gameElements.victoryImage.src =
            imagePath;

    }


    if (gameElements.victoryStars) {

        gameElements.victoryStars.textContent =
            starsToText(stars);

    }


    if (gameElements.victoryTime) {

        gameElements.victoryTime.textContent =
            formatTime(
                PixVinzGame.elapsedSeconds
            );

    }


    if (gameElements.victoryMoves) {

        gameElements.victoryMoves.textContent =
            String(
                PixVinzGame.moves
            );

    }


    /*
       Best results are deliberately not
       calculated here.

       save.js will become the owner of
       persistent best-score data.
    */

    if (gameElements.bestTime) {

        gameElements.bestTime.textContent =
            "--";

    }


    if (gameElements.bestMoves) {

        gameElements.bestMoves.textContent =
            "--";

    }


    if (gameElements.bestStars) {

        gameElements.bestStars.textContent =
            "☆☆☆";

    }


    /*
       Coin calculation is intentionally
       not performed here.

       The coin system belongs in save.js
       / progression logic so coins cannot
       accidentally be farmed.
    */

    if (gameElements.coinsEarned) {

        gameElements.coinsEarned.textContent =
            "+0";

    }


    if (gameElements.victoryModal) {

        gameElements.victoryModal.classList.remove(
            "hidden"
        );

    }


    /*
       No next-level navigation is enabled
       here yet.

       We will connect it to the unlock
       system after the core engine is tested.
    */

    updateNextLevelButton();

}


/* =========================================================
   NEXT LEVEL BUTTON
========================================================= */

function updateNextLevelButton() {

    if (!gameElements.nextLevelButton) {
        return;
    }


    const nextLevel =
        PixVinzGame.level + 1;


    if (nextLevel > 200) {

        gameElements.nextLevelButton.textContent =
            "ALL LEVELS COMPLETE";

        gameElements.nextLevelButton.disabled =
            true;

        gameElements.nextLevelButton.style.opacity =
            "0.5";

        return;

    }


    gameElements.nextLevelButton.textContent =
        `NEXT LEVEL`;

}


/* =========================================================
   SHUFFLE BUTTON
========================================================= */

function shuffleCurrentPuzzle() {

    if (
        PixVinzGame.gameFinished
    ) {
        return;
    }


    shufflePieces();

    deselectPiece();

    renderPiecePositions();


    setGameMessage(
        "Puzzle shuffled"
    );


    /*
       Shuffling is considered a move
       because the player requested a
       new board arrangement.
    */

    PixVinzGame.moves++;

    updateMoveDisplay();

}


/* =========================================================
   RESTART BUTTON
========================================================= */

function restartCurrentPuzzle() {

    loadPuzzle();

}


/* =========================================================
   GAME MESSAGE
========================================================= */

function setGameMessage(message) {

    if (!gameElements.gameMessage) {
        return;
    }

    gameElements.gameMessage.textContent =
        message;

}


/* =========================================================
   CLOSE VICTORY MODAL
========================================================= */

function closeVictoryModal() {

    if (!gameElements.victoryModal) {
        return;
    }

    gameElements.victoryModal.classList.add(
        "hidden"
    );

}


/* =========================================================
   GO BACK
========================================================= */

function returnToLevels() {

    /*
       For now, return to index.html.
       The level screen will be restored by
       the main application once progression
       integration is completed.
    */

    window.location.href =
        "index.html#levels";

}


/* =========================================================
   REPLAY
========================================================= */

function replayCurrentLevel() {

    closeVictoryModal();

    loadPuzzle();

}


/* =========================================================
   NEXT LEVEL
========================================================= */

function openNextLevel() {

    const nextLevel =
        PixVinzGame.level + 1;


    if (nextLevel > 200) {
        return;
    }


    window.location.href =
        `game.html?level=${nextLevel}`;

}


/* =========================================================
   ATTACH EVENTS
========================================================= */

function attachGameEvents() {

    if (gameElements.shuffleButton) {

        gameElements.shuffleButton.addEventListener(
            "click",
            shuffleCurrentPuzzle
        );

    }


    if (gameElements.restartButton) {

        gameElements.restartButton.addEventListener(
            "click",
            restartCurrentPuzzle
        );

    }


    if (gameElements.backButton) {

        gameElements.backButton.addEventListener(
            "click",
            returnToLevels
        );

    }


    if (gameElements.replayLevelButton) {

        gameElements.replayLevelButton.addEventListener(
            "click",
            replayCurrentLevel
        );

    }


    if (gameElements.nextLevelButton) {

        gameElements.nextLevelButton.addEventListener(
            "click",
            openNextLevel
        );

    }


    if (gameElements.levelsButton) {

        gameElements.levelsButton.addEventListener(
            "click",
            returnToLevels
        );

    }


    if (gameElements.victoryCloseButton) {

        gameElements.victoryCloseButton.addEventListener(
            "click",
            closeVictoryModal
        );

    }


    /*
       Prevent accidental closing when the
       player taps inside the modal.
    */

    if (gameElements.victoryModal) {

        gameElements.victoryModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    gameElements.victoryModal
                ) {

                    closeVictoryModal();

                }

            }
        );

    }

}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    stopTimer
);
