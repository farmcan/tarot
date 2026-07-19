# MiaoTarot mobile UX mocks

Standalone interactive prototypes for comparing three mobile-first directions.
They are not imported by the production application.

Open while the Vite development server is running:

- `/mobile-mocks/?variant=a` — quiet ritual
- `/mobile-mocks/?variant=b` — lightweight game table
- `/mobile-mocks/?variant=c` — cat companion

Each option supports the same complete flow:

1. Home
2. Question
3. Shuffle
4. Select three cards
5. Reveal each card
6. Read the result

For focused visual review, append `&screen=home`, `question`, `shuffle`,
`select`, `reveal`, or `result`.

Review screenshots are stored in `artifacts/mobile-ux-mocks/screenshots/`.
