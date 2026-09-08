This file is generated corpus content, produced by the `/generate-ui-guide` skill from the real
`src/features/ai-chat/` component/hook source, `src/shared/stores/aiChatStore.ts`,
`src/shared/components/titlebar/AiChatButton.tsx`, `src/shared/components/titlebar/Titlebar.tsx`,
`src/pages/_app.tsx`, and the AI Assistant's tier-comparison row in
`src/shared/components/pro/GoProModal/data.ts` (cross-checked against `docs/.../pro.mdx`'s tier
table). No dedicated docs page exists for this feature yet (only `pro.mdx`, which markets it as a
tier perk rather than explaining its UI), so there is nothing to supersede. It is the single merged
source for this feature and should be regenerated via that skill whenever the chat overlay's UI,
stores, or tier caps change — not hand-patched for small drift.

# AI Assistant

## What this feature is

The AI Assistant is an in-app chat panel that answers questions about how to use Steam Game Idler —
a retrieval-backed Q&A helper over the app's own docs/UI content, not a general-purpose chatbot and
not something that can change app settings or trigger actions on your behalf. It has no route of
its own under `/dashboard/*`; it's a modal overlay (`AiChatOverlay`) that can be opened from
anywhere in the app, including before you've signed in to any Steam account.

## Opening the AI Assistant

The trigger is the **"AI Assistant"** button (`AiChatButton`) in the titlebar — a robot-face icon
(`RiRobot3Line`) inside a plain `h-14 w-12` icon button. It sits in the titlebar's right-hand button
group, in this left-to-right order: an update button (only if an app update is available), **AI
Assistant**, Help Desk, Notifications, Menu, then a vertical divider before the window
minimize/maximize/close controls. Hovering it shows a tooltip reading "AI Assistant" (300ms delay,
appears below the icon). Clicking it calls `aiChatStore`'s `open()` and raises the chat modal.

**The AI Assistant button is visible at every subscription tier, including Free** — unlike Help
Desk (which is hidden entirely below Casual tier), there is no locked/hidden state for this button.
Every tier can open the chat and send messages; what differs by tier is only the daily message cap
(see "Daily message limit" below).

**Reachable before signing in to Steam.** `AiChatOverlay` is mounted at the root of the app in
`src/pages/_app.tsx` (alongside the Titlebar, toast provider, and `GoProModal`), not inside
`DashboardShell` — so it renders on the pre-dashboard sign-in landing screen too, not just on
`/dashboard/*` pages. The titlebar's `AiChatButton` is likewise shown regardless of whether you're
signed in. Nothing about asking a question requires a signed-in Steam account; if you are signed in,
your account is used only to help route the request, not to gate access to the feature.

## The chat window layout

The chat opens as a modal (HeroUI `Modal`, size `lg`), roughly 1000px tall (capped at 95% of the
viewport height) with a fixed header, a scrollable message area in the middle, and a footer that
holds either the message composer or the daily-limit notice.

- **Header**: the title "AI Assistant", followed by a small rounded pill showing your current
  message usage as a plain fraction like `2 / 25` (only shown once at least one quota response has
  come back from the server — it's blank on first open until you've sent a message or it's already
  cached from earlier in the session). To the far right of the header is a **"New chat"** icon
  button (a speech-bubble icon, `TbMessage`) with a "New chat" tooltip, and a separate close (X)
  button in the header's own corner closes the whole modal.
- **Body**: the message feed. Before you've sent anything, it shows a centered empty state reading
  **"Ask me anything"** (no subtext beyond that heading). Once you've sent at least one message,
  this becomes a scrolling list of message bubbles (see "Sending a question" below). The feed
  auto-scrolls to the newest message every time a message is added or the pending/sending state
  changes; reopening the modal jumps straight to the bottom instantly rather than animating from the
  top.
- **Footer**: normally the message composer (a text input plus a send button). Once you've hit your
  daily message cap, the composer is replaced entirely by the limit notice described below — you
  cannot see or use the input box at all while capped.

## Sending a question and getting a reply

Type into the input field (placeholder text: "Ask a question about Steam Game Idler...") and either
press Enter or click the send button (a paper-plane icon, `TbSend2`, to the right of the input).
Both the input and the send button are disabled while a reply is in flight or while you're capped
for the day; the send button is additionally disabled whenever the input is empty/whitespace-only.

