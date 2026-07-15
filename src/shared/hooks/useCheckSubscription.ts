import type { SubscriptionApiResult } from '@/shared/utils/subscriptionApi'
import { useEffect } from 'react'
import { useSessionStore } from '@/shared/stores/sessionStore'
import { logFrontendWarn } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import {
  applySubscriptionResult,
  clearSubscription,
  SUBSCRIPTION_API_URL,
} from '@/shared/utils/subscriptionApi'

const CHECK_INTERVAL_MS = 3 * 60 * 60 * 1000
const LICENSE_KEY_STORAGE_KEY = 'licenseKey'

interface SubscriptionApiResponse {
  revoked?: boolean
  licenseKey?: string
  results?: SubscriptionApiResult
}

// Resolves a SteamID64 for the signed-in account regardless of sign-in mode - local mode already
// has one (from `local_steam::commands::get_users`), agent mode needs the backend to resolve it
// from its live session (see `games::commands::resolve_account_steam_id`'s doc comment).
async function resolveSteamId(
  account: NonNullable<ReturnType<typeof useSessionStore.getState>['account']>,
) {
  if (account.mode === 'local') return account.steamId
  return invoke<string>('resolve_account_steam_id', { account })
}

// Periodically verifies this device/account's Pro subscription against the live licensing API
// (same external service `main` uses), keeping `subscriptionStore` current. Mirrors `main`'s
// `useCheckSubscription` - same request shape
// (steamId-or-licenseKey + deviceFingerprint), same revoked -> force-quit behavior, same
// grandfather-cutoff rule for pre-cutoff subscribers.
export function useCheckSubscription() {
  const account = useSessionStore(state => state.account)

  useEffect(() => {
    if (!account) return
    let cancelled = false

    const checkSubscription = async () => {
      try {
        const steamId = await resolveSteamId(account)
        const licenseKey = localStorage.getItem(LICENSE_KEY_STORAGE_KEY)
        const deviceFingerprint = await invoke<string>('get_device_fingerprint')
        const requestBody = licenseKey
          ? { licenseKey, deviceFingerprint }
          : { steamId, deviceFingerprint }

        const response = await fetch(SUBSCRIPTION_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })

        const data = (await response.json()) as SubscriptionApiResponse

        if (cancelled) return

        if (data?.revoked) {
          await invoke('quit_app')
          return
        }

        // Migration: persist auto-generated key for legacy Steam ID subscribers
        if (!licenseKey && data?.licenseKey) {
          localStorage.setItem(LICENSE_KEY_STORAGE_KEY, data.licenseKey)
        }

        if (data?.results?.status) {
          applySubscriptionResult(data.results)
        } else {
          clearSubscription()
        }
      } catch (error) {
        console.error('Error in (checkSubscription):', error)
        if (!cancelled) {
          logFrontendWarn(
            'useCheckSubscription',
            'subscription check failed, clearing subscription state',
            { error: String(error) },
          )
          clearSubscription()
        }
      }
    }

    checkSubscription()
    const intervalId = setInterval(checkSubscription, CHECK_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [account])
}
