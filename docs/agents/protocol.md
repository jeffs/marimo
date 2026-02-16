# Agent Iteration Protocol

A convention for Claude Code sessions working on marimo. Each session
consumes work from `backlog.md`, produces results, and may enqueue
newly-discovered work for future sessions.

## The backlog

`docs/agents/backlog.md` is a priority-ordered queue of work items.
It is the **single source of truth** for what needs doing.

Completed items go in `docs/agents/done.md` — a separate file so
the backlog stays small and doesn't burn context in fresh sessions.

Priority levels:

| Level | Meaning |
|-------|---------|
| P0 | Blocking — nothing else should start until these are resolved |
| P1 | High — important but doesn't block other work |
| P2 | Normal — the default for planned features and enhancements |
| P3 | Low — nice-to-haves, cleanup, speculative ideas |

Within a priority, items are ordered top-to-bottom by importance.

### Item format

Each item has a stable ID (e.g. `{#001}`) in its heading. IDs are
assigned incrementally and never reused.

```markdown
### P1: Short imperative title {#002}
- **blocked-by**: #001
- **discovered**: YYYY-MM-DD, context (e.g. "while fixing X")
- **context**: Enough detail for a cold-start session to begin work.
  Reference files, line numbers, prior plans, error messages.
- **acceptance**: What "done" looks like — specific, testable criteria.
- **notes**: (optional) Anything learned so far, failed approaches, etc.
```

The `blocked-by` field is optional. When present, it lists IDs of
items that must be completed (moved to `done.md`) before this item
can be started. An item is **unblocked** when it has no `blocked-by`
field, or all referenced IDs are in `done.md`.

## Session lifecycle

### 1. Orient (read-only)

**Start clean.** If the current jj working copy has changes
(`jj diff --stat` is non-empty), run `jj new` to create a fresh
commit before beginning new work. This prevents unrelated changes
from being folded into a previous commit.

Read `backlog.md`. Identify the highest-priority **unblocked** item
(no `blocked-by`, or all referenced IDs are in `done.md`).
If multiple P0s exist, address them in order. If none, take the
top P1, and so on.

### 2. Reproduce

Before planning or fixing anything, **confirm the problem exists**
in the current codebase. This means:

- For bugs: trigger the bug. Run the app, execute the failing
  scenario, observe the symptom. If the item describes a visual
  issue, take a screenshot or capture measurable evidence
  (bounding box coordinates, computed styles, console errors).
- For features: verify the feature is actually missing. Run the
  relevant code path and confirm the gap.
- For test failures: run the test and see it fail.

**If you can't reproduce it**, that's the finding. Update the
backlog item with what you tried and what you observed. Don't
proceed to a fix for something you haven't seen break.

Reproduction also establishes a **baseline** — the specific,
observable state you'll compare against after applying a fix.
Record this baseline in the backlog item's notes.

### 3. Plan

For non-trivial items, enter plan mode. Use **parallel exploration**
to build context quickly:

- Spawn concurrent Explore agents for independent research axes
  (e.g., one reads CSS, another reads test patterns, a third
  checks related components).
- Synthesize findings into a plan. Get user approval.

The plan should reference the reproduction from step 2: what
exactly was observed, and what the fix should change about that
observation.

### 4. Implement (with parallel agents where possible)

Fan out when work is independent; serialize when there are
data dependencies.

**Safe to parallelize:**
- Investigating unrelated files or subsystems
- Running a test suite while working on the next item
- Researching docs/patterns while drafting code

**Must serialize:**
- Editing the same file (risk of conflicting changes)
- Writing code that depends on another agent's output
- Any action with side effects on shared state

### 5. Verify

Run targeted tests for the item. If they pass, run broader checks
(`make fe-check`, `make py-check`, or relevant test suites) to
catch regressions.

Also re-run the reproduction from step 2 — the symptom you
observed should now be gone. If it isn't, the fix is incomplete.

### 6. Update the backlog

- **Completed**: Move the item from `backlog.md` to `done.md`
  with the completion date and a one-line summary of what was done.
- **Bugs discovered**: Append new items to `backlog.md` at the
  appropriate priority. P0 bugs go above all non-P0 work. Include
  enough context that the *next* session (not this one) can pick
  it up cold.
- **Partial progress**: Update the item in-place in `backlog.md`.
  Add what was learned, what was tried, what failed, and what's
  left. Never delete context.

### 7. Continue or stop

If time/context permits, loop back to step 1. Otherwise, ensure
the backlog is current and stop. The next session picks up cleanly.

## Invariant

Every session leaves `backlog.md` in a state where the next session
can start cold with zero ambient context. If an item can't be
understood without reading the conversation that produced it,
the item description is insufficient — fix it before ending.

## Anti-patterns

- **Context-switching on discovery**: Don't drop the current item to
  chase a newly-found bug. Log it to the backlog and finish what
  you started, unless it's P0 and blocks your current work.
- **Ambient context**: Don't assume the next session knows anything
  not written in the backlog or codebase.
- **Monolithic sessions**: Don't try to drain the backlog in one
  session. Do one item well, update the backlog, stop.
- **Sequential-only agents**: If three files need reading and they're
  independent, read them concurrently. Wall-clock time matters.
