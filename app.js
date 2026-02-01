// ===============================
// MAIN APP CONTROLLER
// ===============================

// Global input buffer for score entry
let scoreBuffer = "";

// Active screen
let currentScreen = "match";

// Engine modules (loaded later)
let Match = null;
let Doubles = null;
let Players = null;
let Checkout = null;


// ===============================
// INITIALISATION
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    // Load engine modules

    Match = window.MatchEngine;
    Doubles = window.DoublesEngine;
    Players = window.PlayersEngine;
    Checkout = window.CheckoutEngine;
    Doubles.init();

    setupNavigation();
    setupKeypad();
   

    // Initial UI render
    renderMatchScreen();

});


// ===============================
// NAVIGATION
// ===============================

function setupNavigation() {
    const navButtons = document.querySelectorAll(".top-nav button");

    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.dataset.screen;
            switchScreen(target);

            navButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        });
    });

    // Default active
    document.querySelector('.top-nav button[data-screen="match"]').classList.add("active");
}

function switchScreen(name) {
    currentScreen = name;

    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    document.getElementById(`screen-${name}`).classList.add("active");

    if (name === "match") renderMatchScreen();
    if (name === "averages") renderAveragesScreen();
    if (name === "players") renderPlayersScreen();
    if (name === "doubles") renderDoublesScreen();
}


// ===============================
// KEYPAD HANDLING
// ===============================

function setupKeypad() {
    const keys = document.querySelectorAll(".key");

   keys.forEach(key => {
    key.addEventListener("click", () => {
        const value = key.textContent.trim();

        if (key.classList.contains("key-undo")) {
            handleUndo();
            return;
        }

        if (key.classList.contains("key-enter")) {
            submitScore();
            return;
        }


            handleDigit(value);
        });
    });
}

function handleDigit(digit) {
    if (scoreBuffer.length >= 3) return; // max 180

    scoreBuffer += digit;
    updateEntryDisplay();
}

function handleUndo() {
    scoreBuffer = scoreBuffer.slice(0, -1);
    updateEntryDisplay();
}

function updateEntryDisplay() {
    const display = document.getElementById("entry-display");
    display.textContent = scoreBuffer.length > 0 ? `Score: ${scoreBuffer}` : "Score: —";
}


// ===============================
// MATCH SCREEN RENDERING
// ===============================

function renderMatchScreen() {
    const p1 = Match.getPlayer(0);
    const p2 = Match.getPlayer(1);

    //  Active player (0 or 1)
    const active = Match.getCurrentPlayer();

    // ===============================
    // UPDATE NAMES & SCORES
    // ===============================
    document.getElementById("p1-name").textContent = p1.name;
    document.getElementById("p2-name").textContent = p2.name;

    document.getElementById("p1-score").textContent = p1.score;
    document.getElementById("p2-score").textContent = p2.score;

    // ===============================
    // CHECKOUT SUGGESTION
    // ===============================
    const activePlayer = active === 0 ? p1 : p2;
    const suggestion = Checkout.getSuggestion(activePlayer.score);

    document.getElementById("checkout-display").textContent =
        suggestion ? `Checkout: ${suggestion}` : "Checkout: —";

    // ===============================
    // ACTIVE PLAYER HIGHLIGHT
    // ===============================
    document.getElementById("p1").classList.toggle("active", active === 0);
    document.getElementById("p2").classList.toggle("active", active === 1);
}




// ===============================
// SCORE SUBMISSION
// ===============================

document.addEventListener("keydown", e => {
    if (e.key === "Enter") submitScore();
});

function submitScore() {
    if (scoreBuffer.length === 0) return;

    const score = parseInt(scoreBuffer, 10);
    Match.enterScore(score);

    scoreBuffer = "";
    updateEntryDisplay();
    renderMatchScreen();
}


// ===============================
// AVERAGES SCREEN
// ===============================

function renderAveragesScreen() {
    const container = document.getElementById("averages-content");
    const stats = Match.getAverages();

    container.innerHTML = `
        <div class="player-card">
            <h3>${stats.p1.name}</h3>
            <p>3-Dart Avg: ${stats.p1.matchAvg.toFixed(1)}</p>
            <p>Turns/Leg Won: ${stats.p1.turnsAvg.toFixed(1)}</p>
            <p>Checkout %: ${stats.p1.checkout}%</p>
        </div>

        <div class="player-card">
            <h3>${stats.p2.name}</h3>
            <p>3-Dart Avg: ${stats.p2.matchAvg.toFixed(1)}</p>
            <p>Turns/Leg Won: ${stats.p2.turnsAvg.toFixed(1)}</p>
            <p>Checkout %: ${stats.p2.checkout}%</p>
        </div>
    `;
}


// ===============================
// PLAYERS SCREEN
// ===============================

function renderPlayersScreen() {
    const list = document.getElementById("players-list");
    const players = Players.getAll();

    list.innerHTML = "";

    players.forEach(p => {
        const card = document.createElement("div");
        card.className = "player-card";

        card.innerHTML = `
            <strong>${p.name}</strong><br>
            ID: ${p.id}<br>
            Legs Won: ${p.legsWon}<br>
            Sets Won: ${p.setsWon}<br>
            <button data-id="${p.id}" class="delete-player">Delete</button>
        `;

        list.appendChild(card);
    });

    document.querySelectorAll(".delete-player").forEach(btn => {
        btn.addEventListener("click", () => {
            Players.delete(btn.dataset.id);
            renderPlayersScreen();
        });
    });
}


// ===============================
// DOUBLES PRACTICE
// ===============================

function renderDoublesScreen() {
  const target = Doubles.getCurrentTarget();
  const suggestion = target ? Checkout.getSuggestion(target) : null;

  document.getElementById("doubles-target").textContent = target ?? "—";
  document.getElementById("doubles-suggestion").textContent = suggestion || "—";

  // --- Finish % line ---
  const st = Doubles.getStats();
  const p1 = st.attempts1D ? (st.success1D / st.attempts1D) * 100 : 0;
  const p2 = st.attempts2D ? (st.success2D / st.attempts2D) * 100 : 0;
  const p3 = st.attempts3D ? (st.success3D / st.attempts3D) * 100 : 0;

  const fmt = (n) => (Math.round(n * 10) / 10).toFixed(1);
  const statsLine = `1 Dart: ${fmt(p1)}%     2 Dart: ${fmt(p2)}%     3 Dart: ${fmt(p3)}%`;

  const statsEl = document.getElementById("doubles-stats-line");
  if (statsEl) statsEl.textContent = statsLine;
}

// Doubles Hit / Miss buttons
const hitBtn  = document.getElementById("doubles-hit-btn");
const missBtn = document.getElementById("doubles-miss-btn");

if (hitBtn) {
  hitBtn.addEventListener("click", () => {
    Doubles.enterVisit({ hit: true });
    renderDoublesScreen();
  });
}
if (missBtn) {
  missBtn.addEventListener("click", () => {
    Doubles.enterVisit({ hit: false });
    renderDoublesScreen();
  });
}


// ===============================
// SETTINGS
// ===============================

document.getElementById("reset-data-btn").addEventListener("click", () => {
    if (confirm("Reset all saved players and stats?")) {
        Players.reset();
        Match.reset();
        Doubles.reset();
        renderMatchScreen();
        renderPlayersScreen();
    }
});