- **Your message** appears immediately as a right-aligned bubble (accent-colored background, white
  text), shown exactly as typed with line breaks preserved.
- **While waiting for a reply**, a left-aligned bubble containing only a loading spinner appears
  beneath your message — there is no streaming/typing-in effect, the whole reply arrives at once.
- **The assistant's reply** replaces that spinner with a left-aligned bubble (neutral surface
  background) containing the answer, rendered as formatted Markdown rather than plain text.

## Markdown rendering in assistant replies

Assistant replies are rendered with `react-markdown` (GitHub-Flavored Markdown enabled via
`remark-gfm`), scaled down to fit a narrow chat bubble. Confirmed supported elements, and exactly
how each renders inside a reply bubble:

- **Headings** (`#` through `######`) render as bold/semibold text at small sizes appropriate to a
  chat bubble (not full page-heading sizes).
- **Paragraphs, bullet lists, and numbered lists** render normally, including GFM task-list
  checkboxes (`- [ ]`) as real (disabled) checkboxes with no redundant bullet next to them.
- **Blockquotes** render with a left border and slightly faded/italic text.
- **Inline code** (`` `like this` ``) renders in a small monospace font on a light shaded
  background; **fenced code blocks** render the same shaded background as a scrollable block (no
  syntax highlighting, just monospace text) so a long line doesn't blow out the bubble's width.
- **Tables** (GFM tables) render as real bordered tables with a header row, wrapped in their own
  horizontal-scroll container so a wide table doesn't force the whole chat bubble wider than its
  80%-of-window max width.
- **Links** are the one element that doesn't behave like normal Markdown: an assistant reply's link
  renders as underlined accent-colored clickable text, but clicking it does **not** navigate inside
  the app or open a new in-app view — it calls `openExternalLink`, which hands the URL to your
  system's default web browser (via Tauri's opener plugin) and leaves the chat window exactly where
  it was. This is how the assistant cites its sources: when it references a specific docs page for
  something, that reference is an ordinary Markdown link in the reply text (there is no separate
  "Sources" section, footnote list, or citation panel below a reply — any source reference is
  embedded inline as a normal link within the answer itself).
- User messages (the right-hand bubbles you send) are **not** Markdown-rendered — they show as
  plain text with preserved line breaks, since only assistant replies go through the Markdown
  pipeline.

## Conversational memory

The assistant remembers your **immediately preceding exchange only** — your last question and its
answer — not your full conversation history. When you send a new question, the app looks at the two
most recent messages in the open conversation; if they form a complete user-then-assistant pair,
that single exchange is sent along as context for your new question. Anything further back in the
conversation (a third-most-recent message onward) is not sent with the request, even though it's
still visible on screen in the message feed above. This means the assistant can follow up on your
very last question naturally ("what about on Linux?" right after asking about a Windows-specific
flow) but won't reliably recall something you asked several messages earlier in the same
conversation — for that, rephrase your question with the full context restated.

## Starting a new chat

The "New chat" button (speech-bubble icon, top-right of the header, next to the usage pill) clears
the visible conversation and the input box. It's disabled whenever there are no messages yet (an
already-empty conversation) or while a reply is currently pending. **Starting a new chat does not
reset your daily message quota** — the usage count shown in the header pill and the daily cap
described below are tied to your account/day, not to any one conversation, so clearing the chat
window has no effect on how many messages you have left today.

## Daily message limit and what happens when you hit it

Every tier gets a fixed number of AI Assistant messages per calendar day (UTC), enforced by the
server that answers each question. The exact caps, as shown in the app's own Pro-tier comparison
table (`GoProModal`, "AI Assistant messages" row): **Free — 3 messages/day, Casual — 25
messages/day, Gamer — 50 messages/day.** The header's usage pill (e.g. `2 / 25`) reflects your
actual current tier's cap once the server has responded at least once in the session.

**Once you've used your full daily allotment**, the message composer (input box and send button) is
completely replaced in the footer by a limit notice — you cannot type or attempt to send another
message until either the day resets or you upgrade:

