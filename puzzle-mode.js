/**
 * Puzzle Mode — Solve & Create
 * No dynamic generation. Two separate entry points from index.html.
 */

let pzChess        = null;
let pzPuzzle       = null;
let pzIndex        = 0;
let pzSelectedSq   = null;
let pzLegalTargets = [];
let pzLastMove     = null;
let pzOver         = false;

// Editor state
let edChess         = null;
let edSelectedPiece = null;
let edTurn          = 'w';

const EDITOR_PIECES = [
  { color:'w', type:'k' }, { color:'w', type:'q' }, { color:'w', type:'r' },
  { color:'w', type:'b' }, { color:'w', type:'n' },

  { color:'b', type:'k' }, { color:'b', type:'q' }, { color:'b', type:'r' },
  { color:'b', type:'b' }, { color:'b', type:'n' }
];

function pieceImgHTML(color, type, className = 'piece') {
  return `<img class="${className}" src="${getPieceSVG(color, type)}" alt="" draggable="false">`;
}

// ── Entry points ────────────────────────────────────────────────────────────

function startSolveMode() {
  document.getElementById('setup').style.display = 'none';
  const gameEl = document.getElementById('game');
  gameEl.style.display = 'block';
  gameEl.innerHTML = '';
  pzIndex = 0;
  pzPuzzle = null;
  pzOver = false;

  const params = new URLSearchParams(window.location.search);
  const sharedFen = params.get('puzzle');
  if (sharedFen) {
    loadSharedPuzzle(sharedFen);
  } else {
    loadNextPuzzle();
  }
}

function startEditorMode() {
  document.getElementById('setup').style.display = 'none';
  const gameEl = document.getElementById('game');
  gameEl.style.display = 'block';
  gameEl.innerHTML = '';
  edChess = new Chess();
  edChess.clear();
  edTurn = 'w';
  edSelectedPiece = null;
  buildEditorUI();
}

function exitPuzzleMode() {
  pzPuzzle = null;
  pzIndex = 0;
  pzOver = false;
  edChess = null;
  document.getElementById('game').style.display = 'none';
  document.getElementById('game').innerHTML = '';
  document.getElementById('setup').style.display = 'block';
}

// ── Solve — Load ────────────────────────────────────────────────────────────

function loadNextPuzzle() {
  pzOver = false;
  pzSelectedSq = null;
  pzLegalTargets = [];
  pzLastMove = null;

  if (pzIndex >= CURATED_PUZZLES.length) {
    showAllSolvedScreen();
    return;
  }

  loadPuzzle(CURATED_PUZZLES[pzIndex]);
  pzIndex++;
}

function loadPuzzle(puzzle) {
  pzPuzzle = puzzle;
  pzChess = new Chess();
  pzChess.load(puzzle.fen);
  buildSolveUI();
}

function loadSharedPuzzle(fen) {
  try {
    const test = new Chess();
    if (!test.load(fen)) throw new Error('invalid');
    const mate = findMateInOne(test);

    loadPuzzle({
      id: 'shared',
      title: 'Shared Puzzle',
      type: mate ? 'Mate in 1' : 'Custom Position',
      diff: 2,
      fen,
      solution: mate ? [mate] : [],
      hint: 'This puzzle was shared via link.'
    });

    const url = new URL(window.location);
    url.searchParams.delete('puzzle');
    history.replaceState({}, '', url);
  } catch {
    loadNextPuzzle();
  }
}

function showAllSolvedScreen() {
  document.getElementById('game').innerHTML = `
    <div style="text-align:center;padding:4rem 1rem;width:100%">
      <div style="font-size:48px;margin-bottom:1rem">♟</div>
      <h2 style="font-size:1.6rem;font-weight:700;color:var(--text);margin-bottom:.5rem">All puzzles solved!</h2>
      <p style="color:var(--text2);margin-bottom:2rem">You've completed all 20 curated puzzles.</p>
      <button class="pz-btn primary" style="max-width:220px;margin:0 auto" onclick="pzIndex=0;loadNextPuzzle()">Play again from start</button>
      <br><br>
      <button class="new-game-btn" style="max-width:220px;margin:0 auto" onclick="exitPuzzleMode()">↩ Back to menu</button>
    </div>`;
}

// ── Solve — UI ──────────────────────────────────────────────────────────────

