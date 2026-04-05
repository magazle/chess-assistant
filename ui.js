/**
 * Chess Assistant — UI
 * Modes: Play vs Engine | Opening Lab | Correspondence
 */

// ── Difficulty ──────────────────────────────────────────────────────────────

const DIFFICULTY = {
  beginner:     { depth: 1, blunder: 0.40, label: 'Beginner',  time: '~0.2s / move',   desc: 'Makes frequent mistakes. Good for complete beginners.' },
  casual:       { depth: 2, blunder: 0.20, label: 'Casual',    time: '~0.5s / move',   desc: 'Occasionally blunders. Suitable for casual players.' },
  club:         { depth: 3, blunder: 0.05, label: 'Club',      time: '~1s / move',     desc: 'Rarely makes mistakes. Plays solid tactical chess.' },
  advanced:     { depth: 4, blunder: 0,    label: 'Advanced',  time: '2–5s / move',    desc: 'No blunders. Finds multi-move combinations.' },
  master:       { depth: 5, blunder: 0,    label: 'Master',    time: 'up to 15s / move', desc: 'Maximum strength. Calculates very deeply. Very hard to beat.' },
};

// ── Shared state ────────────────────────────────────────────────────────────

let chess          = null;
let playerColor    = null;
let gameMode       = null;   // 'vs' | 'lab' | 'correspondence'
let selectedSq     = null;
let legalTargets   = [];
let lastMove       = null;
let engineThinking = false;
let gameOver       = false;

// Play vs Engine
let currentDifficulty = 'club';
let engineWorker      = null;

// Opening Lab navigation
let labHistory = [];
let labIndex   = 0;

// ── Game start ──────────────────────────────────────────────────────────────

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

  if (mode === 'lab') {
    labHistory = [chess.fen()];
    labIndex   = 0;
  }

  document.getElementById('setup').style.display = 'none';
  const gameEl = document.getElementById('game');
  gameEl.style.display = 'flex';
  gameEl.style.flexWrap = 'wrap';
  gameEl.innerHTML = '';
  buildGameUI();
  renderBoard();
  updateEvalBar();

  if (chess.turn() === getEngineColor()) triggerEngine();
  return true;
}

function loadPGNAndStart(color, mode) {
  const pgn = (document.getElementById('pgn-' + mode) || {}).value || '';
  const fen = (document.getElementById('fen-' + mode) || {}).value || '';

  if (pgn.trim()) {
    const temp = new Chess();
    if (!temp.load_pgn(pgn.trim())) { markInputError('pgn-' + mode); return; }

    // Build FEN history for lab navigation
    const moves = temp.history({ verbose: true });
    const g = new Chess();
    const fens = [g.fen()];
    for (const m of moves) { g.move(m); fens.push(g.fen()); }

    if (!startGame(color, mode, fens[fens.length - 1])) return;

    if (mode === 'lab') {
      labHistory = fens;
      labIndex   = fens.length - 1;
      updateNavButtons();
    }
    return;
  }

  if (fen.trim()) {
    if (!startGame(color, mode, fen.trim())) { markInputError('fen-' + mode); return; }
    return;
  }

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
  document.getElementById('game').innerHTML = '';
  document.getElementById('setup').style.display = 'block';
}

// ── Engine color helper ──────────────────────────────────────────────────────

function getEngineColor() {
  if (gameMode === 'vs')             return playerColor === 'w' ? 'b' : 'w';
  if (gameMode === 'lab')            return playerColor;           // engine plays player's chosen color
  if (gameMode === 'correspondence') return playerColor;           // engine plays your pieces
  return null;
}

function getHumanColor() {
  if (gameMode === 'vs')             return playerColor;
  if (gameMode === 'lab')            return chess.turn();          // human moves whoever's turn it is
  if (gameMode === 'correspondence') return playerColor === 'w' ? 'b' : 'w';
  return playerColor;
}

// ── UI Construction ─────────────────────────────────────────────────────────

function buildGameUI() {
  const gameEl = document.getElementById('game');
  const orientation = playerColor;
  const ranks = orientation === 'w' ? ['8','7','6','5','4','3','2','1'] : ['1','2','3','4','5','6','7','8'];
  const files = orientation === 'w' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];

  const badges = { vs: 'vs Engine', lab: 'Opening Lab', correspondence: 'Correspondence' };

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
      ${gameMode === 'lab' ? `
      <div class="nav-row">
        <button class="nav-btn" id="btn-back" onclick="labGoBack()">← Back</button>
        <button class="nav-btn" id="btn-fwd"  onclick="labGoForward()">Forward →</button>
      </div>` : ''}
    </div>

    <div class="side-panel">
      <div class="pcard">
        <div class="clbl">Playing as</div>
        <div class="pname">${playerColor === 'w' ? 'White' : 'Black'}</div>
        <div class="mode-badge">${badges[gameMode] || ''}</div>
      </div>
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

