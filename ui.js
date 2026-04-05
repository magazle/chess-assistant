/**
 * Chess Assistant — UI
 * Modes: vs Engine | Opening Lab | Opening Drill | Analysis | Engine Pilot
 */

// ── Difficulty ────────────────────────────────────────────────────────────────

const DIFFICULTY = {
  beginner: { depth: 1, blunder: 0.40 },
  casual:   { depth: 2, blunder: 0.20 },
  club:     { depth: 3, blunder: 0.05 },
  advanced: { depth: 4, blunder: 0    },
  master:   { depth: 5, blunder: 0    },
};

const DIFF_LEVELS = ['beginner','casual','club','advanced','master'];

// ── Stockfish configuration ───────────────────────────────────────────────────

const STOCKFISH_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

const SF_LEVELS = {
  beginner: { skill:  2, movetime:  150 },
  casual:   { skill:  5, movetime:  300 },
  club:     { skill: 10, movetime:  600 },
  advanced: { skill: 15, movetime: 1200 },
  master:   { skill: 20, movetime: 2500 },
};

// ── Move classification ───────────────────────────────────────────────────────

const MOVE_CLASSES = [
  { max:   0, cls: 'mv-best',       sym: '✦',  label: 'Best'       },
  { max:  20, cls: 'mv-excellent',  sym: '✓',  label: 'Excellent'  },
  { max:  60, cls: 'mv-good',       sym: '',   label: 'Good'       },
  { max: 120, cls: 'mv-inaccuracy', sym: '?!', label: 'Inaccuracy' },
  { max: 250, cls: 'mv-mistake',    sym: '?',  label: 'Mistake'    },
  { max: Infinity, cls: 'mv-blunder', sym: '??', label: 'Blunder'  },
];

function classifyLoss(cpLoss) {
  const cls = MOVE_CLASSES.find(c => cpLoss <= c.max) || MOVE_CLASSES[MOVE_CLASSES.length - 1];
  return { ...cls, loss: cpLoss };
}

// Eval from White's perspective given a Stockfish score and the side to move
function whitePov(sfScore, turnToMove) {
  return turnToMove === 'w' ? sfScore : -sfScore;
}

// Loss for the side that just moved, given evals from White's perspective
function computeLoss(evalBefore, evalAfter, movedColor) {
  if (evalBefore === null || evalAfter === null) return null;
  return movedColor === 'w'
    ? Math.max(0, evalBefore - evalAfter)
    : Math.max(0, evalAfter  - evalBefore);
}

// ── Opening name ──────────────────────────────────────────────────────────────

function updateOpeningName() {
  const el = document.getElementById('opening-name');
  if (!el || !chess) return;
  if (!ecoReady && !ecoFailed) {
    el.textContent = chess.history().length ? 'Identifying…' : 'Starting position';
    el.style.color = 'var(--text3)';
    return;
  }
  const result = lookupOpening(chess.fen());
  el.textContent = result ? result.displayName : (chess.history().length ? 'Unknown opening' : 'Starting position');
  el.style.color  = result ? 'var(--text)' : 'var(--text3)';
}

// ── State ─────────────────────────────────────────────────────────────────────

let chess             = null;
let playerColor       = null;
let gameMode          = null; // 'vs'|'lab'|'drill'|'analysis'|'correspondence'
let selectedSq        = null;
let legalTargets      = [];
let lastMove          = null;
let engineThinking    = false;
let gameOver          = false;
let currentDifficulty = 'club';

// Lab / Analysis / Drill navigation history
let labHistory = [];
let labIndex   = 0;

// Promotion pending
let pendingPromoFrom = null;
let pendingPromoTo   = null;

// Analysis hint (ask engine)
let hintFrom = null;
let hintTo   = null;

// Analysis — eval & classification state
let positionEvals       = []; // positionEvals[i] = White-POV centipawns for labHistory[i]
let moveClassifications = []; // moveClassifications[i] = classifyLoss result for history move i
let analysisRunning     = false;

// Opening Drill state
let drillLine     = []; // Array of FENs for the target line
let drillIndex    = 0;
let drillFeedback = null; // null | 'correct' | 'wrong'

// Stockfish
let sfWorker    = null;
let sfReady     = false;
let sfPending   = null;
let sfLastScore = null; // last 'info score cp' captured

// ── Helpers ───────────────────────────────────────────────────────────────────

function isNavMode() {
  return gameMode === 'lab' || gameMode === 'analysis' || gameMode === 'drill';
}

function getEngineColor() {
  if (gameMode === 'vs')             return playerColor === 'w' ? 'b' : 'w';
  if (gameMode === 'lab')            return playerColor === 'w' ? 'b' : 'w';
  if (gameMode === 'correspondence') return playerColor;
  return null; // analysis / drill: no automatic engine moves
}

function getHumanColor() {
  if (gameMode === 'correspondence') return playerColor === 'w' ? 'b' : 'w';
  if (gameMode === 'analysis')       return chess.turn();
  if (gameMode === 'drill')          return playerColor;
  return playerColor;
}

// ── Stockfish engine ──────────────────────────────────────────────────────────

