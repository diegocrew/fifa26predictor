# fifa26predictor

A simple, **unofficial fan-made prediction game** for the 2026 FIFA World Cup. It is just for fun — it is not affiliated with, endorsed by, or in any way official from FIFA.

Play it live on GitHub Pages, or just open `index.html` in a browser.

## What it does

- Real 2026 World Cup groups: all 12 groups (A–L), 48 real teams.
- **Group stage**: enter/predict scores for every match (or use the quick Win/Draw/Win buttons). Standings, goal difference, and points are calculated live.
- **Best 3rd-placed teams**: the 8 best third-place finishers across all 12 groups are ranked automatically once every group is complete.
- **Knockout bracket**: Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Final (+ 3rd place match). Click a team's name to pick it as the winner and advance it. Bracket slots fill in automatically as group results and earlier rounds are decided.
- **Predictions vs. real results**: every group and every knockout round has an "Official results" toggle. Turning it on auto-fills the real scores for that group/round from `js/results.js` (where known) instead of you typing them in, and marks the card with a gold "OFFICIAL" badge so it's visually distinct from your own guesses.
- Everything is saved in your browser's local storage, so your bracket survives a page reload. "Reset All Predictions" clears everything.

## Keeping results up to date

`js/results.js` holds the real match data used by the "Official results" toggles:

- `REAL_GROUP_RESULTS[group]` — an array of 6 `{ hs, as }` scores (or `null` if not played yet), in the fixed match order `[0v1, 0v2, 0v3, 1v2, 1v3, 2v3]` against the team order in `GROUPS[g]` in `js/data.js`.
- `REAL_KO_RESULTS[matchId]` — `{ aCode, bCode, hs, as, winner, note }` for a completed knockout match. `aCode`/`bCode` pin down the actual two teams (needed for Round of 32 matches involving a third-place qualifier, since this app's own slot-assignment algorithm is a simplified approximation — see below — and isn't guaranteed to guess the same team FIFA's real draw did).

This data isn't fetched live (this is a static site with no backend) — it only updates when someone edits `results.js` with scores they've personally confirmed from an official source.