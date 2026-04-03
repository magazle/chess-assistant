/**
 * Chess Assistant — UI
 * Two modes: Engine Assist and vs Engine
 * Uses getPieceSVG() from pieces.js — no Unicode symbols
 */

const DEPTH_LABELS = {
  2: { label: 'Beginner',     desc: 'Looks 2 moves ahead. Avoids immediate blunders but misses short combinations. Very fast.' },
  3: { label: 'Intermediate', desc: 'Looks 3 moves ahead. Spots basic tactics (forks, captures). Recommended for most players.' },
  4: { label: 'Advanced',     desc: 'Looks 4 moves ahead. Finds multi-step tactics and plays solid positional chess. May take 2–5 seconds.' },
  5: { label: 'Strong',       desc: 'Looks 5 moves ahead. Calculates deep combinations and defends precisely. Can take up to 15 seconds per move.' }
};

let chess          = null;
let playerColor    = null;
let gameMode       = null;
let selectedSq     = null;
let legalTargets   = [];
let lastMove       = null;
let engineThinking = false;
let gameOver       = false;
let engineDepth    = 3;

// ── Game lifecycle ──────────────────────────────────────────────────────────

function startGame(color, mode) {
  playerColor    = color;
  gameMode       = mode;
  chess          = new Chess();
  selectedSq     = null;
  legalTargets   = [];
  lastMove       = null;
  engineThinking = false;
  gameOver       = false;

  document.getElementById('setup').style.display = 'none';
  const gameEl = document.getElementById('game');
  gameEl.style.display = 'flex';
  gameEl.style.flexWrap = 'wrap';
  gameEl.innerHTML = '';
  buildGameUI();
  renderBoard();

  const engineColor = mode === 'assist' ? playerColor : (playerColor === 'w' ? 'b' : 'w');
  if (chess.turn() === engineColor) {
    engineThinking = true;
    renderBoard();
    setTimeout(runEngine, 80);
  }
}

function resetGame() {
  document.getElementById('game').style.display = 'none';
  document.getElementById('game').innerHTML = '';
  document.getElementById('setup').style.display = 'block';
}

// ── UI Construction ─────────────────────────────────────────────────────────

function depthDescHTML(d) {
  const info = DEPTH_LABELS[d];
  return `<div class="depth-desc"><strong>${info.label}</strong> — ${info.desc}</div>`;
}

