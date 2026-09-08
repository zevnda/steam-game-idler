<!-- url: https://steamgameidler.com/docs/steam-credentials -->
# Settings — Steam Credentials

Generated corpus content (see `.claude/skills/generate-ui-guide/SKILL.md`) — the single merged
source for the Settings modal's Steam Credentials tab, and for the shared `SteamCookiesConnectPanel`
mechanism it's built on. That shared component is also embedded directly inside Card Farming's and
Inventory Manager's own pages (as their pre-connect "connect your Steam Community session" prompt)
— this file is the canonical description of how that shared mechanism actually works; the
`card-farming.md`/`inventory-manager.md` UI guides reference this file for those mechanics rather
than re-explaining them. Verified against
`src/features/settings/components/SteamCredentialsTab.tsx`,
`src/features/settings/hooks/useSteamCredentialsSettings.ts`,
`src/shared/components/SteamCookiesConnectPanel.tsx`, `src/shared/components/ManualCookiesForm.tsx`,
`src/shared/hooks/useSavedSteamCookies.ts`, `src/shared/hooks/useAutoConnectSteamCookies.ts`,
`src/shared/hooks/useSteamCookiesSync.ts`, `src/shared/stores/steamCookiesStore.ts`,
`src-tauri/src/steam_community/{mod.rs,credentials.rs,session.rs,commands.rs}`, and the
`steam-credentials.mdx` docs page. Regenerate via that skill when any of those change — don't
hand-edit this file to patch small drift.

## What Steam Credentials are and why they exist

"Steam Credentials" are a separate set of Steam Community session cookies (`sessionid` /
`steamLoginSecure` / optionally `steamMachineAuth{steamId}`), distinct from SGI's own app sign-in
(Steam Sign-in / agent mode, or Legacy Sign-in / CLI mode — see `get-started/how-to-sign-in.mdx`).
They're required only by **Card Farming** (to check which owned games still have card drops
remaining) and **Inventory Manager** (to fetch and list marketplace items) — no other feature in
the app needs them. The Settings modal's description line for this tab states this directly:
"Steam credentials are required in order to use the Card Farming and Inventory Manager features."
You must obtain these cookies from `https://steamcommunity.com/`, never from
`https://store.steampowered.com/` — a different cookie jar entirely.

This is a real, historically-missed step: a production bug this whole ui-guide regeneration effort
exists to fix was specifically a "connect your Steam Credentials first" step being skipped in a
related guide. Any "why doesn't Card Farming/Inventory Manager do anything" question should check
this connection first, before anything else.

**Family View**: if the signed-in Steam account has [Family View](https://store.steampowered.com/parental/)
enabled, cookie-authenticated requests to Card Farming/Inventory Manager return HTTP 403 with a
`Family View` PIN-gate page — confirmed live against a real Family-View-enabled account
(`steam_community::session::is_family_view_blocked`). Steam Credentials themselves can still be
saved successfully in this state; the block only surfaces once Card Farming/Inventory Manager
actually try to use them. Family View must be disabled on the Steam account itself — nothing in SGI
can work around it.

## Where this tab lives and how to open it

The Steam Credentials tab is one of 11 tabs in the app-wide Settings modal
(`src/features/settings/components/SettingsModal.tsx`), opened via the sidebar's Settings gear icon
(which reopens whichever tab was last active) or from any other "Settings → X" entry point. Inside
the modal's tab list it's the 4th tab, in this fixed order: General, Subscription, Customization,
**Steam Credentials**, Card Farming, Achievement Unlocker, Inventory Manager, Free Games, Game
Settings, Keybinds, Debug. There is no dedicated deep-link that opens Settings directly to this tab
from elsewhere in the app (e.g. from Card Farming's or Inventory Manager's own connect panel) — a
user following a "Learn more" link from those panels is taken to the external docs page
(`https://steamgameidler.com/docs/steam-credentials`), not to this Settings tab directly.

This is a **per-account** category, not an app-wide preference: it reflects and edits the
credentials saved for whichever Steam account is currently the active signed-in account
(`useSteamCredentialsSettings` gates its load on the account's resolved key, reloading fresh if you
switch accounts). Switching the active account via the account-switcher and reopening this tab shows
that other account's own saved (or not-yet-saved) credentials.

## The two paths: Automatic (Gamer tier, agent mode) vs. Manual (everyone else)

The tab's content branches on the signed-in account's sign-in mode and subscription tier:

- **A Gamer-tier account signed in via Steam Sign-in (agent mode)** never needs this tab at all.
  Instead of the connect panel, the tab shows a single info `Alert` with the text: "Not needed. This
  account signs in via Steam and gets its Steam Community session automatically." This is because
  agent mode's daemon already holds a live, authenticated SteamKit2 connection that can mint a web
  session (`steamLoginSecure`) directly (`AgentManager::get_web_session` →
  `steam_community::session::derive_from_agent_session`) with **no webview and no login prompt at
  all** — verified in `session.rs`: `derive_from_agent_session` just calls the daemon and wraps the
  result, no window is ever created. In this state the tab's own "Learn more" button (next to the
  title) is also hidden, since there's nothing to configure.