- **On Free or Casual tier**: the footer shows the text "Daily limit reached. Upgrade to continue or
  wait {time}." alongside an **"Upgrade"** button. `{time}` is a live countdown to the next reset
  (formatted as whichever single unit is largest — e.g. "3h", "42m", or "18s" — counting down, not a
  fixed clock time), reflecting that the cap resets at the next UTC midnight. Clicking "Upgrade"
  opens the Pro upgrade modal (`GoProModal`), pre-scrolled to Gamer tier if you're already Casual, or
  to Casual tier if you're currently Free — the same shared upgrade-modal pattern used by every other
  tier-gated control in the app.
- **On Gamer tier** (the highest tier, so there's no higher tier to upgrade to for a bigger cap): the
  footer instead shows only centered muted text: "Daily limit reached. Resets in {time}." with the
  same live countdown format, and no upgrade button at all.
- If you activate a license key or your subscription tier otherwise changes while the chat is open,
  the app fetches your usage under the new tier's identity on your very next message — you are not
  left permanently stuck showing an old tier's exhausted quota after upgrading.

Note the Go Pro modal's tier-comparison table lists the AI Assistant purely as a comparison row
(with the three per-tier message counts above); it is not one of that modal's separately highlighted
feature cards.

## Error and failure states

If a request to the assistant fails outright (network error, or the server errors) or the server
denies the request due to a rate limit, the assistant "replies" with a plain-text error message
bubble instead of a real answer — styled identically to a normal assistant reply bubble, just with
generic text rather than Markdown content:

- A general failure (network problem, unexpected server error, or the server responded but without
  a usable answer) shows: **"Something went wrong. Please try again shortly."**
- A request that the server rejects specifically as over the message cap (HTTP 429) shows: **"You've
  reached today's message limit. Come back tomorrow, or upgrade for a higher daily limit."** — this
  can appear as a reply bubble even outside the composer-replaced limit state described above, e.g.
  if your locally-tracked usage count hasn't caught up yet with a cap the server enforces.
- In both cases, your own question still appears as sent (it isn't rolled back or removed), and the
  input becomes usable again immediately afterward unless you're now capped for the day.

## Cross-feature connections

- **`aiChatStore`** (`src/shared/stores/aiChatStore.ts`) is this feature's only dedicated store —
  `isOpen`, the message list, `isSending`, and `quota`. It is deliberately session-only (cleared on
  app restart, never persisted) and deliberately **not** keyed per Steam account the way
  `idlingStore`/`cardFarmingStore`/etc. are: this is treated as one global conversation helper, not
  per-account automation state, so switching the active Steam account in the account switcher does
  not start a new conversation or otherwise touch the chat.
- **`subscriptionStore`** supplies the current tier used to decide the daily cap messaging (which
  limit-notice variant is shown) and which upgrade tier the "Upgrade" button targets. A change in
  subscription tier mid-session also clears any cached `quota` object in `aiChatStore`, so the next
  message re-fetches fresh usage numbers under the new tier rather than showing stale exhausted
  usage from before the change.
- **`proModalStore`**'s `openWithTier('casual' | 'gamer')` is what the limit notice's "Upgrade"
  button reroutes to — the same shared tier-gating pattern used by every other gated control in the
  app (a real, clickable control rather than a disabled one, rerouted to the upgrade modal).
- **`sessionStore`**: if you're signed in to a Steam account when you send a question, that
  account's identity is included with the request; if you're not signed in (or on the pre-dashboard
  sign-in screen), the question is still sent and answered normally with no account information
  attached. Being signed in does not raise or lower your message cap or change how replies look —
  it plays no visible role in the chat UI itself.
- **Titlebar** (`src/shared/components/titlebar/Titlebar.tsx`): hosts the `AiChatButton` trigger as
  described above; the titlebar is itself global chrome mounted once in `_app.tsx`; and the
  minimized/"splash screen" mode of the titlebar (shown during app boot or a self-update) hides the
  AI Assistant button along with every other titlebar control until the app finishes loading.
- **Sign-in-mode differences**: none. The AI Assistant's request/response flow doesn't branch on
  Steam Sign-in vs. Legacy Sign-in at all — it behaves identically regardless of sign-in mode, and
  identically whether or not any account is signed in.
- **Settings**: this feature has no dedicated Settings tab or settings file of its own; there is
  nothing to configure about it beyond your subscription tier (which is managed from the
  Subscription settings tab / Go Pro modal, not from within the chat itself).
