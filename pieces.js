/**
 * Chess piece assets
 * Uses local SVG files from /pieces so rendering is consistent across platforms.
 */

const SYMBOLS = {
  w: {
    k: './pieces/wK.svg',
    q: './pieces/wQ.svg',
    r: './pieces/wR.svg',
    b: './pieces/wB.svg',
    n: './pieces/wN.svg',
    p: './pieces/wP.svg'
  },
  b: {
    k: './pieces/bK.svg',
    q: './pieces/bQ.svg',
    r: './pieces/bR.svg',
    b: './pieces/bB.svg',
    n: './pieces/bN.svg',
    p: './pieces/bP.svg'
  }
};

function getPieceSVG(color, type) {
  return SYMBOLS[color]?.[type] || '';
}