- **Every other combination** — a Casual/free-tier agent-mode account, *or* any Legacy Sign-in
  (CLI-mode) account regardless of tier, including a Gamer-tier CLI-mode account — gets the full
  connect panel (the shared `SteamCookiesConnectPanel`, described below) with both an Automatic and
  a Manual tab. This is a real, confirmed asymmetry: a Gamer-tier subscription alone is not enough
  to skip manual entry — it must be paired with agent-mode sign-in specifically. A Gamer-tier
  CLI-mode account still needs *some* connect action (automatic-via-webview or manual paste),
  because CLI mode has no live daemon session for `derive_from_agent_session` to read from at all —
  its only automatic option is `session::acquire`'s hidden webview flow (see below), which still
  shows a real, visible Steam sign-in window on first use, unlike agent mode's silent derivation.

## The connect panel: Automatic tab

Rendered whenever the tab doesn't show the agent-mode bypass note above. The panel always shows
**both** tabs — "Automatic" and "Manual" (`common.connect.automaticTab`/`manualTab`) — as real,
always-selectable tabs; the Automatic tab is never hidden or disabled for a non-Gamer account.
Selecting it when the account isn't Gamer-tier doesn't switch tabs at all — it intercepts the
selection and opens the upgrade modal (`proModalStore.openWithTier('gamer')`) instead, and the tab
itself renders a small `TierBadge` reading "gamer" next to its label at ~60% opacity to signal the
gate visually without disabling the control (the gated-control pattern used everywhere in this app —
never a native disabled tab).

For an account that *can* use it (Gamer tier — mode doesn't matter, since the panel itself doesn't
re-check agent vs. CLI, only tier), the Automatic tab shows one line of description text: "Signs in
to Steam Community automatically and saves the cookies here." Below it is a single submit button
labeled **"Sign In"** (`common.actions.signIn` — not "Connect" or "Reauthenticate", and this same
label is used both for a first-time connection and for re-running the flow later). Clicking it:

- For an **agent-mode** account, silently derives cookies from the live daemon session — no window,
  no visible pause beyond the button's own loading spinner.
- For a **CLI-mode** account, opens `session::acquire`'s hidden `WebviewWindow` pointed at
  `https://steamcommunity.com/login/home/?goto=`. If that account's persisted per-steam-id WebView2
  profile (`<cache_dir>/<steam_id>/card-farming-webview-data` — still named for card farming, its
  original consumer, but shared by every cookie-authenticated feature for that account) already
  holds valid session cookies, the window is checked and closed within ~500ms with no visible flash.
  Otherwise the window becomes visible and the user signs in for real (username/password or QR),
  same as any other Steam login page; the backend polls for up to 5 minutes for the required
  cookies (`sessionid` + `steamLoginSecure`; `steamMachineAuth{steamId}` is optional) to appear in
  the window's cookie jar, then closes it automatically. Closing the window manually before signing
  in fails the attempt with a real error rather than hanging.

A successful Automatic connect persists the result via `acquire_and_save_steam_credentials` (which
internally calls the same `session::resolve` flow the feature pages use) and shows a
"Credentials saved" toast (`common.manualCookies.savedToast`) — this toast only fires from this
Settings tab; Card Farming's/Inventory Manager's own connect panels skip it since their own page
already visibly transitions off the connect prompt as feedback.

## The connect panel: Manual tab

Always available regardless of tier — this is the free/Casual-tier path, and also the only fallback
path for anyone (any tier) who'd rather not use the Automatic flow. Selecting "Manual" shows:

