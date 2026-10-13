---
name: dep-triage
description: >
  Triage and resolve open Dependabot PRs and security alerts (npm + Cargo) locally — upgrade,
  supersede, or postpone each one, verify the desktop app and docs site still build and run, and
  hand the user manual test steps. Never commits, pushes, or touches GitHub state. Use for
  "go through dependabot", "fix security alerts", "deal with dep PRs", or /dep-triage.
---

Resolve every open Dependabot PR and security alert in the working tree, so that one user-made
commit to `main` lets GitHub close them all. Correctness over speed: a dependency bump that breaks
a live release (~1,850 DAU) or the auto-updater is far worse than an open alert.

## Hard rules

- **Never commit, push, or offer to.** End with an uncommitted working tree (see CLAUDE.md).
- **Read-only on GitHub.** Don't close PRs, dismiss alerts, comment, or merge. Merged fixes on
  `main` close alerts within minutes; Dependabot closes superseded PRs on its next check (can be
  up to the weekly schedule in `.github/dependabot.yml`). Tell the user this instead of acting.
- **Never write the GitHub token to disk.** Keep it in a shell variable for the duration of one
  command.
- Never run the `prettier` package.json script — `pnpm exec prettier --check <file>` only.

## 1. Gather

`gh` is not installed here. Use the git credential helper + `curl` (Bash tool), and `node -e` for
JSON (no Python on this machine):

```bash
TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill 2>/dev/null | sed -n 's/^password=//p')
H="Authorization: Bearer $TOKEN"; R=https://api.github.com/repos/zevnda/steam-game-idler
curl -s -H "$H" "$R/pulls?state=open&per_page=100"               # filter user.login == dependabot[bot]
curl -s -H "$H" "$R/dependabot/alerts?state=open&per_page=100"   # package, manifest, range, first_patched_version
```

Write raw JSON to the session scratchpad, not the repo. Also glance at
`$R/code-scanning/alerts?state=open` so nothing security-related is missed.

## 2. Map each item to where it actually lives

The repo is a pnpm workspace (`.` = desktop app, `docs` = independently deployed Vercel site) plus
`src-tauri/Cargo.lock`. For every vulnerable or bumped package:

- npm: `pnpm why -r <pkg> --depth 3` — which workspace, direct vs. transitive, runtime vs. dev.
- Cargo: `cargo tree -i <crate> -e normal --manifest-path src-tauri/Cargo.toml`. Anything under
  `tauri-plugin-updater`/`reqwest`/TLS is on the update path — treat with extra care.

## 3. Decide per item: fix, supersede, or postpone

Before touching anything, check what the **target** version actually ships:
`pnpm view <pkg>@<ver> dependencies optionalDependencies peerDependencies engines`.

- **A Dependabot PR's target may not fix its own alert** (e.g. `concurrently@10.0.4` still pinned a
  vulnerable `shell-quote`). Check the patched transitive version really lands; if it doesn't, go
  to the newest compatible release that does, instead of the PR's version.
- **Prefer a real upgrade of the parent over a `pnpm.overrides` entry.** Override only when no
  upstream release fixes it, and comment why next to the override.
- **Transitive-only fixes**: `pnpm update -r --depth Infinity <pkg...>` refreshes the lockfile
  without adding direct deps. Confirm with `git diff package.json docs/package.json` afterwards.
- **Cargo**: `cargo update -p <crate> --precise <patched>` — semver-compatible only; inspect the
  `Cargo.lock` diff stays small.
- **Bump siblings together**: `next` ↔ `@next/eslint-plugin-next`; `fumadocs-core` ↔ `fumadocs-ui`
  (exact peer pin); `@tauri-apps/*` JS packages ↔ their Rust crates — the Tauri CLI refuses to
  build when a JS package's major.minor differs from the crate version resolved in `Cargo.lock`,
  which is why `package.json` uses `~` ranges. Bump both sides or neither (`cargo update -p
  tauri-plugin-<name>`). `tauri-plugin-window-state` comes from a custom git fork
  (`zevnda/plugins-workspace-custom`), not crates.io — never bump its JS side blindly.