function buildSolveUI() {
  const total = CURATED_PUZZLES.length;
  const progress = Math.min(pzIndex, total);
  const pct = Math.round((progress / total) * 100);
  const orient = pzChess.turn();
  const ranks = orient === 'w' ? ['8','7','6','5','4','3','2','1'] : ['1','2','3','4','5','6','7','8'];
  const files = orient === 'w' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];

  document.getElementById('game').innerHTML = `
    <div class="pz-layout">
      <div class="board-area">
        <div class="board-wrap">
          <div class="rank-col">${ranks.map(r => `<div class="rank-lbl">${r}</div>`).join('')}</div>
          <div>
            <div id="pz-board"></div>
            <div class="file-row">${files.map(f => `<div class="file-lbl">${f}</div>`).join('')}</div>
          </div>
        </div>
      </div>

      <div class="side-panel">
        <div class="pcard">
          <div class="clbl">Progress</div>
          <div class="pname" style="font-size:14px">${progress} / ${total}</div>
          <div class="pz-bar-wrap"><div class="pz-bar" style="width:${pct}%"></div></div>
        </div>

        <div class="pcard">
          <div class="clbl">Puzzle</div>
          <div class="pname" style="font-size:16px">${pzPuzzle.title}</div>
          <div class="psub">${pzPuzzle.type}</div>
          <div class="pz-diff">${'★'.repeat(pzPuzzle.diff)}${'☆'.repeat(5 - pzPuzzle.diff)}</div>
        </div>

        <div class="pcard">
          <div class="clbl">Status</div>
          <div id="pz-status">${pzChess.turn() === 'w' ? 'White' : 'Black'} to move — find the best move</div>
        </div>

        <div class="pcard" id="pz-hint-card" style="display:none">
          <div class="clbl">Hint</div>
          <div id="pz-hint-text" class="psub"></div>
        </div>

        <div class="pcard">
          <div class="clbl">Actions</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="pz-btn" id="pz-hint-btn" onclick="showHint()">Show hint</button>
            <button class="pz-btn" id="pz-skip-btn" onclick="skipPuzzle()">Skip puzzle</button>
            <button class="pz-btn primary" id="pz-next-btn" onclick="loadNextPuzzle()" style="display:none">Next puzzle</button>
          </div>
        </div>

        <button class="new-game-btn" onclick="exitPuzzleMode()">↩ Back to menu</button>
      </div>
    </div>`;

  renderPuzzleBoard();
}

function pzSqFromIndex(row, col, orient) {
  const files = 'abcdefgh';
  return orient === 'w'
    ? files[col] + (8 - row)
    : files[7 - col] + (row + 1);
}

function renderPuzzleBoard() {
  const boardEl = document.getElementById('pz-board');
  if (!boardEl) return;

  const orient = pzChess.turn();
  const board = pzChess.board();
  let checkedSq = null;

  if (pzChess.in_check()) {
    const turn = pzChess.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) checkedSq = 'abcdefgh'[c] + (8 - r);
      }
    }
  }

  let html = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq = pzSqFromIndex(row, col, orient);
      const piece = orient === 'w' ? board[row][col] : board[7 - row][7 - col];
      const lt = (row + col) % 2 === 0;
      let cls = 'sq ' + (lt ? 'lt' : 'dk');

      if (!pzOver) {
        if (sq === pzSelectedSq) cls += ' sel';
        else if (pzLastMove && sq === pzLastMove.from) cls += ' lf';
        else if (pzLastMove && sq === pzLastMove.to) cls += ' lt2';
        if (sq === checkedSq) cls += ' chk';
        if (pzLegalTargets.includes(sq)) cls += piece ? ' hr' : ' hd';
      } else {
        if (pzLastMove && sq === pzLastMove.from) cls += ' lf';
        if (pzLastMove && sq === pzLastMove.to) cls += ' lt2';
      }

      const ph = piece ? pieceImgHTML(piece.color, piece.type, 'piece') : '';
      html += `<div class="${cls}" onclick="onPuzzleSquareClick('${sq}')">${ph}</div>`;
    }
  }

  boardEl.innerHTML = html;
}

// ── Solve — Interaction ─────────────────────────────────────────────────────

function onPuzzleSquareClick(sq) {
  if (pzOver || !pzChess || !pzPuzzle) return;

  const humanColor = pzChess.turn();
  const piece = pzChess.get(sq);

  if (!pzSelectedSq) {
    if (piece && piece.color === humanColor) {
      pzSelectedSq = sq;
      pzLegalTargets = pzChess.moves({ square: sq, verbose: true }).map(m => m.to);
      renderPuzzleBoard();
    }
    return;
  }

  if (pzLegalTargets.includes(sq)) {
    const move = pzChess.move({ from: pzSelectedSq, to: sq, promotion: 'q' });
    if (move) {
      pzLastMove = { from: move.from, to: move.to };
      pzSelectedSq = null;
      pzLegalTargets = [];
      renderPuzzleBoard();
      checkPuzzleResult(move.san);
      return;
    }
  }

  if (piece && piece.color === humanColor) {
    pzSelectedSq = sq;
    pzLegalTargets = pzChess.moves({ square: sq, verbose: true }).map(m => m.to);
  } else {
    pzSelectedSq = null;
    pzLegalTargets = [];
  }

  renderPuzzleBoard();
}