function initStockfish() {
  if (sfWorker) return;
  fetch(STOCKFISH_CDN)
    .then(r => r.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      sfWorker  = new Worker(url);
      URL.revokeObjectURL(url);
      sfWorker.onmessage = onSfMessage;
      sfWorker.onerror   = () => { sfWorker = null; sfReady = false; };
      sfWorker.postMessage('uci');
    })
    .catch(() => {});
}

function onSfMessage({ data }) {
  if (typeof data !== 'string') return;
  if (data === 'uciok') {
    sfWorker.postMessage('isready');
  } else if (data === 'readyok') {
    sfReady = true;
  } else if (data.startsWith('info') && data.includes('score cp')) {
    const m = data.match(/score cp (-?\d+)/);
    if (m) sfLastScore = parseInt(m[1]);
  } else if (data.startsWith('bestmove') && sfPending) {
    const cb    = sfPending;
    const score = sfLastScore;
    sfPending   = null;
    sfLastScore = null;
    cb(data.split(' ')[1], score);
  }
}

// Request Stockfish evaluation for a FEN. Calls cb(score) where score is
// centipawns from the perspective of the side to move in that FEN.
function sfEvalPosition(fen, movetime, cb) {
  if (!sfReady || !sfWorker || sfPending) { cb(null); return; }
  sfPending = (_, score) => cb(score);
  sfWorker.postMessage(`position fen ${fen}`);
  sfWorker.postMessage(`go movetime ${movetime}`);
}

// ── Engine dispatch ───────────────────────────────────────────────────────────

function triggerEngine() {
  const ec = getEngineColor();
  if (!ec || chess.turn() !== ec) return;
  engineThinking = true;
  renderBoard();
  runEngine();
}

function runEngine() {
  const { blunder } = DIFFICULTY[currentDifficulty];

  if (blunder > 0 && Math.random() < blunder) {
    const moves = chess.moves({ verbose: true });
    const m     = moves[Math.floor(Math.random() * moves.length)];
    if (m) { chess.move(m); onEngineMoveApplied(m.from, m.to); }
    else   { engineThinking = false; renderBoard(); }
    return;
  }

  if (sfReady && sfWorker && !sfPending) {
    const { skill, movetime } = SF_LEVELS[currentDifficulty];
    sfPending = (moveStr) => {
      const from  = moveStr.slice(0, 2);
      const to    = moveStr.slice(2, 4);
      const promo = moveStr[4] || 'q';
      const move  = chess.move({ from, to, promotion: promo });
      if (move) {
        onEngineMoveApplied(move.from, move.to);
      } else {
        const legal = chess.moves({ verbose: true });
        if (legal.length) { const m = chess.move(legal[0]); if (m) onEngineMoveApplied(m.from, m.to); }
        else { engineThinking = false; renderBoard(); }
      }
    };
    sfWorker.postMessage(`setoption name UCI_LimitStrength value ${skill < 20 ? 'true' : 'false'}`);
    sfWorker.postMessage(`setoption name Skill Level value ${skill}`);
    sfWorker.postMessage(`position fen ${chess.fen()}`);
    sfWorker.postMessage(`go movetime ${movetime}`);
  } else {
    runEngineSync();
  }
}

function onEngineMoveApplied(from, to) {
  lastMove = { from, to };
  if (isNavMode()) {
    labHistory = labHistory.slice(0, labIndex + 1);
    labHistory.push(chess.fen());
    labIndex++;
  }
  engineThinking = false;
  renderBoard();
  updateEvalBar();
  if (isNavMode()) updateOpeningName();
  if (chess.game_over()) { gameOver = true; setTimeout(showGameOverBanner, 400); }
}

function runEngineSync() {
  const ec              = getEngineColor();
  const { depth, blunder } = DIFFICULTY[currentDifficulty];
  let best;
  if (blunder > 0 && Math.random() < blunder) {
    const moves = chess.moves({ verbose: true });
    best = moves[Math.floor(Math.random() * moves.length)];
    if (best) chess.move(best);
  } else {
    best = getBestMove(chess, depth, ec);
    if (best) chess.move(best);
  }
  if (best) onEngineMoveApplied(best.from, best.to);
  else { engineThinking = false; renderBoard(); }
}

// ── Game lifecycle ────────────────────────────────────────────────────────────

function startGame(color, mode, fen) {
  playerColor    = color;
  gameMode       = mode;
  chess          = new Chess();
  if (fen && !chess.load(fen)) return false;
  selectedSq     = null;
  legalTargets   = [];
  lastMove       = null;
  engineThinking = false;
  gameOver       = false;
  hintFrom       = null;
  hintTo         = null;

  if (isNavMode()) {
    labHistory          = [chess.fen()];
    labIndex            = 0;
    positionEvals       = [null];
    moveClassifications = [];
  }

  document.getElementById('setup').style.display = 'none';
  const gameEl = document.getElementById('game');
  gameEl.style.display  = 'flex';
  gameEl.style.flexWrap = 'wrap';
  gameEl.innerHTML      = '';

  buildGameUI();
  renderBoard();
  updateEvalBar();
  if (isNavMode()) updateOpeningName();

  // Request initial position eval for Analysis mode
  if (mode === 'analysis') requestPositionEval(labIndex);

  if (chess.turn() === getEngineColor()) triggerEngine();
  return true;
}