// ── Eval bar ─────────────────────────────────────────────────────────────────

function updateEvalBar() {
  const bar = document.getElementById('eval-fill');
  if (!bar || !chess) return;
  let score = staticEvalWhite(chess);
  const CAP = 1200;
  score = Math.max(-CAP, Math.min(CAP, score));
  const pct = 50 + (score / CAP) * 50; // 50% = equal; 100% = white winning
  bar.style.height = pct + '%';
}

// ── Board rendering ──────────────────────────────────────────────────────────

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
  const chk   = getCheckedKingSquare();
  const board = chess.board();
  let html = '';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq    = squareFromIndex(row, col);
      const piece = playerColor === 'w' ? board[row][col] : board[7 - row][7 - col];
      const lt    = (row + col) % 2 === 0;

      let cls = 'sq ' + (lt ? 'lt' : 'dk');
      if (sq === selectedSq)                    cls += ' sel';
      else if (lastMove && sq === lastMove.from) cls += ' lf';
      else if (lastMove && sq === lastMove.to)   cls += ' lt2';
      if (sq === chk)                            cls += ' chk';
      if (legalTargets.includes(sq))             cls += piece ? ' hr' : ' hd';

      const ph = piece ? `<img class="piece" src="${getPieceSVG(piece.color, piece.type)}" alt="" draggable="false">` : '';
      html += `<div class="${cls}" onclick="onSquareClick('${sq}')">${ph}</div>`;
    }
  }
  el.innerHTML = html;
  updateStatus();
  updateMoveHistory();
  updateNavButtons();
}

// ── Interaction ──────────────────────────────────────────────────────────────

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
    const move = chess.move({ from: selectedSq, to: sq, promotion: 'q' });
    if (move) {
      lastMove     = { from: move.from, to: move.to };
      selectedSq   = null;
      legalTargets = [];
      if (gameMode === 'lab') { labHistory = labHistory.slice(0, labIndex + 1); labHistory.push(chess.fen()); labIndex++; }
      renderBoard();
      updateEvalBar();
      if (chess.game_over()) { gameOver = true; setTimeout(showGameOverBanner, 400); }
      else triggerEngine();
      return;
    }
  }

  if (piece && piece.color === humanColor) { selectedSq = sq; legalTargets = chess.moves({ square: sq, verbose: true }).map(m => m.to); }
  else { selectedSq = null; legalTargets = []; }
  renderBoard();
}

// ── Engine ───────────────────────────────────────────────────────────────────

function triggerEngine() {
  if (!getEngineColor() || chess.turn() !== getEngineColor()) return;
  engineThinking = true;
  renderBoard();
  if (gameMode === 'vs') runEngineWorker();
  else setTimeout(runEngineSync, 30);
}

function runEngineWorker() {
  const diff = DIFFICULTY[currentDifficulty];
  if (engineWorker) engineWorker.terminate();
  try {
    engineWorker = new Worker('./engine.worker.js');
    engineWorker.onmessage = function (e) {
      const { from, to, promotion } = e.data;
      if (from) {
        const r = chess.move({ from, to, promotion: promotion || 'q' });
        if (r) lastMove = { from: r.from, to: r.to };
      }
      engineThinking = false; engineWorker = null;
      renderBoard(); updateEvalBar();
      if (chess.game_over()) { gameOver = true; setTimeout(showGameOverBanner, 400); }
    };
    engineWorker.onerror = () => { engineWorker = null; runEngineSync(); };
    engineWorker.postMessage({ fen: chess.fen(), depth: diff.depth, engineColor: getEngineColor(), blunderRate: diff.blunder });
  } catch { runEngineSync(); }
}

function runEngineSync() {
  const ec    = getEngineColor();
  const depth = gameMode === 'vs' ? DIFFICULTY[currentDifficulty].depth : 3;
  const blund = gameMode === 'vs' ? DIFFICULTY[currentDifficulty].blunder : 0;
  let best;

  if (blund > 0 && Math.random() < blund) {
    const moves = chess.moves({ verbose: true });
    best = moves[Math.floor(Math.random() * moves.length)];
    if (best) chess.move(best);
  } else {
    best = getBestMove(chess, depth, ec);
    if (best) chess.move(best);
  }

  if (best) lastMove = { from: best.from, to: best.to };
  if (gameMode === 'lab') { labHistory = labHistory.slice(0, labIndex + 1); labHistory.push(chess.fen()); labIndex++; }
  engineThinking = false;
  renderBoard(); updateEvalBar();
  if (chess.game_over()) { gameOver = true; setTimeout(showGameOverBanner, 400); }
}

