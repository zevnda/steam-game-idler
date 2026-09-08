<!-- url: https://steamgameidler.com/docs/settings/game-settings -->
# Settings: Game Settings

Generated corpus content (see `.claude/skills/generate-ui-guide/SKILL.md`) — the merged source for
the Settings modal's Game Settings tab (UI behavior + the docs page's content + its cross-feature
connections), verified against `src/features/settings/components/game-settings/GameSettingsTab.tsx`,
`GameSettingsGameList.tsx`, `src/features/settings/hooks/useGameSettings.ts`, and the Rust settings
modules it calls into. Regenerate via that skill if any of those change — don't hand-edit this file
to patch small drift.

## What the Game Settings tab actually controls

The Game Settings tab (Settings modal → "Game Settings" in the left-hand tab list) is a per-game
override screen for exactly three auto-stop caps, each backed by its own Rust settings module:

- **Max playtime** — stop a game (and drop it from automatic queues) once its total playtime
  reaches a given number of minutes. Has both an account-wide value ("Max playtime (all games)")
  and a per-game override ("Max playtime"). Backed by `max_playtime_settings.json`
  (`src-tauri/src/max_playtime/settings.rs`) — a module owned by no single feature; see "Which
  automations actually respect the Max Playtime cap" below for exactly who reads it.
- **Max idle time** — stop idling a game after a given number of minutes. Also has an account-wide
  value ("Max idle time (all games)") and a per-game override ("Max idle time"). Backed by
  `idling_settings.json` (`src-tauri/src/idling/settings.rs`), and only ever applies to manual
  idling (the Idling page) and Auto Idle — never to achievement-unlocker's or card-farming's own
  idle claims.
