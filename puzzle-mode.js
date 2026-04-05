/**
 * Position Editor — Create, annotate and share positions.
 * hint and solution are encoded in the shared URL.
 */

let edChess         = null;
let edSelectedPiece = null;
let edTurn          = 'w';
let edHint          = '';
let edSolution      = '';

const PIECE_TYPES = ['k','q','r','b','n','p'];

function pieceImgHTML(color, type, cls = 'piece') {
  return `<img class="${cls}" src="${getPieceSVG(color, type)}" alt="" draggable="false">`;
}

// ── Entry ────────────────────────────────────────────────────────────────────

function startEditorMode() {
  edChess = new Chess(); edChess.clear();
  edTurn = 'w'; edSelectedPiece = null; edHint = ''; edSolution = '';

  const params   = new URLSearchParams(window.location.search);
  const fen      = params.get('puzzle');
  const hint     = params.get('hint');
  const solution = params.get('solution');
  let isShared   = false;

  if (fen) {
    const test = new Chess();
    if (test.load(fen)) { edChess.load(fen); edTurn = fen.split(' ')[1] || 'w'; isShared = true; }
    edHint     = hint     || '';
    edSolution = solution || '';
    const url = new URL(window.location);
    ['puzzle','hint','solution'].forEach(k => url.searchParams.delete(k));
    history.replaceState({}, '', url);
  }

  document.getElementById('setup').style.display = 'none';
  const gameEl = document.getElementById('game');
  gameEl.style.display = 'block'; gameEl.innerHTML = '';

  if (isShared && (edHint || edSolution)) buildSharedView();
  else buildEditorUI();
}

function exitEditorMode() {
  edChess = null;
  document.getElementById('game').style.display = 'none';
  document.getElementById('game').innerHTML = '';
  document.getElementById('setup').style.display = 'block';
}

// ── Shared puzzle view (recipient) ───────────────────────────────────────────

function buildSharedView() {
  const ranks = ['8','7','6','5','4','3','2','1'];
  const files = ['a','b','c','d','e','f','g','h'];

  document.getElementById('game').innerHTML = `
    <div class="pz-layout">
      <div class="board-area">
        <div class="board-wrap">
          <div class="rank-col">${ranks.map(r=>`<div class="rank-lbl">${r}</div>`).join('')}</div>
          <div>
            <div id="ed-board"></div>
            <div class="file-row">${files.map(f=>`<div class="file-lbl">${f}</div>`).join('')}</div>
          </div>
        </div>
      </div>
      <div class="side-panel">
        <div class="pcard">
          <div class="clbl">Shared puzzle</div>
          <div class="pname" style="font-size:14px">${edTurn === 'w' ? 'White' : 'Black'} to move</div>
        </div>
        ${edHint ? `
        <div class="pcard">
          <div class="clbl">Hint</div>
          <div id="hint-reveal" style="display:none" class="psub">${edHint}</div>
          <button class="pz-btn" id="hint-btn" onclick="document.getElementById('hint-reveal').style.display='block';this.style.display='none'">Reveal hint</button>
        </div>` : ''}
        ${edSolution ? `
        <div class="pcard">
          <div class="clbl">Solution</div>
          <div id="sol-reveal" style="display:none" class="psub" style="font-family:var(--font-mono)">${edSolution}</div>
          <button class="pz-btn" id="sol-btn" onclick="document.getElementById('sol-reveal').style.display='block';this.style.display='none'">Reveal solution</button>
        </div>` : ''}
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="pz-btn primary" onclick="playEditorPosition()">Play this position</button>
          <button class="pz-btn" onclick="buildEditorUI();renderEditorBoard()">Edit position</button>
        </div>
        <button class="new-game-btn" onclick="exitEditorMode()">↩ Back to menu</button>
      </div>
    </div>`;

  renderEditorBoard(true);
}

// ── Editor UI ────────────────────────────────────────────────────────────────

