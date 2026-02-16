# Backlog

<!-- Items ordered by priority, then importance. IDs are incremental, never reused. Next ID: #002 -->

### P3: Remove unnecessary z-index on published cell hover {#001}

- **discovered**: 2026-02-16, while investigating dark-mode hover jiggle
- **context**: `.marimo-cell:hover { z-index: 30 }` (Cell.css:85) applies to
  all cells including `.published`. Published cells in App view have no
  overlapping UI that needs z-index layering, so the stacking-context
  promotion is unnecessary. While not causing a bug by itself, it creates
  a surface for extension interactions (the original dark-mode hover
  jiggle report turned out to be caused by the Dark Reader extension).

  The prior plan (`../edu/edu-marimo/var/dark-mode-hover-jiggle-plan.md`)
  proposes `z-index: auto` on `.published:hover` and `@apply divide-y-0`
  on `.published`. The z-index override is the relevant part.

  Key file: `frontend/src/css/app/Cell.css` — `.published:hover` blocks
  at lines 241-244 and 318-321.

- **acceptance**:
  1. `.published:hover` sets `z-index: auto` to prevent stacking-context
     creation.
  2. Existing E2E suite passes with no regressions.
