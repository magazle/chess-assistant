# Chess Assistant

A browser-based chess assistant powered by a real minimax engine. No backend, no AI, no subscription — pure JavaScript in the browser.

![Chess Assistant](https://img.shields.io/badge/built%20with-vanilla%20JS-yellow) ![License](https://img.shields.io/badge/license-MIT-blue) ![Deploy](https://img.shields.io/badge/deploy-Vercel-black)

---

## What it does

Four modes, one lightweight app:

- **Play vs Engine** — classic game against the engine, five difficulty levels
- **Opening Lab** — sandbox for studying positions and openings
- **Correspondence** — the engine plays your pieces, you move the opponent's
- **Puzzles** — build positions, add hints and solutions, share via link

---

## Game modes

### Play vs Engine
You move your pieces, the engine responds. Five difficulty levels from Beginner to Master, each combining search depth with a blunder rate that simulates how real players at that level actually make mistakes. Engine runs in a Web Worker so the interface never freezes during calculation.

### Opening Lab
A sandbox, not a formal game. Load any position via FEN or PGN, pick a side, and the engine plays your color. Navigate back and forward through moves to explore alternative lines. Useful for replaying critical moments from your own games and seeing what the engine would have done differently.

### Correspondence
The engine plays your moves. You control the opponent's pieces. Load a position via PGN or start from scratch. The name comes from correspondence chess, a format where engine assistance has been historically accepted — but the use case is yours to decide.

### Position Editor
Place pieces freely on an empty board, set the side to move, and optionally add a hint and a solution. Generate a shareable URL that includes the position, hint, and solution. Recipients see the board and can reveal hint and solution on demand via dedicated buttons.

---

## How the engine works

Built from scratch in `engine.js`, using three standard techniques:

**Minimax** — explores all move sequences up to a configurable depth, assuming the opponent always responds optimally.

**Alpha-beta pruning** — cuts branches that cannot improve on the best line already found, allowing deeper search in the same time.

**Piece-Square Tables (PST)** — positional bonus tables for each piece type. Pawns are rewarded for advancing, knights penalised on the rim, kings encouraged to stay sheltered. This gives the engine genuine positional awareness beyond material counting.

**Move ordering** — captures and promotions are searched first, which dramatically improves pruning efficiency.

**Web Worker** — in Play vs Engine mode, the search runs in a background thread. The UI stays fully responsive at all difficulty levels.

**Blunder rate** — at lower difficulty levels, the engine occasionally plays a random legal move instead of the best one. This produces realistic mistakes rather than just shallow search.

---

## Difficulty levels

| Level    | Depth | Blunder rate | Approx. strength | Time per move   |
|----------|-------|--------------|------------------|-----------------|
| Beginner | 1     | 40%          | ~400 Elo         | ~0.2s           |
| Casual   | 2     | 20%          | ~800 Elo         | ~0.5s           |
| Club     | 3     | 5%           | ~1200 Elo        | ~1s             |
| Advanced | 4     | 0%           | ~1800 Elo        | 2–5s            |
| Master   | 5     | 0%           | ~2400 Elo        | up to 15s       |

---

## Rendering & pieces

- Board rendered via CSS Grid (8×8)
- Game state managed by [chess.js](https://github.com/jhlywa/chess.js)
- Pieces rendered as local SVG files — identical across iOS, Android, and desktop, with no dependency on system fonts

```
/pieces/wK.svg  wQ.svg  wR.svg  wB.svg  wN.svg  wP.svg
        bK.svg  bQ.svg  bR.svg  bB.svg  bN.svg  bP.svg
```

---

## Tech stack

- chess.js — move generation, validation, game state
- Vanilla JavaScript — no framework, no build step
- Web Workers API — non-blocking engine computation
- CSS custom properties — theming and responsive layout
- URL-encoded state — puzzle sharing without a backend

---

## Getting started locally

```bash
git clone https://github.com/magazle/chess-assistant
cd chess-assistant
npx serve
# or just open index.html directly in any browser
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
├── engine.worker.js    # Web Worker wrapper for Play vs Engine
├── ui.js               # Game logic for vs, lab, correspondence modes
├── puzzle-mode.js      # Position editor, shared puzzle view
├── puzzles.js          # Shared chess utilities (findMateInOne)
├── pieces.js           # SVG path resolver
├── pieces/             # SVG piece assets
├── vercel.json         # Deployment config
└── README.md
```

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
