// ===============================
// MAIN APP CONTROLLER
// ===============================

// Global input buffer for score entry (match keypad)
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

  // Init doubles once (engine guards against duplicates)
  if (Doubles && typeof Doubles.init === "function") {
    Doubles.init();
  }

  setupNavigation();
  setupKeypad();
  bindDoublesButtons();

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
  const defaultBtn = document.querySelector('.top-nav button[data-screen="match"]');
  if (defaultBtn) defaultBtn.classList.add("active");
}

function switchScreen(name) {
  currentScreen = name;

  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const screenEl = document.getElementById(`screen-${name}`);
  if (screenEl) screenEl.classList.add("active");

  if (name === "match") renderMatchScreen();
  if (name === "averages") renderAveragesScreen();
  if (name === "players") renderPlayersScreen();
  if (name === "doubles") renderDoublesScreen();
}


// ===============================
// KEYPAD HANDLING (Match only)
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
  if (display) {
    display.textContent = scoreBuffer.length > 0 ? `Score: ${scoreBuffer}` : "Score: —";
  }
}


// ===============================
// MATCH SCREEN RENDERING
// ===============================

function renderMatchScreen() {
  const p1 = Match.getPlayer(0);
  const p2 = Match.getPlayer(1);

  // Active player (0 or 1)
  const active = Match.getCurrentPlayer();

  // UPDATE NAMES & SCORES
  const p1Name = document.getElementById("p1-name");
  const p2Name = document.getElementById("p2-name");
  const p1Score = document.getElementById("p1-score");
  const p2Score = document.getElementById("p2-score");

  if (p1Name) p1Name.textContent = p1.name;
  if (p2Name) p2Name.textContent = p2.name;
  if (p1Score) p1Score.textContent = p1.score;
  if (p2Score) p2Score.textContent = p2.score;

  // CHECKOUT SUGGESTION
  const activePlayer = active === 0 ? p1 : p2;
  const suggestion = Checkout && typeof Checkout.getSuggestion === "function"
    ? Checkout.getSuggestion(activePlayer.score)
    : null;

  const checkoutEl = document.getElementById("checkout-display");
  if (checkoutEl) {
    checkoutEl.textContent = suggestion ? `Checkout: ${suggestion}` : "Checkout: —";
  }

  // ACTIVE PLAYER HIGHLIGHT
  const p1Card = document.getElementById("p1");
  const p2Card = document.getElementById("p2");
  if (p1Card) p1Card.classList.toggle("active", active === 0);
  if (p2Card) p2Card.classList.toggle("active", active === 1);
}


// ===============================
// SCORE SUBMISSION (Match)
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

  if (!container) return;

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

  if (!list) return;

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

// --- Polish helpers for % UI ---
function classForPct(pct) {
  if (pct >= 66) return "stat-ok";
  if (pct >= 33) return "stat-warn";
  return "stat-bad";
}

function updateStatEl(el, pct) {
  if (!el) return;

  // Remove previous classes
  el.classList.remove("stat-ok", "stat-warn", "stat-bad", "stat-animate", "stat-pulse");

  // Apply new % class
  el.classList.add(classForPct(pct));

  // Restart and apply animation
  void el.offsetWidth; // reflow for restart
  el.classList.add("stat-animate");

  // Subtle pulse
  el.classList.add("stat-pulse");
  setTimeout(() => el.classList.remove("stat-pulse"), 420);
}

function fmtPct(n) {
  return (Math.round(n * 10) / 10).toFixed(1) + "%";
}

function renderDoublesScreen() {
  const target = Doubles.getCurrentTarget();
  const suggestion = (Checkout && typeof Checkout.getSuggestion === "function" && target)
    ? Checkout.getSuggestion(target)
    : null;

  const tEl = document.getElementById("doubles-target");
  const sEl = document.getElementById("doubles-suggestion");

  if (tEl) tEl.textContent = (target ?? "—");
  if (sEl) sEl.textContent = (suggestion || "—");

  // Percentages per category
  const st = Doubles.getStats();
  const p1 = st.attempts1D ? (st.success1D / st.attempts1D) * 100 : 0;
  const p2 = st.attempts2D ? (st.success2D / st.attempts2D) * 100 : 0;
  const p3 = st.attempts3D ? (st.success3D / st.attempts3D) * 100 : 0;

  // Update pretty stat pills
  const el1 = document.getElementById("doubles-pct-1d");
  const el2 = document.getElementById("doubles-pct-2d");
  const el3 = document.getElementById("doubles-pct-3d");

  if (el1) { el1.textContent = fmtPct(p1); updateStatEl(el1, p1); }
  if (el2) { el2.textContent = fmtPct(p2); updateStatEl(el2, p2); }
  if (el3) { el3.textContent = fmtPct(p3); updateStatEl(el3, p3); }
}

function bindDoublesButtons() {
  const hitBtn  = document.getElementById("doubles-hit-btn");
  const missBtn = document.getElementById("doubles-miss-btn");

  if (hitBtn && !hitBtn.dataset.bound) {
    hitBtn.addEventListener("click", () => {
      Doubles.enterVisit({ hit: true });
      renderDoublesScreen();
    });
    hitBtn.dataset.bound = "1";
  }

  if (missBtn && !missBtn.dataset.bound) {
    missBtn.addEventListener("click", () => {
      Doubles.enterVisit({ hit: false });
      renderDoublesScreen();
    });
    missBtn.dataset.bound = "1";
  }
}


// ===============================
// SETTINGS
// ===============================

const resetBtn = document.getElementById("reset-data-btn");
if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (confirm("Reset all saved players and stats?")) {
      Players.reset();
      Match.reset();
      Doubles.reset();
      renderMatchScreen();
      renderPlayersScreen();
      renderDoublesScreen();
    }
  });
}
