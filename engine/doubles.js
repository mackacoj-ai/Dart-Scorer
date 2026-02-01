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
    const idx = Math.floor(Math.random() * 21);
    if (idx === 20) return 50; // bull (double bull)
    return 2 + idx * 2;        // 2..40 even
  }

  function getRandom2DScore() {
    while (true) {
      const s = Math.floor(Math.random() * (100 - 41 + 1)) + 41;
      if (s !== 50 && s !== 99) return s;
    }
  }

  function getRandom3DScore() {
    while (true) {
      const s = Math.floor(Math.random() * (170 - 101 + 1)) + 101;
      if (![159, 162, 163, 166, 168, 169].includes(s)) return s;
    }
  }

  // =====================================
  // CATEGORY DETECTION (legacy/safety)
  // =====================================

  function getFinishCategory(score) {
    if ((score >= 2 && score <= 40 && score % 2 === 0) || score === 50) return 1; // 1D
    if (score >= 41 && score <= 100 && score !== 50 && score !== 99) return 2;    // 2D
    if (score >= 101 && score <= 170 && ![159, 162, 163, 166, 168, 169].includes(score)) return 3; // 3D
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
  // ENTER VISIT (boolean): finished within the 3-dart visit (ending on a double)?
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
