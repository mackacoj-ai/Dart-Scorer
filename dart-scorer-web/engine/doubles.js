// =====================================
// DOUBLES PRACTICE ENGINE
// Port of your Arduino doubles logic
// =====================================

(function () {

    const State = window.StateEngine;
    const Checkout = window.CheckoutEngine;

    const S = State.doublesState;


    // =====================================
    // RANDOM TARGET GENERATION
    // (faithful to your Arduino logic)
    // =====================================

    function getRandom1DScore() {
        const idx = Math.floor(Math.random() * 21);
        if (idx === 20) return 50;
        return 2 + idx * 2;
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
    // CATEGORY DETECTION
    // (same as Arduino getFinishCategory)
    // =====================================

    function getFinishCategory(score) {
        if ((score >= 2 && score <= 40 && score % 2 === 0) || score === 50)
            return 1; // 1D

        if (score >= 41 && score <= 100 && score !== 50 && score !== 99)
            return 2; // 2D

        if (score >= 101 && score <= 170 &&
            ![159, 162, 163, 166, 168, 169].includes(score))
            return 3; // 3D

        return 0;
    }


    // =====================================
    // GENERATE NEXT TARGET
    // =====================================

    function nextTarget() {
        const cat = Math.floor(Math.random() * 3); // 0,1,2

        if (cat === 0) {
            S.currentTarget = getRandom1DScore();
            S.attempts1D++;
        } else if (cat === 1) {
            S.currentTarget = getRandom2DScore();
            S.attempts2D++;
        } else {
            S.currentTarget = getRandom3DScore();
            S.attempts3D++;
        }
    }


    // =====================================
    // SCORE ENTRY FOR DOUBLES PRACTICE
    // =====================================

    function enterScore(score) {
        const target = S.currentTarget;
        const cat = getFinishCategory(target);

        if (score === target) {
            if (cat === 1) S.success1D++;
            if (cat === 2) S.success2D++;
            if (cat === 3) S.success3D++;
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

        nextTarget() {
            nextTarget();
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
            nextTarget();
        },

        init () {
	   nextTarget();
    }

};

})();