function buildEditorUI() {
  const ranks = ['8','7','6','5','4','3','2','1'];
  const files = ['a','b','c','d','e','f','g','h'];

  document.getElementById('game').innerHTML = `
    <div class="pz-layout">
      <div class="board-area">
        <div class="board-wrap">
          <div class="rank-col">${ranks.map(r=>`<div class="rank-lbl">${r}</div>`).join('')}</div>
          <div>
            <div id="ed-board"></div>
            <div class="file-row">${files.map(f=>`<div class="file-lbl">${f}</div>`).join('')}</div>
          </div>
        </div>
      </div>
      <div class="side-panel">
        <div class="pcard">
          <div class="clbl">Pieces</div>
          <div class="piece-palette">
            ${PIECE_TYPES.map(t=>`<div class="pal-piece" data-color="w" data-type="${t}" onclick="selectEditorPiece('w','${t}')">${pieceImgHTML('w',t,'pal-piece-img')}</div>`).join('')}
            <div class="pal-spacer"></div>
            ${PIECE_TYPES.map(t=>`<div class="pal-piece" data-color="b" data-type="${t}" onclick="selectEditorPiece('b','${t}')">${pieceImgHTML('b',t,'pal-piece-img')}</div>`).join('')}
            <button class="pal-erase-btn" id="pal-erase-btn" onclick="selectEditorPiece(null,null)">✕ Erase</button>
          </div>
        </div>
        <div class="pcard">
          <div class="clbl">Side to move</div>
          <div class="turn-toggle">
            <button class="turn-btn ${edTurn==='w'?'active':''}" id="turn-w" onclick="setEditorTurn('w')">White</button>
            <button class="turn-btn ${edTurn==='b'?'active':''}" id="turn-b" onclick="setEditorTurn('b')">Black</button>
          </div>
        </div>
        <div class="pcard">
          <div class="clbl">Hint <span class="opt-label">(optional)</span></div>
          <textarea id="ed-hint" class="ed-textarea" rows="2" placeholder="e.g. Look for a back rank weakness…" oninput="edHint=this.value">${edHint}</textarea>
        </div>
        <div class="pcard">
          <div class="clbl">Solution <span class="opt-label">(optional)</span></div>
          <textarea id="ed-solution" class="ed-textarea" rows="2" placeholder="e.g. 1. Rd8+ Rxd8 2. Rxd8#" oninput="edSolution=this.value">${edSolution}</textarea>
        </div>
        <div class="pcard">
          <div class="clbl">Actions</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="pz-btn primary" onclick="playEditorPosition()">Play this position</button>
            <button class="pz-btn" onclick="copyShareLink()">Copy share link</button>
            <button class="pz-btn" onclick="clearEditor()">Clear board</button>
          </div>
        </div>
        <div class="pcard"><div id="ed-status" class="psub">Select a piece, then click the board to place it.</div></div>
        <button class="new-game-btn" onclick="exitEditorMode()">↩ Back to menu</button>
      </div>
    </div>`;

  renderEditorBoard();
}

// ── Board ────────────────────────────────────────────────────────────────────

function selectEditorPiece(color, type) {
  edSelectedPiece = color ? { color, type } : null;
  document.querySelectorAll('.pal-piece').forEach(el => {
    el.classList.toggle('pal-active',
      el.dataset.color === color && el.dataset.type === type);
  });
  const eraseBtn = document.getElementById('pal-erase-btn');
  if (eraseBtn) eraseBtn.classList.toggle('pal-active', !color);
}

function setEditorTurn(color) {
  edTurn = color;
  const w = document.getElementById('turn-w');
  const b = document.getElementById('turn-b');
  if (w) w.classList.toggle('active', color === 'w');
  if (b) b.classList.toggle('active', color === 'b');
}

function onEditorSquareClick(sq) {
  if (!edChess) return;
  const existing = edChess.get(sq);
  if (!edSelectedPiece) { if (existing) { edChess.remove(sq); renderEditorBoard(); } return; }
  if (existing) edChess.remove(sq);
  edChess.put({ type: edSelectedPiece.type, color: edSelectedPiece.color }, sq);
  renderEditorBoard();
}

function renderEditorBoard(readOnly = false) {
  const el = document.getElementById('ed-board');
  if (!el || !edChess) return;
  const board = edChess.board();
  let html = '';
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const sq    = 'abcdefgh'[col] + (8 - row);
      const piece = board[row][col];
      const lt    = (row + col) % 2 === 0;
      const ph    = piece ? pieceImgHTML(piece.color, piece.type, 'piece') : '';
      const click = readOnly ? '' : `onclick="onEditorSquareClick('${sq}')"`;
      html += `<div class="sq ${lt?'lt':'dk'}${readOnly?'':' ed-sq'}" ${click}>${ph}</div>`;
    }
  }
  el.innerHTML = html;
}

// ── Actions ──────────────────────────────────────────────────────────────────

function getEditorFen() {
  const parts = edChess.fen().split(' ');
  parts[1] = edTurn; parts[2] = '-'; parts[3] = '-'; parts[4] = '0'; parts[5] = '1';
  return parts.join(' ');
}

function playEditorPosition() {
  const fen  = getEditorFen();
  const test = new Chess();
  if (!test.load(fen)) { setEditorStatus('Invalid position — both kings must be present.'); return; }
  startGame(edTurn, 'vs', fen);
}

function copyShareLink() {
  const fen  = getEditorFen();
  const test = new Chess();
  if (!test.load(fen)) { setEditorStatus('Invalid position — cannot share.'); return; }
  const url = new URL(window.location.href);
  url.searchParams.set('puzzle', fen);
  const h = (document.getElementById('ed-hint') || {}).value || edHint;
  const s = (document.getElementById('ed-solution') || {}).value || edSolution;
  if (h.trim()) url.searchParams.set('hint', h.trim());
  if (s.trim()) url.searchParams.set('solution', s.trim());
  navigator.clipboard.writeText(url.toString())
    .then(() => setEditorStatus('Link copied to clipboard!'))
    .catch(() => setEditorStatus('Copy this link: ' + url.toString()));
}

function clearEditor() { edChess.clear(); renderEditorBoard(); setEditorStatus('Board cleared.'); }
function setEditorStatus(msg) { const el = document.getElementById('ed-status'); if (el) el.textContent = msg; }
