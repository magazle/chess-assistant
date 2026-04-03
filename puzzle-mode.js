/**
 * Puzzle Mode — UI
 * Curated puzzles + dynamic generation + position editor with URL sharing
 */

let pzChess         = null;   // chess.js instance for current puzzle
let pzPuzzle        = null;   // current puzzle object
let pzIndex         = 0;      // index into CURATED_PUZZLES (or 'generated' mode)
let pzSolved        = 0;      // number solved this session
let pzSelectedSq    = null;
let pzLegalTargets  = [];
let pzLastMove      = null;
let pzOver          = false;  // puzzle solved/skipped
let pzDynamic       = false;  // true when in dynamic generation mode
let pzDynCount      = 0;      // counter for generated puzzles
let pzCompleted     = new Set(); // ids of solved puzzles

// Editor state
let edChess         = null;
let edSelectedPiece = null;   // { color, type } from palette
let edTurn          = 'w';

// ── Entry ──────────────────────────────────────────────────────────────────

function startPuzzleMode() {
  document.getElementById('setup').style.display = 'none';
  const gameEl = document.getElementById('game');
  gameEl.style.display = 'block';
  gameEl.style.flexWrap = 'wrap';

  buildPuzzleShell();

  // Check URL for shared puzzle
  const params = new URLSearchParams(window.location.search);
  const sharedFen = params.get('puzzle');
  if (sharedFen) {
    loadSharedPuzzle(sharedFen);
  } else {
    showSubMode('solve');
  }
}

function buildPuzzleShell() {
  document.getElementById('game').innerHTML = `
    <div id="puzzle-app" style="width:100%">
      <div class="puzzle-tabs">
        <button class="ptab active" onclick="showSubMode('solve')" id="ptab-solve">Solve</button>
        <button class="ptab" onclick="showSubMode('editor')" id="ptab-editor">Position editor</button>
      </div>
      <div id="pz-solve-view"></div>
      <div id="pz-editor-view" style="display:none"></div>
    </div>
  `;
}

function showSubMode(mode) {
  document.getElementById('pz-solve-view').style.display  = mode === 'solve'  ? 'flex' : 'none';
  document.getElementById('pz-editor-view').style.display = mode === 'editor' ? 'flex' : 'none';
  document.getElementById('ptab-solve').classList.toggle('active',  mode === 'solve');
  document.getElementById('ptab-editor').classList.toggle('active', mode === 'editor');

  if (mode === 'solve'  && !pzPuzzle) loadNextPuzzle();
  if (mode === 'editor' && !edChess)  initEditor();
}

// ── Solve Mode ─────────────────────────────────────────────────────────────

function buildSolveUI() {
  const total = CURATED_PUZZLES.length;
  const progress = pzDynamic
    ? `All ${total} solved · Generated #${pzDynCount}`
    : `${Math.min(pzIndex + 1, total)} / ${total}`;

  document.getElementById('pz-solve-view').innerHTML = `
    <div class="pz-layout">
      <div class="board-area">
        <div class="board-wrap">
          <div class="rank-col" id="pz-ranks"></div>
          <div>
            <div id="pz-board"></div>
            <div class="file-row" id="pz-files"></div>
          </div>
        </div>
      </div>
      <div class="side-panel">
        <div class="pcard">
          <div class="clbl">Progress</div>
          <div class="pname" style="font-size:14px">${progress}</div>
          <div class="pz-bar-wrap"><div class="pz-bar" style="width:${pzDynamic ? 100 : Math.round((pzIndex/total)*100)}%"></div></div>
        </div>
        <div class="pcard">
          <div class="clbl">Puzzle</div>
          <div class="pname" id="pz-title">${pzPuzzle ? pzPuzzle.title : ''}</div>
          <div class="psub" id="pz-type">${pzPuzzle ? pzPuzzle.type : ''}</div>
          <div class="pz-diff" id="pz-diff">${pzPuzzle ? diffStars(pzPuzzle.diff) : ''}</div>
        </div>
        <div class="pcard">
          <div class="clbl">Status</div>
          <div id="pz-status"></div>
        </div>
        <div class="pcard" id="pz-hint-card" style="display:none">
          <div class="clbl">Hint</div>
          <div class="psub" id="pz-hint-text" style="color:var(--text)"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="pz-btn primary" id="pz-next-btn" style="display:none" onclick="loadNextPuzzle()">Next puzzle →</button>
          <button class="pz-btn" id="pz-hint-btn" onclick="showHint()">Show hint</button>
          <button class="pz-btn" onclick="skipPuzzle()">Skip puzzle</button>
          <button class="new-game-btn" onclick="exitPuzzleMode()">↩ Back to menu</button>
        </div>
      </div>
    </div>
  `;
  renderPuzzleBoard();
  setPuzzleStatus('toMove');
}

