/**
 * ECO Opening Lookup
 * Loads the JeffML/eco.json database (12k+ openings) from GitHub on startup.
 * Exposes lookupOpening(fen) → { name, eco } | null
 */

const ECO_URLS = [
  'https://raw.githubusercontent.com/JeffML/eco.json/master/ecoA.json',
  'https://raw.githubusercontent.com/JeffML/eco.json/master/ecoB.json',
  'https://raw.githubusercontent.com/JeffML/eco.json/master/ecoC.json',
  'https://raw.githubusercontent.com/JeffML/eco.json/master/ecoD.json',
  'https://raw.githubusercontent.com/JeffML/eco.json/master/ecoE.json',
];

// Map<3-field-FEN, { name, eco }>
let ecoMap      = null;
let ecoReady    = false;
let ecoFailed   = false;

/**
 * Strip FEN to 3 fields (position + turn + castling), dropping en passant,
 * halfmove clock and fullmove number. This matches the key format in eco.json.
 */
function fenKey(fen) {
  return fen.split(' ').slice(0, 3).join(' ');
}

/**
 * Kick off background load. Safe to call multiple times.
 */
async function loadECO() {
  if (ecoReady || ecoFailed || ecoMap) return;
  ecoMap = new Map();

  let loaded = 0;
  const errors = [];

  await Promise.all(ECO_URLS.map(async url => {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      for (const [fen, entry] of Object.entries(data)) {
        if (entry && entry.name) {
          // Store the 3-field key. If key already exists, keep the existing
          // entry unless the new one is from the authoritative eco_tsv source.
          const key = fenKey(fen);
          const existing = ecoMap.get(key);
          if (!existing || entry.src === 'eco_tsv') {
            ecoMap.set(key, { name: entry.name, eco: entry.eco || '' });
          }
        }
      }
      loaded++;
    } catch (e) {
      errors.push(url);
    }
  }));

  if (loaded === 0) {
    ecoFailed = true;
    ecoMap = null;
  } else {
    ecoReady = true;
  }

  // Trigger an opening name refresh if a game is already in progress
  if (typeof updateOpeningName === 'function') updateOpeningName();
}

/**
 * Look up an opening by the current board FEN.
 * Returns { name, eco, displayName } or null.
 */
function lookupOpening(fen) {
  if (!ecoMap) return null;

  const key3 = fenKey(fen);
  const hit  = ecoMap.get(key3);
  if (!hit) return null;

  return {
    name:        hit.name,
    eco:         hit.eco,
    displayName: hit.eco ? `${hit.eco} — ${hit.name}` : hit.name,
  };
}

// Start loading immediately on script parse
loadECO();
