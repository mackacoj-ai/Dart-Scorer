// =====================================
// STATE ENGINE
// Centralised state container
// =====================================

(function () {

    // -------------------------------
    // GAME STATE ENUM
    // -------------------------------
    const GameState = {
        MATCH: "match",
        DOUBLES: "doubles",
        PLAYERS: "players",
        AVERAGES: "averages",
        SETTINGS: "settings"
    };


    // -------------------------------
    // MATCH STATE
    // Mirrors your Arduino variables
    // -------------------------------
    const matchState = {
        players: [
            {
                id: 1,
                name: "Player 1",
                score: 501,
                legsWon: 0,
                setsWon: 0,
                matchScore: 0,
                matchDarts: 0,
                legScore: 0,
                legDarts: 0,
                turnsThisLeg: 0,
                totalTurnsWonLegs: 0,
                legsWonCount: 0,
                chkAttempts1D: 0,
                chkAttempts2D: 0,
                chkAttempts3D: 0,
                chkSuccess1D: 0,
                chkSuccess2D: 0,
                chkSuccess3D: 0
            },
            {
                id: 2,
                name: "Player 2",
                score: 501,
                legsWon: 0,
                setsWon: 0,
                matchScore: 0,
                matchDarts: 0,
                legScore: 0,
                legDarts: 0,
                turnsThisLeg: 0,
                totalTurnsWonLegs: 0,
                legsWonCount: 0,
                chkAttempts1D: 0,
                chkAttempts2D: 0,
                chkAttempts3D: 0,
                chkSuccess1D: 0,
                chkSuccess2D: 0,
                chkSuccess3D: 0
            }
        ],

        currentPlayer: 0,
        legStartPlayer: 0,
        setStartPlayer: 0,

        totalTurnsCompletedLegs: 0,
        legsCompleted: 0,

        scoreEntry: "",
        currentScreen: 0,
        avgPlayerView: 0
    };


    // -------------------------------
    // DOUBLES PRACTICE STATE
    // -------------------------------
    const doublesState = {
        currentTarget: null,
        currentCategory: null, // <-- NEW: 1 (1D), 2 (2D), or 3 (3D) for the current target

        attempts1D: 0,
        attempts2D: 0,
        attempts3D: 0,
        success1D: 0,
        success2D: 0,
        success3D: 0
    };


    // -------------------------------
    // PLAYER DATABASE (localStorage)
    // Replaces EEPROM
    // -------------------------------
    const playersDB = {
        key: "dart_scorer_players",

        load() {
            const raw = localStorage.getItem(this.key);
            return raw ? JSON.parse(raw) : [];
        },

        save(list) {
            localStorage.setItem(this.key, JSON.stringify(list));
        },

        reset() {
            localStorage.removeItem(this.key);
        }
    };


    // -------------------------------
    // RESET HELPERS
    // -------------------------------
    function resetMatchState() {
        matchState.players.forEach(p => {
            p.score = 501;
            p.legsWon = 0;
            p.setsWon = 0;
            p.matchScore = 0;
            p.matchDarts = 0;
            p.legScore = 0;
            p.legDarts = 0;
            p.turnsThisLeg = 0;
            p.totalTurnsWonLegs = 0;
            p.legsWonCount = 0;
            p.chkAttempts1D = 0;
            p.chkAttempts2D = 0;
            p.chkAttempts3D = 0;
            p.chkSuccess1D = 0;
            p.chkSuccess2D = 0;
            p.chkSuccess3D = 0;
        });

        matchState.currentPlayer = 0;
        matchState.legStartPlayer = 0;
        matchState.setStartPlayer = 0;
        matchState.totalTurnsCompletedLegs = 0;
        matchState.legsCompleted = 0;
        matchState.scoreEntry = "";
        matchState.currentScreen = 0;
        matchState.avgPlayerView = 0;
    }

    function resetDoublesState() {
        doublesState.currentTarget = null;
        doublesState.currentCategory = null; // <-- NEW: clear the stored category

        doublesState.attempts1D = 0;
        doublesState.attempts2D = 0;
        doublesState.attempts3D = 0;
        doublesState.success1D = 0;
        doublesState.success2D = 0;
        doublesState.success3D = 0;
    }


    // -------------------------------
    // EXPORT
    // -------------------------------
    window.StateEngine = {
        GameState,
        matchState,
        doublesState,
        playersDB,
        resetMatchState,
        resetDoublesState
    };

})();
