# Thought Mapper

Psych-test style app that maps how you think — one **Generate** push at a time. Offline-capable PWA (Next.js, no API keys, all data in your browser's localStorage).

## Flow
1. **Stage 0 warm-up** (10 items: pattern, verbal nuance, logic, base rates, working memory, analogy, numeric, 2 style picks) → computes a Question Fit Profile (`readingLevel`, `framingStyle`, `complexityTier`). Every question's wording is tuned to it; what's measured stays identical. One-tap **Copy Intelligence Test Export** (+ .txt/.json).
2. **Generate** serves one never-before-seen question, picked by information gain (least-covered axes, formats, triggers, current blind-spot axes; skipped topics deprioritized). Can't answer? Push Generate again — it's logged as a skip.
3. **Signal meter** → unlocks the plain-English map after ~9 answers across ≥4 formats.

## Question sources
- `BANK` in `lib/engine.ts`: 47 curated raw items (scales that capture self-claims, scenarios, forced choice, open prompts) across betrayal, power, money, ego, envy, temptation, revenge, loyalty, mortality, taboo, etc.
- `genItem(kind, n)`: deterministic parametric generators — mixed coin-flip gambles (loss aversion), sure-vs-gamble gain/loss frames, actor×breach×stakes betrayal scenarios (480 combos), calibration traps (bat-and-ball, doubling, base-rate), evidence-sampling jars, value forks. Effectively endless.
- Custom packs: Lab → paste JSON array of items; custom items are served first.

## Metrics (all deterministic)
12 axes (−1..+1), loss weight λ (midpoint between highest rejected and lowest accepted win/loss ratio), Brier score, overconfidence (mean confidence − accuracy), mean clues before deciding (JTC), 6 trigger intensities (answer intensity + latency vs your median + answer switches), claimed-vs-revealed blind spots (gap ≥ 0.6, with item citations), open-text lexicon analyzer (hedges, absolutes, causal/conditional, anger, betrayal, threat, agency vs passive, self-vs-other ratio), and an emergent compound-pattern detector. Every finding is written in plain second-person English.

## Dev
`npm install && npm test && npm run build`