- **Raise the manifest floor to the patched version** (`^16.3.8`, not leaving `^16.2.11`) so a
  fresh resolve can never land on a vulnerable version. Note that `^` may resolve higher than the
  PR target — that's fine as long as it's verified, but say which version actually installed.
- **Postpone (leave open, explain why)** when the change is a major explicitly deferred in
  CLAUDE.md's "Dependency notes" (TypeScript 7, ESLint 10), would need a real migration beyond the
  scope of a dep bump, or touches updater signing/config. Postponing is a valid outcome — say what
  would unblock it.
- **Cascading removal rule** (CLAUDE.md): if an upgrade makes a dep unused, remove it in the same
  change.

Check `git status` and `tasklist` first — no `pnpm tauri dev` may be running while you run cargo
(incremental-cache corruption / `SteamKit2.dll` lock, see CLAUDE.md gotchas).

## 4. Verify — everything, every time

Run all of these; a failure in either workspace blocks the whole change:

```bash
pnpm typecheck && pnpm lint && pnpm i18n:check && pnpm build          # desktop app static export
pnpm --filter steam-game-idler-docs types:check                       # docs (runs fumadocs-mdx too)
pnpm --filter steam-game-idler-docs lint
pnpm --filter steam-game-idler-docs build
cargo check --manifest-path src-tauri/Cargo.toml
cargo test --lib --manifest-path src-tauri/Cargo.toml
```

Use `--manifest-path` — the Bash tool's working directory can drift after a `cd`. Also confirm
`engines.node` of upgraded packages against `setup-node` versions in `.github/workflows/`.

**When an upgrade breaks the build**, don't revert reflexively: read the new version's shipped
`.d.ts`/dist in `node_modules/.pnpm/<pkg>@<ver>/` to see what changed (e.g. fumadocs-core 16.14
swapped Orama for ZBSearch, breaking `docs`' custom `initOrama`). Fix at the call site with a
comment explaining *why* the code looks the way it does, and `pnpm exec prettier --check` any
hand-edited file. If the fix is a genuine migration rather than a small adaptation, postpone that
item instead and say so.

## 5. Run the app and hand off manual testing

Any runtime dependency change for the desktop app (`next`, React, HeroUI, `@tauri-apps/*`, Rust
crates) needs a real launch:

1. Start `pnpm td` with `run_in_background`, logging to the scratchpad. Wait for
   `Running ... steam-game-idler.exe` (or an error) in the log, then scan the log for errors.
   C# `ILLink` trim warnings from SteamUtility are pre-existing noise.
2. Give the user **1–2 concrete manual steps at a time** (exact screen, exact control, expected
   result, and why that step covers this upgrade), then wait for their reply before continuing.
   Pick steps that exercise what actually changed (routing/rendering for `next`; a SteamUtility
   round-trip like loading achievements for Tauri/IPC; the search box for docs search libs).
3. When done, stopping the background task **orphans the process tree**. Find this session's
   processes (`Get-CimInstance Win32_Process` → command lines containing `pnpm.mjs td`,
   `tauri.js dev`, `next dev`, `cargo run`, `steam-game-idler.exe`, `SteamUtility.exe agent`),
   `taskkill /PID <pnpm td pid> /T /F`, then confirm port 3000 is free. Never kill node processes
   you didn't start (editor tooling).

Note: `next dev` (16.4+) writes an untracked `AGENTS.md` at the repo root — mention it to the user
(commit or `.gitignore`), don't delete or commit it yourself.

## 6. Report

Lead with the outcome, then one table:

| Item | Action | Notes |
| ---- | ------ | ----- |
| PR #NNNN / alert #NNN — pkg | fixed / superseded by X / postponed | why, version landed |

Then: files changed, verification results (with exact pass/fail), anything postponed and what
unblocks it, manual test steps still owed, and how/when GitHub will auto-close the items once the
user pushes to `main`. Leave committing to the user (`/commit-desc` can draft the message).