function buildGameUI() {
  const gameEl = document.getElementById('game');
  const ranks = playerColor === 'w' ? ['8','7','6','5','4','3','2','1'] : ['1','2','3','4','5','6','7','8'];
  const files = playerColor === 'w' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];
  const modeLabel = gameMode === 'assist' ? 'Engine Assist' : 'vs Engine';
  const modeSub   = gameMode === 'assist' ? 'Engine moves your pieces' : 'You play, engine plays opponent';

  gameEl.innerHTML = `
    <div class="board-area">
      <div class="board-wrap">
        <div class="rank-col">${ranks.map(r => `<div class="rank-lbl">${r}</div>`).join('')}</div>
        <div>
          <div id="board"></div>
          <div class="file-row">${files.map(f => `<div class="file-lbl">${f}</div>`).join('')}</div>
        </div>
      </div>
    </div>
    <div class="side-panel">
      <div class="pcard">
        <div class="clbl">Playing as</div>
        <div class="pname">${playerColor === 'w' ? 'White' : 'Black'}</div>
        <div class="psub">${modeSub}</div>
        <div class="mode-badge">${modeLabel}</div>
      </div>
      <div class="pcard">
        <div class="clbl">Engine strength</div>
        <div class="depth-row">
          <label>Depth</label>
          <input type="range" min="2" max="5" value="${engineDepth}" id="depthSlider"
            oninput="engineDepth=+this.value;document.getElementById('depthVal').textContent=this.value;document.getElementById('depthDesc').innerHTML=depthDescHTML(+this.value)">
          <span class="depth-val" id="depthVal">${engineDepth}</span>
        </div>
        <div id="depthDesc">${depthDescHTML(engineDepth)}</div>
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

// ── Board Rendering ─────────────────────────────────────────────────────────

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
  const boardEl = document.getElementById('board');
  if (!boardEl) return;
  const checkedSq = getCheckedKingSquare();
  const board = chess.board();
  let html = '';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq    = squareFromIndex(row, col);
      const piece = playerColor === 'w' ? board[row][col] : board[7-row][7-col];
      const lt    = (row + col) % 2 === 0;
      let cls     = 'sq ' + (lt ? 'lt' : 'dk');

      if (sq === selectedSq)                       cls += ' sel';
      else if (lastMove && sq === lastMove.from)   cls += ' lf';
      else if (lastMove && sq === lastMove.to)     cls += ' lt2';
      if (sq === checkedSq)                        cls += ' chk';
      if (legalTargets.includes(sq))               cls += piece ? ' hr' : ' hd';

      const ph = piece ? getPieceSVG(piece.color, piece.type) : '';
      html += `<div class="${cls}" onclick="onSquareClick('${sq}')">${ph}</div>`;
    }
  }
  boardEl.innerHTML = html;
  updateStatus();
  updateMoveHistory();
}

// ── Interaction ─────────────────────────────────────────────────────────────

function onSquareClick(sq) {
  if (engineThinking || gameOver) return;
  const humanColor = gameMode === 'assist' ? (playerColor === 'w' ? 'b' : 'w') : playerColor;
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
      renderBoard();
      if (chess.game_over()) { gameOver = true; setTimeout(showGameOverBanner, 400); }
      else { engineThinking = true; renderBoard(); setTimeout(runEngine, 30); }
      return;
    }
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

// ── Engine ──────────────────────────────────────────────────────────────────

function runEngine() {
  const engineColor = gameMode === 'assist' ? playerColor : (playerColor === 'w' ? 'b' : 'w');
  const best = getBestMove(chess, engineDepth, engineColor);
  if (best) {
    const result = chess.move(best);
    if (result) lastMove = { from: result.from, to: result.to };
  }
  engineThinking = false;
  renderBoard();
  if (chess.game_over()) { gameOver = true; setTimeout(showGameOverBanner, 400); }
}

// ── Status & History ────────────────────────────────────────────────────────

function updateStatus() {
  const el = document.getElementById('status-text');
  if (!el) return;
  const humanColor = gameMode === 'assist' ? (playerColor === 'w' ? 'b' : 'w') : playerColor;

  if (engineThinking) { el.innerHTML = '<span class="thnk">Engine calculating<span>.</span><span>.</span><span>.</span></span>'; return; }
  if (chess.in_checkmate()) { el.textContent = `Checkmate — ${chess.turn() === 'w' ? 'Black' : 'White'} wins`; return; }
  if (chess.in_draw())      { el.textContent = 'Draw'; return; }
  if (chess.in_check())     { el.textContent = `${chess.turn() === 'w' ? 'White' : 'Black'} is in check!`; return; }
  el.textContent = chess.turn() === humanColor
    ? (gameMode === 'assist' ? "Move the opponent's pieces" : 'Your turn')
    : 'Engine is thinking…';
}

function updateMoveHistory() {
  const el = document.getElementById('move-list');
  if (!el) return;
  const history = chess.history();
  if (!history.length) { el.innerHTML = '<div class="no-moves">No moves yet</div>'; return; }

  const whiteIsMe = playerColor === 'w';
  let html = '<div class="move-grid">';
  for (let i = 0; i < history.length; i += 2) {
    const n = Math.floor(i / 2) + 1;
    html += `<span class="move-num">${n}.</span>
      <span class="move-san ${whiteIsMe ? 'mine' : 'opp'}">${history[i] || ''}</span>
      <span class="move-san ${!whiteIsMe ? 'mine' : 'opp'}">${history[i+1] || ''}</span>`;
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
    const winnerColor = chess.turn() === 'w' ? 'b' : 'w';
    const playerWon   = winnerColor === playerColor;
    cls   = playerWon ? 'win' : 'lose';
    title = playerWon ? 'Victory!' : 'Defeat';
    sub   = 'Checkmate';
  } else if (chess.in_stalemate())          { sub = 'Stalemate'; }
  else if (chess.in_threefold_repetition()) { sub = 'Threefold repetition'; }
  else if (chess.insufficient_material())   { sub = 'Insufficient material'; }
  slot.innerHTML = `<div class="game-over ${cls}"><h3>${title}</h3><p>${sub}</p></div>`;
}