- A note: "You must get your cookies from" followed by a clickable link reading
  `https://steamcommunity.com/` (opens in the system's default external browser, not in-app) with a
  small external-link icon (`TbExternalLink`) next to it.
- If the form was prefilled from an already-saved credential set, a second muted note: "Loaded from
  the Steam Credentials saved in Settings."
- Two password-type text fields (`ManualCookiesForm`):
  - **steamLoginSecure** (`common.manualCookies.slsLabel`) — placeholder text
    `steamLoginSecure`, required. This is the account's actual bearer session cookie.
  - **steamMachineAuth** (`common.manualCookies.smaLabel`) — placeholder text `steamMachineAuth`,
    with a description "Optional. Only needed if your account has a pending Steam Guard machine
    confirmation."

**There is no `sessionid`/`sid` field in the form at all**, despite `SteamCookies`
(`src/features/settings/types.ts`) having a `sid` property. The frontend never collects a
`sessionid` from the user — Steam Community's `sessionid` cookie is just an opaque CSRF
double-submit token Steam never validates server-side against anything real, so the backend mints
its own 24-character random hex value for it on every manual save
(`steam_community::session::generate_session_id`), both when the form is first submitted
(`ManualCookiesForm`'s form value has no `sid` field to begin with — the frontend sends `sid: ''` as
an unused placeholder) and again server-side in `validate_and_save_steam_credentials`/
`set_steam_credentials`, which always overwrite whatever `sid` was sent with a freshly generated
one before persisting. **This is a real, confirmed mismatch with the live docs page**
(`steam-credentials.mdx`'s Manual Method steps still instruct the user to copy the "sessionid"
cookie's value from DevTools alongside `steamLoginSecure`) — the actual UI has no field for it and
silently ignores it if somehow supplied; only `steamLoginSecure` and (optionally)
`steamMachineAuth` need to be pasted in. The docs page's mention of an optional "steamParental"
cookie is similarly not reflected anywhere in the code — only `steamMachineAuth{steamId}` exists as
a field (`sma`); there is no separate `steamParental` concept in `SteamCookies`.

The submit button is disabled until the `steamLoginSecure` field is non-empty, and reads **"Save"**
(`common.actions.save`) for the Manual tab specifically (as opposed to "Sign In" for Automatic).
Clicking it, from this Settings tab specifically, calls `validate_and_save_steam_credentials` —
which first validates the pasted cookies against Steam Community for real
(`steam_community::session::validate`, a GET to `steamcommunity.com` checking for the logged-in
account-dropdown marker, with one retry after 1.5s if inconclusive) and only writes to the OS
credential store if that succeeds. A failed validation returns an error and the fields are cleared
back to empty (never left sitting there looking like they might still work) — the user must
re-paste fresh values rather than retry the identical submission. On success, the same "Credentials
saved" toast as the Automatic path fires.

(Card Farming's `CardFarmingStartPanel` and Inventory Manager's `InventoryConnectPanel` — the same
shared panel component embedded on those two feature pages instead of here — call a plain
`set_steam_credentials` write instead, since those callers already proved the cookies work via
their own feature-specific fetch, `get_games_with_drops`/`get_inventory`, before ever calling
`save()`. Only this Settings tab has no such prior proof step, hence its own dedicated
`validate_and_save_steam_credentials` command.)

## Connected vs. not-connected state, and the Clear button

There's no separate "Connected!" banner or green checkmark shown anywhere in this tab — the signal
that credentials are already saved is purely: the Manual tab's fields arrive pre-filled with the
saved `steamLoginSecure`/`steamMachineAuth` values (masked, since both are `type='password'`
fields) plus the "Loaded from the Steam Credentials saved in Settings" note underneath, and a
**"Clear"** button (`common.actions.clear`) appears next to the Save/Sign In button whenever a
saved credential set exists for the account — regardless of which tab (Automatic or Manual) is
currently selected. This is the same shared component and the same button for both tabs; there is
no separate "Sign Out" button distinct from "Clear" anywhere in this UI (the live docs page's
Automated Method section describes a "Sign Out" button for the automatic path — that's stale; the
actual button is "Clear" in both cases, identical to the manual path's clear button).

Clicking Clear calls `clear_steam_credentials`, wipes the OS-credential-store entry for the active
account, resets the form fields to empty, and shows a "Credentials cleared" toast
(`common.manualCookies.clearedToast`) — this toast fires unconditionally on a successful clear from
every surface, not just Settings. A clear failure (a rare credential-store I/O error) shows an error
toast reading "Couldn't clear your saved Steam credentials. ({{code}})" with a "Learn more" link,
rather than the tab's own inline error alert.

## No distinct "Reauthenticate" button — it's always "Sign In"

The live docs page's Automated Method section describes clicking a "Reauthenticate" button to
manually refresh expired automatic credentials. **This does not exist as a separate button on this
tab** — "Reauthenticate" is a real button, but it belongs to a completely different feature (the
Free Games settings tab's auto-redeem sign-in, `dashboard.settings.freeGames.autoRedeem.reauthenticate`).
On the Steam Credentials tab, the Automatic tab's submit button is always labeled "Sign In"
regardless of whether a connection already exists — clicking it again re-runs the exact same
acquire flow described above (silent daemon derivation for agent mode, webview flow for CLI mode)
and overwrites whatever was previously saved. There is no dedicated re-auth affordance distinct from
just clicking "Sign In" again.

## Automatic session revalidation (behind the scenes, not user-visible as a distinct step)

Every resolved cookie set that didn't come fresh from `derive_from_agent_session` (i.e. every
CLI-mode result, and every manually-supplied set on either mode) is checked for continued validity
via `session::ensure_valid` whenever it's actually used by a feature (Card Farming/Inventory
Manager's own resolve calls — not something this Settings tab itself triggers on open). If Steam
reports the session as logged-out:
- An **automatically-acquired** (non-manual) cookie set gets one silent retry: the backend
  re-navigates that account's persisted webview profile with stale session cookies cleared first
  (`force_relogin: true`), which resolves with no visible window if the underlying browser-level
  Steam session is still alive, or shows a real visible login window (identical to a first-time
  connect) if it's genuinely dead too.
- A **manually-pasted** cookie set has no such session to silently refresh — a confirmed
  logged-out result goes straight to clearing the saved credential and returning
  `SteamCommunitySessionExpired`, surfacing to the user as needing to reconnect from scratch (their
  next visit to this tab, or to Card Farming's/Inventory Manager's connect panel, shows the credential
  as gone).

This revalidation happens transparently as part of Card Farming/Inventory Manager actually using the
cookies — it is not something visible or triggerable from this Settings tab directly, beyond the
general "Sign In"/"Save" actions described above.

## Errors shown inline on this tab

Two distinct error states, both rendered as a red `Alert`:

- **Load error** (fetching the account's saved credentials on tab open failed): replaces the whole
  tab body with a centered danger alert titled "Couldn't load settings"
  (`dashboard.settings.errors.title` — the same generic Settings-modal load-error title every other
  tab uses, not text specific to Steam Credentials) plus a "Try again" button
  (`common.actions.tryAgain`) that re-runs the load.
- **Action error** (a Save/Sign-In/Automatic attempt failed): shown as an inline alert above the
  tabs, inside the panel — the form stays visible and editable underneath it. This alert clears
  itself automatically the moment you navigate away from this tab (switch to another Settings tab,
  or close the modal) so a stale error from a previous attempt never resurfaces if you come back.

Both alert types map the same underlying error code through `steamCredentialsErrorMessageKey`:
- `steam_credentials_store_io_failed` → "Couldn't read or write your saved Steam credentials."
- `steam_community_session_failed` **and** `steam_community_session_expired` → both map to Card
  Farming's own "Couldn't sign in to Steam Community. Check your cookies and try again." copy
  (deliberately not a "your session expired, please reconnect" message here — since this tab is
  always validating a fresh, not-yet-saved paste/sign-in attempt, even a technically-"expired" code
  reads correctly as "this attempt didn't work," never "the one you already had stopped working").
- Anything else → generic fallback: "Something went wrong updating your Steam credentials. Please
  try again. ({{code}})", with the literal error code interpolated in.

## The shared `steamCookiesStore` and cross-feature sync

`steamCookiesStore` (`src/shared/stores/steamCookiesStore.ts`) holds the resolved/saved manual
cookie set **per account** (`Record<AccountKey, {isChecked, savedCookies}>`), and is the single
source every surface reads from — this Settings tab, and Card Farming's/Inventory Manager's own
connect panels. `useSteamCookiesSync` (mounted once in `DashboardShell`, not owned by any one
feature page) checks `get_steam_credentials` once per account as soon as it becomes active,
independent of which page is open — so switching to Card Farming right after saving credentials
here in Settings sees the saved value immediately, with no extra fetch or page reload needed. Every
save/clear/acquire action from any of the three surfaces (`SteamCredentialsTab`, `CardFarmingStartPanel`,
`InventoryConnectPanel`) writes straight back into this same store via `useSavedSteamCookies`'s
`save`/`clear`, so entering or clearing a cookie set on any one of the three screens is instantly
visible on the other two without a remount.

`useAutoConnectSteamCookies` (used by Card Farming's and Inventory Manager's own pages, not by this
Settings tab) is what actually decides whether either feature page can skip showing its own connect
panel entirely: it fires once per account, either deriving cookies silently for a Gamer-tier
agent-mode account, or auto-submitting a previously-saved manual cookie set if one exists in this
same store — neither path retries if it fails once; a failed auto-connect just leaves that page's
own connect panel showing for a manual retry.

## Tier gating summary

- **Casual tier / free tier**: Manual tab only is usable; the Automatic tab is visible but gated —
  clicking it opens the Gamer upgrade prompt instead of switching tabs.
- **Gamer tier**: Automatic tab is usable on every sign-in mode, but only genuinely skips this whole
  tab (via the agent-mode bypass note) when paired with agent-mode (Steam Sign-in). A Gamer-tier
  CLI-mode (Legacy Sign-in) account still goes through the same webview-based Automatic flow (or
  Manual) as a Casual-tier CLI-mode account — Gamer tier does not shortcut CLI mode's need for a
  real webview sign-in the way it does for agent mode.
- Which tab you can actually use is decided by `SteamCookiesConnectPanel`'s own `canUseAutomatic`
  check, re-evaluated live against your current subscription tier and sign-in mode rather than
  fixed once when the panel first opens.
