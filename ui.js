/**
 * Chess Assistant — UI
 * Modes: Play vs Engine | Opening Lab | Correspondence
 */

// ── Difficulty ───────────────────────────────────────────────────────────────

const DIFFICULTY = {
  beginner:     { depth: 1, blunder: 0.40, label: 'Beginner',  time: '~0.2s / move'    },
  casual:       { depth: 2, blunder: 0.20, label: 'Casual',    time: '~0.5s / move'    },
  club:         { depth: 3, blunder: 0.05, label: 'Club',      time: '~1s / move'      },
  advanced:     { depth: 4, blunder: 0,    label: 'Advanced',  time: '2–5s / move'     },
  master:       { depth: 5, blunder: 0,    label: 'Master',    time: 'up to 15s / move'},
};

// ── ECO Opening table ────────────────────────────────────────────────────────
// Sorted longest-first so the most specific match wins

const ECO = [
  // Ruy Lopez lines
  { m: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O', n: 'Ruy Lopez, Closed' },
  { m: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O', n: 'Ruy Lopez, Open Defence' },
  { m: 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4', n: 'Ruy Lopez, Morphy Defence' },
  { m: 'e4 e5 Nf3 Nc6 Bb5 Nf6', n: 'Ruy Lopez, Berlin Defence' },
  { m: 'e4 e5 Nf3 Nc6 Bb5 f5', n: 'Ruy Lopez, Schliemann Defence' },
  { m: 'e4 e5 Nf3 Nc6 Bb5', n: 'Ruy Lopez' },
  // Italian / Two Knights
  { m: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4', n: 'Giuoco Piano, Centre Attack' },
  { m: 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3', n: 'Giuoco Piano' },
  { m: 'e4 e5 Nf3 Nc6 Bc4 Bc5', n: 'Italian Game, Giuoco Piano' },
  { m: 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5', n: 'Italian, Fried Liver Attack' },
  { m: 'e4 e5 Nf3 Nc6 Bc4 Nf6', n: 'Italian, Two Knights Defence' },
  { m: 'e4 e5 Nf3 Nc6 Bc4', n: 'Italian Game' },
  // Scotch
  { m: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5', n: 'Scotch Game, Classical' },
  { m: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6', n: 'Scotch Game, Schmidt Variation' },
  { m: 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4', n: 'Scotch Game' },
  { m: 'e4 e5 Nf3 Nc6 d4 exd4', n: 'Scotch Game' },
  { m: 'e4 e5 Nf3 Nc6 d4', n: 'Scotch Opening' },
  // Four Knights
  { m: 'e4 e5 Nf3 Nc6 Nc3 Nf6', n: 'Four Knights Game' },
  // Petrov
  { m: 'e4 e5 Nf3 Nf6 Nxe5 d6', n: "Petrov's Defence" },
  { m: 'e4 e5 Nf3 Nf6', n: "Petrov's Defence" },
  // King's Knight
  { m: 'e4 e5 Nf3 Nc6', n: "King's Knight Opening" },
  { m: 'e4 e5 Nf3 d6', n: 'Philidor Defence' },
  { m: 'e4 e5 Nf3 f6', n: 'Damiano Defence' },
  { m: 'e4 e5 Nf3', n: "King's Knight Opening" },
  // King's Gambit
  { m: 'e4 e5 f4 exf4 Nf3 g5', n: "King's Gambit, Kieseritzky" },
  { m: 'e4 e5 f4 exf4 Bc4', n: "King's Gambit, Bishop's Gambit" },
  { m: 'e4 e5 f4 exf4', n: "King's Gambit Accepted" },
  { m: 'e4 e5 f4 d5', n: 'Falkbeer Counter-Gambit' },
  { m: 'e4 e5 f4 Bc5', n: "King's Gambit Declined, Classical" },
  { m: 'e4 e5 f4', n: "King's Gambit" },
  // Vienna
  { m: 'e4 e5 Nc3 Nf6', n: 'Vienna Game, Falkbeer Variation' },
  { m: 'e4 e5 Nc3 Bc5', n: 'Vienna Game, Classical' },
  { m: 'e4 e5 Nc3', n: 'Vienna Game' },
  // Open game fallback
  { m: 'e4 e5', n: 'Open Game' },
  // Sicilian lines
  { m: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5', n: 'Sicilian, Najdorf (English Attack)' },
  { m: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6', n: 'Sicilian, Najdorf' },
  { m: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6', n: 'Sicilian, Dragon' },
  { m: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6', n: 'Sicilian, Scheveningen' },
  { m: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3', n: 'Sicilian, Open' },
  { m: 'e4 c5 Nf3 d6 d4 cxd4 Nxd4', n: 'Sicilian, Open (d6)' },
  { m: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 d6', n: 'Sicilian, Rauzer' },
  { m: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6', n: 'Sicilian, Accelerated Dragon' },
  { m: 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4', n: 'Sicilian, Classical' },
  { m: 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6', n: 'Sicilian, Kan Variation' },
  { m: 'e4 c5 Nf3 e6 d4 cxd4 Nxd4', n: 'Sicilian, Kan / Taimanov' },
  { m: 'e4 c5 Nf3 d6', n: 'Sicilian, Open (d6)' },
  { m: 'e4 c5 Nf3 Nc6', n: 'Sicilian, Open' },
  { m: 'e4 c5 Nf3 e6', n: 'Sicilian, Open' },
  { m: 'e4 c5 Nf3', n: 'Sicilian, Open' },
  { m: 'e4 c5 c3 Nf6 e5', n: 'Sicilian, Alapin (Anti-Nimzo)' },
  { m: 'e4 c5 c3 d5 exd5', n: 'Sicilian, Alapin (d5)' },
  { m: 'e4 c5 c3', n: 'Sicilian, Alapin' },
  { m: 'e4 c5 Nc3', n: 'Sicilian, Closed' },
  { m: 'e4 c5 f4', n: 'Sicilian, Grand Prix Attack' },
  { m: 'e4 c5', n: 'Sicilian Defence' },
  // French
  { m: 'e4 e6 d4 d5 e5 c5 c3', n: 'French, Advance (Milner-Barry)' },
  { m: 'e4 e6 d4 d5 e5 c5', n: 'French, Advance Variation' },
  { m: 'e4 e6 d4 d5 e5', n: 'French, Advance Variation' },
  { m: 'e4 e6 d4 d5 Nc3 Bb4', n: 'French, Winawer Variation' },
  { m: 'e4 e6 d4 d5 Nc3 Nf6', n: 'French, Classical Variation' },
  { m: 'e4 e6 d4 d5 Nc3', n: 'French, Classical' },
  { m: 'e4 e6 d4 d5 Nd2 c5', n: 'French, Tarrasch (c5)' },
  { m: 'e4 e6 d4 d5 Nd2 Nf6', n: 'French, Tarrasch' },
  { m: 'e4 e6 d4 d5 Nd2', n: 'French, Tarrasch' },
  { m: 'e4 e6 d4 d5 exd5 exd5', n: 'French, Exchange Variation' },
  { m: 'e4 e6 d4 d5 exd5', n: 'French, Exchange Variation' },
  { m: 'e4 e6 d4 d5', n: 'French Defence' },
  { m: 'e4 e6 d4', n: 'French Defence' },
  { m: 'e4 e6', n: 'French Defence' },
  // Caro-Kann
  { m: 'e4 c6 d4 d5 e5 Bf5', n: 'Caro-Kann, Advance Variation' },
  { m: 'e4 c6 d4 d5 e5', n: 'Caro-Kann, Advance Variation' },
  { m: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5', n: 'Caro-Kann, Classical' },
  { m: 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7', n: 'Caro-Kann, Karpov Variation' },
  { m: 'e4 c6 d4 d5 Nc3 dxe4', n: 'Caro-Kann, Classical' },
  { m: 'e4 c6 d4 d5 exd5 cxd5 c4', n: 'Caro-Kann, Panov Attack' },
  { m: 'e4 c6 d4 d5 Nd2', n: 'Caro-Kann, Modern Variation' },
  { m: 'e4 c6 d4 d5 Nc3', n: 'Caro-Kann, Classical' },
  { m: 'e4 c6 d4 d5', n: 'Caro-Kann Defence' },
  { m: 'e4 c6 d4', n: 'Caro-Kann Defence' },
  { m: 'e4 c6', n: 'Caro-Kann Defence' },
  // Scandinavian
  { m: 'e4 d5 exd5 Qxd5 Nc3 Qa5', n: 'Scandinavian, Main Line' },
  { m: 'e4 d5 exd5 Qxd5 Nc3', n: 'Scandinavian Defence' },
  { m: 'e4 d5 exd5 Nf6', n: 'Scandinavian, Modern Variation' },
  { m: 'e4 d5 exd5', n: 'Scandinavian Defence' },
  { m: 'e4 d5', n: 'Scandinavian Defence' },
  // Pirc / Modern
  { m: 'e4 d6 d4 Nf6 Nc3 g6', n: 'Pirc Defence' },
  { m: 'e4 d6 d4 Nf6', n: 'Pirc Defence' },
  { m: 'e4 d6', n: 'Pirc / Robatsch Defence' },
  { m: 'e4 g6 d4 Bg7', n: 'Modern Defence' },
  { m: 'e4 g6', n: 'Modern Defence' },
  { m: 'e4 Nf6 e5 Nd5 c4', n: "Alekhine's Defence, Four Pawns Attack" },
  { m: 'e4 Nf6 e5 Nd5', n: "Alekhine's Defence" },
  { m: 'e4 Nf6', n: "Alekhine's Defence" },
  // e4 fallback
  { m: 'e4', n: "King's Pawn Opening" },
  // Queen's Gambit
  { m: 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3', n: "Queen's Gambit Declined, Orthodox" },
  { m: 'd4 d5 c4 e6 Nc3 Nf6 Bg5', n: "Queen's Gambit Declined, Classical" },
  { m: 'd4 d5 c4 e6 Nc3 Nf6', n: "Queen's Gambit Declined" },
  { m: 'd4 d5 c4 e6 Nf3 Nf6 Nc3', n: "Queen's Gambit Declined" },
  { m: 'd4 d5 c4 e6', n: "Queen's Gambit Declined" },
  { m: 'd4 d5 c4 dxc4 Nf3 Nf6', n: "Queen's Gambit Accepted" },
  { m: 'd4 d5 c4 dxc4', n: "Queen's Gambit Accepted" },
  { m: 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4', n: 'Slav, Exchange Variation' },
  { m: 'd4 d5 c4 c6 Nf3 Nf6 Nc3', n: 'Slav Defence' },
  { m: 'd4 d5 c4 c6 Nf3 Nf6', n: 'Slav Defence' },
  { m: 'd4 d5 c4 c6 Nc3', n: 'Slav Defence' },
  { m: 'd4 d5 c4 c6', n: 'Slav Defence' },
  { m: 'd4 d5 c4 Bf5', n: "Queen's Gambit, Baltic Defence" },
  { m: 'd4 d5 c4 Nf6', n: "Queen's Gambit, Marshall Defence" },
  { m: 'd4 d5 c4', n: "Queen's Gambit" },
  { m: 'd4 d5 Nf3 Nf6 c4', n: "Queen's Gambit (delayed)" },
  { m: 'd4 d5 Bf4', n: "London System" },
  { m: 'd4 d5 Nf3 Nf6 Bf4', n: "London System" },
  { m: 'd4 d5', n: "Queen's Pawn Game" },
  // Nimzo / Queen's Indian / King's Indian / Grünfeld
  { m: 'd4 Nf6 c4 e6 Nc3 Bb4 e3', n: 'Nimzo-Indian, Rubinstein' },
  { m: 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2', n: 'Nimzo-Indian, Classical' },
  { m: 'd4 Nf6 c4 e6 Nc3 Bb4', n: 'Nimzo-Indian Defence' },
  { m: 'd4 Nf6 c4 e6 Nf3 b6 g3 Bb7', n: "Queen's Indian, Fianchetto" },
  { m: 'd4 Nf6 c4 e6 Nf3 b6', n: "Queen's Indian Defence" },
  { m: 'd4 Nf6 c4 e6 Nc3', n: "Queen's Indian / Nimzo" },
  { m: 'd4 Nf6 c4 e6', n: "Queen's / Nimzo-Indian" },
  { m: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2', n: "King's Indian, Classical" },
  { m: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f4', n: "King's Indian, Four Pawns Attack" },
  { m: 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6', n: "King's Indian Defence" },
  { m: 'd4 Nf6 c4 g6 Nc3 Bg7 e4', n: "King's Indian Defence" },
  { m: 'd4 Nf6 c4 g6 Nc3 Bg7', n: "King's Indian Defence" },
  { m: 'd4 Nf6 c4 g6 Nc3', n: "King's Indian Defence" },
  { m: 'd4 Nf6 c4 g6', n: "King's Indian Defence" },
  { m: 'd4 Nf6 c4 d5 Nc3 g6', n: 'Grünfeld Defence' },
  { m: 'd4 Nf6 c4 d5 Nc3 dxc4', n: 'Grünfeld, Exchange' },
  { m: 'd4 Nf6 c4 d5 Nc3', n: 'Grünfeld Defence' },
  { m: 'd4 Nf6 c4 d5', n: 'Grünfeld / Transposition' },
  { m: 'd4 Nf6 c4 c5 d5 e6 Nc3', n: 'Modern Benoni' },
  { m: 'd4 Nf6 c4 c5 d5', n: 'Benoni Defence' },
  { m: 'd4 Nf6 c4', n: 'Indian Defence' },
  { m: 'd4 Nf6 Nf3 g6 c4', n: "King's Indian (Transposition)" },
  { m: 'd4 Nf6 Nf3 e6 c4', n: "Queen's Indian (Transposition)" },
  { m: 'd4 Nf6 Nf3 d5 c4', n: "Queen's Gambit (Transposition)" },
  { m: 'd4 Nf6 Bf4', n: 'London System' },
  { m: 'd4 Nf6 Nf3 Nf6', n: "Queen's Pawn Game" },
  { m: 'd4 Nf6', n: 'Indian Defence' },
  // Dutch / other d4
  { m: 'd4 f5 c4 Nf6 g3', n: 'Dutch, Leningrad' },
  { m: 'd4 f5 c4 e6', n: 'Dutch, Classical' },
  { m: 'd4 f5 Nf3 Nf6 g3', n: 'Dutch, Leningrad' },
  { m: 'd4 f5', n: 'Dutch Defence' },
  { m: 'd4 e6 c4', n: "Queen's Gambit / Nimzo Transposition" },
  { m: 'd4 e5', n: 'Englund Gambit' },
  { m: 'd4', n: "Queen's Pawn Opening" },
  // English
  { m: 'c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2', n: 'English, Reversed Dragon' },
  { m: 'c4 e5 Nc3 Nf6', n: "English, King's English" },
  { m: 'c4 e5 Nc3 Nc6', n: "English, Four Knights" },
  { m: 'c4 e5', n: "English, King's English" },
  { m: 'c4 Nf6 Nc3 d5', n: 'English, Anglo-Grünfeld' },
  { m: 'c4 Nf6 Nc3 e6', n: 'English, Agincourt' },
  { m: 'c4 Nf6', n: 'English, Anglo-Indian' },
  { m: 'c4 c5 Nf3 Nf6 Nc3 Nc6', n: 'English, Symmetrical Four Knights' },
  { m: 'c4 c5 Nf3 Nf6', n: 'English, Symmetrical' },
  { m: 'c4 c5', n: 'English, Symmetrical' },
  { m: 'c4 d5 cxd5', n: 'English Opening, Anglo-Scandinavian' },
  { m: 'c4', n: 'English Opening' },
  // Réti
  { m: 'Nf3 d5 c4 d4', n: 'Réti, Advance Variation' },
  { m: 'Nf3 d5 c4 e6 g3', n: 'Réti, Catalan formation' },
  { m: 'Nf3 d5 c4', n: 'Réti Opening' },
  { m: 'Nf3 Nf6 c4 g6', n: "Réti, King's Indian transposition" },
  { m: 'Nf3 Nf6 c4', n: 'Réti, Anglo-Indian' },
  { m: 'Nf3 d5 g3', n: "Réti, King's Indian Attack" },
  { m: 'Nf3', n: 'Réti Opening' },
  // Misc
  { m: 'g3 d5 Bg2', n: "King's Fianchetto" },
  { m: 'g3', n: "King's Fianchetto Opening" },
  { m: 'b3 e5 Bb2', n: 'Nimzo-Larsen Attack' },
  { m: 'b3', n: 'Nimzo-Larsen Attack' },
  { m: 'b4 e5', n: 'Polish Opening, Outflank Variation' },
  { m: 'b4', n: 'Polish Opening' },
  { m: 'f4 d5 Nf3', n: "Bird's Opening, Dutch Variation" },
  { m: 'f4', n: "Bird's Opening" },
  { m: 'a3', n: 'Anderssen Opening' },
  { m: 'a4', n: 'Ware Opening' },
].sort((a, b) => b.m.length - a.m.length);

function detectOpening(chess) {
  const movesStr = chess.history().join(' ');
  if (!movesStr) return null;
  for (const entry of ECO) {
    if (movesStr === entry.m || movesStr.startsWith(entry.m + ' ')) return entry.n;
  }
  return null;
}

function updateOpeningName() {
  const el = document.getElementById('opening-name');
  if (!el) return;
  const name = detectOpening(chess);
  el.textContent = name || (chess.history().length ? 'Unknown opening' : 'Starting position');
  el.style.color  = name ? 'var(--text)' : 'var(--text3)';
}

// ── Shared state ─────────────────────────────────────────────────────────────

let chess          = null;
let playerColor    = null;
let gameMode       = null;
let selectedSq     = null;
let legalTargets   = [];
let lastMove       = null;
let engineThinking = false;
let gameOver       = false;

let currentDifficulty = 'club';
let engineWorker      = null;

let labHistory = [];
let labIndex   = 0;

// Promotion state
let pendingPromoFrom = null;
let pendingPromoTo   = null;

// ── Game start ────────────────────────────────────────────────────────────────

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

  if (mode === 'lab') { labHistory = [chess.fen()]; labIndex = 0; }

  document.getElementById('setup').style.display = 'none';
  const gameEl = document.getElementById('game');
  gameEl.style.display = 'flex';
  gameEl.style.flexWrap = 'wrap';
  gameEl.innerHTML = '';
  buildGameUI();
  renderBoard();
  updateEvalBar();
  if (mode === 'lab') updateOpeningName();

  if (chess.turn() === getEngineColor()) triggerEngine();
  return true;
}

function loadPGNAndStart(color, mode) {
  const pgn = (document.getElementById('pgn-' + mode) || {}).value || '';
  const fen = (document.getElementById('fen-' + mode) || {}).value || '';

  if (pgn.trim()) {
    const temp = new Chess();
    if (!temp.load_pgn(pgn.trim())) { markInputError('pgn-' + mode); return; }
    const moves = temp.history({ verbose: true });
    const g = new Chess();
    const fens = [g.fen()];
    for (const m of moves) { g.move(m); fens.push(g.fen()); }
    if (!startGame(color, mode, fens[fens.length - 1])) return;
    if (mode === 'lab') { labHistory = fens; labIndex = fens.length - 1; updateNavButtons(); updateOpeningName(); }
    return;
  }

  if (fen.trim()) { if (!startGame(color, mode, fen.trim())) markInputError('fen-' + mode); return; }
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

// ── Color helpers ─────────────────────────────────────────────────────────────

function getEngineColor() {
  if (gameMode === 'vs')             return playerColor === 'w' ? 'b' : 'w';
  if (gameMode === 'lab')            return playerColor === 'w' ? 'b' : 'w'; // engine plays OPPONENT
  if (gameMode === 'correspondence') return playerColor;                      // engine plays YOUR pieces
  return null;
}

function getHumanColor() {
  if (gameMode === 'vs')             return playerColor;
  if (gameMode === 'lab')            return playerColor;                      // human moves OWN pieces
  if (gameMode === 'correspondence') return playerColor === 'w' ? 'b' : 'w';
  return playerColor;
}

// ── UI ────────────────────────────────────────────────────────────────────────

function buildGameUI() {
  const gameEl = document.getElementById('game');
  const ranks = playerColor === 'w' ? ['8','7','6','5','4','3','2','1'] : ['1','2','3','4','5','6','7','8'];
  const files = playerColor === 'w' ? ['a','b','c','d','e','f','g','h'] : ['h','g','f','e','d','c','b','a'];
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
      ${gameMode === 'lab' ? `
      <div class="pcard">
        <div class="clbl">Opening</div>
        <div id="opening-name" style="font-size:13px;font-weight:600;color:var(--text3)">Starting position</div>
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
  let score = staticEvalWhite(chess);
  const CAP = 1200;
  score = Math.max(-CAP, Math.min(CAP, score));
  bar.style.height = (50 + (score / CAP) * 50) + '%';
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

// ── Interaction ───────────────────────────────────────────────────────────────

function onSquareClick(sq) {
  if (engineThinking || gameOver) return;
  const humanColor = getHumanColor();
  if (chess.turn() !== humanColor) return;
  const piece = chess.get(sq);

  if (!selectedSq) {
    if (piece && piece.color === humanColor) {
      selectedSq = sq;
      legalTargets = chess.moves({ square: sq, verbose: true }).map(m => m.to);
      renderBoard();
    }
    return;
  }

  if (legalTargets.includes(sq)) {
    // Check if this is a pawn promotion
    const movingPiece = chess.get(selectedSq);
    const isPromotion = movingPiece && movingPiece.type === 'p' &&
      ((movingPiece.color === 'w' && sq[1] === '8') ||
       (movingPiece.color === 'b' && sq[1] === '1'));

    if (isPromotion) {
      pendingPromoFrom = selectedSq;
      pendingPromoTo   = sq;
      selectedSq   = null;
      legalTargets = [];
      renderBoard();
      showPromotionPicker(movingPiece.color);
      return;
    }

    const move = chess.move({ from: selectedSq, to: sq, promotion: 'q' });
    if (move) {
      lastMove = { from: move.from, to: move.to };
      selectedSq = null; legalTargets = [];
      if (gameMode === 'lab') { labHistory = labHistory.slice(0, labIndex + 1); labHistory.push(chess.fen()); labIndex++; }
      renderBoard(); updateEvalBar();
      if (gameMode === 'lab') updateOpeningName();
      if (chess.game_over()) { gameOver = true; setTimeout(showGameOverBanner, 400); }
      else triggerEngine();
      return;
    }
  }

  if (piece && piece.color === humanColor) { selectedSq = sq; legalTargets = chess.moves({ square: sq, verbose: true }).map(m => m.to); }
  else { selectedSq = null; legalTargets = []; }
  renderBoard();
}

// ── Engine ────────────────────────────────────────────────────────────────────

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
      if (from) { const r = chess.move({ from, to, promotion: promotion || 'q' }); if (r) lastMove = { from: r.from, to: r.to }; }
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
  const depth = DIFFICULTY[currentDifficulty].depth;
  const blund = DIFFICULTY[currentDifficulty].blunder;
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
  if (gameMode === 'lab') updateOpeningName();
  if (chess.game_over()) { gameOver = true; setTimeout(showGameOverBanner, 400); }
}

// ── Opening Lab navigation ────────────────────────────────────────────────────

function labGoBack() {
  if (labIndex <= 0) return;
  labIndex--;
  chess.load(labHistory[labIndex]);
  lastMove = null; selectedSq = null; legalTargets = []; gameOver = false;
  renderBoard(); updateEvalBar(); updateOpeningName();
}

function labGoForward() {
  if (labIndex >= labHistory.length - 1) return;
  labIndex++;
  chess.load(labHistory[labIndex]);
  lastMove = null; selectedSq = null; legalTargets = [];
  renderBoard(); updateEvalBar(); updateOpeningName();
}

function updateNavButtons() {
  if (gameMode !== 'lab') return;
  const back = document.getElementById('btn-back');
  const fwd  = document.getElementById('btn-fwd');
  if (back) back.disabled = labIndex <= 0;
  if (fwd)  fwd.disabled  = labIndex >= labHistory.length - 1;
}

// ── Status & history ──────────────────────────────────────────────────────────

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
  const wIsEngine = gameMode === 'vs' ? playerColor === 'b' : gameMode === 'correspondence' ? playerColor === 'w' : false;
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
    const ec = getEngineColor();
    const engineWon = winner === ec;
    if (gameMode === 'vs')             { cls = engineWon ? 'lose' : 'win'; title = engineWon ? 'Defeat' : 'Victory!'; }
    else if (gameMode === 'correspondence') { cls = engineWon ? 'win' : 'lose'; title = engineWon ? 'Victory!' : 'Defeat'; }
    else                               { cls = 'win'; title = 'Checkmate!'; }
    sub = 'Checkmate';
  } else if (chess.in_stalemate())          { sub = 'Stalemate'; }
  else if (chess.in_threefold_repetition()) { sub = 'Threefold repetition'; }
  else if (chess.insufficient_material())   { sub = 'Insufficient material'; }
  slot.innerHTML = `<div class="game-over ${cls}"><h3>${title}</h3><p>${sub}</p></div>`;
}

// ── Promotion picker ──────────────────────────────────────────────────────────

function showPromotionPicker(color) {
  const pieces = ['q','r','b','n'];
  const overlay = document.createElement('div');
  overlay.className = 'promo-overlay';
  overlay.id = 'promo-overlay';
  overlay.innerHTML = `
    <div class="promo-box">
      <span class="clbl">Promote pawn to</span>
      <div class="promo-pieces">
        ${pieces.map(p => `
          <div class="promo-piece" onclick="completePromotion('${p}')">
            <img src="${getPieceSVG(color, p)}" alt="${p}">
          </div>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function completePromotion(piece) {
  const overlay = document.getElementById('promo-overlay');
  if (overlay) overlay.remove();
  if (!pendingPromoFrom || !pendingPromoTo) return;

  const move = chess.move({ from: pendingPromoFrom, to: pendingPromoTo, promotion: piece });
  pendingPromoFrom = null;
  pendingPromoTo   = null;

  if (move) {
    lastMove = { from: move.from, to: move.to };
    if (gameMode === 'lab') { labHistory = labHistory.slice(0, labIndex + 1); labHistory.push(chess.fen()); labIndex++; }
    renderBoard(); updateEvalBar();
    if (gameMode === 'lab') updateOpeningName();
    if (chess.game_over()) { gameOver = true; setTimeout(showGameOverBanner, 400); }
    else triggerEngine();
  }
}

// ── Difficulty ────────────────────────────────────────────────────────────────

const DIFF_LEVELS = ['beginner','casual','club','advanced','master'];

function setDifficultyByIndex(idx) {
  currentDifficulty = DIFF_LEVELS[idx] || 'club';

  // Sync all sliders to same position
  document.querySelectorAll('.diff-slider').forEach(s => { s.value = idx; });

  // Update tick label highlights for every slider wrap
  document.querySelectorAll('.diff-tick-row').forEach(row => {
    row.querySelectorAll('.diff-tick-lbl').forEach((lbl, i) => {
      lbl.classList.toggle('active', i === idx);
    });
  });
}

// Keep old name for any legacy calls
function setDifficulty(level) {
  const idx = DIFF_LEVELS.indexOf(level);
  if (idx >= 0) setDifficultyByIndex(idx);
}