function diffStars(d) {
  return '★'.repeat(d) + '☆'.repeat(3 - d);
}

function loadNextPuzzle() {
  pzOver = false;
  pzSelectedSq = null;
  pzLegalTargets = [];
  pzLastMove = null;

  if (!pzDynamic) {
    if (pzIndex >= CURATED_PUZZLES.length) {
      pzDynamic = true;
      pzDynCount = 0;
    }
  }

  if (pzDynamic) {
    setPuzzleStatusDirect('<span class="thnk">Generating puzzle<span>.</span><span>.</span><span>.</span></span>');
    // Use setTimeout to allow the UI to update before blocking computation
    setTimeout(() => {
      const puzzle = generatePuzzle(50);
      if (puzzle) {
        pzDynCount++;
        loadPuzzle(puzzle);
      } else {
        setPuzzleStatusDirect('Could not generate a puzzle. Try again.');
        document.getElementById('pz-next-btn').style.display = 'block';
      }
    }, 30);
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
  showSubMode('solve');
  try {
    const testGame = new Chess();
    if (!testGame.load(fen)) throw new Error('invalid fen');
    const matingMove = findMateInOne(testGame);
    const puzzle = {
      id: 'shared',
      title: 'Shared Puzzle',
      type: matingMove ? 'Mate in 1' : 'Custom Position',
      diff: 2,
      fen: fen,
      solution: matingMove ? [matingMove] : [],
      hint: 'This puzzle was shared via link.'
    };
    loadPuzzle(puzzle);
    // Clear the URL param without reload
    const url = new URL(window.location);
    url.searchParams.delete('puzzle');
    history.replaceState({}, '', url);
  } catch (e) {
    loadNextPuzzle();
  }
}

// ── Board Rendering ─────────────────────────────────────────────────────────

function getPuzzleOrientation() {
  // Board is shown from the perspective of the side to move
  return pzPuzzle && pzChess ? pzChess.turn() : 'w';
}

function pzSquareFromIndex(row, col) {
  const files = 'abcdefgh';
  const orientation = getPuzzleOrientation();
  return orientation === 'w'
    ? files[col] + (8 - row)
    : files[7 - col] + (row + 1);
}

function renderPuzzleBoard() {
  const boardEl = document.getElementById('pz-board');
  const ranksEl = document.getElementById('pz-ranks');
  const filesEl = document.getElementById('pz-files');
  if (!boardEl) return;

  const orientation = getPuzzleOrientation();
  const ranks = orientation === 'w'
    ? ['8','7','6','5','4','3','2','1']
    : ['1','2','3','4','5','6','7','8'];
  const files = orientation === 'w'
    ? ['a','b','c','d','e','f','g','h']
    : ['h','g','f','e','d','c','b','a'];

  if (ranksEl) ranksEl.innerHTML = ranks.map(r => `<div class="rank-lbl">${r}</div>`).join('');
  if (filesEl) filesEl.innerHTML = files.map(f => `<div class="file-lbl">${f}</div>`).join('');

  const board = pzChess.board();
  let html = '';

  // Check indicator
  let checkedSq = null;
  if (pzChess.in_check()) {
    const turn = pzChess.turn();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          checkedSq = 'abcdefgh'[c] + (8 - r);
        }
      }
    }
  }

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq = pzSquareFromIndex(row, col);
      const piece = orientation === 'w' ? board[row][col] : board[7 - row][7 - col];
      const isLight = (row + col) % 2 === 0;

      let cls = 'sq ' + (isLight ? 'lt' : 'dk');
      if (!pzOver) {
        if (sq === pzSelectedSq)                     cls += ' sel';
        else if (pzLastMove && sq === pzLastMove.from) cls += ' lf';
        else if (pzLastMove && sq === pzLastMove.to)   cls += ' lt2';
        if (sq === checkedSq)                          cls += ' chk';
        if (pzLegalTargets.includes(sq))               cls += piece ? ' hr' : ' hd';
      } else {
        if (pzLastMove && sq === pzLastMove.from) cls += ' lf';
        if (pzLastMove && sq === pzLastMove.to)   cls += ' lt2';
      }

      const pieceHTML = piece
        ? `<span class="piece ${piece.color === 'w' ? 'wp' : 'bp'}">${SYMBOLS[piece.color][piece.type]}</span>`
        : '';

      html += `<div class="${cls}" onclick="onPuzzleSquareClick('${sq}')">${pieceHTML}</div>`;
    }
  }
  boardEl.innerHTML = html;
}

