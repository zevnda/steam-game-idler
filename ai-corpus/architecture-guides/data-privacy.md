# Where your data lives, and what leaves your machine

Generated corpus content (see `.claude/skills/generate-architecture-guide/SKILL.md`) — verified
against `src-tauri/src/platform.rs`, `src/shared/hooks/useCheckSubscription.ts`,
`src/shared/utils/subscriptionApi.ts`, `src/features/ai-chat/hooks/useAiChat.ts`,
`src/shared/components/pro/AdSlot.tsx`, `src/shared/components/titlebar/HelpDesk.tsx`, and
`src/shared/components/pro/GoProModal/TierCard.tsx`, cross-checked against the published Privacy
Policy page. Regenerate via that skill if this behavior changes; don't hand-edit to patch small
drift.

## Everything is stored locally by default

Your settings, cache, and log files are all stored locally on your own computer, in the app's own
data folder (or, if you're running the portable Windows build, right alongside the app's own
executable instead) — none of this is uploaded or synced to any SGI-controlled server just by
having the app installed and running.

## Finding your log file

If you ever need to find your log file (for example, to attach to a bug report), you can reveal it
in your file explorer from the Debug tab in Settings, rather than needing to know the exact folder
path yourself.

## Clearing your local data

The Debug tab in Settings also has two different ways to remove locally-stored data: a lighter
"Reset settings" (returns your preferences and per-account feature settings to their defaults
without signing anyone out) and a much broader "Clear data" (signs every account out and deletes
all locally-stored app data on the device, including your settings file and every cached list —
this can't be undone). Both are confirmed with their own dialog before doing anything.

## What actually reaches the internet

A few things do talk to servers outside your machine as part of normal use:

- **Steam.** SGI talks directly to Steam's own servers (and, for Card Farming/Inventory Manager,
  your Steam Community web session) for anything Steam-related — achievement data, your games
  library, free-game detection, and so on. This never routes through SGI's own infrastructure.
- **SGI's subscription check.** If you're signed in, SGI periodically (roughly every 3 hours)
  checks in with SGI's own licensing server to confirm your Pro subscription status. This request
  identifies you by your Steam ID or license key, together with a non-personal device identifier
  used to help enforce the one-device-at-a-time rule for a license key.
- **The AI Assistant, if you use it.** Typing a question to the in-app AI Assistant sends that
  question's text (plus, for follow-up context, your immediately preceding exchange) to SGI's own
  server, which uses it to generate a reply. It also uses limited account context — such as your
  subscription tier — to apply the correct daily usage limits.
- **The sidebar ad, on the Free tier.** If you're not subscribed to at least Casual tier, the
  sidebar shows a small ad slot. It loads content from SGI's own website inside an embedded frame,
  which may include a Google-served ad and set cookies as part of that — the same as visiting the
  website directly. Casual tier and above removes this ad entirely.
- **Live support, on Casual tier and above.** Opening the in-app Help Desk connects to a
  third-party live-chat provider and shares some basic context with it — your Steam persona name
  and ID, the app version, your subscription tier, and whether you're on the installed or portable
  build — so support staff have context for your conversation.
- **Subscribing to Pro.** Choosing Stripe or PayPal opens that provider's own checkout in your
  browser, outside the app. Your card or PayPal details are entered there, directly with that
  provider — SGI itself never sees or stores them.

None of the above routes your data through any third party beyond Steam, SGI's own
infrastructure, and (only for the specific cases above) the ad, live-chat, and payment providers
named.
