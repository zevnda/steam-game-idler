import type { AccountKey, SignedInAccount } from '@/shared/stores/sessionStore'

export type ProTier = 'casual' | 'gamer' | null

// Subscribers before this date get full Gamer access regardless of their plan_id - ported
// verbatim from `main` (`src/shared/utils/subscriptionAccess.ts`), same live subscription backend.
export const GRANDFATHER_CUTOFF = new Date('2026-04-10')

// Ad-free experience, exclusive themes, Discord role, live support
export function hasCasualAccess(tier: ProTier) {
  return tier === 'casual' || tier === 'gamer'
}

// Automated Steam credentials, auto games list updates, free game redemption, sell dupes
export function hasGamerAccess(tier: ProTier) {
  return tier === 'gamer'
}

// Automatic Steam Community cookie acquisition (no manually-pasted set) is Gamer-tier for both
// sign-in modes - `session::resolve`'s Rust side has no tier check at all by design (see its own
// doc comment; "no Rust-side tier enforcement anywhere in this system" is the deliberate,
// documented architecture), so every frontend call site that could end up invoking a
// cookie-gated command with no manual override must check this itself - not just the two places
// that already do (`useAutoConnectSteamCookies`'s mount-time decision,
// `SteamCookiesConnectPanel`'s own submit handler). A `refresh`/`start`/`listItems`-style action
// that reuses whatever manual-cookie ref currently holds can otherwise silently succeed via
// automatic derivation for a non-gamer account whenever that ref happens to be `undefined` - after
// a session-expiry reset, or because a cache-based instant-paint skipped the real connect step
// entirely (see `useInventory.ts`'s `hasLoaded`-from-cache doc comment).
export function canResolveCookiesAutomatically(hasManualOverride: boolean, tier: ProTier) {
  return hasManualOverride || hasGamerAccess(tier)
}

// Gamer's "unlimited" concurrent agent-mode accounts is a marketing promise, not a literal
// implementation ceiling - each concurrent account is a real child process + network connection,
// so a real hard cap still applies.
export const GAMER_SANITY_CAP_CONCURRENT_AGENT_ACCOUNTS = 10

// Concurrent agent-mode (SteamKit2/daemon) account cap. Only agent-mode accounts count against
// this: CLI mode is a separate, Steam-imposed
// one-account ceiling (a real local Steam client can only ever be signed into one account at a
// time), not a tier gate, so it's handled independently via `localDisabled`.
export function maxConcurrentAgentAccounts(tier: ProTier) {
  if (hasGamerAccess(tier)) return GAMER_SANITY_CAP_CONCURRENT_AGENT_ACCOUNTS
  if (hasCasualAccess(tier)) return 3
  return 1
}

// Which signed-in accounts a subscription downgrade (a lapsed renewal, a cleared license key) still
// permits as *active/switchable*, per the "never silently force-sign-out" rule. A
// downgrade never drops a session, only which ones can be switched to: local-mode accounts are
// always allowed (a separate, Steam-imposed one-account ceiling, not a tier gate - see
// `maxConcurrentAgentAccounts`'s own comment), and agent-mode accounts are allowed in add order
// (`Object.entries`'s iteration order, i.e. insertion order - see sessionStore.ts) up to the current
// tier's cap. The very first account ever added is therefore always allowed under any tier (every
// cap is >= 1), which is what makes it a safe fallback target - see
// `useAgentAccountCapEnforcement`.
export function computeAllowedAccountKeys(
  accounts: Record<AccountKey, SignedInAccount>,
  tier: ProTier,
) {
  const cap = maxConcurrentAgentAccounts(tier)
  const allowed = new Set<AccountKey>()
  let agentCount = 0

  for (const [key, account] of Object.entries(accounts)) {
    if (account.mode === 'local') {
      allowed.add(key)
    } else if (agentCount < cap) {
      allowed.add(key)
      agentCount += 1
    }
  }

  return allowed
}