function checkPuzzleResult(moveSan) {
  const played = moveSan.replace(/[+#!?]/g, '');
  const expected = (pzPuzzle.solution[0] || '').replace(/[+#!?]/g, '');

  if (played === expected || pzChess.in_checkmate()) {
    pzOver = true;
    setPuzzleStatus('solved');
    document.getElementById('pz-next-btn').style.display = 'block';
    document.getElementById('pz-hint-btn').style.display = 'none';

    const board = document.getElementById('pz-board');
    if (board) {
      board.style.transition = 'box-shadow .3s';
      board.style.boxShadow = '0 0 0 3px var(--success)';
      setTimeout(() => { if (board) board.style.boxShadow = ''; }, 1500);
    }
  } else {
    pzChess.undo();
    pzLastMove = null;
    renderPuzzleBoard();
    setPuzzleStatus('wrong');
    setTimeout(() => setPuzzleStatus('toMove'), 1800);
  }
}

function skipPuzzle() {
  pzOver = true;
  setPuzzleStatus('skipped');
  document.getElementById('pz-next-btn').style.display = 'block';
  document.getElementById('pz-hint-btn').style.display = 'none';
}

function showHint() {
  if (!pzPuzzle) return;

  const card = document.getElementById('pz-hint-card');
  const text = document.getElementById('pz-hint-text');
  if (card && text) {
    text.textContent = pzPuzzle.hint;
    card.style.display = 'block';
    document.getElementById('pz-hint-btn').style.display = 'none';
  }
}

function setPuzzleStatus(state) {
  const el = document.getElementById('pz-status');
  if (!el) return;

  const turn = pzChess ? (pzChess.turn() === 'w' ? 'White' : 'Black') : '';
  const msgs = {
    toMove: `${turn} to move — find the best move`,
    wrong: '✗ Not the right move. Try again.',
    solved: '✓ Correct! Well done.',
    skipped: 'Puzzle skipped.',
  };

  el.innerHTML = msgs[state] || state;
  el.className = state === 'solved' ? 'pz-status-ok' : state === 'wrong' ? 'pz-status-err' : '';
}

// ── Position Editor ─────────────────────────────────────────────────────────

function buildEditorUI() {
  const ranks = ['8','7','6','5','4','3','2','1'];
  const files = ['a','b','c','d','e','f','g','h'];

  document.getElementById('game').innerHTML = `
    <div class="pz-layout">
      <div class="board-area">
        <div class="board-wrap">
          <div class="rank-col">${ranks.map(r => `<div class="rank-lbl">${r}</div>`).join('')}</div>
          <div>
            <div id="ed-board"></div>
            <div class="file-row">${files.map(f => `<div class="file-lbl">${f}</div>`).join('')}</div>
          </div>
        </div>
      </div>

      <div class="side-panel">
        <div class="pcard">
          <div class="clbl">Pieces</div>
          <div class="piece-palette" id="ed-palette">

  <!-- Riga 1: white -->
  ${['k','q','r','b','n'].map(t => `
    <div class="pal-piece" onclick="selectEditorPiece('w','${t}')">
      ${pieceImgHTML('w', t, 'pal-piece-img')}
    </div>
  `).join('')}

  <!-- spacer per chiudere la riga -->
  <div class="pal-spacer"></div>

  <!-- Riga 2: black -->
  ${['k','q','r','b','n'].map(t => `
    <div class="pal-piece" onclick="selectEditorPiece('b','${t}')">
      ${pieceImgHTML('b', t, 'pal-piece-img')}
    </div>
  `).join('')}

  <!-- erase in fondo riga -->
  <div class="pal-piece pal-erase" onclick="selectEditorPiece(null,null)">✕</div>

  <!-- Riga 3: centrata -->
  <div class="pal-spacer"></div>
  <div class="pal-spacer"></div>
  <div class="pal-spacer"></div>

  <div class="pal-piece" onclick="selectEditorPiece('w','p')">
    ${pieceImgHTML('w','p','pal-piece-img')}
  </div>

  <div class="pal-piece" onclick="selectEditorPiece('b','p')">
    ${pieceImgHTML('b','p','pal-piece-img')}
  </div>

  <div class="pal-spacer"></div>

</div>
        <div class="pcard">
          <div class="clbl">Side to move</div>
          <div class="turn-toggle">
            <button class="turn-btn active" id="turn-w" onclick="setEditorTurn('w')">White</button>
            <button class="turn-btn" id="turn-b" onclick="setEditorTurn('b')">Black</button>
          </div>
        </div>

        <div class="pcard">
          <div class="clbl">Actions</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="pz-btn primary" onclick="playEditorPosition()">Play this position</button>
            <button class="pz-btn primary" onclick="solveEditorPosition()">Solve as puzzle</button>
            <button class="pz-btn" onclick="copyShareLink()">Copy share link</button>
            <button class="pz-btn" onclick="clearEditor()">Clear board</button>
          </div>
        </div>

        <div class="pcard">
          <div class="clbl">Info</div>
          <div id="ed-status" class="psub">Select a piece from the palette, then click the board to place it.</div>
        </div>

        <button class="new-game-btn" onclick="exitPuzzleMode()">↩ Back to menu</button>
      </div>
    </div>`;

  renderEditorBoard();
}

function selectEditorPiece(color, type) {
  edSelectedPiece = color ? { color, type } : null;
  document.querySelectorAll('.pal-piece').forEach(el => {
    el.classList.toggle(
      'pal-active',
      (el.dataset.color === color && el.dataset.type === type) ||
      (!color && el.classList.contains('pal-erase'))
    );
  });
}

function setEditorTurn(color) {
  edTurn = color;
  document.getElementById('turn-w').classList.toggle('active', color === 'w');
  document.getElementById('turn-b').classList.toggle('active', color === 'b');
}

function onEditorSquareClick(sq) {
  if (!edChess) return;

  const existing = edChess.get(sq);
  if (!edSelectedPiece) {
    if (existing) {
      edChess.remove(sq);
      renderEditorBoard();
    }
    return;
  }

  if (existing) edChess.remove(sq);
  edChess.put({ type: edSelectedPiece.type, color: edSelectedPiece.color }, sq);
  renderEditorBoard();
}

function renderEditorBoard() {
  const boardEl = document.getElementById('ed-board');
  if (!boardEl) return;

  const board = edChess.board();
  let html = '';

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq = 'abcdefgh'[col] + (8 - row);
      const piece = board[row][col];
      const lt = (row + col) % 2 === 0;
      const ph = piece ? pieceImgHTML(piece.color, piece.type, 'piece') : '';
      html += `<div class="sq ${lt ? 'lt' : 'dk'} ed-sq" onclick="onEditorSquareClick('${sq}')">${ph}</div>`;
    }
  }

  boardEl.innerHTML = html;
}

function getEditorFen() {
  const parts = edChess.fen().split(' ');
  parts[1] = edTurn;
  parts[2] = '-';
  parts[3] = '-';
  parts[4] = '0';
  parts[5] = '1';
  return parts.join(' ');
}

function playEditorPosition() {
  const fen = getEditorFen();
  const test = new Chess();

  if (!test.load(fen)) {
    setEditorStatus('Invalid position — make sure both kings are present.');
    return;
  }

  playerColor = edTurn;
  gameMode = 'vs';
  chess = new Chess();
  chess.load(fen);
  selectedSq = null;
  legalTargets = [];
  lastMove = null;
  engineThinking = false;
  gameOver = false;

  document.getElementById('setup').style.display = 'none';
  const gameEl = document.getElementById('game');
  gameEl.style.display = 'flex';
  gameEl.style.flexWrap = 'wrap';
  gameEl.innerHTML = '';
  buildGameUI();
  renderBoard();

  const engineColor = playerColor === 'w' ? 'b' : 'w';
  if (chess.turn() === engineColor) {
    engineThinking = true;
    renderBoard();
    setTimeout(runEngine, 80);
  }
}

function solveEditorPosition() {
  const fen = getEditorFen();
  const test = new Chess();

  if (!test.load(fen)) {
    setEditorStatus('Invalid position.');
    return;
  }

  const mate = findMateInOne(test);
  document.getElementById('game').innerHTML = '';
  pzOver = false;
  pzSelectedSq = null;
  pzLegalTargets = [];
  pzLastMove = null;

  loadPuzzle({
    id: 'custom-' + Date.now(),
    title: 'Custom Puzzle',
    type: mate ? 'Mate in 1' : 'Custom Position',
    diff: 2,
    fen,
    solution: mate ? [mate] : [],
    hint: mate ? 'There is a checkmate in one move.' : 'Find the best move.'
  });
}

function copyShareLink() {
  const fen = getEditorFen();
  const test = new Chess();

  if (!test.load(fen)) {
    setEditorStatus('Invalid position — cannot share.');
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set('puzzle', fen);
  navigator.clipboard.writeText(url.toString())
    .then(() => setEditorStatus('Share link copied to clipboard.'))
    .catch(() => setEditorStatus('Could not copy the link.'));
}

function clearEditor() {
  edChess.clear();
  renderEditorBoard();
  setEditorStatus('Board cleared.');
}

function setEditorStatus(text) {
  const el = document.getElementById('ed-status');
  if (el) el.textContent = text;
}
