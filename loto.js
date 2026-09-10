async function generateAndUploadScratchCards() {
  const db = firebase.firestore();
  
  // 1. Define all available prize tiers based on your exact specifications
  const prizeDefinitions = [
    { id: 'jackpot', name: '1,000,000 XP', img: 'images/jpxp.png', type: 'xp', value: 1000000, count: 2, matchIcon: 'images/jpxp.png' },
    { id: 'xp_50k', name: '50,000 XP', img: 'images/50kxp.png', type: 'xp', value: 50000, count: 10, matchIcon: 'images/50kxp.png' },
    { id: 'xp_10k', name: '10,000 XP', img: 'images/10kxp.png', type: 'xp', value: 10000, count: 20, matchIcon: 'images/10kxp.png' },
    { id: 'xp_5k', name: '5,000 XP', img: 'images/5kxp.png', type: 'xp', value: 5000, count: 50, matchIcon: 'images/5kxp.png' },
    { id: 'xp_1k', name: '1,000 XP', img: 'images/1kxp.png', type: 'xp', value: 1000, count: 100, matchIcon: 'images/1kxp.png' },
    { id: 'coin_20k', name: '20,000 Coins', img: 'images/20k.png', type: 'coins', value: 20000, count: 10, matchIcon: 'images/20k.png' },
    { id: 'coin_5k', name: '5,000 Coins', img: 'images/5k.png', type: 'coins', value: 5000, count: 20, matchIcon: 'images/5k.png' },
    { id: 'coin_1k', name: '1,000 Coins', img: 'images/1k.png', type: 'coins', value: 1000, count: 30, matchIcon: 'images/1k.png' },
    { id: 'coin_500', name: '500 Coins', img: 'images/500.png', type: 'coins', value: 500, count: 100, matchIcon: 'images/500.png' },
    { id: 'coin_100', name: '100 Coins', img: 'images/100.png', type: 'coins', value: 100, count: 200, matchIcon: 'images/100.png' },
    { id: 'none', name: 'No Win', img: null, type: 'none', value: 0, count: 458, matchIcon: null }
  ];

  // List of all image paths for populating filler slots on cards
  const allImages = [
    'images/100.png', 'images/500.png', 'images/1k.png', 'images/5k.png', 'images/20k.png',
    'images/1kxp.png', 'images/5kxp.png', 'images/10kxp.png', 'images/50kxp.png', 'images/jpxp.png'
  ];

  // 2. Flatten out all 1,000 card definitions into an array
  let masterPool = [];
  prizeDefinitions.forEach(tier => {
    for (let i = 0; i < tier.count; i++) {
      masterPool.push({
        tierId: tier.id,
        prizeName: tier.name,
        prizeType: tier.type,
        prizeValue: tier.value,
        matchIcon: tier.matchIcon
      });
    }
  });

  // Shuffle the master pool randomly so winning cards are distributed unpredictably
  masterPool.sort(() => Math.random() - 0.5);

  // Keep track of generated codes to guarantee 100% uniqueness
  let generatedCodes = new Set();
  function generateUniqueCode() {
    let code;
    do {
      // Creates a secure random alphanumeric code like "PV-79A2-K9X"
      let part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
      let part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
      code = `PV-${part1}-${part2}`;
    } while (generatedCodes.has(code));
    
    generatedCodes.add(code);
    return code;
  }

  // 3. Batch upload to Firestore (Firestore limits batches to 500 writes at a time)
  let batchCount = 0;
  let batch = db.batch();
  let totalUploaded = 0;

  for (let i = 0; i < masterPool.length; i++) {
    let cardConfig = masterPool[i];
    let cardDocId = `card_${String(i + 1).padStart(4, '0')}`;
    let uniqueCode = generateUniqueCode();

    // Generate 12 slots for the grid
    let gridSlots = [];

    if (cardConfig.tierId === 'none') {
      // For losing cards: Fill 12 slots with random images, ensuring NO image appears 3 or more times
      let attempts = 0;
      do {
        gridSlots = [];
        let counts = {};
        let isValid = true;

        for (let s = 0; s < 12; s++) {
          let randomImg = allImages[Math.floor(Math.random() * allImages.length)];
          gridSlots.push({ imageUrl: randomImg });
          counts[randomImg] = (counts[randomImg] || 0) + 1;
          if (counts[randomImg] >= 3) {
            isValid = false; // Accidentally created a 3-match, retry generation for this card
            break;
          }
        }
        if (isValid) break;
        attempts++;
      } while (attempts < 100);
    } else {
      // For winning cards: Force exactly 3 slots to contain the winning image
      let winningIcon = cardConfig.matchIcon;
      
      // Pick 3 random distinct indices out of 12 for the winning match
      let winningIndices = [];
      while (winningIndices.length < 3) {
        let randIdx = Math.floor(Math.random() * 12);
        if (!winningIndices.includes(randIdx)) {
          winningIndices.push(randIdx);
        }
      }

      for (let s = 0; s < 12; s++) {
        if (winningIndices.includes(s)) {
          gridSlots.push({ imageUrl: winningIcon });
        } else {
          // Fill remaining 9 slots with random distractor images that do NOT accidentally form another 3-match
          let distractorImg;
          let safeCheck = 0;
          do {
            distractorImg = allImages[Math.floor(Math.random() * allImages.length)];
            safeCheck++;
            // Make sure distractor doesn't accidentally hit 3 appearances total
            let currentMatches = gridSlots.filter(slot => slot && slot.imageUrl === distractorImg).length;
            if (distractorImg !== winningIcon && currentMatches < 2) break;
            if (safeCheck > 50) break;
          } while (true);

          gridSlots.push({ imageUrl: distractorImg });
        }
      }
    }

    // Document payload structure for Firestore
    let cardRef = db.collection('scratch_cards').doc(cardDocId);
    batch.set(cardRef, {
      uniqueCode: uniqueCode,
      tierId: cardConfig.tierId,
      prizeName: cardConfig.prizeName,
      prizeType: cardConfig.prizeType,
      prizeValue: cardConfig.prizeValue,
      isBought: false,
      isScratched: false,
      ownerId: null,
      gridSlots: gridSlots, // Array of 12 slot objects
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    batchCount++;
    totalUploaded++;

    // Commit batch every 450 documents to stay safely under Firestore's 500 limit
    if (batchCount === 450 || i === masterPool.length - 1) {
      await batch.commit();
      console.log(`Successfully committed batch up to card ${totalUploaded}`);
      batch = db.batch();
      batchCount = 0;
    }
  }

  console.log("All 1,000 unique scratch cards generated and uploaded securely to Firestore!");
}
