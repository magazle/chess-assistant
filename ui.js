/**
 * Chess Assistant — UI
 * Modes: vs Engine | Opening Lab | Analysis | Engine Pilot
 */

// ── Difficulty levels ─────────────────────────────────────────────────────────

const DIFFICULTY = {
  beginner: { depth: 1, blunder: 0.40 },
  casual:   { depth: 2, blunder: 0.20 },
  club:     { depth: 3, blunder: 0.05 },
  advanced: { depth: 4, blunder: 0    },
  master:   { depth: 5, blunder: 0    },
};

const DIFF_LEVELS = ['beginner','casual','club','advanced','master'];

// ── Opening name ─────────────────────────────────────────────────────────────
// Uses eco-lookup.js (JeffML/eco.json, 12k+ openings, FEN-keyed).
// Falls back silently if the database hasn't loaded yet.

function updateOpeningName() {
  const el = document.getElementById('opening-name');
  if (!el || !chess) return;

  if (!ecoReady && !ecoFailed) {
    // Still loading — show a placeholder, will update when ready
    el.textContent = chess.history().length ? 'Identifying…' : 'Starting position';
    el.style.color = 'var(--text3)';
    return;
  }

  const result = lookupOpening(chess.fen());
  if (result) {
    el.textContent = result.displayName;
    el.style.color = 'var(--text)';
  } else {
    el.textContent = chess.history().length ? 'Unknown opening' : 'Starting position';
    el.style.color = 'var(--text3)';
  }
}

// ── State ─────────────────────────────────────────────────────────────────────

let chess            = null;
let playerColor      = null;
let gameMode         = null;  // 'vs' | 'lab' | 'analysis' | 'correspondence'
let selectedSq       = null;
let legalTargets     = [];
let lastMove         = null;
let engineThinking   = false;
let gameOver         = false;
let currentDifficulty = 'club';
let engineWorker     = null;

// Lab / Analysis navigation
let labHistory = [];
let labIndex   = 0;

// Promotion pending state
let pendingPromoFrom = null;
let pendingPromoTo   = null;

// Analysis engine hint
let hintFrom = null;
let hintTo   = null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isNavMode()    { return gameMode === 'lab' || gameMode === 'analysis'; }
function isEngineAuto() { return gameMode === 'vs'  || gameMode === 'lab' || gameMode === 'correspondence'; }

function getEngineColor() {
  if (gameMode === 'vs')             return playerColor === 'w' ? 'b' : 'w';
  if (gameMode === 'lab')            return playerColor === 'w' ? 'b' : 'w';
  if (gameMode === 'correspondence') return playerColor;
  return null; // analysis: no automatic moves
}

function getHumanColor() {
  if (gameMode === 'correspondence') return playerColor === 'w' ? 'b' : 'w';
  if (gameMode === 'analysis')       return chess.turn();
  return playerColor;
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

  if (isNavMode()) { labHistory = [chess.fen()]; labIndex = 0; }

  document.getElementById('setup').style.display = 'none';
  const gameEl = document.getElementById('game');
  gameEl.style.display  = 'flex';
  gameEl.style.flexWrap = 'wrap';
  gameEl.innerHTML      = '';

  buildGameUI();
  renderBoard();
  updateEvalBar();
  if (isNavMode()) updateOpeningName();
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
    if (isNavMode()) { labHistory = fens; labIndex = fens.length - 1; updateNavButtons(); updateOpeningName(); }
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
  if (engineWorker) { engineWorker.terminate(); engineWorker = null; }
  document.getElementById('game').style.display = 'none';
  document.getElementById('game').innerHTML     = '';
  document.getElementById('setup').style.display = 'block';
}

// ── UI ────────────────────────────────────────────────────────────────────────

const MODE_LABELS = {
  vs:             'vs Engine',
  lab:            'Opening Lab',
  analysis:       'Analysis Board',
  correspondence: 'Engine Pilot',
};