// ── Opening Lab navigation ───────────────────────────────────────────────────

function labGoBack() {
  if (labIndex <= 0) return;
  labIndex--;
  chess.load(labHistory[labIndex]);
  lastMove = null; selectedSq = null; legalTargets = []; gameOver = false;
  renderBoard(); updateEvalBar();
}

function labGoForward() {
  if (labIndex >= labHistory.length - 1) return;
  labIndex++;
  chess.load(labHistory[labIndex]);
  lastMove = null; selectedSq = null; legalTargets = [];
  renderBoard(); updateEvalBar();
}

function updateNavButtons() {
  if (gameMode !== 'lab') return;
  const back = document.getElementById('btn-back');
  const fwd  = document.getElementById('btn-fwd');
  if (back) back.disabled = labIndex <= 0;
  if (fwd)  fwd.disabled  = labIndex >= labHistory.length - 1;
}

// ── Status & history ─────────────────────────────────────────────────────────

function updateStatus() {
  const el = document.getElementById('status-text');
  if (!el) return;
  if (engineThinking) { el.innerHTML = '<span class="thnk">Engine calculating<span>.</span><span>.</span><span>.</span></span>'; return; }
  if (chess.in_checkmate()) { el.textContent = `Checkmate — ${chess.turn() === 'w' ? 'Black' : 'White'} wins`; return; }
  if (chess.in_draw())      { el.textContent = 'Draw'; return; }
  if (chess.in_check())     { el.textContent = `${chess.turn() === 'w' ? 'White' : 'Black'} is in check!`; return; }
  const humanColor = getHumanColor();
  if (chess.turn() === humanColor) {
    if (gameMode === 'correspondence') el.textContent = "Move the opponent's pieces";
    else if (gameMode === 'lab') el.textContent = `${chess.turn() === 'w' ? 'White' : 'Black'} to move`;
    else el.textContent = 'Your turn';
  } else {
    el.textContent = 'Engine is thinking…';
  }
}

function updateMoveHistory() {
  const el = document.getElementById('move-list');
  if (!el) return;
  const history = chess.history();
  if (!history.length) { el.innerHTML = '<div class="no-moves">No moves yet</div>'; return; }
  const wIsEngine = gameMode === 'vs' ? playerColor === 'b' : gameMode === 'correspondence' ? playerColor === 'w' : true;
  let html = '<div class="move-grid">';
  for (let i = 0; i < history.length; i += 2) {
    const n = Math.floor(i / 2) + 1;
    html += `<span class="move-num">${n}.</span>
      <span class="move-san ${wIsEngine?'mine':'opp'}">${history[i]||''}</span>
      <span class="move-san ${!wIsEngine?'mine':'opp'}">${history[i+1]||''}</span>`;
  }
  html += '</div>';
  el.innerHTML = html;
  el.scrollTop = el.scrollHeight;
}

function showGameOverBanner() {
  const slot = document.getElementById('gameover-slot');
  if (!slot) return;
  let cls = 'draw', title = 'Draw', sub = 'The game is drawn';
  if (chess.in_checkmate()) {
    const winner = chess.turn() === 'w' ? 'b' : 'w';
    const engineColor = getEngineColor();
    const engineWon = winner === engineColor;
    if (gameMode === 'vs')             { cls = engineWon ? 'lose' : 'win'; title = engineWon ? 'Defeat' : 'Victory!'; }
    else if (gameMode === 'correspondence') { cls = engineWon ? 'win' : 'lose'; title = engineWon ? 'Victory!' : 'Defeat'; }
    else                               { cls = 'win'; title = 'Checkmate!'; }
    sub = 'Checkmate';
  } else if (chess.in_stalemate())          { sub = 'Stalemate'; }
  else if (chess.in_threefold_repetition()) { sub = 'Threefold repetition'; }
  else if (chess.insufficient_material())   { sub = 'Insufficient material'; }
  slot.innerHTML = `<div class="game-over ${cls}"><h3>${title}</h3><p>${sub}</p></div>`;
}

// ── Difficulty selector ──────────────────────────────────────────────────────

function setDifficulty(level) {
  currentDifficulty = level;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.toggle('active', b.dataset.level === level));
}
