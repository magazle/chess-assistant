/**
 * Chess piece SVGs — cburnett set (Lichess, GPL licensed)
 * viewBox: 0 0 45 45 — renders identically on all platforms
 */

const PIECE_SVG_DATA = {

  // ── WHITE PIECES ──────────────────────────────────────────────────────────

  wk: `<g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 11.63V6" stroke-linejoin="miter"/>
    <path d="M20 8h5" stroke-linejoin="miter"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#fff" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-11.5-15-5.5c-3 3 4 10 4 10V37" fill="#fff"/>
    <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"/>
  </g>`,

  wq: `<g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z" stroke-linecap="butt"/>
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/>
    <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c4-1.5 17-1.5 21 0" stroke-width="1" fill="none"/>
    <circle cx="6" cy="12" r="2"/><circle cx="14" cy="9" r="2"/><circle cx="22.5" cy="8" r="2"/><circle cx="31" cy="9" r="2"/><circle cx="39" cy="12" r="2"/>
  </g>`,

  wr: `<g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M34 14l-3 3H14l-3-3"/>
    <path d="M31 17v12.5H14V17" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M31 29.5l1.5 2.5h-20l1.5-2.5"/>
    <path d="M11 14h23" fill="none" stroke-linejoin="miter"/>
  </g>`,

  wb: `<g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.5.5 1.5 1.5-8.5 3.5-20.5 3.5-29 0 0-1 1.5-1.5 1.5-1.5z" fill="#fff"/>
    <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" fill="#fff"/>
    <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" fill="#fff"/>
    <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" stroke-linejoin="miter"/>
  </g>`,

  wn: `<g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#fff"/>
    <path d="M24 18c.38 5.12-5.62 8.5-8 13.5-3.5 7.36.78 10.5 5 10.5h17.5c5 0 7-3.5 3.5-8C39 30 30 24 28 22" fill="#fff"/>
    <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#000" stroke="#000"/>
    <path d="M14.933 15.75a5 5 0 0 1-2.433 6.59A5 5 0 0 1 6.9 19.906a5 5 0 0 1 2.434-6.591 5 5 0 0 1 5.599 2.435z" fill="#fff"/>
    <path d="M24.55 10.4l-.45 1.45.5.15c3.15 1 5.65 2.49 6.9 3.95 1.25 1.46 1.35 2.91.25 4.5l.06.1L36 8.3l-2.4-3.05-3.35.65L30.1 7.1l-1.55 1.1L26.7 8l-.85 1.5z" fill="#fff"/>
  </g>`,

  wp: `<g fill="#fff" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.42 5.03L17 39h11l-1.42-12.97A6.993 6.993 0 0 0 29 21c0-2.41-1.33-4.5-3.78-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" stroke-linecap="butt"/>
  </g>`,

  // ── BLACK PIECES ──────────────────────────────────────────────────────────

  bk: `<g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 11.63V6" stroke="#fff" stroke-linejoin="miter"/>
    <path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" fill="#000" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V17s-5.5-11.5-15-5.5c-3 3 4 10 4 10V37" fill="#000"/>
    <path d="M20 8h5" stroke="#fff" stroke-linejoin="miter"/>
    <path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0" stroke="#fff"/>
  </g>`,

  bq: `<g fill="#000" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 26c8.5-1.5 21-1.5 27 0l2.5-12.5L31 25l-.3-14.1-5.2 13.6-3-14.5-3 14.5-5.2-13.6L14 25 6.5 13.5 9 26z" stroke-linecap="butt"/>
    <path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z"/>
    <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c4-1.5 17-1.5 21 0" stroke="#fff" stroke-width="1" fill="none"/>
    <circle cx="6" cy="12" r="2" fill="#000"/><circle cx="14" cy="9" r="2" fill="#000"/><circle cx="22.5" cy="8" r="2" fill="#000"/><circle cx="31" cy="9" r="2" fill="#000"/><circle cx="39" cy="12" r="2" fill="#000"/>
  </g>`,

  br: `<g fill="#000" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 39h27v-3H9v3zM12.5 32l1.5-2.5h17l1.5 2.5h-20zM12 36v-4h21v4H12z" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M14 29.5v-13h17v13H14z" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M14 16.5L11 14h23l-3 2.5H14zM11 14V9h4v2h5V9h5v2h5V9h4v5H11z" stroke-linecap="butt" stroke-linejoin="miter"/>
    <path d="M12 35.5h21M13 31.5h19M14 29.5h17M14 16.5h17M11 14h23" stroke="#fff" stroke-width="1" fill="none"/>
  </g>`,

  bb: `<g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.5.5 1.5 1.5-8.5 3.5-20.5 3.5-29 0 0-1 1.5-1.5 1.5-1.5z" fill="#000"/>
    <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" fill="#000"/>
    <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z" fill="#000"/>
    <path d="M17.5 26h10M15 30h15M22.5 15.5v5M20 18h5" stroke="#fff" stroke-linejoin="miter"/>
  </g>`,

  bn: `<g fill="none" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" fill="#000"/>
    <path d="M24 18c.38 5.12-5.62 8.5-8 13.5-3.5 7.36.78 10.5 5 10.5h17.5c5 0 7-3.5 3.5-8C39 30 30 24 28 22" fill="#000"/>
    <path d="M9.5 25.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="#fff" stroke="#fff"/>
    <path d="M14.933 15.75a5 5 0 0 1-2.433 6.59A5 5 0 0 1 6.9 19.906a5 5 0 0 1 2.434-6.591 5 5 0 0 1 5.599 2.435z" fill="#000"/>
    <path d="M24.55 10.4l-.45 1.45.5.15c3.15 1 5.65 2.49 6.9 3.95 1.25 1.46 1.35 2.91.25 4.5l.06.1L36 8.3l-2.4-3.05-3.35.65L30.1 7.1l-1.55 1.1L26.7 8l-.85 1.5z" fill="#000"/>
    <path d="M14 16.5l3 1.5-1 3 3.5-2.5-.5-2.5 2.5.5 2-2-2.5-2 1.5-2.5-2 1-3.5 2z" fill="#fff" stroke="#fff" stroke-width="0.5"/>
  </g>`,

  bp: `<g fill="#000" fill-rule="evenodd" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.42 5.03L17 39h11l-1.42-12.97A6.993 6.993 0 0 0 29 21c0-2.41-1.33-4.5-3.78-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" stroke-linecap="butt"/>
  </g>`,

};

/**
 * Returns an HTML string containing the SVG piece.
 * @param {string} color - 'w' or 'b'
 * @param {string} type  - 'k','q','r','b','n','p'
 * @param {number} size  - rendered size in px (default 44)
 */
function getPieceSVG(color, type, size = 44) {
  const key = color + type;
  const inner = PIECE_SVG_DATA[key];
  if (!inner) return '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45 45"
    width="${size}" height="${size}" style="display:block;pointer-events:none">${inner}</svg>`;
}
