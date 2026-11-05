import { useEffect, useRef } from 'react'
import { logFrontendInfo, logFrontendWarn } from '@/shared/utils/frontendLogging'
import { invoke } from '@/shared/utils/invoke'
import { clearLegacyMigrationData } from '@/shared/utils/update'

// Companion to the Rust-side `legacy_migration` module: that side wipes the on-disk cache
// directory once, before the webview even loads, for anyone upgrading from any pre-6.0.0 release
// (or a fresh install - both are safe, see its doc comment). This hook is the other half - a
// one-time `localStorage`/`sessionStorage` clear (preserving `licenseKey` only, see
// `clearLegacyMigrationData`), gated by `was_legacy_migration_performed` so it only runs on the
// exact launch the backend just migrated, and skipped unless the profile really holds pre-6.0.0 data.
export function useLegacyMigrationCleanup() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    ;(async () => {
      try {
        const migrated = await invoke<boolean>('was_legacy_migration_performed')
        if (migrated) {
          const cleared = await clearLegacyMigrationData()
          logFrontendInfo(
            'legacyMigration',
            cleared ? 'cleared pre-6.0.0 local storage' : 'no pre-6.0.0 local storage to clear',
            {},
          )
        }
      } catch (error) {
        console.error('Error in (useLegacyMigrationCleanup):', error)
        logFrontendWarn('legacyMigration', 'migration check failed', { error: String(error) })
      }
    })()
  }, [])
}
