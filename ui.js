/**
 * Chess Assistant — UI
 * Handles board rendering, user interaction, and game flow
 */

const SYMBOLS = {
  w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
};

let chess = null;
let playerColor = null;
let selectedSq = null;
let legalTargets = [];
let lastMove = null;
let engineThinking = false;
let gameOver = false;
let engineDepth = 3;

// ── Game lifecycle ──────────────────────────────────────────────────────────

function startGame(color) {
  playerColor = color;
  chess = new Chess();
  selectedSq = null;
  legalTargets = [];
  lastMove = null;
  engineThinking = false;
  gameOver = false;

  document.getElementById('setup').style.display = 'none';
  buildGameUI();
  renderBoard();

  // If engine plays white, go first
  if (chess.turn() === playerColor) {
    setTimeout(runEngine, 80);
  }
}

function resetGame() {
  document.getElementById('game').style.display = 'none';
  document.getElementById('game').innerHTML = '';
  document.getElementById('setup').style.display = 'block';
}

// ── UI Construction ─────────────────────────────────────────────────────────

function buildGameUI() {
  const gameEl = document.getElementById('game');
  gameEl.style.display = 'flex';

  const ranks = playerColor === 'w'
    ? ['8','7','6','5','4','3','2','1']
    : ['1','2','3','4','5','6','7','8'];
  const files = playerColor === 'w'
    ? ['a','b','c','d','e','f','g','h']
    : ['h','g','f','e','d','c','b','a'];

  gameEl.innerHTML = `
    <div class="board-area">
      <div class="board-wrap">
        <div class="rank-col">
          ${ranks.map(r => `<div class="rank-lbl">${r}</div>`).join('')}
        </div>
        <div>
          <div id="board"></div>
          <div class="file-row">
            ${files.map(f => `<div class="file-lbl">${f}</div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="side-panel">
      <div class="pcard">
        <div class="clbl">Giochi come</div>
        <div class="pname">${playerColor === 'w' ? '♔ Bianco' : '♚ Nero'}</div>
        <div class="psub">Il motore muove i tuoi pezzi</div>
      </div>

      <div class="pcard">
        <div class="clbl">Forza motore</div>
        <div class="depth-row">
          <label>Profondità</label>
          <input type="range" min="2" max="5" value="${engineDepth}" id="depthSlider"
            oninput="engineDepth = +this.value; document.getElementById('depthVal').textContent = this.value">
          <span id="depthVal">${engineDepth}</span>
        </div>
      </div>

      <div class="pcard">
        <div class="clbl">Stato</div>
        <div id="status-text"></div>
      </div>

      <div class="pcard history-card">
        <div class="clbl">Mosse</div>
        <div id="move-list"></div>
      </div>

      <div id="gameover-slot"></div>

      <button class="new-game-btn" onclick="resetGame()">↩ Nuova partita</button>
    </div>
  `;
}

// ── Board Rendering ─────────────────────────────────────────────────────────

function squareFromIndex(row, col) {
  const files = 'abcdefgh';
  if (playerColor === 'w') {
    return files[col] + (8 - row);
  } else {
    return files[7 - col] + (row + 1);
  }
}

function getCheckedKingSquare() {
  if (!chess.in_check()) return null;
  const board = chess.board();
  const turn = chess.turn();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p && p.type === 'k' && p.color === turn) {
        return 'abcdefgh'[c] + (8 - r);
      }
    }
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
      const sq = squareFromIndex(row, col);
      const piece = playerColor === 'w' ? board[row][col] : board[7 - row][7 - col];
      const isLight = (row + col) % 2 === 0;

      let classes = 'sq ' + (isLight ? 'lt' : 'dk');
      if (sq === selectedSq) classes += ' sel';
      else if (lastMove && sq === lastMove.from) classes += ' lf';
      else if (lastMove && sq === lastMove.to) classes += ' lt2';
      if (sq === checkedSq) classes += ' chk';
      if (legalTargets.includes(sq)) classes += piece ? ' hr' : ' hd';

      const pieceHTML = piece
        ? `<span class="piece ${piece.color === 'w' ? 'wp' : 'bp'}">${SYMBOLS[piece.color][piece.type]}</span>`
        : '';

      html += `<div class="${classes}" onclick="onSquareClick('${sq}')">${pieceHTML}</div>`;
    }
  }

  boardEl.innerHTML = html;
  updateStatus();
  updateMoveHistory();
}

// ── Interaction ─────────────────────────────────────────────────────────────

function onSquareClick(sq) {
  if (engineThinking || gameOver) return;

  const opponentColor = playerColor === 'w' ? 'b' : 'w';

  // Only respond when it's the opponent's turn
  if (chess.turn() !== opponentColor) return;

  const piece = chess.get(sq);

  if (!selectedSq) {
    // Select a piece
    if (piece && piece.color === opponentColor) {
      selectedSq = sq;
      legalTargets = chess.moves({ square: sq, verbose: true }).map(m => m.to);
      renderBoard();
    }
    return;
  }

  // Attempt to move to target square
  if (legalTargets.includes(sq)) {
    const move = chess.move({ from: selectedSq, to: sq, promotion: 'q' });
    if (move) {
      lastMove = { from: move.from, to: move.to };
      selectedSq = null;
      legalTargets = [];
      renderBoard();

      if (chess.game_over()) {
        gameOver = true;
        setTimeout(showGameOverBanner, 400);
      } else {
        engineThinking = true;
        renderBoard();
        setTimeout(runEngine, 30);
      }
      return;
    }
  }

  // Re-select a different piece
  if (piece && piece.color === opponentColor) {
    selectedSq = sq;
    legalTargets = chess.moves({ square: sq, verbose: true }).map(m => m.to);
  } else {
    selectedSq = null;
    legalTargets = [];
  }
  renderBoard();
}

// ── Engine ──────────────────────────────────────────────────────────────────

function runEngine() {
  const best = getBestMove(chess, engineDepth, playerColor);
  if (best) {
    const result = chess.move(best);
    if (result) lastMove = { from: result.from, to: result.to };
  }
  engineThinking = false;
  renderBoard();

  if (chess.game_over()) {
    gameOver = true;
    setTimeout(showGameOverBanner, 400);
  }
}

// ── Status & History ────────────────────────────────────────────────────────

function updateStatus() {
  const el = document.getElementById('status-text');
  if (!el) return;

  const opponentColor = playerColor === 'w' ? 'b' : 'w';

  if (engineThinking) {
    el.innerHTML = '<span class="thnk">Motore calcola<span>.</span><span>.</span><span>.</span></span>';
    return;
  }
  if (chess.in_checkmate()) {
    el.textContent = `Scacco matto — vince il ${chess.turn() === 'w' ? 'Nero' : 'Bianco'}`;
    return;
  }
  if (chess.in_draw()) { el.textContent = 'Patta'; return; }
  if (chess.in_check()) {
    el.textContent = `Scacco al ${chess.turn() === 'w' ? 'Bianco' : 'Nero'}!`;
    return;
  }
  if (chess.turn() === opponentColor) {
    el.textContent = "Muovi i pezzi dell'avversario";
  } else {
    el.textContent = 'Motore in elaborazione…';
  }
}

function updateMoveHistory() {
  const el = document.getElementById('move-list');
  if (!el) return;

  const history = chess.history();
  if (!history.length) {
    el.innerHTML = '<div class="no-moves">Nessuna mossa ancora</div>';
    return;
  }

  const engineIsWhite = playerColor === 'w';
  let html = '<div class="move-grid">';
  for (let i = 0; i < history.length; i += 2) {
    const n = Math.floor(i / 2) + 1;
    const wm = history[i] || '';
    const bm = history[i + 1] || '';
    html += `
      <span class="move-num">${n}.</span>
      <span class="move-san ${engineIsWhite ? 'mine' : 'opp'}">${wm}</span>
      <span class="move-san ${!engineIsWhite ? 'mine' : 'opp'}">${bm}</span>
    `;
  }
  html += '</div>';
  el.innerHTML = html;
  el.scrollTop = el.scrollHeight;
}

function showGameOverBanner() {
  const slot = document.getElementById('gameover-slot');
  if (!slot) return;

  let cls = 'draw', title = 'Patta', sub = 'La partita è patta';

  if (chess.in_checkmate()) {
    const winnerColor = chess.turn() === 'w' ? 'b' : 'w';
    const engineWon = winnerColor === playerColor;
    cls = engineWon ? 'win' : 'lose';
    title = engineWon ? 'Vittoria!' : 'Sconfitta';
    sub = 'Scacco matto';
  } else if (chess.in_stalemate()) {
    sub = 'Stallo';
  } else if (chess.in_threefold_repetition()) {
    sub = 'Triplice ripetizione';
  } else if (chess.insufficient_material()) {
    sub = 'Materiale insufficiente';
  }

  slot.innerHTML = `
    <div class="game-over ${cls}">
      <h3>${title}</h3>
      <p>${sub}</p>
    </div>
  `;
}