function loadPGNAndStart(color, mode) {
  const pgnEl = document.getElementById('pgn-' + mode);
  const fenEl = document.getElementById('fen-' + mode);
  const pgn   = pgnEl ? pgnEl.value.trim() : '';
  const fen   = fenEl ? fenEl.value.trim() : '';

  if (pgn) {
    const temp = new Chess();
    if (!temp.load_pgn(pgn)) { markInputError('pgn-' + mode); return; }
    const g    = new Chess();
    const fens = [g.fen()];
    for (const m of temp.history({ verbose: true })) { g.move(m); fens.push(g.fen()); }
    if (!startGame(color, mode, fens[fens.length - 1])) return;
    if (isNavMode()) {
      labHistory          = fens;
      labIndex            = fens.length - 1;
      positionEvals       = new Array(fens.length).fill(null);
      moveClassifications = [];
      updateNavButtons();
      updateOpeningName();
    }
    return;
  }

  if (fen) { startGame(color, mode, fen) || markInputError('fen-' + mode); return; }
  startGame(color, mode);
}

function markInputError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = 'var(--danger)';
  setTimeout(() => { el.style.borderColor = ''; }, 1500);
}

function resetGame() {
  sfPending            = null;
  analysisRunning      = false;
  drillFeedback        = null;
  selectedDrillOpening = null;
  document.getElementById('game').style.display  = 'none';
  document.getElementById('game').innerHTML      = '';
  document.getElementById('setup').style.display = 'block';
}

// ── UI construction ───────────────────────────────────────────────────────────

const MODE_LABELS = {
  vs:             'vs Engine',
  lab:            'Opening Lab',
  drill:          'Opening Drill',
  analysis:       'Analysis Board',
  correspondence: 'Engine Pilot',
};

function buildGameUI() {
  const gameEl = document.getElementById('game');
  const ranks  = playerColor === 'w' ? ['8','7','6','5','4','3','2','1'] : ['1','2','3','4','5','6','7','8'];
  const files  = playerColor === 'w' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];
  const isDrill    = gameMode === 'drill';
  const isAnalysis = gameMode === 'analysis';
  const showNav    = isNavMode();
  const showEval   = gameMode !== 'drill';

  gameEl.innerHTML = `
    <div class="board-area">
      <div class="board-wrap">
        ${showEval ? `
        <div class="eval-col">
          <div class="eval-bar">
            <div class="eval-fill-black"></div>
            <div class="eval-fill-white" id="eval-fill"></div>
          </div>
          ${isAnalysis ? '<div id="eval-score" class="eval-score-text"></div>' : ''}
        </div>` : ''}
        <div class="rank-col">${ranks.map(r => `<div class="rank-lbl">${r}</div>`).join('')}</div>
        <div>
          <div id="board" class="${isDrill && drillFeedback ? 'drill-' + drillFeedback : ''}"></div>
          <div class="file-row">${files.map(f => `<div class="file-lbl">${f}</div>`).join('')}</div>
        </div>
      </div>
      ${showNav ? `
      <div class="nav-row">
        <button class="nav-btn" id="btn-back" onclick="labGoBack()">← Back</button>
        <button class="nav-btn" id="btn-fwd"  onclick="labGoForward()">Forward →</button>
      </div>` : ''}
    </div>
    <div class="side-panel">
      ${isDrill ? buildDrillSidePanel() : buildGameSidePanel()}
    </div>`;
}

function buildGameSidePanel() {
  const isAnalysis = gameMode === 'analysis';
  return `
    <div class="pcard">
      <div class="clbl">${gameMode === 'analysis' ? 'Mode' : 'Playing as'}</div>
      <div class="pname">${gameMode === 'analysis' ? 'Analysis Board' : (playerColor === 'w' ? 'White' : 'Black')}</div>
      <div class="mode-badge">${MODE_LABELS[gameMode]}</div>
    </div>
    ${isAnalysis ? `
    <div class="pcard">
      <div class="clbl">Engine hint</div>
      <button class="ask-engine-btn" id="ask-engine-btn" onclick="askEngine()">Ask engine for best move</button>
      <div id="hint-text" class="hint-result"></div>
    </div>
    <div class="pcard">
      <div class="clbl">Game analysis</div>
      <button class="pz-btn" id="analyze-btn" onclick="analyzeGame()">Analyze all moves</button>
      <div id="analysis-progress" class="psub"></div>
    </div>` : ''}
    ${(gameMode === 'lab' || isAnalysis) ? `
    <div class="pcard">
      <div class="clbl">Opening</div>
      <div id="opening-name" class="opening-name-text">Starting position</div>
    </div>` : ''}
    <div class="pcard">
      <div class="clbl">Status</div>
      <div id="status-text"></div>
    </div>
    <div class="pcard history-card">
      <div class="clbl">Moves</div>
      <div id="move-list"></div>
    </div>
    <div id="gameover-slot"></div>
    <button class="new-game-btn" onclick="resetGame()">↩ New game</button>`;
}