- **Max achievement unlocks** — stop the Achievement Unlocker on a game after it has unlocked a
  given number of achievements for that game this session. **Per-game only — there is no
  account-wide "all games" version of this one.** Backed by `achievement_unlocker_settings.json`
  (`src-tauri/src/achievement_unlocker/settings.rs`), as a sibling of that feature's own pacing/
  scheduling settings (idle-while-unlocking, interval, schedule, etc. — those live on the
  Achievement Unlocker's own Settings tab, not here).

**There is no Card Farming section on this tab, and no card-farming cap exists anywhere in the
app.** A pre-rewrite version of the app did have per-game/global max-farming-time and max-card-drops
caps for card farming, but they were removed entirely in card farming's rewrite — their "elapsed
since this game entered active" semantics stopped meaning anything coherent once farming started
stopping/restarting a game every few minutes and bouncing between its ready-farm/bulk-idle phases
(`src-tauri/src/card_farming/settings.rs`'s own doc comment: "No auto-stop caps live here anymore
... a deliberate simplification, not an oversight"). If you're looking for a way to cap how long or
how much a specific game gets card-farmed, it doesn't exist — card farming stops a game only when
its card drops run out (or you stop it manually / it hits a blacklist/refund-window/whitelist
filter), never based on an elapsed-time or drop-count limit you set yourself.

## Which automations actually respect the Max Playtime cap

The Max Playtime section's own on-screen note says this cap "Applies everywhere a game can be
idled — manual and automatic idling, achievement unlocker, and card farming" — **that claim is not
fully accurate for card farming.** Verified directly against the Rust source:

- **Manual idling and Auto Idle**: enforced live by a standalone background poll loop
  (`src-tauri/src/max_playtime/enforcement.rs`, spawned once at app startup) that checks roughly
  every 60 seconds whether a currently-idling game (owned by the `manual` or `auto_idle` idle-claim
  owner) has crossed its effective cap, and force-stops it the instant it has. Also checked
  up-front: `idling::commands::toggle_manual_idle`'s manual-start path calls
  `max_playtime::settings::is_over_cap` and refuses to start an already-over-cap game at all
  (`AppError::MaxPlaytimeCapReached`), and Auto Idle's own queue-building filters out already-capped
  games before ever idling them.
- **Achievement Unlocker**: genuinely does respect this cap — `achievement_unlocker::manager.rs`'s
  `run_scan_phase` calls `max_playtime::settings::is_over_cap` as a pre-check before working a game,
  and reports `CompletedUnlockReason::MaxPlaytime` when a game hits its cap mid-session.
- **Card Farming does NOT respect this cap at all — a confirmed, real gap, not a design choice
  documented anywhere in the app's own copy.** A full read of every file under
  `src-tauri/src/card_farming/` (including `manager.rs`, the module that would need to call it) and
  a grep of the entire `src-tauri/src` tree for `MaxPlaytime`/`is_over_cap`/`effective_max_playtime`
  confirms `card_farming` is not among the modules that ever reference the max-playtime cap in any
  form. Setting a max playtime override (global or per-game) currently has **zero effect** on a card
  farming session — a game already over its cap can still be picked up and farmed, and a game that
  crosses its cap mid-farm is never stopped because of it. If a user asks "why is card farming still
  running past the playtime limit I set," this is the accurate answer: it's a real, currently-open
  gap in the app, not user error. (Several source-code doc comments elsewhere in the codebase —
  including `max_playtime/mod.rs`'s and `max_playtime/enforcement.rs`'s own module comments, which
  claim a `card_farming::manager::poll_active`/`StopReason::MaxPlaytimeReached` mechanism exists —
  are themselves stale on this point; no such function or enum variant exists in
  `card_farming/manager.rs` today.)
- The live docs page `docs/settings/game-settings.mdx` is also significantly stale here: it still
  describes an entire "Card Farming" section with "Max Card Farming Time (All Games)", "Max Card
  Farming Time", and "Max Card Drops" fields. None of these exist in the current UI or backend —
  they were the pre-rewrite caps described above, already fully removed. Don't describe these
  fields as real; they aren't reachable anywhere in the app.

## Opening the Game Settings tab

There is no dedicated shortcut or context-menu entry that jumps straight to this tab for a specific
game — you always reach it the same way, then pick the game from inside the tab itself:

1. Open the Settings modal — either the gear-icon button in the Sidebar's permanent chrome, or the
   `Ctrl+,` keybind (see the Keybinds settings tab). In practice the Sidebar's gear button opens on
   the **General** tab every time (closing the modal always resets the active tab back to
   `'general'`, and the gear button opens with no tab argument, so it just reopens on whatever
   `activeTab` already is — which is `'general'` after any previous close).
2. Click **"Game Settings"** in the modal's left-hand vertical tab list to switch to this tab.

**No game's right-click context menu offers a way to jump here.** A `GameCard`'s context menu
(built by `src/shared/utils/buildGameCardMenu.ts`, used by every page that renders game cards —
Games list, Idling, Favorites, Auto Idle, Card Farming, Achievement Unlocker) only offers:
Start/Stop Idling, Manage Achievements (opens the achievement-manager overlay), View on Steam, and
an "Add to..." submenu (Favorites/Card Farming/Achievement Unlocker/Auto Idle). There is no
"Game Settings" or "Configure limits" entry anywhere in that menu — configuring a specific game's
caps always means opening Settings → Game Settings and finding that game in the list described
below, never a shortcut from the game's own card.

## Picking a game to configure (the game list)

The left side of the tab (a fixed `288px`-wide column on wider windows; full-width, stacked above
the fields, on narrower ones) is a searchable, virtualized single-column list of every game in your
library (the same owned-games list every other page uses, via `useGamesList()`):

- **Search box** (magnifying-glass icon, placeholder text is the shared search placeholder) filters
  the list by a case-insensitive substring match against each game's name as you type; an X-shaped
  clear button appears in the box once you've typed something, clearing the search back to the full
  list.
- **A toggle button next to the search box** (a pencil icon) is "only show games with custom
  settings" — switching it on filters the list down to just games that currently have a non-default
  override set in *any* of the three caps above (playtime, idle time, or achievement unlocks). It's
  disabled (greyed out, not clickable) whenever no game has any override at all yet. If you have
  this filter on and then clear the very last customized game's last remaining override, the filter
  automatically switches itself back off — otherwise the list would go empty with no obvious
  explanation for why.
- **Each row** shows the game's thumbnail and name. A game with any active override shows a small
  filled accent-colored dot on the far right of its row — this is the same "customized" signal the
  pencil-icon filter above uses. The currently-selected game's row gets a colored left border and a
  highlighted background.
- **Clicking a game selects it**, switching the fields on the right from the three account-wide
  ("all games") inputs to that game's three per-game override inputs. **Clicking the
  already-selected game again deselects it**, switching back to the account-wide fields — there's no
  need to navigate away and back just to clear the selection.

## The three cap sections and how each field behaves

The right-hand column always shows three bordered, labeled groups, top to bottom — Playtime,
Idling, Achievement Unlocker (Playtime is listed first specifically because it's the one cap that
applies most broadly; see "Which automations actually respect the Max Playtime cap" above for the
real, verified scope of that reach). **Exactly one set of inputs is editable at a time, by design**:

- **No game selected** → the two account-wide ("all games") fields (Max playtime (all games), Max
  idle time (all games)) are enabled; every per-game field (Max playtime, Max idle time, Max
  achievement unlocks) is disabled/greyed out, since there's no selected game for a per-game value
  to apply to.
- **A game selected** → the reverse: the two account-wide fields become disabled, and that game's
  three per-game fields become editable.

This is a deliberate, unambiguous UX choice (per the component's own code comment) — it's never
possible to be confused about which value a visible-but-disabled field would apply to.

Each individual field:

- **Max playtime (all games)** — minutes; account-wide fallback cap. Enabled only while no game is
  selected.
- **Max playtime** — minutes; this specific game's override, taking precedence over the account-wide
  value when set. Enabled only while this game is selected.
- **Max idle time (all games)** — minutes; account-wide fallback, applies only to manual idling and
  Auto Idle (never achievement-unlocker/card-farming's own idle claims — see achievement unlocks
  below for that feature's own separate cap). Enabled only while no game is selected.
- **Max idle time** — minutes; this game's override for the same idle-time cap. Enabled only while
  this game is selected.
- **Max achievement unlocks** — count of achievements, not minutes. Stops the Achievement Unlocker
  on this game once it has unlocked this many achievements this session. Enabled only while this
  game is selected. This is the one field with no account-wide counterpart at all.

Every field is a stepper number input (up/down chevron buttons always shown alongside the text
field) with a minimum of `0` and a small "0 = unlimited" hint printed just below it. It commits its
value on blur (clicking/tabbing away) or pressing Enter — not on every keystroke while typing. If
you leave a field empty or type something invalid and click away, it snaps back to `0`. If saving a
new value to disk fails, the field visibly reverts to its last known-good value and a toast appears
("Something went wrong updating your game settings. Please try again." with an error code — none of
the specific error codes this tab can hit get a more tailored message than that generic one today).

## What "0" actually means, and how the account-wide/per-game precedence works

Every per-game override field collapses a typed `0` down to "no override at all" — it's not stored
as an explicit "force unlimited for this game" value, it just clears any existing override for that
game and that field, exactly the same way it looked before you ever touched it. Concretely: the
effective cap SGI actually enforces for a given game is **the per-game override if one is set above
`0`; otherwise the account-wide value if that's set above `0`; otherwise the game is genuinely
uncapped.** A per-game field showing `0` does **not** mean "this game is guaranteed unlimited" if an
account-wide cap is currently set — it means "no override on this field for this game," so the
account-wide value (if any) still applies to it. The only way to get a specific game genuinely
uncapped while an account-wide cap exists for everything else is not exposed anywhere in this UI —
there's no explicit "force unlimited" sentinel distinct from "no override," so as long as the
account-wide value is non-zero, every game without its own higher-priority override still inherits
it. (This precedence direction — per-game always wins when set, otherwise fall back to the
account-wide value — is a deliberate product decision for both the playtime and idle-time caps,
matching each Rust module's own `effective_max_playtime`/`effective_max_idle_time` logic.)

## Loading and error states

While the tab's data is loading (both the two account-wide values and, if applicable, the selected
game's three per-game values), the three sections render as grey skeleton placeholders instead of
real inputs — this only affects the fields column on the right; the game list on the left loads
independently and isn't blocked by it. If the initial load fails outright (either the account-wide
values or a selected game's per-game values), the whole fields column is replaced by a single error
card ("Something went wrong" + the underlying error code) with a "Try again" button. That button
only re-runs the account-wide fetch (the two global values plus the three "which games have an
override" lists that back the pencil-icon filter and the per-row accent dot) — if the failure
actually came from loading one specific selected game's per-game values instead, "Try again" alone
won't necessarily re-trigger that fetch; deselecting and reselecting the same game (click its row
twice) does, since the per-game fetch is gated on the selected game actually changing.

## Refreshing after Reset Settings (Debug tab)

This tab is deliberately self-contained rather than having its state lifted up into the Settings
modal itself — but the Debug tab's "Reset Settings" action (`debug::commands::reset_settings`) does
genuinely wipe every file this tab reads and writes: it calls `idling::settings::reset` (clears the
global max idle time and every per-game override), `max_playtime::settings::reset` (clears the
global max playtime and every per-game override), and `achievement_unlocker::settings::reset`
(clears that feature's settings plus its own per-game max-unlocks overrides) — all in the same pass
that resets every other per-account settings file.

Since the Settings modal keeps every tab's panel mounted underneath whichever tab is currently
active (it's a tab switch, not a route change), if you're parked on a different Settings tab when
you click "Reset Settings," the Game Settings tab's own state doesn't get told about the reset
directly. Instead, `useGameSettings`'s data-loading effects are gated on this tab actually being the
active one (`isOpen && activeTab === 'gameSettings'`) — every time this panel becomes active again
(including switching to it after a reset happened while you were elsewhere), it automatically
re-fetches both the account-wide values and, if a game is still selected, that game's per-game
values from disk. In practice this means: if your Game Settings tab looks like it's showing stale
or wrong values right after using Reset Settings, just (re-)opening this tab is enough to see the
real, post-reset state — no separate manual refresh action exists or is needed.
