using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SteamKit2;
using SteamUtility.Core.Errors;

namespace SteamUtility.Daemon.Bot
{
    public sealed class FreeLicenseResult
    {
        public required bool Granted { get; init; }
        public required IReadOnlyList<uint> GrantedApps { get; init; }
        public required IReadOnlyList<uint> GrantedPackages { get; init; }
        public required string Result { get; init; }
    }

    // Claims a free game via SteamKit2's SteamApps.RequestFreeLicense - a real Steam-network
    // license grant, no cookies/webview/local Steam client needed (unlike the CLI-mode/local-client
    // backend, which has no equivalent in the Steamworks.NET SDK surface and falls back to a
    // cookie-authenticated store-page webview click on the Rust side instead - see
    // src-tauri/src/local_steam/free_game_claim.rs).
    public sealed class FreeLicenseManager
    {
        // Bounded wait for OwnershipManager's next PICS-based ownership read (get_owned_apps, and
        // therefore the Rust side's immediate post-claim games-list refresh) to actually reflect a
        // grant this call already confirmed - see SteamBot.WaitForPackagesInLicensesAsync's doc
        // comment for why this can't be assumed to already be true the instant RequestFreeLicense
        // returns. 10s comfortably covers the CM's normal license-list-repush latency without
        // meaningfully delaying the claim UI, and stays well under the Rust host's 30s IPC timeout.
        private static readonly TimeSpan LicenseListSyncTimeout = TimeSpan.FromSeconds(10);

        public async Task<FreeLicenseResult> RequestFreeLicenseAsync(SteamBot bot, uint appId)
        {
            if (!bot.IsLoggedOn)
            {
                throw new NotLoggedOnException();
            }

            var callback = await bot.SteamAppsHandler.RequestFreeLicense(appId);

            // Result == EResult.OK does NOT by itself mean a new license was granted - Steam
            // returns OK with both lists empty for an already-owned/no-op case (confirmed against
            // Actions.AddFreeLicenseApp, the most widely-used real consumer of
            // this exact SteamKit2 API). Granted-list-non-empty is the only reliable success check.
            var granted = callback.GrantedApps.Count > 0 || callback.GrantedPackages.Count > 0;

            if (granted && callback.GrantedPackages.Count > 0)
            {
                await bot.WaitForPackagesInLicensesAsync(callback.GrantedPackages, LicenseListSyncTimeout);
            }

            return new FreeLicenseResult
            {
                Granted = granted,
                GrantedApps = callback.GrantedApps.ToList(),
                GrantedPackages = callback.GrantedPackages.ToList(),
                Result = callback.Result.ToString(),
            };
        }
    }
}
