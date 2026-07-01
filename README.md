# fifa26predictor

A simple, **unofficial fan-made prediction game** for the 2026 FIFA World Cup. It is just for fun — it is not affiliated with, endorsed by, or in any way official from FIFA.

Play it live on GitHub Pages, or just open `index.html` in a browser.

## What it does

- Real 2026 World Cup groups: all 12 groups (A–L), 48 real teams.
- **Group stage**: enter/predict scores for every match (or use the quick Win/Draw/Win buttons). Standings, goal difference, and points are calculated live.
- **Best 3rd-placed teams**: the 8 best third-place finishers across all 12 groups are ranked automatically once every group is complete.
- **Knockout bracket**: Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Final (+ 3rd place match). Click a team's name to pick it as the winner and advance it. Bracket slots fill in automatically as group results and earlier rounds are decided.
- **Predictions vs. real results**: every match has an "Actual result" checkbox. Use it to flag a score you've entered as the real outcome (as games are actually played) rather than just a guess — this is a manual flag/label only, since this is a static site with no live data feed.
- Everything is saved in your browser's local storage, so your bracket survives a page reload. "Reset All Predictions" clears everything.

## Notes on accuracy

- Groups are based on the official December 2025 World Cup draw.
- The Round of 32 pairing skeleton (which group winner/runner-up plays which) follows the tournament's fixed "no redraws" bracket structure.
- Slotting the 8 best third-placed teams into their Round of 32 matches uses a simplified rule (avoiding a team facing its own group's winner) rather than FIFA's full official 495-combination lookup table, since that table isn't reproduced here. Everything past that point (Round of 16 onward) follows standard sequential bracket progression.
- Tiebreakers use points → goal difference → goals for, not the full official FIFA tiebreaker rules (head-to-head, disciplinary points, etc.).

## Running it

No build step — it's plain HTML/CSS/JS:

```
index.html
style.css
js/data.js   # teams, groups, bracket structure
js/app.js    # state, standings, rendering
```

Just enable GitHub Pages on this repo (Settings → Pages → Deploy from branch) and it will serve directly.
