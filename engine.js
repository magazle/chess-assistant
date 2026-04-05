/**
 * Chess Engine — Minimax with Alpha-Beta Pruning
 * Piece-Square Tables (PST) for positional evaluation
 */

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Piece-Square Tables (white's perspective, mirrored for black)
const PST = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ],
  b: [
    -20,-10,-10,-10,-10,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5, 10, 10,  5,  0,-10,
    -10,  5,  5, 10, 10,  5,  5,-10,
    -10,  0, 10, 10, 10, 10,  0,-10,
    -10, 10, 10, 10, 10, 10, 10,-10,
    -10,  5,  0,  0,  0,  0,  5,-10,
    -20,-10,-10,-10,-10,-10,-10,-20
  ],
  r: [
     0,  0,  0,  0,  0,  0,  0,  0,
     5, 10, 10, 10, 10, 10, 10,  5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
    -5,  0,  0,  0,  0,  0,  0, -5,
     0,  0,  0,  5,  5,  0,  0,  0
  ],
  q: [
    -20,-10,-10, -5, -5,-10,-10,-20,
    -10,  0,  0,  0,  0,  0,  0,-10,
    -10,  0,  5,  5,  5,  5,  0,-10,
     -5,  0,  5,  5,  5,  5,  0, -5,
      0,  0,  5,  5,  5,  5,  0, -5,
    -10,  5,  5,  5,  5,  5,  0,-10,
    -10,  0,  5,  0,  0,  0,  0,-10,
    -20,-10,-10, -5, -5,-10,-10,-20
  ],
  k: [
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -30,-40,-40,-50,-50,-40,-40,-30,
    -20,-30,-30,-40,-40,-30,-30,-20,
    -10,-20,-20,-20,-20,-20,-20,-10,
     20, 20,  0,  0,  0,  0, 20, 20,
     20, 30, 10,  0,  0, 10, 30, 20
  ]
};

// Get PST value for a piece at a given board position
function getPST(type, color, row, col) {
  const idx = color === 'w' ? row * 8 + col : (7 - row) * 8 + col;
  return PST[type][idx];
}

// Score a move for move ordering (higher = search first)
function moveOrderScore(move) {
  let score = 0;
  if (move.captured) {
    // MVV-LVA: Most Valuable Victim, Least Valuable Attacker
    score += 10 * PIECE_VALUES[move.captured] - PIECE_VALUES[move.piece];
  }
  if (move.promotion) {
    score += PIECE_VALUES[move.promotion];
  }
  return score;
}

// Order moves: captures and promotions first
function orderMoves(moves) {
  return moves.sort((a, b) => moveOrderScore(b) - moveOrderScore(a));
}

// Static evaluation of the current board position
// Returns score from the perspective of playerColor (positive = good for player)
function evaluate(chess, playerColor) {
  if (chess.in_checkmate()) {
    return chess.turn() === playerColor ? -100000 : 100000;
  }
  if (chess.in_draw() || chess.in_stalemate() || chess.in_threefold_repetition()) {
    return 0;
  }

  let score = 0;
  chess.board().forEach((row, r) => {
    row.forEach((piece, c) => {
      if (!piece) return;
      const value = PIECE_VALUES[piece.type] + getPST(piece.type, piece.color, r, c);
      score += piece.color === playerColor ? value : -value;
    });
  });
  return score;
}

// Minimax with alpha-beta pruning
// maximizing = true when it's the engine's turn
function minimax(chess, depth, alpha, beta, maximizing, playerColor) {
  if (depth === 0 || chess.game_over()) {
    return evaluate(chess, playerColor);
  }

  const moves = orderMoves(chess.moves({ verbose: true }));

  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      chess.move(move);
      best = Math.max(best, minimax(chess, depth - 1, alpha, beta, false, playerColor));
      chess.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break; // Beta cutoff
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      chess.move(move);
      best = Math.min(best, minimax(chess, depth - 1, alpha, beta, true, playerColor));
      chess.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break; // Alpha cutoff
    }
    return best;
  }
}

// Find the best move for the engine
function getBestMove(chess, depth, playerColor) {
  const moves = orderMoves(chess.moves({ verbose: true }));
  let bestMove = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, -Infinity, Infinity, false, playerColor);
    chess.undo();
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }
  return bestMove;
}

// Static evaluation from white's perspective — used for the evaluation bar
function staticEvalWhite(chess) {
  if (chess.in_checkmate()) return chess.turn() === 'w' ? -100000 : 100000;
  if (chess.in_draw() || chess.in_stalemate() || chess.in_threefold_repetition()) return 0;
  let score = 0;
  chess.board().forEach((row, r) => {
    row.forEach((piece, c) => {
      if (!piece) return;
      const v = PIECE_VALUES[piece.type] + getPST(piece.type, piece.color, r, c);
      score += piece.color === 'w' ? v : -v;
    });
  });
  return score;
}
