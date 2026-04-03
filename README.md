# Chess Assistant

A browser-based chess assistant where a real chess engine plays your pieces while you control the opponent. No backend, no AI API calls — pure JavaScript running in the browser.

![Chess Assistant](https://img.shields.io/badge/built%20with-vanilla%20JS-yellow) ![License](https://img.shields.io/badge/license-MIT-blue) ![Deploy](https://img.shields.io/badge/deploy-Vercel-black)

---

## What it does

Chess Assistant combines multiple modes in a single lightweight app:

- **Engine Assist** — the engine plays your pieces, you play the opponent
- **Play vs Engine** — classic mode where you play against the engine
- **Puzzle Mode** — solve curated positions or create your own
- **Position Editor** — build any board and analyze or share it

The goal is to learn from engine decisions, explore positions interactively, or just play fast games without friction.

---

## Game modes

### Engine Assist
- Engine plays your side
- You control the opponent
- Ideal for learning openings and ideas

### Play vs Engine
- You play normally against the engine
- Adjustable difficulty (depth 2–5)

### Puzzle Mode
- 20 curated puzzles (mate in 1)
- Difficulty indicators (★)
- Progress tracking
- Hints and instant feedback

### Position Editor
- Place pieces freely on the board
- Choose side to move
- Convert position into:
  - playable game
  - puzzle
  - shareable link

---

## How it works

The engine is built from scratch in `engine.js` and uses three standard techniques found in competitive chess programs:

**Minimax** — the engine explores all possible move sequences up to a configurable depth, assuming the opponent always plays the best available response.

**Alpha-beta pruning** — branches that cannot possibly improve on the current best line are cut early, allowing the engine to search deeper in the same amount of time.

**Piece-Square Tables (PST)** — each piece has a positional bonus table that encodes strategic preferences: pawns are rewarded for advancing, knights are penalised on the edge of the board, the king is encouraged to stay safe. This gives the engine a positional understanding beyond pure material count.

Move ordering (captures and promotions first) improves pruning efficiency significantly.

---

## Rendering & UI

- Board rendered via **CSS Grid (8×8)**
- Game state handled by **chess.js**
- Pieces rendered using **local SVG assets** (not Unicode)

Why SVG:
- consistent across iOS, Android, desktop
- no font dependency
- full visual control

Assets live in:

/pieces/

Naming:

wK.svg, wQ.svg, wR.svg, wB.svg, wN.svg, wP.svg
bK.svg, bQ.svg, bR.svg, bB.svg, bN.svg, bP.svg

---

## Tech stack

- [chess.js](https://github.com/jhlywa/chess.js) — move generation, validation, and game state
- Vanilla JavaScript — no framework, no build step
- CSS custom properties — responsive UI and theming
- Static assets (SVG) — consistent rendering

---

## Getting started locally

```bash
git clone https://github.com/your-username/chess-assistant
cd chess-assistant
# Open index.html in any browser — no server needed
open index.html

Or run a simple local server:

npx serve


⸻

Deploy to Vercel
	1.	Fork or clone this repository
	2.	Go to https://vercel.com and import the repo
	3.	Click Deploy

No configuration required.

⸻

Engine strength

Depth	Approximate strength	Response time
2	Beginner	Instant
3 (default)	Intermediate	< 1 second
4	Advanced	2–5 seconds
5	Strong	5–15 seconds

Depth is adjustable via the UI slider.

⸻

Project structure

chess-assistant/
├── index.html        # App entry point
├── style.css         # UI and layout
├── engine.js         # Minimax + alpha-beta + PST
├── ui.js             # Main game logic and rendering
├── puzzle-mode.js    # Puzzle + editor logic
├── puzzles.js        # Puzzle dataset
├── pieces.js         # SVG resolver
├── /pieces           # SVG assets
├── vercel.json       # Deployment config
└── README.md


⸻

Limitations
	•	Engine is intentionally lightweight (not Stockfish-level)
	•	Only mate-in-1 puzzles (for now)
	•	No PGN export or game history persistence
	•	No multiplayer

⸻

Why not use AI (LLMs)?

LLMs (like ChatGPT or Claude) are poor chess players because they generate moves statistically rather than calculating variations.

This project uses a deterministic search engine instead — the correct approach for a finite, rule-based system like chess.

At depth 3–4, the engine beats most casual players. At depth 5, it reaches solid club-level strength.

⸻

Future improvements
	•	Stronger engine
	•	More puzzle types (mate in 2/3, tactics)
	•	Drag & drop pieces
	•	Mobile UX improvements
	•	Move animations

⸻

License

MIT — free to use, modify, and deploy.

