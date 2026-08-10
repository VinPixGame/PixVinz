/* =========================================================
   PIXVINZ - LEVEL CONFIGURATION
   ========================================================= */

const TOTAL_LEVELS = 200;


/* =========================================================
   PUZZLE SIZE
   ========================================================= */

function getPuzzleSize(level) {

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
   LEVEL DATA
   ========================================================= */

function createLevel(level) {

    return {
        id: level,

        image:
            `image/level${level}.jpeg`,

        size:
            getPuzzleSize(level)
    };
}


const LEVELS =
    Array.from(
        { length: TOTAL_LEVELS },
        (_, index) =>
            createLevel(index + 1)
    );


/* =========================================================
   GET LEVEL
   ========================================================= */

function getLevel(level) {

    return LEVELS.find(
        item => item.id === Number(level)
    );
}


/* =========================================================
   GET LAST PLAYABLE LEVEL
   ========================================================= */

function getLastPlayableLevel(playerData) {

    if (!playerData || !playerData.levels) {
        return 1;
    }

    let lastPlayable = 1;

    for (
        let level = 1;
        level <= TOTAL_LEVELS;
        level++
    ) {

        if (
            playerData.levels[level] &&
            playerData.levels[level].unlocked
        ) {

            lastPlayable = level;

        } else {

            break;
        }
    }

    return lastPlayable;
}


/* =========================================================
   UNLOCK NEXT LEVEL
   ========================================================= */

function unlockNextLevel(
    playerData,
    completedLevel
) {

    const nextLevel =
        Number(completedLevel) + 1;


    if (
        nextLevel > TOTAL_LEVELS
    ) {
        return;
    }


    if (
        !playerData.levels[nextLevel]
    ) {
        return;
    }


    playerData.levels[nextLevel].unlocked =
        true;
}


/* =========================================================
   LEVEL STATUS
   ========================================================= */

function getLevelStatus(
    playerData,
    level
) {

    const data =
        playerData?.levels?.[level];


    if (!data) {
        return "locked";
    }


    if (data.completed) {
        return "completed";
    }


    if (data.unlocked) {
        return "unlocked";
    }


    return "locked";
}