function buildDrillSidePanel() {
  const total    = drillLine.length - 1;
  const progress = Math.round((drillIndex / Math.max(total, 1)) * 100);
  return `
    <div class="pcard">
      <div class="clbl">Opening Drill</div>
      <div class="pname" style="font-size:14px" id="drill-progress-text">Move ${drillIndex} of ${total}</div>
      <div class="drill-progress-bar">
        <div class="drill-progress-fill" id="drill-progress-fill" style="width:${progress}%"></div>
      </div>
    </div>
    <div class="pcard">
      <div class="clbl">Opening</div>
      <div id="opening-name" class="opening-name-text">Starting position</div>
    </div>
    <div class="pcard">
      <div class="clbl">Status</div>
      <div id="status-text"></div>
    </div>
    <div class="pcard history-card">
      <div class="clbl">Line</div>
      <div id="move-list"></div>
    </div>
    <button class="pz-btn" style="margin-bottom:8px" onclick="restartDrill()">↺ Restart drill</button>
    <button class="new-game-btn" onclick="resetGame()">↩ Back to menu</button>`;
}

// ── Eval bar ──────────────────────────────────────────────────────────────────

function updateEvalBar() {
  const bar = document.getElementById('eval-fill');
  if (!bar || !chess) return;
  const raw = Math.max(-1200, Math.min(1200, staticEvalWhite(chess)));
  bar.style.height = (50 + (raw / 1200) * 50) + '%';
}

function updateEvalScore(evalWhite) {
  const el = document.getElementById('eval-score');
  if (!el) return;
  const pawns = (evalWhite / 100).toFixed(1);
  el.textContent = evalWhite > 0 ? `+${pawns}` : pawns;
  el.className = 'eval-score-text' + (evalWhite > 30 ? ' eval-pos' : evalWhite < -30 ? ' eval-neg' : '');
}

// ── Board rendering ───────────────────────────────────────────────────────────

function squareFromIndex(row, col) {
  const f = 'abcdefgh';
  return playerColor === 'w' ? f[col] + (8 - row) : f[7 - col] + (row + 1);
}

function getCheckedKingSquare() {
  if (!chess.in_check()) return null;
  const board = chess.board(), turn = chess.turn();
  for (let r = 0; r < 8; r++)
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === turn) return 'abcdefgh'[c] + (8 - r);
    }
  return null;
}

function renderBoard() {
  const el = document.getElementById('board');
  if (!el) return;

  // Drill feedback flash
  el.className = drillFeedback ? 'drill-' + drillFeedback : '';

  const chk   = getCheckedKingSquare();
  const board = chess.board();
  let html = '';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq    = squareFromIndex(row, col);
      const piece = playerColor === 'w' ? board[row][col] : board[7 - row][7 - col];
      const lt    = (row + col) % 2 === 0;

      let cls = 'sq ' + (lt ? 'lt' : 'dk');
      if (sq === selectedSq)                     cls += ' sel';
      else if (lastMove && sq === lastMove.from)  cls += ' lf';
      else if (lastMove && sq === lastMove.to)    cls += ' lt2';
      if (sq === hintFrom)                        cls += ' hint-from';
      if (sq === hintTo)                          cls += ' hint-to';
      if (sq === chk)                             cls += ' chk';
      if (legalTargets.includes(sq))              cls += piece ? ' hr' : ' hd';

      const ph = piece
        ? `<img class="piece" src="${getPieceSVG(piece.color, piece.type)}" alt="" draggable="false">`
        : '';
      html += `<div class="${cls}" onclick="onSquareClick('${sq}')">${ph}</div>`;
    }
  }

  el.innerHTML = html;
  updateStatus();
  updateMoveHistory();
  updateNavButtons();
  if (gameMode === 'drill') updateDrillProgress();
}

// ── Interaction ───────────────────────────────────────────────────────────────

function onSquareClick(sq) {
  if (engineThinking || gameOver || drillFeedback) return;
  const humanColor = getHumanColor();
  if (chess.turn() !== humanColor) return;

  const piece = chess.get(sq);

  if (!selectedSq) {
    if (piece && piece.color === humanColor) {
      selectedSq   = sq;
      legalTargets = chess.moves({ square: sq, verbose: true }).map(m => m.to);
      renderBoard();
    }
    return;
  }

  if (legalTargets.includes(sq)) {
    const moving = chess.get(selectedSq);
    const isPromo = moving && moving.type === 'p' &&
      ((moving.color === 'w' && sq[1] === '8') || (moving.color === 'b' && sq[1] === '1'));

    if (isPromo) {
      pendingPromoFrom = selectedSq;
      pendingPromoTo   = sq;
      selectedSq   = null;
      legalTargets = [];
      renderBoard();
      showPromotionPicker(moving.color);
      return;
    }

    const move = chess.move({ from: selectedSq, to: sq, promotion: 'q' });
    if (move) { applyMove(move); return; }
  }

  if (piece && piece.color === humanColor) {
    selectedSq   = sq;
    legalTargets = chess.moves({ square: sq, verbose: true }).map(m => m.to);
  } else {
    selectedSq   = null;
    legalTargets = [];
  }
  renderBoard();
}

