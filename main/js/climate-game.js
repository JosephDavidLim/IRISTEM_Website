/**
 * "How to Pay for Climate Costs," an interactive budget simulation.
 * Implements the official game rules: allocate tokens across 7 sectors,
 * then resolve 3 climate event cards.
 *
 * - Funding Gap (tokens < an event's cost): the balance is lost and the
 *   simulation ends immediately.
 * - Sufficient Coverage (tokens >= an event's cost): always a success, even
 *   when it drains a sector to exactly 0; that sector has done its job.
 * - Victory requires surviving all 3 cards AND every sector that was never
 *   targeted by an event still holding at least 1 token; a sector left
 *   empty during allocation can never recover, so it dooms the round the
 *   moment it's drawn (instant Funding Gap) or, if never drawn, at the
 *   final check.
 */
(function () {
  "use strict";

  var CATEGORIES = [
    { id: "wildfire", name: "Wildfire", icon: "🔥" },
    { id: "homes", name: "Homes", icon: "🏠" },
    { id: "school", name: "School", icon: "🏫" },
    { id: "medical", name: "Medical", icon: "🚑" },
    { id: "floods", name: "Floods", icon: "🌊" },
    { id: "trees", name: "Trees", icon: "🌳" },
    { id: "air", name: "Air", icon: "💨" },
  ];

  var EVENT_DECK = [
    { category: "wildfire", name: "Ember Storm", cost: 1, desc: "Wind-driven embers ignite spot fires across dry brush." },
    { category: "wildfire", name: "Raging Wildfire", cost: 2, desc: "A fast-moving wildfire threatens the urban edge." },
    { category: "wildfire", name: "Firestorm Outbreak", cost: 3, desc: "Multiple simultaneous fires overwhelm containment lines." },
    { category: "homes", name: "Storm-Damaged Roofs", cost: 1, desc: "High winds tear roofing off dozens of homes." },
    { category: "homes", name: "Housing Displacement", cost: 2, desc: "Families are displaced after flooding damages residential blocks." },
    { category: "homes", name: "Mass Home Loss", cost: 3, desc: "An entire neighborhood is destroyed by a climate disaster." },
    { category: "school", name: "Smoke Closure", cost: 1, desc: "Poor air quality forces an emergency school closure." },
    { category: "school", name: "Storm-Damaged Campus", cost: 2, desc: "Flooding damages classrooms and electrical systems." },
    { category: "school", name: "Extended Shutdown", cost: 3, desc: "Structural damage forces schools to relocate students for weeks." },
    { category: "medical", name: "Medical Supply Shortage", cost: 1, desc: "A heat wave strains local pharmacy and clinic supplies." },
    { category: "medical", name: "Heat-Related ER Surge", cost: 2, desc: "Emergency rooms are overwhelmed by heat-stroke cases." },
    { category: "medical", name: "Hospital Overload", cost: 3, desc: "A disaster floods hospitals well beyond capacity." },
    { category: "floods", name: "Flash Flood Warning", cost: 1, desc: "Sudden heavy rainfall floods low-lying streets." },
    { category: "floods", name: "Catastrophic Flooding", cost: 2, desc: "A swollen river overtops its banks into residential areas." },
    { category: "floods", name: "Levee Failure", cost: 3, desc: "An aging levee fails, flooding an entire district." },
    { category: "trees", name: "Drought Stress", cost: 1, desc: "Prolonged drought weakens the urban tree canopy." },
    { category: "trees", name: "Mass Tree Die-Off", cost: 2, desc: "Pests and heat stress kill trees across city parks." },
    { category: "trees", name: "Canopy Collapse", cost: 3, desc: "Widespread tree loss removes shade and erosion control citywide." },
    { category: "air", name: "Extreme Heat", cost: 1, desc: "A heat dome pushes temperatures to dangerous highs." },
    { category: "air", name: "Wildfire Smoke Advisory", cost: 2, desc: "Drifting smoke worsens air quality for days." },
    { category: "air", name: "Air Quality Crisis", cost: 3, desc: "Hazardous air quality triggers a public health emergency." },
  ];

  var ROUNDS = {
    1: { label: "Round 1: Local Budget Only", total: 8, local: 8, superfund: 0 },
    2: { label: "Round 2: Climate Superfund", total: 12, local: 8, superfund: 4 },
  };

  var els = {};
  var state = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function shuffledDeck() {
    var deck = EVENT_DECK.slice();
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = deck[i];
      deck[i] = deck[j];
      deck[j] = tmp;
    }
    return deck;
  }

  function newState(roundNumber) {
    var round = ROUNDS[roundNumber];
    var buckets = {};
    CATEGORIES.forEach(function (c) {
      buckets[c.id] = 0;
    });
    return {
      roundNumber: roundNumber,
      round: round,
      tokensRemaining: round.total,
      buckets: buckets,
      deck: shuffledDeck(),
      eventIndex: 0,
      log: [],
      touched: {},
      phase: "allocate",
      failedCategory: null,
    };
  }

  function announce(message) {
    els.message.textContent = message;
  }

  /* ---------- Bucket board ---------- */

  function buildBoard() {
    els.buckets.innerHTML = "";
    CATEGORIES.forEach(function (c) {
      var el = document.createElement("div");
      el.className = "cg-bucket";
      el.dataset.category = c.id;
      el.innerHTML =
        '<div class="cg-bucket-icon" aria-hidden="true">' + c.icon + "</div>" +
        '<div class="cg-bucket-name">' + c.name + "</div>" +
        '<div class="cg-coin-stack" data-role="coins" aria-hidden="true"></div>' +
        '<div class="cg-bucket-count"><span data-role="count">0</span> token<span data-role="plural">s</span></div>' +
        '<div class="cg-token-controls" data-role="controls">' +
        '<button type="button" class="cg-token-btn" data-action="minus" aria-label="Remove token from ' + c.name + '">−</button>' +
        '<button type="button" class="cg-token-btn" data-action="plus" aria-label="Add token to ' + c.name + '">+</button>' +
        "</div>";
      el.querySelector('[data-action="minus"]').addEventListener("click", function () {
        adjustToken(c.id, -1);
      });
      el.querySelector('[data-action="plus"]').addEventListener("click", function () {
        adjustToken(c.id, 1);
      });
      els.buckets.appendChild(el);
    });
  }

  function refreshBoard() {
    var editable = state.phase === "allocate";
    CATEGORIES.forEach(function (c) {
      var el = els.buckets.querySelector('.cg-bucket[data-category="' + c.id + '"]');
      var count = state.buckets[c.id];
      el.querySelector('[data-role="count"]').textContent = count;
      el.querySelector('[data-role="plural"]').textContent = count === 1 ? "" : "s";
      el.classList.toggle("cg-empty", count === 0);

      var coinStack = el.querySelector('[data-role="coins"]');
      coinStack.innerHTML = "";
      for (var i = 0; i < count; i++) {
        var coin = document.createElement("span");
        coin.className = "cg-coin";
        coinStack.appendChild(coin);
      }

      var controls = el.querySelector('[data-role="controls"]');
      controls.style.display = editable ? "" : "none";
      var minusBtn = el.querySelector('[data-action="minus"]');
      var plusBtn = el.querySelector('[data-action="plus"]');
      minusBtn.disabled = count <= 0;
      plusBtn.disabled = state.tokensRemaining <= 0;
    });

    els.tokensRemaining.textContent = state.tokensRemaining;
    els.roundLabel.textContent = state.round.label;
  }

  function adjustToken(categoryId, delta) {
    if (state.phase !== "allocate") return;
    if (delta > 0) {
      if (state.tokensRemaining <= 0) return;
      state.buckets[categoryId] += 1;
      state.tokensRemaining -= 1;
    } else {
      if (state.buckets[categoryId] <= 0) return;
      state.buckets[categoryId] -= 1;
      state.tokensRemaining += 1;
    }
    refreshBoard();
    renderControlPanel();
  }

  function flashBucket(categoryId, className) {
    var el = els.buckets.querySelector('.cg-bucket[data-category="' + categoryId + '"]');
    el.classList.remove("cg-flash-success", "cg-flash-fail", "cg-flash-warning");
    // Force reflow so the animation can restart if triggered twice.
    void el.offsetWidth;
    el.classList.add(className);
  }

  /* ---------- Control panel per phase ---------- */

  function renderControlPanel() {
    els.panel.innerHTML = "";

    if (state.phase === "allocate") {
      var wrap = document.createElement("div");
      wrap.className = "cg-panel-block";
      var composition =
        state.round.superfund > 0
          ? state.round.local + " Local + " + state.round.superfund + " Superfund"
          : state.round.local + " Local";
      wrap.innerHTML =
        '<p class="cg-instructions">Distribute all ' + state.round.total + " tokens (" + composition +
        ") across the sectors above. You may leave a sector empty, but it will be completely unbuffered." +
        "</p>" +
        '<p class="cg-tip">Tip: a sector can never be topped up once the budget is locked in. Any sector left at 0 can never reach Climate Resilience. It must dodge every event AND still won’t count as funded at the end.</p>' +
        '<div class="cg-actions">' +
        '<button type="button" class="btn btn-custom" id="cg-lock-budget"' +
        (state.tokensRemaining === 0 ? "" : " disabled") +
        ">Lock In Budget &amp; Face Events ▶</button>" +
        '<button type="button" class="cg-link-btn" id="cg-reset-allocation">Reset Allocation</button>' +
        "</div>";
      els.panel.appendChild(wrap);
      var lockBtn = byId("cg-lock-budget");
      if (lockBtn) lockBtn.addEventListener("click", lockBudget);
      byId("cg-reset-allocation").addEventListener("click", resetAllocation);
    } else if (state.phase === "event") {
      var block = document.createElement("div");
      block.className = "cg-panel-block";
      var cardShown = state.currentCard != null;
      var html = '<p class="cg-event-status">Event ' + (state.eventIndex + 1) + " of 3</p>";
      if (cardShown) {
        var card = state.currentCard;
        var catName = CATEGORIES.filter(function (c) { return c.id === card.category; })[0].name;
        html +=
          '<div class="cg-card">' +
          '<div class="cg-card-cost">Severity ' + card.cost + "</div>" +
          "<h3>" + card.name + "</h3>" +
          "<p>" + card.desc + "</p>" +
          '<p class="cg-card-target">Targets: <strong>' + catName + "</strong></p>" +
          "</div>";
        if (state.currentResult) {
          html += '<div class="cg-result cg-result-' + state.currentResult.kind + '">' + state.currentResult.text + "</div>";
        }
      }
      block.innerHTML = html;
      els.panel.appendChild(block);

      var actions = document.createElement("div");
      actions.className = "cg-actions";
      if (!cardShown) {
        actions.innerHTML = '<button type="button" class="btn btn-custom" id="cg-draw-card">Draw Event Card 🎴</button>';
        els.panel.appendChild(actions);
        byId("cg-draw-card").addEventListener("click", drawCard);
      } else if (state.awaitingNext) {
        actions.innerHTML = '<button type="button" class="btn btn-custom" id="cg-next-event">Continue ▶</button>';
        els.panel.appendChild(actions);
        byId("cg-next-event").addEventListener("click", advanceAfterCard);
      }
    } else if (state.phase === "final") {
      renderFinal();
    }
  }

  function lockBudget() {
    if (state.tokensRemaining !== 0) return;
    state.phase = "event";
    state.currentCard = null;
    state.currentResult = null;
    state.awaitingNext = false;
    announce("Budget locked in. Draw your first climate event.");
    refreshBoard();
    renderControlPanel();
  }

  function resetAllocation() {
    var round = state.roundNumber;
    state = newState(round);
    refreshBoard();
    renderControlPanel();
    announce("Allocation reset. Place your tokens across the seven sectors.");
  }

  function drawCard() {
    var card = state.deck[state.eventIndex];
    state.currentCard = card;

    var available = state.buckets[card.category];
    var catName = CATEGORIES.filter(function (c) { return c.id === card.category; })[0].name;
    var result;

    state.touched[card.category] = true;

    if (available >= card.cost) {
      // Sufficient Coverage: always a successful resolution, even when it
      // drains the sector to exactly 0. The official rules only call an
      // immediate "infrastructure failure" when tokens are insufficient;
      // a sector that pays its cost in full has still done its job.
      state.buckets[card.category] -= card.cost;
      var remaining = state.buckets[card.category];
      if (remaining === 0) {
        result = {
          kind: "warning",
          text: "✅ Sufficient Coverage: " + catName + " paid " + card.cost + " token(s) in full and is now fully spent, with nothing left for the rest of this round.",
        };
        flashBucket(card.category, "cg-flash-warning");
      } else {
        result = {
          kind: "success",
          text: "✅ Sufficient Coverage: " + catName + " paid " + card.cost + " token(s) and has " + remaining + " left.",
        };
        flashBucket(card.category, "cg-flash-success");
      }
    } else {
      // Funding Gap: tokens are fewer than required, so the entire balance is
      // lost and this ends the simulation immediately.
      state.buckets[card.category] = 0;
      result = {
        kind: "gap",
        text: "❌ Funding Gap! " + catName + " only had " + available + " of the " + card.cost + " token(s) needed. The balance is lost and the sector fails.",
      };
      flashBucket(card.category, "cg-flash-fail");
    }

    state.currentResult = result;
    state.log.push({ card: card, categoryName: catName, resultKind: result.kind });
    refreshBoard();

    if (result.kind === "gap") {
      state.failedCategory = catName;
      state.failedReason = "gap";
      state.awaitingNext = false;
      renderControlPanel();
      setTimeout(function () {
        endGame(false);
      }, 900);
      return;
    }

    state.awaitingNext = true;
    renderControlPanel();
  }

  function advanceAfterCard() {
    state.eventIndex += 1;
    state.currentCard = null;
    state.currentResult = null;
    state.awaitingNext = false;

    if (state.eventIndex >= 3) {
      // A sector drained to 0 by successfully paying an event's cost already
      // did its job (Sufficient Coverage). The only sectors that can still
      // sink the Victory condition here are ones that sat at 0 the whole
      // round and were never even tested by an event.
      var unfunded = CATEGORIES.filter(function (c) {
        return !state.touched[c.id] && state.buckets[c.id] === 0;
      });
      if (unfunded.length === 0) {
        endGame(true);
      } else {
        state.failedCategory = unfunded.map(function (c) { return c.name; }).join(", ");
        state.failedReason = "unfunded";
        endGame(false);
      }
      return;
    }

    renderControlPanel();
  }

  function endGame(victory) {
    state.phase = "final";
    state.victory = victory;
    refreshBoard();
    renderControlPanel();
    announce(victory ? "Climate Resilience achieved." : "Funding Gap. Simulation over.");
  }

  function renderFinal() {
    var banner = document.createElement("div");
    banner.className = "cg-final-banner " + (state.victory ? "cg-final-win" : "cg-final-lose");

    if (state.victory) {
      banner.innerHTML =
        "<h3>🏆 Climate Resilience Achieved</h3>" +
        "<p>You survived all three climate events and every sector still has funding.</p>";
    } else if (state.failedReason === "gap") {
      banner.innerHTML =
        "<h3>⚠️ Funding Gap</h3>" +
        "<p><strong>" + state.failedCategory + "</strong> didn't have enough tokens to cover an event's cost. The balance was lost and the sector failed immediately.</p>";
    } else {
      banner.innerHTML =
        "<h3>⚠️ Funding Gap</h3>" +
        "<p>You survived all three events, but <strong>" + state.failedCategory + "</strong> was left completely unbuffered during your budget allocation and never received support.</p>";
    }

    var recap = document.createElement("div");
    recap.className = "cg-recap";
    if (state.log.length > 0) {
      var items = state.log
        .map(function (entry, i) {
          var outcome =
            entry.resultKind === "success"
              ? "covered"
              : entry.resultKind === "warning"
              ? "covered but fully drained"
              : "caused a Funding Gap in";
          return (
            "<li>Event " + (i + 1) + ": <strong>" + entry.card.name + "</strong> (Severity " + entry.card.cost + ") " +
            outcome + " " + entry.categoryName + "</li>"
          );
        })
        .join("");
      recap.innerHTML = "<h4>Event Recap</h4><ol>" + items + "</ol>";
    }

    var actions = document.createElement("div");
    actions.className = "cg-actions";
    actions.innerHTML =
      '<button type="button" class="btn btn-custom" id="cg-play-again">Play Again</button>';

    els.panel.appendChild(banner);
    els.panel.appendChild(recap);
    els.panel.appendChild(actions);

    byId("cg-play-again").addEventListener("click", function () {
      showRoundSelect();
    });
  }

  /* ---------- Round selection ---------- */

  function startRound(roundNumber) {
    state = newState(roundNumber);
    els.roundSelect.hidden = true;
    els.board.hidden = false;
    refreshBoard();
    renderControlPanel();
    announce(
      "Round " + roundNumber + " started with " + state.round.total +
        " tokens. Place them across the seven sectors, then lock in your budget."
    );
    els.board.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showRoundSelect() {
    state = null;
    els.board.hidden = true;
    els.roundSelect.hidden = false;
    els.roundSelect.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function init() {
    var root = byId("climate-game");
    if (!root) return;

    els.roundSelect = byId("cg-round-select");
    els.board = byId("cg-board");
    els.buckets = byId("cg-buckets");
    els.panel = byId("cg-control-panel");
    els.message = byId("cg-message");
    els.tokensRemaining = byId("cg-tokens-remaining");
    els.roundLabel = byId("cg-round-label");

    buildBoard();

    var roundButtons = els.roundSelect.querySelectorAll("[data-round]");
    roundButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        startRound(Number(btn.dataset.round));
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
