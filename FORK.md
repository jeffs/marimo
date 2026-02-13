# Custom Fork

The `custom` branch carries local changes on top of `upstream/main`,
for use as a git dependency in downstream projects (e.g. edu-marimo).

Built frontend assets are committed to `custom` so that `pip install`
/ `uv sync` from the git URL works without a Node.js build step.

## Using this fork

In your project's `pyproject.toml`:

```toml
"marimo[sql] @ git+https://github.com/jeffs/marimo.git@custom",
```

Then `uv sync`.

## Current changes

### Dark-mode hover fix

**File:** `frontend/src/css/app/Cell.css`

In dark-mode app view, hovering over a published cell adds a 1px
border that causes layout jiggle.  Three rules are relevant, all at
specificity 0,3,0:

| Selector                       | Effect                            |
|:-------------------------------|:----------------------------------|
| `.marimo-cell.published:hover` | `border: none`                    |
| `.dark .marimo-cell:hover`     | `border: 1px solid var(--gray-9)` |
| `.dark .marimo-cell.published` | `border: none`                    |

At equal specificity the last rule in source order wins, so the dark
hover border overrides the published suppression.  Fix: add a
`.dark .marimo-cell.published:hover` rule.

### Default to system theme

**Files:** `marimo/_config/config.py`,
`frontend/src/core/config/config-schema.ts`

Changes the default theme from `"light"` to `"system"` so new
notebooks follow the OS dark/light preference.

## Repo layout

Two kinds of bookmarks:

| Bookmark | Purpose |
|:---------|:--------|
| `fix-dark-hover`, `default-system-theme`, ... | One per change, branching from `upstream/main`; used for upstream PRs |
| `custom` | All custom changes stacked on `upstream/main`; tip of the stack includes built frontend assets |

## Making a new change

```sh
jj git fetch --remote upstream

# Create the fix
jj new upstream/main
# ... edit ...
jj describe -m 'fix: description'
jj bookmark create fix-name -r @

# Stack it into custom
jj rebase -b custom -d fix-name
# Or if adding on top of an existing stack:
#   jj new <tip-of-stack>
#   ... edit ...
#   jj bookmark set custom -r @
```

## Building frontend assets

The `custom` branch tip must always include built `_static/` so
git-based installs work.  Rebuild after every change that touches
frontend code, and after every rebase onto upstream:

```sh
pnpm install
./scripts/buildfrontend.sh
```

The `.gitignore` on `custom` un-ignores `marimo/_static/` so jj
tracks the build output.

## Syncing with upstream

```sh
jj git fetch --remote upstream
jj rebase -b custom -d upstream/main
```

If a fix has been merged upstream, drop it:

```sh
jj abandon <change-id-of-merged-fix>
jj rebase -b custom -d upstream/main
```

Then rebuild and push:

```sh
pnpm install
./scripts/buildfrontend.sh
jj git push --bookmark custom
```

In downstream projects:

```sh
uv lock --upgrade-package marimo && uv sync
```

## Sending fixes upstream

Push individual fix bookmarks and open PRs against `marimo-team/marimo`:

```sh
jj git push --bookmark fix-name
gh pr create --repo marimo-team/marimo \
  --title 'Fix: description' \
  --body '...'
```

All PRs require signing the CLA.  The bot will prompt you; comment
"I have read the CLA Document and I hereby sign the CLA" on the PR.

## Retiring the fork

Once all custom changes are merged upstream or no longer needed,
revert downstream `pyproject.toml` to a released version:

```toml
"marimo[sql]>=0.NEXT_VERSION",
```
