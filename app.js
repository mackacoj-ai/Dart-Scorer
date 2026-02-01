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
let Checkout = null;


// ===============================
// INITIALISATION
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  // Load engine modules
  Match = window.MatchEngine;
  Doubles = window.DoublesEngine;
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
  if (name === "doubles") renderDoublesScreen();
  // players screen removed
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

  // ACTIVE PLAYER HIGHLIGHT (cards)
  const p1Card = document.getElementById("p1");
  const p2Card = document.getElementById("p2");
  if (p1Card) p1Card.classList.toggle("active", active === 0);
  if (p2Card) p2Card.classList.toggle("active", active === 1);

  // Player pill text
  const p1LegsEl = document.getElementById("pill-p1-legs");
  const p2LegsEl = document.getElementById("pill-p2-legs");
  const p1SetsEl = document.getElementById("pill-p1-sets");
  const p2SetsEl = document.getElementById("pill-p2-sets");
  const p1NameEl = document.getElementById("pill-p1-name");
  const p2NameEl = document.getElementById("pill-p2-name");

  if (p1NameEl) p1NameEl.textContent = p1.name;
  if (p2NameEl) p2NameEl.textContent = p2.name;

  if (p1LegsEl) p1LegsEl.textContent = `Legs: ${p1.legsWon ?? 0}`;
  if (p2LegsEl) p2LegsEl.textContent = `Legs: ${p2.legsWon ?? 0}`;
  if (p1SetsEl) p1SetsEl.textContent = `Sets: ${p1.setsWon ?? 0}`;
  if (p2SetsEl) p2SetsEl.textContent = `Sets: ${p2.setsWon ?? 0}`;

  // Subtle active glow on the player pills
  const pillP1 = document.getElementById("pill-p1");
  const pillP2 = document.getElementById("pill-p2");
  if (pillP1) {
    pillP1.style.boxShadow = (active === 0)
      ? "0 0 0 3px rgba(10,132,255,0.25), 0 10px 28px rgba(0,0,0,0.10)"
      : "0 1px 1px rgba(0,0,0,0.04), 0 8px 22px rgba(0,0,0,0.05)";
  }
  if (pillP2) {
    pillP2.style.boxShadow = (active === 1)
      ? "0 0 0 3px rgba(255,69,58,0.25), 0 10px 28px rgba(0,0,0,0.10)"
      : "0 1px 1px rgba(0,0,0,0.04), 0 8px 22px rgba(0,0,0,0.05)";
  }
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
  if (!container) return;

  const stats = Match.getAverages();

  const p1 = stats.p1;
  const p2 = stats.p2;

  // Safe formatting helpers
  const fmtNum = (n, d = 1) => {
    if (typeof n !== "number" || isNaN(n)) return "0.0";
    return n.toFixed(d);
  };
  const fmtPct = (n) => {
    if (typeof n !== "number" || isNaN(n)) return "0.0%";
    return `${fmtNum(n, 1)}%`;
  };

  container.innerHTML = `
    <section class="averages-grid">
      <article class="avg-card avg-card--p1">
        <h3>${p1.name}</h3>
        <div class="avg-main">${fmtNum(p1.matchAvg, 1)}</div>
        <div class="avg-subgrid">
          <div class="avg-item">
            <span class="label">Checkout %</span>
            <span class="value">${fmtPct(p1.checkout)}</span>
          </div>
          <div class="avg-item">
            <span class="label">Darts thrown</span>
            <span class="value">${p1.matchDarts ?? 0}</span>
          </div>

          <div class="avg-item">
            <span class="label">Turns / Leg Won</span>
            <span class="value">${fmtNum(p1.turnsAvg, 1)}</span>
          </div>
          <div class="avg-item">
            <span class="label">Sets</span>
            <span class="value">${p1.setsWon ?? 0}</span>
          </div>

          <div class="avg-item">
            <span class="label">1-Dart: Attempts</span>
            <span class="value">${p1.chkAttempts1D ?? 0}</span>
          </div>
          <div class="avg-item">
            <span class="label">1-Dart: Success %</span>
            <span class="value">${fmtPct(p1.chkPct1D ?? 0)}</span>
          </div>

          <div class="avg-item">
            <span class="label">2-Dart: Attempts</span>
            <span class="value">${p1.chkAttempts2D ?? 0}</span>
          </div>
          <div class="avg-item">
            <span class="label">2-Dart: Success %</span>
            <span class="value">${fmtPct(p1.chkPct2D ?? 0)}</span>
          </div>

          <div class="avg-item">
            <span class="label">3-Dart: Attempts</span>
            <span class="value">${p1.chkAttempts3D ?? 0}</span>
          </div>
          <div class="avg-item">
            <span class="label">3-Dart: Success %</span>
            <span class="value">${fmtPct(p1.chkPct3D ?? 0)}</span>
          </div>
        </div>
      </article>

      <article class="avg-card avg-card--p2">
        <h3>${p2.name}</h3>
        <div class="avg-main">${fmtNum(p2.matchAvg, 1)}</div>
        <div class="avg-subgrid">
          <div class="avg-item">
            <span class="label">Checkout %</span>
            <span class="value">${fmtPct(p2.checkout)}</span>
          </div>
          <div class="avg-item">
            <span class="label">Darts thrown</span>
            <span class="value">${p2.matchDarts ?? 0}</span>
          </div>

          <div class="avg-item">
            <span class="label">Turns / Leg Won</span>
            <span class="value">${fmtNum(p2.turnsAvg, 1)}</span>
          </div>
          <div class="avg-item">
            <span class="label">Sets</span>
            <span class="value">${p2.setsWon ?? 0}</span>
          </div>

          <div class="avg-item">
            <span class="label">1-Dart: Attempts</span>
            <span class="value">${p2.chkAttempts1D ?? 0}</span>
          </div>
          <div class="avg-item">
            <span class="label">1-Dart: Success %</span>
            <span class="value">${fmtPct(p2.chkPct1D ?? 0)}</span>
          </div>

          <div class="avg-item">
            <span class="label">2-Dart: Attempts</span>
            <span class="value">${p2.chkAttempts2D ?? 0}</span>
          </div>
          <div class="avg-item">
            <span class="label">2-Dart: Success %</span>
            <span class="value">${fmtPct(p2.chkPct2D ?? 0)}</span>
          </div>

          <div class="avg-item">
            <span class="label">3-Dart: Attempts</span>
            <span class="value">${p2.chkAttempts3D ?? 0}</span>
          </div>
          <div class="avg-item">
            <span class="label">3-Dart: Success %</span>
            <span class="value">${fmtPct(p2.chkPct3D ?? 0)}</span>
          </div>
        </div>
      </article>
    </section>
  `;
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
    if (confirm("Reset all match and doubles data?")) {
      Match.reset();
      Doubles.reset();
      renderMatchScreen();
      renderDoublesScreen();
      renderAveragesScreen();
    }
  });
}
