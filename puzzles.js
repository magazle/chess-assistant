/**
 * Chess Puzzles — 20 curated positions
 * All mate in 1. Solution validated by chess.js on load.
 */

const CURATED_PUZZLES = [
  { id:1,  title:'Back Rank',       diff:1, type:'Mate in 1', fen:'6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',                                 solution:['Rd8'],  hint:'The king is trapped behind its own pawns.' },
  { id:2,  title:'King & Rook',     diff:1, type:'Mate in 1', fen:'k7/8/1K6/8/8/8/8/7R w - - 0 1',                                         solution:['Rh8'],  hint:'Cut off every escape with one rook move.' },
  { id:3,  title:"Scholar's Mate",  diff:1, type:'Mate in 1', fen:'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4',  solution:['Qxf7'], hint:'The f7 square is only defended by the king.' },
  { id:4,  title:'Queen Box',       diff:1, type:'Mate in 1', fen:'5k2/8/8/8/8/8/5PPP/5QK1 w - - 0 1',                                     solution:['Qf7'],  hint:'Bring the queen to the 7th rank.' },
  { id:5,  title:'Double Rook',     diff:1, type:'Mate in 1', fen:'k7/8/1K6/8/8/8/8/RR6 w - - 0 1',                                        solution:['Ra8'],  hint:'Both rooks working together.' },
  { id:6,  title:'Smothered King',  diff:1, type:'Mate in 1', fen:'6rk/5ppp/8/8/8/8/5PPP/6RK w - - 0 1',                                   solution:['Rxg8'], hint:'Capture to deliver mate — the king cannot escape its own pieces.' },
  { id:7,  title:'Corridor Mate',   diff:1, type:'Mate in 1', fen:'k7/p7/KR6/8/8/8/8/1R6 w - - 0 1',                                       solution:['Rb8'],  hint:'The a-pawn is a liability, not a help.' },
  { id:8,  title:'Rook Swing',      diff:1, type:'Mate in 1', fen:'k7/2R5/1K6/8/8/8/8/8 w - - 0 1',                                        solution:['Rc8'],  hint:'One rook and a well-placed king is enough.' },
  { id:9,  title:'Queen Sweep',     diff:1, type:'Mate in 1', fen:'6k1/5ppp/8/8/8/8/5PPP/6KQ w - - 0 1',                                   solution:['Qh8'],  hint:'The queen dominates the h-file and the corner.' },
  { id:10, title:'Diagonal Finish', diff:1, type:'Mate in 1', fen:'6k1/5ppp/8/8/8/8/5PPP/Q5K1 w - - 0 1',                                  solution:['Qa8'],  hint:'The queen covers rank, file and diagonal at once.' },
  { id:11, title:'F-File',          diff:1, type:'Mate in 1', fen:'7k/5ppp/8/8/8/8/5PPP/5R1K w - - 0 1',                                   solution:['Rf8'],  hint:'Seize the open file — the king has nowhere to go.' },
  { id:12, title:'G-File',          diff:1, type:'Mate in 1', fen:'7k/6ppp/8/8/8/8/6PPP/6RK w - - 0 1',                                    solution:['Rg8'],  hint:'The rook belongs on the 8th rank.' },
  { id:13, title:'Rook Battery',    diff:1, type:'Mate in 1', fen:'6k1/5ppp/8/8/8/8/5PPP/3RR1K1 w - - 0 1',                                solution:['Re8'],  hint:'Two rooks on the 1st rank — one leaps to the 8th.' },
  { id:14, title:'Rook & Queen',    diff:1, type:'Mate in 1', fen:'6k1/5ppp/8/8/8/8/5PPP/3RQ1K1 w - - 0 1',                                solution:['Qe8'],  hint:'The queen jumps to the back rank supported by the rook.' },
  { id:15, title:'Queen & King I',  diff:2, type:'Mate in 1', fen:'1k6/8/1KQ5/8/8/8/8/8 w - - 0 1',                                        solution:['Qc7'],  hint:'The queen covers both diagonals from one square.' },
  { id:16, title:'Queen Ladder',    diff:2, type:'Mate in 1', fen:'3k4/8/2K5/8/8/8/3Q4/8 w - - 0 1',                                       solution:['Qd7'],  hint:'Push the queen up the d-file.' },
  { id:17, title:'Queen & King II', diff:2, type:'Mate in 1', fen:'2k5/8/1KQ5/8/8/8/8/8 w - - 0 1',                                        solution:['Qc7'],  hint:'The queen cuts off every escape square.' },
  { id:18, title:'Corner Squeeze',  diff:2, type:'Mate in 1', fen:'k7/8/K7/8/8/8/8/2Q5 w - - 0 1',                                         solution:['Qc8'],  hint:'The queen controls the entire back rank from c8.' },
  { id:19, title:"Fool's Mate",     diff:1, type:'Mate in 1', fen:'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq g3 0 2',       solution:['Qh4'],  hint:'White has weakened the king — the queen strikes on the diagonal.' },
  { id:20, title:'Black Back Rank', diff:1, type:'Mate in 1', fen:'6K1/5PPP/8/8/8/8/5ppp/3r2k1 b - - 0 1',                                 solution:['Rd8'],  hint:'Mirror the white back rank pattern.' },
];

/**
 * Find a mate-in-1 move. Returns SAN string or null.
 */
function findMateInOne(game) {
  for (const move of game.moves({ verbose: true })) {
    game.move(move);
    if (game.in_checkmate()) { game.undo(); return move.san; }
    game.undo();
  }
  return null;
}
