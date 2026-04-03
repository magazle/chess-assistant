/**
 * Chess piece SVGs — custom flat set with pure white whites and strong contrast.
 * Local inline SVG only, so rendering stays consistent across platforms.
 */

function piecePalette(color) {
  const white = color === 'w';
  return {
    fill: white ? '#ffffff' : '#111111',
    stroke: '#111111',
    detail: white ? '#111111' : '#ffffff'
  };
}

function svgWrap(inner, size = 44) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="${size}" height="${size}" style="display:block;pointer-events:none">${inner}</svg>`;
}

function pawnSVG(color) {
  const { fill, stroke } = piecePalette(color);
  return svgWrap(`
    <circle cx="30" cy="14" r="7" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    <path d="M24 26c0-4.5 2.8-8 6-8s6 3.5 6 8c0 2.5-1 4.5-3.3 6.7L37 52H23l4.3-19.3C25 30.5 24 28.5 24 26z" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M21 52h18" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
  `, size = arguments[1] || 44);
}

function rookSVG(color) {
  const { fill, stroke, detail } = piecePalette(color);
  return svgWrap(`
    <path d="M18 10h5v5h4v-5h6v5h4v-5h5v9H18z" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="20" y="19" width="20" height="24" rx="1.5" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    <path d="M17 47h26v5H17z" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    <path d="M14 52h32" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M20 27h20M20 35h20" stroke="${detail}" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
  `, size = arguments[1] || 44);
}

function bishopSVG(color) {
  const { fill, stroke, detail } = piecePalette(color);
  return svgWrap(`
    <circle cx="30" cy="11" r="4" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    <path d="M30 17c8 0 12 6 12 12 0 5-2.8 9-7.2 12.8L39 52H21l4.2-10.2C20.8 38 18 34 18 29c0-6 4-12 12-12z" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M27 19l8 10" stroke="${detail}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M22 52h16" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
  `, size = arguments[1] || 44);
}

function knightSVG(color) {
  const { fill, stroke, detail } = piecePalette(color);
  return svgWrap(`
    <path d="M19 48c0-4 1.2-7.4 3.8-10.2 2.4-2.5 5.6-4.7 7.2-7.9 1.3-2.6 1-5.3-1.2-8.2l6.2-4.7c5.5 4.4 8.4 10.1 8.4 17.6V48H19z" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M27.8 22.5c-2.2-3-5.3-4.6-9.2-4.8 1.2-4.2 4.9-7.7 9.5-9l6.3 4.2-3.5 4.2" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="24" cy="18" r="1.6" fill="${detail}"/>
    <path d="M22.5 48h18" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M30.5 14.5l3.4 2.1" stroke="${detail}" stroke-width="2" stroke-linecap="round"/>
  `, size = arguments[1] || 44);
}

function queenSVG(color) {
  const { fill, stroke, detail } = piecePalette(color);
  return svgWrap(`
    <circle cx="14" cy="13" r="3" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <circle cx="24" cy="10" r="3" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <circle cx="30" cy="8" r="3" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <circle cx="36" cy="10" r="3" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <circle cx="46" cy="13" r="3" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
    <path d="M16 19l5 8 7-10 2 11 2-11 7 10 5-8 3 20H13z" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M17 43c7-2 19-2 26 0" stroke="${detail}" stroke-width="2" stroke-linecap="round" opacity="0.9"/>
    <rect x="16" y="43" width="28" height="6" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    <path d="M14 52h32" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
  `, size = arguments[1] || 44);
}

function kingSVG(color) {
  const { fill, stroke, detail } = piecePalette(color);
  return svgWrap(`
    <path d="M30 6v9" stroke="${detail}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M25.5 10.5h9" stroke="${detail}" stroke-width="2.8" stroke-linecap="round"/>
    <path d="M24 18c0-3.3 2.7-6 6-6s6 2.7 6 6c0 2.3-1.1 4.2-3.2 6.1L37 34v11H23V34l4.2-9.9C25.1 22.2 24 20.3 24 18z" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M18 50c6-3 18-3 24 0" stroke="${detail}" stroke-width="2" stroke-linecap="round" opacity="0.95"/>
    <rect x="17" y="45" width="26" height="6" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    <path d="M15 54h30" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>
  `, size = arguments[1] || 44);
}

function getPieceSVG(color, type, size = 44) {
  const factory = {
    k: kingSVG,
    q: queenSVG,
    r: rookSVG,
    b: bishopSVG,
    n: knightSVG,
    p: pawnSVG
  }[type];

  return factory ? factory(color, size) : '';
}
