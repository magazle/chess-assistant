// Chess Engine Web Worker
// Receives: { fen, depth, engineColor, blunderRate }
// Sends:    { from, to, san, promotion } or { from: null }

importScripts('https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js');
importScripts('./engine.js');

self.onmessage = function (e) {
  const { fen, depth, engineColor, blunderRate } = e.data;

  const game = new Chess();
  if (!game.load(fen)) { self.postMessage({ from: null }); return; }

  let best = null;

  if (blunderRate > 0 && Math.random() < blunderRate) {
    const moves = game.moves({ verbose: true });
    if (moves.length) best = moves[Math.floor(Math.random() * moves.length)];
  } else {
    best = getBestMove(game, depth, engineColor);
  }

  if (best) {
    self.postMessage({ from: best.from, to: best.to, san: best.san, promotion: best.promotion || null });
  } else {
    self.postMessage({ from: null });
  }
};
