# Chess Assistant

A browser-based chess assistant powered by a real minimax engine. No backend, no AI, no subscription — pure JavaScript in the browser.

![Built with vanilla JS](https://img.shields.io/badge/built%20with-vanilla%20JS-yellow) ![License](https://img.shields.io/badge/license-MIT-blue) ![Deploy](https://img.shields.io/badge/deploy-Vercel-black)

---

## What it does

Five modes, one lightweight app:

- **vs Engine** — classic game against the engine, five difficulty levels
- **Opening Lab** — explore positions freely, engine plays the opponent, navigate back and forward through moves
- **Analysis Board** — move both sides freely, ask the engine for its best move at any moment without it being played automatically
- **Engine Pilot** — the engine plays your pieces automatically, you move the opponent's
- **Puzzles** — build any position, add a hint and solution, share via URL

---

## Game modes

### vs Engine
You move your pieces, the engine responds. Five difficulty levels from Beginner to Master, each combining search depth with a blunder rate that simulates how players at that level actually make mistakes. Engine runs in a Web Worker so the interface stays responsive at all difficulty levels.

### Opening Lab
A sandbox for studying positions and openings. Load any position via FEN or PGN, pick a side, and the engine plays the opponent. Navigate back and forward through moves to explore alternative lines. Opening names are identified in real time using a 12,000+ entry database (see Sources below).

### Analysis Board
Move both sides freely — no engine moves automatically. At any point, press "Ask engine for best move": the engine highlights the suggested move in orange on the board without playing it. The hint disappears on the next move. Useful for post-game analysis or studying specific positions.

### Engine Pilot
The engine plays your pieces automatically. You move the opponent's pieces. Built for correspondence chess and post-game analysis. The name comes from correspondence chess, a format where engine assistance has historically been tolerated by many organisations.

*I'm aware this tool can be used in other ways — I don't endorse unfair play.*

### Puzzles — Position Editor
Place pieces freely on an empty board, set the side to move, and optionally add a hint and a solution. Generate a shareable URL that encodes the position, hint, and solution as query parameters. Recipients see the board and can reveal hint and solution on demand, with no account or login required.

---

## How the engine works

Built from scratch in `engine.js`, using standard techniques from competitive chess programming:

**Minimax** — explores all move sequences up to a configurable depth, assuming the opponent always responds optimally.

**Alpha-beta pruning** — cuts branches that cannot improve on the best line already found, allowing deeper search in the same time.

**Piece-Square Tables (PST)** — positional bonus tables for each piece type. Pawns are rewarded for advancing, knights penalised on the rim, kings encouraged to stay sheltered. This gives the engine genuine positional awareness beyond material counting alone.

**Move ordering** — captures and promotions are searched first, which significantly improves pruning efficiency.

**Web Worker** — in vs Engine mode, the search runs in a background thread via `engine.worker.js`. The UI stays fully responsive at all difficulty levels, including Master.

**Blunder rate** — at lower difficulty levels, the engine occasionally plays a random legal move instead of the best one. This produces realistic mistakes rather than just shallow search.

---

## Difficulty levels

| Level | Depth | Blunder rate | Approx. strength | Time per move |
|-------|-------|--------------|-----------------|---------------|
| Beginner | 1 | 40% | ~400 Elo | ~0.2s |
| Casual | 2 | 20% | ~800 Elo | ~0.5s |
| Club | 3 | 5% | ~1200 Elo | ~1s |
| Advanced | 4 | 0% | ~1800 Elo | 2–5s |
| Master | 5 | 0% | ~2400 Elo | up to 15s |

---

## Opening detection

Opening names and ECO codes (e.g., "C42 — Petrov's Defence") are identified by looking up the current board position (FEN) against the `eco.json` database. The database is loaded asynchronously at startup from GitHub and cached in memory for the session.

The detection handles transpositions correctly: if you reach the same position via a different move order, the opening is still identified.

---

## Tech stack

- **[chess.js](https://github.com/jhlywa/chess.js)** — move generation, validation, and game state management
- **Vanilla JavaScript** — no framework, no build step
- **Web Workers API** — non-blocking engine computation in vs Engine mode
- **CSS custom properties** — theming and responsive layout
- **URL-encoded state** — puzzle sharing without a backend
- **`<details>/<summary>`** — native HTML spoiler for advanced import options

---

## Pieces

Pieces are rendered as local SVG files in the `/pieces` directory, ensuring identical rendering across iOS, Android, and desktop regardless of the system font.

```
/pieces/wK.svg  wQ.svg  wR.svg  wB.svg  wN.svg  wP.svg
        bK.svg  bQ.svg  bR.svg  bB.svg  bN.svg  bP.svg
```

---

## Getting started locally

```bash
git clone https://github.com/magazle/chess-assistant
cd chess-assistant
npx serve
# or open index.html directly in any browser
```

---

## Deploy to Vercel

1. Fork or clone this repository
2. Go to [vercel.com](https://vercel.com) and import the repo
3. Click Deploy — no configuration required

The `vercel.json` handles clean URLs automatically.

---

## Project structure

```
chess-assistant/
├── index.html          # Entry point, tab navigation, setup screens
├── style.css           # UI, layout, theming
├── engine.js           # Minimax + alpha-beta + PST + static eval
├── engine.worker.js    # Web Worker wrapper for vs Engine mode
├── ui.js               # Game logic for all play modes
├── eco-lookup.js       # ECO opening database loader and FEN lookup
├── puzzle-mode.js      # Position editor and shared puzzle view
├── puzzles.js          # Utility: findMateInOne
├── pieces.js           # SVG piece path resolver
├── pieces/             # SVG piece assets
├── vercel.json         # Deployment config
└── README.md
```

---

## Sources and acknowledgements

**Chess engine** — implemented from scratch using standard algorithms described in the [Chess Programming Wiki](https://www.chessprogramming.org). The minimax algorithm and alpha-beta pruning are canonical techniques; the Piece-Square Tables are adapted from common public implementations.

**Move generation and game state** — [chess.js](https://github.com/jhlywa/chess.js) by Jeff Hlywa, MIT licence. Chess.js handles all move legality, check/checkmate detection, FEN parsing, PGN parsing, and game state management.

**Opening database** — [@chess-openings/eco.json](https://github.com/JeffML/eco.json) by JeffML (actively maintained continuation of the original [hayatbiralem/eco.json](https://github.com/hayatbiralem/eco.json)), MIT licence. The database aggregates data from multiple sources:
- [lichess chess-openings](https://github.com/lichess-org/chess-openings) (primary/authoritative source)
- [SCID project](https://scid.sourceforge.net/) opening database by Shane Hudson
- [Wikipedia List of Chess Openings](https://en.wikipedia.org/wiki/List_of_chess_openings)
- [Wikibooks Chess Opening Theory](https://en.wikibooks.org/wiki/Chess_Opening_Theory)
- [ChessTempo](https://chesstempo.com/) opening data
- Original eco.json data compiled by Ömür Yanıkoğlu
- Additional sources: chess-graph, chronos eco.pgn, icsbot, various PGN databases

**Chess piece SVG assets** — the piece graphics are based on the cburnett set used by [Lichess](https://lichess.org), originally designed by Colin M.L. Burnett, licensed under GPL.

---

## Limitations

- Engine is intentionally lightweight — not Stockfish-level
- No game history persistence between sessions
- No PGN export
- No multiplayer
- Puzzle solve mode coming soon

---

## Why not an LLM?

LLMs generate moves statistically rather than calculating variations. They have no concept of forced sequences, material count, or tactical depth. A deterministic search engine is the correct tool for a finite, rule-based system like chess.

---

## License

MIT — free to use, modify, and deploy.

---

*Made with love by Leo — a terrible chess player who believes the best move is making things free.*
