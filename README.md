# Chess Assistant

Motore scacchistico che gioca i tuoi pezzi mentre tu muovi quelli dell'avversario.

## Come funziona

- **Motore**: Minimax con alpha-beta pruning e Piece-Square Tables (PST)
- **Nessuna AI esterna**: tutto il calcolo avviene nel browser, zero chiamate API
- **Profondità configurabile**: da 2 (veloce) a 5 (forte, qualche secondo)

## Deploy su Vercel

1. Carica questa cartella su GitHub
2. Vai su [vercel.com](https://vercel.com) e importa il repository
3. Deploy automatico — nessuna configurazione necessaria

## Struttura

```
chess-assistant/
├── index.html      # Struttura HTML
├── style.css       # Stili dark theme
├── engine.js       # Minimax + alpha-beta + PST
├── ui.js           # Logica UI e interazione scacchiera
└── vercel.json     # Configurazione Vercel
```

## Come giocare

1. Scegli se giocare Bianco o Nero
2. Il motore muove i tuoi pezzi automaticamente
3. Tu muovi i pezzi dell'avversario (clicca il pezzo, poi la destinazione)
4. Regola la profondità con lo slider (3 = equilibrio ottimale)
