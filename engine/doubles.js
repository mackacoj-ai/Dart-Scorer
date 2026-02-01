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
  // CATEGORY DETECTION (kept for legacy / safety)
  // =====================================

  function getFinishCategory(score) {
    if ((score >= 2 && score <= 40 && score % 2 === 0) || score === 50) return 1; // 1D
    if (score >= 41 && score <= 100 && score !== 50 && score !== 99) return 2;    // 2D
    if (score >= 101 && score <= 170 && ![159, 162, 163, 166, 168, 169].includes(score)) return 3; // 3D
    return 0;
  }

  // =====================================
  // GENERATE NEXT TARGET
  // -> Sets target, stores category, increments that category's attempts
  // =====================================

  function nextTarget() {
    const catIndex = Math.floor(Math.random() * 3); // 0,1,2

    if (catIndex === 0) {
      S.currentTarget = getRandom1DScore();
      S.currentCategory = 1;
      S.attempts1D++;
    } else if (catIndex === 1) {
      S.currentTarget = getRandom2DScore();
      S.currentCategory = 2;
      S.attempts2D++;
    } else {
      S.currentTarget = getRandom3DScore();
      S.currentCategory = 3;
      S.attempts3D++;
    }
  }

  // =====================================
  // ENTER VISIT (boolean): finished within the 3-dart visit (ending on a double)?
  // Uses the stored category for success
  // =====================================

  function enterVisit({ hit }) {
    if (S.currentTarget == null || S.currentCategory == null) {
      nextTarget();
      return;
    }

    if (hit === true) {
      if (S.currentCategory === 1) S.success1D++;
      else if (S.currentCategory === 2) S.success2D++;
      else if (S.currentCategory === 3) S.success3D++;
    }

    nextTarget();
  }

  // =====================================
  // Legacy numeric path (kept for compatibility)
  // Records success for the stored category only if score === currentTarget
  // =====================================

  function enterScore(score) {
    if (S.currentTarget == null || S.currentCategory == null) {
      nextTarget();
      return;
    }

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

    // Optional helper if the UI needs the category number directly
    getCurrentCategory() {
      return S.currentCategory; // 1, 2, or 3
    },

    nextTarget() {
      nextTarget();
    },

    // New boolean entry for Hit/Miss UI
    enterVisit(payload) {
      enterVisit(payload);
    },

    // Old numeric entry (not used by new UI, kept for safety)
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
      // Make sure currentCategory is reset too if your resetDoublesState doesn't handle it
      if (typeof S.currentCategory !== "undefined") S.currentCategory = null;
      nextTarget();
    },

    init() {
      // Guard so we don't double-increment attempts if init() is called again
      if (S.currentTarget == null || S.currentCategory == null) {
        nextTarget();
      }
    }
  };

})();
