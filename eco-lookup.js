/**
 * ECO Opening Lookup
 * Loads the JeffML/eco.json database (12k+ openings) from GitHub on startup.
 * Exposes:
 *   lookupOpening(fen)         → { name, eco, displayName } | null
 *   searchOpenings(query)      → [{ name, eco, moves }, …]  (max 10)
 */

const ECO_URLS = [
  'https://raw.githubusercontent.com/JeffML/eco.json/master/ecoA.json',
  'https://raw.githubusercontent.com/JeffML/eco.json/master/ecoB.json',
  'https://raw.githubusercontent.com/JeffML/eco.json/master/ecoC.json',
  'https://raw.githubusercontent.com/JeffML/eco.json/master/ecoD.json',
  'https://raw.githubusercontent.com/JeffML/eco.json/master/ecoE.json',
];

// Map<3-field-FEN, { name, eco, moves }>
let ecoMap      = null;
let ecoReady    = false;
let ecoFailed   = false;

// Flat array of unique openings for search — { name, eco, moves }
// One entry per unique name, keeping the most complete moves string.
let searchIndex = [];

function fenKey(fen) {
  return fen.split(' ').slice(0, 3).join(' ');
}

async function loadECO() {
  if (ecoReady || ecoFailed || ecoMap) return;
  ecoMap = new Map();

  const searchNames = new Set();
  let loaded = 0;

  await Promise.all(ECO_URLS.map(async url => {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      for (const [fen, entry] of Object.entries(data)) {
        if (!entry || !entry.name) continue;

        const key      = fenKey(fen);
        const existing = ecoMap.get(key);

        // FEN lookup map — prefer eco_tsv (authoritative source)
        if (!existing || entry.src === 'eco_tsv') {
          ecoMap.set(key, {
            name:  entry.name,
            eco:   entry.eco  || '',
            moves: entry.moves || '',
          });
        }

        // Search index — one entry per unique name, prefer entries with moves
        if (entry.moves && !searchNames.has(entry.name)) {
          searchNames.add(entry.name);
          searchIndex.push({
            name:  entry.name,
            eco:   entry.eco  || '',
            moves: entry.moves,
          });
        }
      }
      loaded++;
    } catch (e) {
      // Silent — searchIndex stays empty for this file
    }
  }));

  if (loaded === 0) {
    ecoFailed = true;
    ecoMap    = null;
  } else {
    ecoReady = true;
    // Sort search index by ECO code so results are stable
    searchIndex.sort((a, b) => a.eco.localeCompare(b.eco) || a.name.localeCompare(b.name));
  }

  if (typeof updateOpeningName === 'function') updateOpeningName();
}

/**
 * Look up an opening by FEN.
 * Returns { name, eco, displayName } or null.
 */
function lookupOpening(fen) {
  if (!ecoMap) return null;
  const hit = ecoMap.get(fenKey(fen));
  if (!hit) return null;
  return {
    name:        hit.name,
    eco:         hit.eco,
    displayName: hit.eco ? `${hit.eco} — ${hit.name}` : hit.name,
  };
}

/**
 * Full-text search across opening names.
 * Returns up to 10 matches as [{ name, eco, moves }].
 */
function searchOpenings(query) {
  if (!ecoReady || !query || query.length < 2) return [];
  const q = query.toLowerCase();
  return searchIndex.filter(e => e.name.toLowerCase().includes(q)).slice(0, 10);
}

/**
 * Convert a moves string from eco.json (e.g. "1. e4 c5 2. Nf3 d6")
 * into an array of FENs starting from the initial position.
 * Requires chess.js to be loaded.
 */
function parseMovesFen(movesStr) {
  const g    = new Chess();
  const fens = [g.fen()];
  const tokens = movesStr.split(/\s+/);
  for (const token of tokens) {
    if (!token || /^\d+\./.test(token)) continue; // skip move numbers
    if (!g.move(token)) break; // stop on invalid move
    fens.push(g.fen());
  }
  return fens;
}

loadECO();
