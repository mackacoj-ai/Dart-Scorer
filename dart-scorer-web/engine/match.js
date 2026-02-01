// =====================================
// MATCH ENGINE
// Port of your Arduino match logic
// =====================================

(function () {

    const State = window.StateEngine;
    const Checkout = window.CheckoutEngine;

    const S = State.matchState;


    // =====================================
    // HELPERS
    // =====================================

    function resetLegStats() {
        S.players.forEach(p => {
            p.legScore = 0;
            p.legDarts = 0;
            p.turnsThisLeg = 0;
        });
    }

    function startNewLeg(newSet) {
        S.players[0].score = 501;
        S.players[1].score = 501;

        if (newSet) {
            S.legStartPlayer = S.setStartPlayer;
        } else {
            S.legStartPlayer = 1 - S.legStartPlayer;
        }

        S.currentPlayer = S.legStartPlayer;
        resetLegStats();
    }

    function startNewSet() {
        S.setStartPlayer = 1 - S.setStartPlayer;
        startNewLeg(true);
    }


    // =====================================
    // CHECKOUT CATEGORY
    // (mirrors your Arduino logic)
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

    function isFinishPossible(score) {
        if (score < 2 || score > 170) return false;
        return ![169, 168, 166, 165, 163, 162, 159].includes(score);
    }


    // =====================================
    // SCORE ENTRY
    // =====================================

    function enterScore(entered) {
        const p = S.currentPlayer;
        const player = S.players[p];

        if (entered < 0 || entered > 180) return;

        const before = player.score;
        const after = before - entered;

        // Track checkout attempt
        const cat = getFinishCategory(before);
        if (cat === 1) player.chkAttempts1D++;
        if (cat === 2) player.chkAttempts2D++;
        if (cat === 3) player.chkAttempts3D++;

        // Count turn
        player.turnsThisLeg++;

        // BUST
        if (after < 0 || after === 1) {
            player.matchDarts += 3;
            player.legDarts += 3;

            S.currentPlayer = 1 - p;
            return;
        }

        // CHECKOUT
        if (after === 0) {
            if (!isFinishPossible(before)) {
                return;
            }

            // Success tracking
            const catStart = getFinishCategory(before);
            if (catStart === 1) player.chkSuccess1D++;
            if (catStart === 2) player.chkSuccess2D++;
            if (catStart === 3) player.chkSuccess3D++;

            // Apply scoring
            player.score = 0;
            player.matchScore += entered;
            player.matchDarts += 3;
            player.legScore += entered;
            player.legDarts += 3;

            // Winner turn stats
            player.totalTurnsWonLegs += player.turnsThisLeg;
            player.legsWonCount++;

            // Global leg stats
            S.totalTurnsCompletedLegs +=
                S.players[0].turnsThisLeg + S.players[1].turnsThisLeg;

            S.legsCompleted++;

            // Leg/Set progression
            player.legsWon++;

            if (player.legsWon >= 3) {
                player.setsWon++;
                S.players[0].legsWon = 0;
                S.players[1].legsWon = 0;
                startNewSet();
            } else {
                startNewLeg(false);
            }

            return;
        }

        // NORMAL SCORING
        player.score = after;
        player.matchScore += entered;
        player.matchDarts += 3;
        player.legScore += entered;
        player.legDarts += 3;

        S.currentPlayer = 1 - p;
    }


    // =====================================
    // AVERAGES
    // =====================================

    function threeDartAvg(score, darts) {
        if (darts === 0) return 0;
        return (score / darts) * 3;
    }

    function turnsPerLegWon(p) {
        if (p.legsWonCount === 0) return 0;
        return p.totalTurnsWonLegs / p.legsWonCount;
    }

    function checkoutPercent(p) {
        const attempts = p.chkAttempts1D + p.chkAttempts2D + p.chkAttempts3D;
        const success = p.chkSuccess1D + p.chkSuccess2D + p.chkSuccess3D;
        if (attempts === 0) return 0;
        return Math.round((success / attempts) * 100);
    }


    // =====================================
    // PUBLIC API
    // =====================================

window.MatchEngine = {

    enterScore,

    getPlayer(i) {
        return S.players[i];
    },

    getCurrentPlayer() {
        return S.currentPlayer;   //  THIS IS THE NEW LINE
    },

    getAverages() {
        const p1 = S.players[0];
        const p2 = S.players[1];

        return {
            p1: {
                name: p1.name,
                matchAvg: threeDartAvg(p1.matchScore, p1.matchDarts),
                turnsAvg: turnsPerLegWon(p1),
                checkout: checkoutPercent(p1)
            },
            p2: {
                name: p2.name,
                matchAvg: threeDartAvg(p2.matchScore, p2.matchDarts),
                turnsAvg: turnsPerLegWon(p2),
                checkout: checkoutPercent(p2)
            }
        };
    },

    reset() {
        State.resetMatchState();
    }
};


})();
