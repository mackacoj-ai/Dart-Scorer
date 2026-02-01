// =====================================
// DOUBLES PRACTICE ENGINE
// Port of your Arduino doubles logic
// =====================================

(function () {

  const State = window.StateEngine;
  const S = State.doublesState;

  // Ensure we have a place to store the current category (1, 2, 3)
  if (typeof S.currentCategory === "undefined") {
    S.currentCategory = null;
  }

  // =====================================
  // RANDOM TARGET GENERATION
  // =====================================

  function getRandom1DScore() {
    // 1D = even doubles 2..40 or 50 (bull)
    const pool = [];
    for (let v = 2; v <= 40; v += 2) pool.push(v);
    pool.push(50);
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  function getRandom2DScore() {
    // 2D = odd 3..49 OR 41..100 (excluding 50 & 99)
    const pool = [];

    // odd 3..49
    for (let v = 3; v <= 49; v += 2) pool.push(v);

    // 41..100 excluding 50 and 99
    for (let v = 41; v <= 100; v++) {
      if (v === 50 || v === 99) continue;
      pool.push(v);
    }

    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  function getRandom3DScore() {
    // 3D = 101..170 excluding [159,162,163,166,168,169]
    while (true) {
      const s = Math.floor(Math.random() * (170 - 101 + 1)) + 101;
      if (![159, 162, 163, 166, 168, 169].includes(s)) return s;
    }
  }

  // =====================================
  // CATEGORY DETECTION (UPDATED)
  // =====================================

  function getFinishCategory(score) {
    // 1D: even 2..40 or 50
    if ((score >= 2 && score <= 40 && score % 2 === 0) || score === 50) return 1;

    // 2D: odd 3..49 OR 41..100 (excl 50, 99)
    if ((score >= 3 && score <= 49 && score % 2 === 1) ||
        (score >= 41 && score <= 100 && score !== 50 && score !== 99)) return 2;

    // 3D: 101..170 excluding bogeys
    if (score >= 101 && score <= 170 &&
        ![159, 162, 163, 166, 168, 169].includes(score)) return 3;

    return 0;
  }

  // =====================================
  // GENERATE NEXT TARGET
  // -> Sets target and category ONLY (no attempts increment here)
  // =====================================

  function nextTarget() {
    const catIndex = Math.floor(Math.random() * 3); // 0,1,2

    if (catIndex === 0) {
      S.currentTarget = getRandom1DScore();
      S.currentCategory = 1;
    } else if (catIndex === 1) {
      S.currentTarget = getRandom2DScore();
      S.currentCategory = 2;
    } else {
      S.currentTarget = getRandom3DScore();
      S.currentCategory = 3;
    }
  }

  // =====================================
  // ENTER VISIT (boolean): finished within the 3-dart visit?
  // -> First increment attempts for the category we JUST attempted
  // -> Then (if hit) increment success for that same category
  // -> Then roll the next target
  // =====================================

  function incrementAttemptsForCurrentCategory() {
    if (S.currentCategory === 1) S.attempts1D++;
    else if (S.currentCategory === 2) S.attempts2D++;
    else if (S.currentCategory === 3) S.attempts3D++;
  }

  function enterVisit({ hit }) {
    // If not initialized, start from a valid target and return
    if (S.currentTarget == null || S.currentCategory == null) {
      nextTarget();
      return;
    }

    // Count the attempt for the category we just played
    incrementAttemptsForCurrentCategory();

    // Count success for that same category (if hit)
    if (hit === true) {
      if (S.currentCategory === 1) S.success1D++;
      else if (S.currentCategory === 2) S.success2D++;
      else if (S.currentCategory === 3) S.success3D++;
    }

    // Move on to the next target (no attempts increment here)
    nextTarget();
  }

  // =====================================
  // Legacy numeric path (kept for compatibility)
  // -> Attempts credited on visit end, success if score matches
  // =====================================

  function enterScore(score) {
    if (S.currentTarget == null || S.currentCategory == null) {
      nextTarget();
      return;
    }

    // Count the attempt for the category we just played
    incrementAttemptsForCurrentCategory();

    // If exact checkout hit, count success
    if (score === S.currentTarget) {
      if (S.currentCategory === 1) S.success1D++;
      else if (S.currentCategory === 2) S.success2D++;
      else if (S.currentCategory === 3) S.success3D++;
    }

    nextTarget();
  }

  // =====================================
  // PUBLIC API
  // =====================================

  window.DoublesEngine = {

    getCurrentTarget() {
      return S.currentTarget;
    },

    getCurrentCategory() {
      return S.currentCategory; // 1, 2, or 3
    },

    nextTarget() {
      nextTarget();
    },

    enterVisit(payload) {
      enterVisit(payload);
    },

    enterScore(score) {
      enterScore(score);
    },

    getStats() {
      return {
        attempts1D: S.attempts1D,
        attempts2D: S.attempts2D,
        attempts3D: S.attempts3D,
        success1D: S.success1D,
        success2D: S.success2D,
        success3D: S.success3D
      };
    },

    reset() {
      State.resetDoublesState();
      if (typeof S.currentCategory !== "undefined") S.currentCategory = null;
      nextTarget(); // start with a target shown, but attempts won't change until first visit ends
    },

    init() {
      // Guard so we don't regenerate if already initialized
      if (S.currentTarget == null || S.currentCategory == null) {
        nextTarget();
      }
    }
  };

})();