// ── Interaction ─────────────────────────────────────────────────────────────

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
  const expected = pzPuzzle.solution[0];
  const played = moveSan.replace(/[+#!?]/g, '');
  const target = expected.replace(/[+#!?]/g, '');

  if (played === target || pzChess.in_checkmate()) {
    // Correct
    pzOver = true;
    pzSolved++;
    pzCompleted.add(pzPuzzle.id);
    showSolvedBanner();
  } else {
    // Wrong — undo
    pzChess.undo();
    pzLastMove = null;
    renderPuzzleBoard();
    setPuzzleStatus('wrong');
    setTimeout(() => setPuzzleStatus('toMove'), 1800);
  }
}

function showSolvedBanner() {
  setPuzzleStatus('solved');
  document.getElementById('pz-next-btn').style.display = 'block';
  document.getElementById('pz-hint-btn').style.display = 'none';
  // Highlight the board
  const board = document.getElementById('pz-board');
  if (board) {
    board.style.transition = 'box-shadow .3s';
    board.style.boxShadow = '0 0 0 3px var(--success)';
    setTimeout(() => { if (board) board.style.boxShadow = ''; }, 1500);
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
    toMove:  `${turn} to move — find the best move`,
    wrong:   '✗ Not the right move. Try again.',
    solved:  '✓ Correct! Well done.',
    skipped: 'Puzzle skipped.',
  };
  el.innerHTML = msgs[state] || state;
  el.className = state === 'solved' ? 'pz-status-ok' : state === 'wrong' ? 'pz-status-err' : '';
}

function setPuzzleStatusDirect(html) {
  const el = document.getElementById('pz-status');
  if (el) el.innerHTML = html;
}

function exitPuzzleMode() {
  pzPuzzle = null;
  pzIndex = 0;
  pzDynamic = false;
  document.getElementById('game').style.display = 'none';
  document.getElementById('game').innerHTML = '';
  document.getElementById('setup').style.display = 'block';
}

// ── Position Editor ─────────────────────────────────────────────────────────

const EDITOR_PIECES = [
  { color: 'w', type: 'k' }, { color: 'w', type: 'q' }, { color: 'w', type: 'r' },
  { color: 'w', type: 'b' }, { color: 'w', type: 'n' }, { color: 'w', type: 'p' },
  { color: 'b', type: 'k' }, { color: 'b', type: 'q' }, { color: 'b', type: 'r' },
  { color: 'b', type: 'b' }, { color: 'b', type: 'n' }, { color: 'b', type: 'p' },
];

function initEditor() {
  edChess = new Chess();
  edChess.clear();
  edTurn = 'w';
  edSelectedPiece = null;
  buildEditorUI();
}

function buildEditorUI() {
  const files = ['a','b','c','d','e','f','g','h'];
  const ranks = ['8','7','6','5','4','3','2','1'];

  document.getElementById('pz-editor-view').innerHTML = `
    <div class="pz-layout">
      <div class="board-area">
        <div class="board-wrap">
          <div class="rank-col">
            ${ranks.map(r => `<div class="rank-lbl">${r}</div>`).join('')}
          </div>
          <div>
            <div id="ed-board"></div>
            <div class="file-row">
              ${files.map(f => `<div class="file-lbl">${f}</div>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="side-panel">
        <div class="pcard">
          <div class="clbl">Pieces</div>
          <div class="piece-palette" id="ed-palette">
            ${EDITOR_PIECES.map(p => `
              <div class="pal-piece ${p.color === 'w' ? 'wp' : 'bp'}"
                   data-color="${p.color}" data-type="${p.type}"
                   onclick="selectEditorPiece('${p.color}','${p.type}')"
                   title="${p.color === 'w' ? 'White' : 'Black'} ${p.type.toUpperCase()}">
                ${SYMBOLS[p.color][p.type]}
              </div>`).join('')}
            <div class="pal-piece pal-erase" onclick="selectEditorPiece(null,null)" title="Erase">✕</div>
          </div>
        </div>
        <div class="pcard">
          <div class="clbl">Side to move</div>
          <div class="turn-toggle">
            <button class="turn-btn ${edTurn==='w'?'active':''}" onclick="setEditorTurn('w')">White</button>
            <button class="turn-btn ${edTurn==='b'?'active':''}" onclick="setEditorTurn('b')">Black</button>
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
        <div class="pcard" id="ed-status-card">
          <div class="clbl">Info</div>
          <div id="ed-status" class="psub">Click a piece, then click the board to place it. Click an occupied square to remove.</div>
        </div>
      </div>
    </div>
  `;
  renderEditorBoard();
}

function selectEditorPiece(color, type) {
  edSelectedPiece = color ? { color, type } : null;
  // Update palette highlight
  document.querySelectorAll('.pal-piece').forEach(el => {
    el.classList.toggle('pal-active',
      (el.dataset.color === color && el.dataset.type === type) ||
      (!color && el.classList.contains('pal-erase'))
    );
  });
}

function setEditorTurn(color) {
  edTurn = color;
  document.querySelectorAll('.turn-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.trim().toLowerCase()[0] === color);
  });
}

function onEditorSquareClick(sq) {
  if (!edChess) return;
  const existing = edChess.get(sq);

  if (!edSelectedPiece) {
    // Remove piece on square
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
      const files = 'abcdefgh';
      const sq = files[col] + (8 - row);
      const piece = board[row][col];
      const isLight = (row + col) % 2 === 0;
      const cls = 'sq ' + (isLight ? 'lt' : 'dk') + ' ed-sq';
      const pieceHTML = piece
        ? `<span class="piece ${piece.color === 'w' ? 'wp' : 'bp'}">${SYMBOLS[piece.color][piece.type]}</span>`
        : '';
      html += `<div class="${cls}" onclick="onEditorSquareClick('${sq}')">${pieceHTML}</div>`;
    }
  }
  boardEl.innerHTML = html;
}

function getEditorFen() {
  // Build FEN manually from board state + turn
  // chess.js .fen() on a cleared board may be invalid; use it anyway and patch turn
  let fen = edChess.fen();
  // Replace the turn portion (2nd field)
  const parts = fen.split(' ');
  parts[1] = edTurn;
  parts[2] = '-'; // castling
  parts[3] = '-'; // en passant
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
  // Launch vs-engine mode from this position
  playerColor = edTurn;
  gameMode = 'vs';
  chess = new Chess();
  chess.load(fen);
  selectedSq = null; legalTargets = []; lastMove = null;
  engineThinking = false; gameOver = false;

  document.getElementById('setup').style.display = 'none';
  document.getElementById('game').style.display = 'flex';
  document.getElementById('game').style.flexWrap = 'wrap';
  document.getElementById('game').innerHTML = '';
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
  const matingMove = findMateInOne(test);
  const puzzle = {
    id: 'custom-' + Date.now(),
    title: 'Custom Puzzle',
    type: matingMove ? 'Mate in 1' : 'Custom Position',
    diff: 2,
    fen,
    solution: matingMove ? [matingMove] : [],
    hint: matingMove ? 'There is a checkmate in one move.' : 'Analyze the position.'
  };
  pzPuzzle = null;
  showSubMode('solve');
  loadPuzzle(puzzle);
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
    .then(() => setEditorStatus('Link copied to clipboard!'))
    .catch(() => {
      // Fallback: show the URL
      setEditorStatus('Copy this link: ' + url.toString());
    });
}

function clearEditor() {
  edChess.clear();
  renderEditorBoard();
  setEditorStatus('Board cleared.');
}

function setEditorStatus(msg) {
  const el = document.getElementById('ed-status');
  if (el) el.textContent = msg;
}