function applyMove(move) {
  lastMove = { from: move.from, to: move.to };
  hintFrom = null;
  hintTo   = null;
  selectedSq   = null;
  legalTargets = [];

  // Drill mode: validate against target line
  if (gameMode === 'drill') {
    checkDrillMove();
    return;
  }

  if (isNavMode()) {
    const prevIdx   = labIndex;
    const movedColor = chess.turn() === 'w' ? 'b' : 'w';
    const evalBefore = positionEvals[prevIdx] ?? null;

    labHistory = labHistory.slice(0, labIndex + 1);
    labHistory.push(chess.fen());
    labIndex++;
    positionEvals[labIndex] = null;

    // Request classification for Analysis mode
    if (gameMode === 'analysis' && sfReady && !sfPending) {
      const capturedFen   = chess.fen();
      const capturedMoved = movedColor;
      const capturedEvalB = evalBefore;
      const capturedMoveI = chess.history().length - 1;
      const capturedHIdx  = labIndex;

      sfEvalPosition(capturedFen, 250, (score) => {
        if (score === null) return;
        const turn      = capturedFen.split(' ')[1];
        const evalWhite = whitePov(score, turn);
        positionEvals[capturedHIdx] = evalWhite;

        if (capturedEvalB !== null) {
          const loss = computeLoss(capturedEvalB, evalWhite, capturedMoved);
          if (loss !== null) moveClassifications[capturedMoveI] = classifyLoss(loss);
        }

        updateMoveHistory();
        updateEvalScore(evalWhite);
      });
    }
  }

  renderBoard();
  updateEvalBar();
  if (isNavMode()) updateOpeningName();

  if (chess.game_over()) {
    gameOver = true;
    setTimeout(showGameOverBanner, 400);
  } else {
    triggerEngine();
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────

function labGoBack() {
  if (labIndex <= 0) return;
  labIndex--;
  chess.load(labHistory[labIndex]);
  lastMove = null; selectedSq = null; legalTargets = []; gameOver = false;
  hintFrom = null; hintTo = null;
  renderBoard(); updateEvalBar(); updateOpeningName();
  const ev = positionEvals[labIndex];
  if (ev !== null && ev !== undefined) updateEvalScore(ev);
}

function labGoForward() {
  if (labIndex >= labHistory.length - 1) return;
  labIndex++;
  chess.load(labHistory[labIndex]);
  lastMove = null; selectedSq = null; legalTargets = [];
  hintFrom = null; hintTo = null;
  renderBoard(); updateEvalBar(); updateOpeningName();
  const ev = positionEvals[labIndex];
  if (ev !== null && ev !== undefined) updateEvalScore(ev);
}

function updateNavButtons() {
  if (!isNavMode()) return;
  const back = document.getElementById('btn-back');
  const fwd  = document.getElementById('btn-fwd');
  if (back) back.disabled = labIndex <= 0;
  if (fwd)  fwd.disabled  = labIndex >= labHistory.length - 1;
}

// Request eval for a specific position index in labHistory (background, no conflict check)
function requestPositionEval(idx) {
  if (!sfReady || sfPending || !labHistory[idx]) return;
  sfEvalPosition(labHistory[idx], 250, (score) => {
    if (score === null) return;
    const turn  = labHistory[idx].split(' ')[1];
    positionEvals[idx] = whitePov(score, turn);
    if (idx === labIndex) updateEvalScore(positionEvals[idx]);
  });
}

// ── Batch analysis ────────────────────────────────────────────────────────────

function analyzeGame() {
  if (!sfReady || !sfWorker || sfPending) {
    setAnalysisStatus('Engine is busy — try again in a moment.');
    return;
  }
  if (labHistory.length < 2) {
    setAnalysisStatus('No moves to analyze yet.');
    return;
  }

  analysisRunning = true;
  positionEvals       = new Array(labHistory.length).fill(null);
  moveClassifications = [];

  const btn = document.getElementById('analyze-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Analyzing…'; }

  analyzePosition(0, labHistory.length);
}

function analyzePosition(idx, total) {
  if (!analysisRunning || idx >= total) {
    finishAnalysis();
    return;
  }

  setAnalysisStatus(`Analyzing move ${idx} of ${total - 1}…`);

  sfEvalPosition(labHistory[idx], 300, (score) => {
    if (score !== null) {
      const turn = labHistory[idx].split(' ')[1];
      positionEvals[idx] = whitePov(score, turn);
    }
    analyzePosition(idx + 1, total);
  });
}

function finishAnalysis() {
  analysisRunning = false;

  // Compute classifications for all moves
  for (let i = 1; i < labHistory.length; i++) {
    if (positionEvals[i - 1] === null || positionEvals[i] === null) continue;
    const turn       = labHistory[i].split(' ')[1];
    const movedColor = turn === 'w' ? 'b' : 'w';
    const loss       = computeLoss(positionEvals[i - 1], positionEvals[i], movedColor);
    if (loss !== null) {
      // Move index: position i in labHistory corresponds to move (i-1) in history
      // Load that position to get history length
      const tempChess = new Chess(); tempChess.load(labHistory[i]);
      const moveIdx   = tempChess.history().length - 1;
      if (moveIdx >= 0) moveClassifications[moveIdx] = classifyLoss(loss);
    }
  }

  // Find critical moment (largest loss)
  let maxLoss = 0, criticalIdx = -1;
  moveClassifications.forEach((c, i) => {
    if (c && c.loss > maxLoss) { maxLoss = c.loss; criticalIdx = i; }
  });

  const btn = document.getElementById('analyze-btn');
  if (btn) { btn.disabled = false; btn.textContent = 'Analyze all moves'; }

  if (criticalIdx >= 0) {
    const c = moveClassifications[criticalIdx];
    setAnalysisStatus(
      `Critical moment: move ${Math.floor(criticalIdx / 2) + 1} (${c.label}, −${(c.loss / 100).toFixed(1)} pawns)` +
      ` <button class="inline-btn" onclick="jumpToCritical(${criticalIdx + 1})">Jump there ↗</button>`
    );
  } else {
    setAnalysisStatus('Analysis complete.');
  }

  updateMoveHistory();
  const ev = positionEvals[labIndex];
  if (ev !== null && ev !== undefined) updateEvalScore(ev);
}

function jumpToCritical(historyIdx) {
  // historyIdx = position in labHistory after the critical move
  if (historyIdx < 0 || historyIdx >= labHistory.length) return;
  labIndex = historyIdx;
  chess.load(labHistory[labIndex]);
  lastMove = null; selectedSq = null; legalTargets = [];
  renderBoard(); updateEvalBar(); updateOpeningName();
  updateNavButtons();
  const ev = positionEvals[labIndex];
  if (ev !== null && ev !== undefined) updateEvalScore(ev);
}

function setAnalysisStatus(html) {
  const el = document.getElementById('analysis-progress');
  if (el) el.innerHTML = html;
}

// ── Ask engine hint (Analysis mode) ──────────────────────────────────────────

function askEngine() {
  if (chess.game_over()) return;
  const btn = document.getElementById('ask-engine-btn');
  const txt = document.getElementById('hint-text');
  if (btn) { btn.disabled = true; btn.textContent = 'Calculating…'; }

  const done = (from, to, san) => {
    hintFrom = from; hintTo = to;
    renderBoard();
    if (txt) txt.textContent = `Best for ${chess.turn() === 'w' ? 'White' : 'Black'}: ${san || (from + to)}`;
    if (btn) { btn.disabled = false; btn.textContent = 'Ask engine for best move'; }
  };

  if (sfReady && sfWorker && !sfPending) {
    const { movetime } = SF_LEVELS[currentDifficulty];
    sfPending = (moveStr) => {
      const from = moveStr.slice(0, 2), to = moveStr.slice(2, 4);
      const temp = new Chess(); temp.load(chess.fen());
      const m    = temp.move({ from, to, promotion: moveStr[4] || 'q' });
      done(from, to, m ? m.san : null);
    };
    sfWorker.postMessage(`setoption name Skill Level value 20`);
    sfWorker.postMessage(`position fen ${chess.fen()}`);
    sfWorker.postMessage(`go movetime ${movetime}`);
  } else {
    setTimeout(() => {
      const turn = chess.turn();
      const best = getBestMove(chess, DIFFICULTY[currentDifficulty].depth, turn);
      if (best) done(best.from, best.to, best.san);
      else { if (txt) txt.textContent = 'No move found.'; if (btn) { btn.disabled = false; btn.textContent = 'Ask engine for best move'; } }
    }, 20);
  }
}

// ── Opening Drill ─────────────────────────────────────────────────────────────

let selectedDrillOpening = null; // { name, eco, moves }

function onDrillSearch(query) {
  const resultsEl = document.getElementById('drill-results');
  if (!resultsEl) return;

  if (!query || query.length < 2) { resultsEl.innerHTML = ''; return; }

  const results = searchOpenings(query);
  if (!results.length) {
    resultsEl.innerHTML = ecoReady
      ? '<div class="drill-result-empty">No openings found</div>'
      : '<div class="drill-result-empty">Database loading…</div>';
    return;
  }

  resultsEl.innerHTML = results.map((r, i) =>
    `<div class="drill-result-item" onclick="selectDrillOpening(${i})" data-idx="${i}">
      <span class="drill-result-eco">${r.eco}</span>
      <span class="drill-result-name">${r.name}</span>
    </div>`
  ).join('');

  // Store results for selection by index
  resultsEl._results = results;
}

function selectDrillOpening(idx) {
  const resultsEl = document.getElementById('drill-results');
  if (!resultsEl || !resultsEl._results) return;

  selectedDrillOpening = resultsEl._results[idx];
  resultsEl.innerHTML  = '';

  const searchEl = document.getElementById('drill-search');
  if (searchEl) searchEl.value = '';

  // Show selected card
  const wrap     = document.getElementById('drill-selected-wrap');
  const ecoEl    = document.getElementById('drill-selected-eco');
  const nameEl   = document.getElementById('drill-selected-name');
  const movesEl  = document.getElementById('drill-selected-moves');

  if (wrap)    wrap.style.display  = 'block';
  if (ecoEl)   ecoEl.textContent   = selectedDrillOpening.eco;
  if (nameEl)  nameEl.textContent  = selectedDrillOpening.name;
  if (movesEl) movesEl.textContent = selectedDrillOpening.moves;
}

function clearDrillSelection() {
  selectedDrillOpening = null;
  const wrap = document.getElementById('drill-selected-wrap');
  if (wrap) wrap.style.display = 'none';
}

function startDrill(color) {
  let fens = null;

  // 1. Use selected opening from search
  if (selectedDrillOpening) {
    fens = parseMovesFen(selectedDrillOpening.moves);
    if (fens.length < 2) {
      showDrillError('Could not parse this opening line.');
      return;
    }
  }

  // 2. Fall back to manually pasted PGN
  if (!fens) {
    const pgnEl = document.getElementById('pgn-drill');
    const pgn   = pgnEl ? pgnEl.value.trim() : '';
    if (!pgn) {
      showDrillError('Search for an opening or paste a PGN line first.');
      return;
    }
    const temp = new Chess();
    if (!temp.load_pgn(pgn)) { markInputError('pgn-drill'); return; }
    const g = new Chess();
    fens    = [g.fen()];
    for (const m of temp.history({ verbose: true })) { g.move(m); fens.push(g.fen()); }
    if (fens.length < 2) { markInputError('pgn-drill'); return; }
  }

  showDrillError('');
  initDrillGame(color, fens);
}

function showDrillError(msg) {
  const el = document.getElementById('drill-error');
  if (el) el.textContent = msg;
}

function initDrillGame(color, fens) {
  drillLine     = fens;
  drillIndex    = 0;
  drillFeedback = null;
  playerColor   = color;
  gameMode      = 'drill';
  chess         = new Chess();
  chess.load(fens[0]);
  selectedSq    = null; legalTargets = []; lastMove = null;
  engineThinking = false; gameOver = false;
  labHistory    = [...fens];
  labIndex      = 0;
  positionEvals       = new Array(fens.length).fill(null);
  moveClassifications = [];

  document.getElementById('setup').style.display = 'none';
  const gameEl = document.getElementById('game');
  gameEl.style.display  = 'flex';
  gameEl.style.flexWrap = 'wrap';
  gameEl.innerHTML = '';
  buildGameUI();
  renderBoard();
  updateOpeningName();

  if (chess.turn() !== color) setTimeout(advanceDrillOpponent, 400);
}

function restartDrill() {
  if (!drillLine.length) return;
  initDrillGame(playerColor, drillLine);
}

function checkDrillMove() {
  const nextExpected = drillLine[drillIndex + 1];
  if (!nextExpected) {
    // End of line
    lastMove = { from: lastMove?.from, to: lastMove?.to };
    drillIndex++;
    labIndex = drillIndex;
    renderBoard();
    showDrillComplete();
    return;
  }

  const correct = fenPositionMatch(chess.fen(), nextExpected);

  if (correct) {
    drillIndex++;
    labIndex = drillIndex;
    drillFeedback = 'correct';
    renderBoard();
    updateOpeningName();
    setTimeout(() => {
      drillFeedback = null;
      if (drillIndex >= drillLine.length - 1) {
        renderBoard();
        showDrillComplete();
      } else {
        setTimeout(advanceDrillOpponent, 200);
      }
    }, 500);
  } else {
    drillFeedback = 'wrong';
    renderBoard();
    setTimeout(() => {
      chess.undo();
      lastMove   = null;
      drillFeedback = null;
      renderBoard();
    }, 800);
  }
}

function advanceDrillOpponent() {
  if (drillIndex >= drillLine.length - 1) return;

  const target   = drillLine[drillIndex + 1];
  const legalMoves = chess.moves({ verbose: true });

  for (const m of legalMoves) {
    chess.move(m);
    if (fenPositionMatch(chess.fen(), target)) {
      lastMove = { from: m.from, to: m.to };
      drillIndex++;
      labIndex = drillIndex;
      renderBoard();
      updateOpeningName();
      return;
    }
    chess.undo();
  }
  // No match found — something wrong with PGN
}

function fenPositionMatch(fen1, fen2) {
  return fen1.split(' ')[0] === fen2.split(' ')[0];
}

function updateDrillProgress() {
  const total   = drillLine.length - 1;
  const pct     = Math.round((drillIndex / Math.max(total, 1)) * 100);
  const progEl  = document.getElementById('drill-progress-text');
  const fillEl  = document.getElementById('drill-progress-fill');
  if (progEl) progEl.textContent = `Move ${drillIndex} of ${total}`;
  if (fillEl) fillEl.style.width = pct + '%';
}

function showDrillComplete() {
  const slot = document.getElementById('gameover-slot') || document.getElementById('move-list');
  if (!slot) return;
  const card = document.createElement('div');
  card.className = 'drill-complete';
  card.innerHTML = `
    <div style="font-size:28px;margin-bottom:6px">♟</div>
    <div style="font-weight:700;font-size:15px;margin-bottom:4px">Line complete!</div>
    <div style="font-size:12px;color:var(--text3);margin-bottom:12px">${drillLine.length - 1} moves drilled</div>
    <button class="pz-btn primary" onclick="restartDrill()" style="width:100%">Drill again</button>`;
  document.getElementById('game').appendChild(card);
}

// ── Promotion picker ──────────────────────────────────────────────────────────

function showPromotionPicker(color) {
  const overlay    = document.createElement('div');
  overlay.className = 'promo-overlay';
  overlay.id        = 'promo-overlay';
  overlay.innerHTML = `
    <div class="promo-box">
      <span class="clbl">Promote pawn to</span>
      <div class="promo-pieces">
        ${['q','r','b','n'].map(p => `
          <div class="promo-piece" onclick="completePromotion('${p}')">
            <img src="${getPieceSVG(color, p)}" alt="${p}">
          </div>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function completePromotion(piece) {
  document.getElementById('promo-overlay')?.remove();
  if (!pendingPromoFrom || !pendingPromoTo) return;
  const move = chess.move({ from: pendingPromoFrom, to: pendingPromoTo, promotion: piece });
  pendingPromoFrom = null;
  pendingPromoTo   = null;
  if (move) applyMove(move);
}

// ── Status & history ──────────────────────────────────────────────────────────

function updateStatus() {
  const el = document.getElementById('status-text');
  if (!el) return;

  if (gameMode === 'drill') {
    el.textContent = chess.turn() === playerColor
      ? 'Your turn — find the next move'
      : 'Engine is responding…';
    return;
  }

  if (engineThinking) {
    el.innerHTML = '<span class="thnk">Engine calculating<span>.</span><span>.</span><span>.</span></span>';
    return;
  }
  if (chess.in_checkmate()) { el.textContent = `Checkmate — ${chess.turn() === 'w' ? 'Black' : 'White'} wins`; return; }
  if (chess.in_draw())      { el.textContent = 'Draw'; return; }
  if (chess.in_check())     { el.textContent = `${chess.turn() === 'w' ? 'White' : 'Black'} is in check!`; return; }

  const msgs = {
    vs:             'Your turn',
    lab:            `${chess.turn() === 'w' ? 'White' : 'Black'} to move`,
    analysis:       `${chess.turn() === 'w' ? 'White' : 'Black'} to move — ask engine for hint`,
    correspondence: "Move the opponent's pieces",
  };

  if (chess.turn() === getHumanColor()) {
    el.textContent = msgs[gameMode] || 'Your turn';
  } else {
    el.textContent = 'Engine is thinking…';
  }
}

function updateMoveHistory() {
  const el = document.getElementById('move-list');
  if (!el) return;

  const history = chess.history();
  if (!history.length) {
    el.innerHTML = '<div class="no-moves">No moves yet</div>';
    return;
  }

  const wIsEngine = gameMode === 'vs'
    ? playerColor === 'b'
    : gameMode === 'correspondence'
    ? playerColor === 'w'
    : false;

  let html = '<div class="move-grid">';
  for (let i = 0; i < history.length; i += 2) {
    const n    = Math.floor(i / 2) + 1;
    const cls0 = moveClassifications[i];
    const cls1 = moveClassifications[i + 1];
    const sym0 = cls0 && cls0.sym ? `<span class="mv-sym ${cls0.cls}" title="${cls0.label}">${cls0.sym}</span>` : '';
    const sym1 = cls1 && cls1.sym ? `<span class="mv-sym ${cls1.cls}" title="${cls1.label}">${cls1.sym}</span>` : '';
    html += `<span class="move-num">${n}.</span>
      <span class="move-san ${wIsEngine ? 'mine' : 'opp'}">${history[i] || ''}${sym0}</span>
      <span class="move-san ${!wIsEngine ? 'mine' : 'opp'}">${history[i + 1] || ''}${sym1}</span>`;
  }
  html += '</div>';
  el.innerHTML  = html;
  el.scrollTop  = el.scrollHeight;
}

function showGameOverBanner() {
  const slot = document.getElementById('gameover-slot');
  if (!slot) return;
  let cls = 'draw', title = 'Draw', sub = 'The game is drawn';
  if (chess.in_checkmate()) {
    const winner    = chess.turn() === 'w' ? 'b' : 'w';
    const engineWon = winner === getEngineColor();
    if (gameMode === 'vs')             { cls = engineWon ? 'lose' : 'win'; title = engineWon ? 'Defeat' : 'Victory!'; }
    else if (gameMode === 'correspondence') { cls = engineWon ? 'win' : 'lose'; title = engineWon ? 'Victory!' : 'Defeat'; }
    else                               { cls = 'win'; title = 'Checkmate!'; }
    sub = 'Checkmate';
  } else if (chess.in_stalemate())          { sub = 'Stalemate'; }
  else if (chess.in_threefold_repetition()) { sub = 'Threefold repetition'; }
  else if (chess.insufficient_material())   { sub = 'Insufficient material'; }
  slot.innerHTML = `<div class="game-over ${cls}"><h3>${title}</h3><p>${sub}</p></div>`;
}

// ── Difficulty ────────────────────────────────────────────────────────────────

function setDifficultyByIndex(idx) {
  currentDifficulty = DIFF_LEVELS[idx] || 'club';
  document.querySelectorAll('.diff-slider').forEach(s => { s.value = idx; });
  document.querySelectorAll('.diff-tick-row').forEach(row => {
    row.querySelectorAll('.diff-tick-lbl').forEach((lbl, i) => {
      lbl.classList.toggle('active', i === idx);
    });
  });
}

// ── Init ─────────────────────────────────────────────────────────────────────

// Start loading Stockfish immediately in the background
initStockfish();
