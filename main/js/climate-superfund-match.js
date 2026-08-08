(function () {
  "use strict";

  var PAIRS = [
    {
      id: "q1",
      number: "Q1",
      topic: "Purpose",
      question: "What was the Climate Superfund proposal designed to do?",
      letter: "E",
      answer: "Require certain large fossil-fuel companies to help cover California’s climate-related costs.",
    },
    {
      id: "q2",
      number: "Q2",
      topic: "Agency",
      question: "Which California agency would have managed the program?",
      letter: "B",
      answer: "The California Environmental Protection Agency, also called CalEPA.",
    },
    {
      id: "q3",
      number: "Q3",
      topic: "Years",
      question: "Which years of fossil-fuel emissions would have been counted?",
      letter: "I",
      answer: "Emissions released from 1990 through 2024.",
    },
    {
      id: "q4",
      number: "Q4",
      topic: "Threshold",
      question: "How much covered pollution would have placed a company above the proposed threshold?",
      letter: "D",
      answer: "More than one billion metric tons of covered fossil-fuel emissions worldwide.",
    },
    {
      id: "q5",
      number: "Q5",
      topic: "Payment",
      question: "How would each responsible company’s payment have been calculated?",
      letter: "J",
      answer: "Proportional to the company’s share of global covered fossil-fuel emissions.",
    },
    {
      id: "q6",
      number: "Q6",
      topic: "Study",
      question: "Which years of climate damage would California have studied?",
      letter: "A",
      answer: "Past and projected climate damages from 1990 through 2045.",
    },
    {
      id: "q7",
      number: "Q7",
      topic: "Projects",
      question: "What kinds of projects could Climate Superfund money have supported?",
      letter: "G",
      answer: "Projects that prepare for, reduce, repair, or respond to climate-related harm.",
    },
    {
      id: "q8",
      number: "Q8",
      topic: "Equity",
      question: "How much funding would have directly benefited disadvantaged communities?",
      letter: "C",
      answer: "At least 40% of the funding.",
    },
    {
      id: "q9",
      number: "Q9",
      topic: "Installments",
      question: "Could responsible companies have paid in installments?",
      letter: "H",
      answer: "Yes. The proposal allowed 20 installments, beginning with at least 10%.",
    },
    {
      id: "q10",
      number: "Q10",
      topic: "Status",
      question: "Did SB 684 and AB 1243 become California law?",
      letter: "F",
      answer: "No. Both proposals became inactive and died during the 2025–2026 session.",
    },
  ];

  var state;
  var timerId;
  var els = {};

  function shuffle(items) {
    var copy = items.slice();
    for (var i = copy.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var current = copy[i];
      copy[i] = copy[j];
      copy[j] = current;
    }
    return copy;
  }

  function formatTime(seconds) {
    var minutes = Math.floor(seconds / 60);
    var remainder = seconds % 60;
    return minutes + ":" + (remainder < 10 ? "0" : "") + remainder;
  }

  function elapsedSeconds() {
    if (!state.startedAt) return 0;
    var end = state.finishedAt || Date.now();
    return Math.floor((end - state.startedAt) / 1000);
  }

  function updateTimer() {
    els.time.textContent = formatTime(state ? elapsedSeconds() : 0);
  }

  function startTimer() {
    if (state.startedAt || state.finishedAt) return;
    state.startedAt = Date.now();
    timerId = window.setInterval(updateTimer, 1000);
  }

  function stopTimer() {
    window.clearInterval(timerId);
    timerId = null;
    if (state) updateTimer();
  }

  function cardButton(pair, type) {
    var button = document.createElement("button");
    var isQuestion = type === "question";
    button.type = "button";
    button.className = "match-card match-card--" + type;
    button.dataset.pairId = pair.id;
    button.dataset.cardType = type;
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = isQuestion
      ? '<span class="match-card-meta"><strong>' + pair.number + "</strong><span>" + pair.topic + "</span></span>" +
        '<span class="match-card-copy">' + pair.question + "</span>"
      : '<span class="match-card-meta"><strong>Answer ' + pair.letter + "</strong><span>Choose me</span></span>" +
        '<span class="match-card-copy">' + pair.answer + "</span>";
    button.addEventListener("click", selectCard);
    return button;
  }

  function renderDecks() {
    els.questionDeck.innerHTML = "";
    els.answerDeck.innerHTML = "";
    PAIRS.forEach(function (pair) {
      els.questionDeck.appendChild(cardButton(pair, "question"));
    });
    state.answerOrder.forEach(function (pair) {
      els.answerDeck.appendChild(cardButton(pair, "answer"));
    });
  }

  function findButton(type, pairId) {
    return document.querySelector(
      '.match-card[data-card-type="' + type + '"][data-pair-id="' + pairId + '"]'
    );
  }

  function clearSelected(type) {
    var selectedId = type === "question" ? state.selectedQuestion : state.selectedAnswer;
    if (!selectedId) return;
    var button = findButton(type, selectedId);
    if (button) {
      button.classList.remove("is-selected");
      button.setAttribute("aria-pressed", "false");
    }
    if (type === "question") state.selectedQuestion = null;
    else state.selectedAnswer = null;
  }

  function selectCard(event) {
    var button = event.currentTarget;
    var type = button.dataset.cardType;
    var pairId = button.dataset.pairId;
    if (state.matched[pairId] || state.busy) return;

    startTimer();

    var selectedKey = type === "question" ? "selectedQuestion" : "selectedAnswer";
    if (state[selectedKey] === pairId) {
      clearSelected(type);
    } else {
      clearSelected(type);
      state[selectedKey] = pairId;
      button.classList.add("is-selected");
      button.setAttribute("aria-pressed", "true");
    }

    updateSelectionMessage();

    if (
      type === "question" &&
      state[selectedKey] &&
      window.innerWidth <= 575 &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      window.setTimeout(function () {
        els.answerDeck.closest(".match-column").scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 120);
    }
  }

  function updateSelectionMessage() {
    els.check.disabled = !(state.selectedQuestion && state.selectedAnswer) || state.busy;
    if (state.selectedQuestion && state.selectedAnswer) {
      els.status.textContent = "Pair selected. Check your match.";
    } else if (state.selectedQuestion) {
      els.status.textContent = "Question selected. Now choose its answer.";
    } else if (state.selectedAnswer) {
      els.status.textContent = "Answer selected. Now choose its question.";
    } else {
      els.status.textContent = "Choose one question and one answer.";
    }
  }

  function updateDashboard() {
    var matchedCount = Object.keys(state.matched).length;
    var percent = matchedCount * 10;
    els.count.textContent = matchedCount;
    els.attempts.textContent = state.attempts;
    els.percent.textContent = percent + "%";
    els.progress.setAttribute("aria-valuenow", matchedCount);
    els.progressBar.style.width = percent + "%";
  }

  function finishGame() {
    state.finishedAt = Date.now();
    stopTimer();
    var misses = state.attempts - PAIRS.length;
    els.summary.textContent =
      "Finished in " + formatTime(elapsedSeconds()) + " with " + state.attempts +
      (state.attempts === 1 ? " try" : " tries") + " and " + misses +
      (misses === 1 ? " incorrect match." : " incorrect matches.");
    els.complete.hidden = false;
    els.check.disabled = true;
    window.setTimeout(function () {
      els.complete.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
  }

  function checkPair() {
    if (!state.selectedQuestion || !state.selectedAnswer || state.busy) return;
    state.busy = true;
    state.attempts += 1;
    var questionButton = findButton("question", state.selectedQuestion);
    var answerButton = findButton("answer", state.selectedAnswer);
    var isMatch = state.selectedQuestion === state.selectedAnswer;

    if (isMatch) {
      var matchedId = state.selectedQuestion;
      state.matched[matchedId] = true;
      questionButton.classList.remove("is-selected");
      answerButton.classList.remove("is-selected");
      questionButton.classList.add("is-matched");
      answerButton.classList.add("is-matched");
      questionButton.disabled = true;
      answerButton.disabled = true;
      questionButton.setAttribute("aria-pressed", "false");
      answerButton.setAttribute("aria-pressed", "false");
      state.selectedQuestion = null;
      state.selectedAnswer = null;
      state.busy = false;
      els.status.textContent = "Correct! That pair is now locked in.";
      updateDashboard();
      if (Object.keys(state.matched).length === PAIRS.length) finishGame();
      else {
        els.check.disabled = true;
        if (window.innerWidth <= 575) {
          window.setTimeout(function () {
            els.questionDeck.closest(".match-column").scrollIntoView({
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth",
              block: "start",
            });
          }, 180);
        }
      }
      return;
    }

    questionButton.classList.add("is-incorrect");
    answerButton.classList.add("is-incorrect");
    els.status.textContent = "Not quite. Those cards are returning to the board.";
    els.check.disabled = true;
    updateDashboard();
    window.setTimeout(function () {
      questionButton.classList.remove("is-incorrect");
      answerButton.classList.remove("is-incorrect");
      clearSelected("question");
      clearSelected("answer");
      state.busy = false;
      updateSelectionMessage();
      questionButton.focus();
    }, 800);
  }

  function resetGame() {
    stopTimer();
    state = {
      selectedQuestion: null,
      selectedAnswer: null,
      matched: {},
      attempts: 0,
      startedAt: null,
      finishedAt: null,
      busy: false,
      answerOrder: shuffle(PAIRS),
    };
    renderDecks();
    updateDashboard();
    updateTimer();
    els.complete.hidden = true;
    els.status.textContent = "Choose a question card to begin.";
    els.check.disabled = true;
  }

  function initialize() {
    els.questionDeck = document.getElementById("question-deck");
    els.answerDeck = document.getElementById("answer-deck");
    els.count = document.getElementById("match-count");
    els.attempts = document.getElementById("attempt-count");
    els.time = document.getElementById("match-time");
    els.percent = document.getElementById("progress-percent");
    els.progress = document.getElementById("match-progress");
    els.progressBar = document.getElementById("match-progress-bar");
    els.status = document.getElementById("match-status");
    els.check = document.getElementById("check-match");
    els.reset = document.getElementById("reset-match");
    els.playAgain = document.getElementById("play-again");
    els.complete = document.getElementById("match-complete");
    els.summary = document.getElementById("match-summary");

    if (!els.questionDeck || !els.answerDeck) return;
    els.check.addEventListener("click", checkPair);
    els.reset.addEventListener("click", resetGame);
    els.playAgain.addEventListener("click", function () {
      resetGame();
      document.getElementById("matching-game").scrollIntoView({ behavior: "smooth" });
    });
    resetGame();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();
