import type { VersionPolicyStatus } from '@/shared/utils/versionPolicy'
import { getVersion } from '@tauri-apps/api/app'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useEffect } from 'react'
import { useVersionPolicyStore } from '@/shared/stores/versionPolicyStore'
import { logFrontendInfo, logFrontendWarn } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import {
  evaluateVersionPolicy,
  fetchVersionPolicy,
  readCachedVersionPolicy,
} from '@/shared/utils/versionPolicy'

// The startup check blocks the rest of the app from mounting, so it gets a short budget - a normal
// GitHub fetch is a few hundred ms, and a slow/unreachable one falls back to the cached policy
// rather than holding every launch hostage.
const STARTUP_TIMEOUT_MS = 2500
// Re-checked while running so a long-lived session (tray, autostart) still gets blocked once its
// version is retired, not only on its next launch.
const RECHECK_INTERVAL_MS = 60 * 60 * 1000
const RECHECK_TIMEOUT_MS = 10_000

// Surfaces the window for a hard block - a `start_minimized`/autostart launch stays hidden in the
// tray (see lib.rs's `setup_window`), and a blocked app the user can't see would just look dead.
async function revealWindow() {
  try {
    const window = getCurrentWindow()
    await window.show()
    await window.setFocus()
  } catch (error) {
    logFrontendWarn('useVersionPolicy', 'failed to reveal window for unsupported-version block', {
      error: String(error),
    })
  }
}

/**
 * Resolves this build's status against the remote version policy (see `utils/versionPolicy.ts`)
 * and keeps `versionPolicyStore` current. Mounted once, at the `_app.tsx` gate, ahead of every
 * other app hook - while `status` is `checking` or `unsupported` the gate never mounts the rest of
 * the app, so no sign-in, Steam connection, or API call happens before the check resolves.
 *
 * Fails open: a failed fetch falls back to the last cached policy, and no policy at all means
 * `supported`. A failed re-check keeps the current status rather than resetting it.
 */
export function useVersionPolicy() {
  const status = useVersionPolicyStore(state => state.status)

  useEffect(() => {
    let cancelled = false

    const apply = async (next: VersionPolicyStatus, currentVersion: string | null) => {
      const previous = useVersionPolicyStore.getState().status
      if (cancelled || next === previous) return

      if (next === 'unsupported') {
        logFrontendInfo(
          'useVersionPolicy',
          'this version is no longer supported, blocking the app',
          {
            currentVersion,
          },
        )
        // A mid-session block unmounts the app tree, but automation runs Rust-side - end every
        // SteamUtility process (agents, idling, claims) so nothing keeps running behind the dialog.
        // Card farming / achievement unlocker loops abort on their own once their session dies.
        if (previous !== 'checking') {
          await invoke('kill_all_steam_utility_processes').catch(error =>
            logFrontendWarn(
              'useVersionPolicy',
              'failed to stop automation for unsupported-version block',
              {
                error: String(error),
              },
            ),
          )
        }
        await revealWindow()
      } else if (next === 'outdated') {
        logFrontendInfo('useVersionPolicy', 'this version is outdated, recommending an update', {
          currentVersion,
        })
      }

      useVersionPolicyStore.getState().setResult(next, currentVersion)
    }

    const check = async (isStartup: boolean) => {
      let currentVersion: string | null = null
      try {
        currentVersion = await getVersion()
      } catch (error) {
        logFrontendWarn('useVersionPolicy', 'could not read app version, skipping version policy', {
          error: String(error),
        })
      }

      const fresh = currentVersion
        ? await fetchVersionPolicy(isStartup ? STARTUP_TIMEOUT_MS : RECHECK_TIMEOUT_MS)
        : null

      if (!fresh && !isStartup) return
      const policy = fresh ?? readCachedVersionPolicy()
      await apply(
        currentVersion ? evaluateVersionPolicy(policy, currentVersion) : 'supported',
        currentVersion,
      )
    }

    check(true)
    const intervalId = setInterval(() => check(false), RECHECK_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [])

  return status
}