function buildGameUI() {
  const gameEl = document.getElementById('game');
  const ranks  = playerColor === 'w' ? ['8','7','6','5','4','3','2','1'] : ['1','2','3','4','5','6','7','8'];
  const files  = playerColor === 'w' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];

  gameEl.innerHTML = `
    <div class="board-area">
      <div class="board-wrap">
        <div class="eval-col">
          <div class="eval-bar">
            <div class="eval-fill-black"></div>
            <div class="eval-fill-white" id="eval-fill"></div>
          </div>
        </div>
        <div class="rank-col">${ranks.map(r => `<div class="rank-lbl">${r}</div>`).join('')}</div>
        <div>
          <div id="board"></div>
          <div class="file-row">${files.map(f => `<div class="file-lbl">${f}</div>`).join('')}</div>
        </div>
      </div>
      ${isNavMode() ? `
      <div class="nav-row">
        <button class="nav-btn" id="btn-back" onclick="labGoBack()">← Back</button>
        <button class="nav-btn" id="btn-fwd"  onclick="labGoForward()">Forward →</button>
      </div>` : ''}
    </div>
    <div class="side-panel">
      <div class="pcard">
        <div class="clbl">${gameMode === 'analysis' ? 'Mode' : 'Playing as'}</div>
        <div class="pname">${gameMode === 'analysis' ? 'Analysis Board' : (playerColor === 'w' ? 'White' : 'Black')}</div>
        <div class="mode-badge">${MODE_LABELS[gameMode]}</div>
      </div>
      ${gameMode === 'analysis' ? `
      <div class="pcard">
        <div class="clbl">Engine hint</div>
        <button class="ask-engine-btn" id="ask-engine-btn" onclick="askEngine()">Ask engine for best move</button>
        <div id="hint-text" class="hint-result"></div>
      </div>` : ''}
      ${isNavMode() ? `
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
      <button class="new-game-btn" onclick="resetGame()">↩ New game</button>
    </div>`;
}

// ── Eval bar ──────────────────────────────────────────────────────────────────

function updateEvalBar() {
  const bar = document.getElementById('eval-fill');
  if (!bar || !chess) return;
  const raw   = Math.max(-1200, Math.min(1200, staticEvalWhite(chess)));
  bar.style.height = (50 + (raw / 1200) * 50) + '%';
}

// ── Board rendering ───────────────────────────────────────────────────────────

function squareFromIndex(row, col) {
  const f = 'abcdefgh';
  return playerColor === 'w' ? f[col] + (8 - row) : f[7 - col] + (row + 1);
}

function getCheckedKingSquare() {
  if (!chess.in_check()) return null;
  const board = chess.board();
  const turn  = chess.turn();
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
}

// ── Interaction ───────────────────────────────────────────────────────────────

function onSquareClick(sq) {
  if (engineThinking || gameOver) return;
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

  if (isNavMode()) {
    labHistory = labHistory.slice(0, labIndex + 1);
    labHistory.push(chess.fen());
    labIndex++;
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

// ── Engine ────────────────────────────────────────────────────────────────────

function triggerEngine() {
  const ec = getEngineColor();
  if (!ec || chess.turn() !== ec) return;
  engineThinking = true;
  renderBoard();
  runEngineWorker();
}

function runEngineWorker() {
  const { depth, blunder } = DIFFICULTY[currentDifficulty];
  if (engineWorker) engineWorker.terminate();
  try {
    engineWorker = new Worker('./engine.worker.js');
    engineWorker.onmessage = ({ data: { from, to, promotion } }) => {
      if (from) {
        const r = chess.move({ from, to, promotion: promotion || 'q' });
        if (r) lastMove = { from: r.from, to: r.to };
      }
      if (lastMove && isNavMode()) {
        labHistory = labHistory.slice(0, labIndex + 1);
        labHistory.push(chess.fen());
        labIndex++;
      }
      engineThinking = false;
      engineWorker   = null;
      renderBoard();
      updateEvalBar();
      if (isNavMode()) updateOpeningName();
      if (chess.game_over()) { gameOver = true; setTimeout(showGameOverBanner, 400); }
    };
    engineWorker.onerror = () => { engineWorker = null; runEngineSync(); };
    engineWorker.postMessage({ fen: chess.fen(), depth, engineColor: getEngineColor(), blunderRate: blunder });
  } catch { runEngineSync(); }
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

  if (best) {
    lastMove = { from: best.from, to: best.to };
    if (isNavMode()) {
      labHistory = labHistory.slice(0, labIndex + 1);
      labHistory.push(chess.fen());
      labIndex++;
    }
  }

  engineThinking = false;
  renderBoard();
  updateEvalBar();
  if (isNavMode()) updateOpeningName();
  if (chess.game_over()) { gameOver = true; setTimeout(showGameOverBanner, 400); }
}

// ── Navigation (Lab / Analysis) ───────────────────────────────────────────────

function labGoBack() {
  if (labIndex <= 0) return;
  labIndex--;
  chess.load(labHistory[labIndex]);
  lastMove = null; selectedSq = null; legalTargets = []; gameOver = false;
  hintFrom = null; hintTo = null;
  renderBoard(); updateEvalBar(); updateOpeningName();
}

function labGoForward() {
  if (labIndex >= labHistory.length - 1) return;
  labIndex++;
  chess.load(labHistory[labIndex]);
  lastMove = null; selectedSq = null; legalTargets = [];
  hintFrom = null; hintTo = null;
  renderBoard(); updateEvalBar(); updateOpeningName();
}

function updateNavButtons() {
  if (!isNavMode()) return;
  const back = document.getElementById('btn-back');
  const fwd  = document.getElementById('btn-fwd');
  if (back) back.disabled = labIndex <= 0;
  if (fwd)  fwd.disabled  = labIndex >= labHistory.length - 1;
}

// ── Analysis — engine hint ────────────────────────────────────────────────────

function askEngine() {
  if (chess.game_over()) return;
  const btn = document.getElementById('ask-engine-btn');
  const txt = document.getElementById('hint-text');
  if (btn) { btn.disabled = true; btn.textContent = 'Calculating…'; }

  setTimeout(() => {
    const turn = chess.turn();
    const best = getBestMove(chess, DIFFICULTY[currentDifficulty].depth, turn);
    if (best) {
      hintFrom = best.from;
      hintTo   = best.to;
      renderBoard();
      if (txt) txt.textContent = `Best for ${turn === 'w' ? 'White' : 'Black'}: ${best.san}`;
    } else {
      if (txt) txt.textContent = 'No move found.';
    }
    if (btn) { btn.disabled = false; btn.textContent = 'Ask engine for best move'; }
  }, 20);
}

// ── Promotion picker ──────────────────────────────────────────────────────────

function showPromotionPicker(color) {
  const overlay = document.createElement('div');
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
  if (!history.length) { el.innerHTML = '<div class="no-moves">No moves yet</div>'; return; }

  // Highlight engine moves in blue (mine = engine's), opponent in gray
  const wIsEngine = gameMode === 'vs'
    ? playerColor === 'b'
    : gameMode === 'correspondence'
    ? playerColor === 'w'
    : false;

  let html = '<div class="move-grid">';
  for (let i = 0; i < history.length; i += 2) {
    const n = Math.floor(i / 2) + 1;
    html += `<span class="move-num">${n}.</span>
      <span class="move-san ${wIsEngine  ? 'mine' : 'opp'}">${history[i]     || ''}</span>
      <span class="move-san ${!wIsEngine ? 'mine' : 'opp'}">${history[i + 1] || ''}</span>`;
  }
  html += '</div>';
  el.innerHTML    = html;
  el.scrollTop    = el.scrollHeight;
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
