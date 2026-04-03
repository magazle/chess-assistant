# Chess Assistant

A browser-based chess assistant where a real chess engine plays your pieces while you control the opponent. No backend, no AI API calls — pure JavaScript running in the browser.

![Chess Assistant](https://img.shields.io/badge/built%20with-vanilla%20JS-yellow) ![License](https://img.shields.io/badge/license-MIT-blue) ![Deploy](https://img.shields.io/badge/deploy-Vercel-black)

---

## What it does

You pick a side (White or Black). The engine plays your pieces using minimax search with alpha-beta pruning. You move the opponent's pieces manually. The goal is to learn from a strong engine playing on your behalf, or just to watch the engine work.

---

## How it works

The engine is built from scratch in `engine.js` and uses three standard techniques found in competitive chess programs:

**Minimax** — the engine explores all possible move sequences up to a configurable depth, assuming the opponent always plays the best available response.

**Alpha-beta pruning** — branches that cannot possibly improve on the current best line are cut early, allowing the engine to search deeper in the same amount of time.

**Piece-Square Tables (PST)** — each piece has a positional bonus table that encodes strategic preferences: pawns are rewarded for advancing, knights are penalised on the edge of the board, the king is encouraged to stay safe. This gives the engine a positional understanding beyond pure material count.

Move ordering (captures and promotions first) improves pruning efficiency significantly.

---

## Tech stack

- [chess.js](https://github.com/jhlywa/chess.js) — move generation, validation, and game state
- Vanilla JavaScript — no framework, no build step
- CSS custom properties — light/dark adaptive styling

---

## Getting started locally

```bash
git clone https://github.com/your-username/chess-assistant
cd chess-assistant
# Open index.html in any browser — no server needed
open index.html
```

---

## Deploy to Vercel

1. Fork or clone this repository to your GitHub account
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Click Deploy — no configuration required

Vercel detects it as a static site automatically. The `vercel.json` file handles clean URLs.

---

## Engine strength

| Depth | Approximate strength | Response time |
|-------|---------------------|---------------|
| 2 | Beginner | Instant |
| 3 (default) | Intermediate | < 1 second |
| 4 | Advanced | 2-5 seconds |
| 5 | Strong | 5-15 seconds |

Depth is adjustable via the slider in the sidebar during a game.

---

## Project structure

```
chess-assistant/
├── index.html      # HTML shell
├── style.css       # Dark theme, responsive layout
├── engine.js       # Minimax + alpha-beta + PST evaluation
├── ui.js           # Board rendering and user interaction
├── vercel.json     # Vercel static site config
└── README.md
```

---

## Limitations

LLMs (like ChatGPT or Claude) are poor chess players because they generate moves statistically rather than calculating variations. This project uses a deterministic search engine instead, which is the correct approach for a game with well-defined rules and a finite state space.

At depth 3-4, the engine will comfortably beat most casual players. At depth 5 it plays solid club-level chess.

---

## License

MIT — free to use, modify, and deploy.
