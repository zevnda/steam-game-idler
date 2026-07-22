using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SteamKit2;
using SteamKit2.Internal;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Logging;
using SteamUtility.Core.Models;

namespace SteamUtility.Daemon.Bot
{
    // Resolves ownership straight from the authenticated CM session's licenses via PICS - no local
    // Steam client needed. Correctly reflects Family Sharing / borrowed games.
    public sealed class OwnershipManager
    {
        // Payment methods that were never an actual money transaction through Steam's checkout -
        // Steam's refund policy has nothing to refund for these regardless of how recently the
        // license was granted, so they're excluded entirely from "recently purchased" tracking
        // rather than treated as a purchase with a normal date.
        private static readonly HashSet<EPaymentMethod> NonMonetaryPaymentMethods = new()
        {
            EPaymentMethod.None,
            EPaymentMethod.ActivationCode,
            EPaymentMethod.HardwarePromo,
            EPaymentMethod.AutoGrant,
            EPaymentMethod.OEMTicket,
            EPaymentMethod.Complimentary,
            EPaymentMethod.FamilyGroup,
            EPaymentMethod.MasterComp,
            EPaymentMethod.Promotional,
        };

        private static bool IsRefundEligiblePurchase(EPaymentMethod paymentMethod) =>
            !NonMonetaryPaymentMethods.Contains(paymentMethod);

        // Resolved once per ResolveOwnedAppIdsAsync call: every owned app id, plus - for apps with
        // at least one refund-eligible license - the most recent qualifying license's TimeCreated.
        // "Most recent" (not earliest) because what matters for refund-window purposes is the most
        // recent time this account paid for the app; an old license on the same app id doesn't make
        // a newer paid purchase any less refundable.
        private readonly record struct OwnedAppResolution(
            HashSet<uint> AppIds,
            Dictionary<uint, DateTime> LastRefundEligiblePurchaseUtcByAppId
        );

        public async Task<IReadOnlyList<OwnedGame>> GetOwnedGamesAsync(SteamBot bot)
        {
            if (!bot.IsLoggedOn)
            {
                throw new NotLoggedOnException();
            }

            // Deliberately unfiltered: every PICS-resolved app id tied to an owned license comes
            // through as-is (games, videos/movies, DLC, tools, demos, soundtracks) - agent mode has
            // no curated-whitelist dependency the way CLI mode's SteamworksLocalBackend does, so
            // there's no ownership-check reason to intersect against GameWhitelistProvider here.
            // This intentionally surfaces non-game owned content (e.g. Steam movies like
            // 518440/518450) that the whitelist used to drop. CLI mode is unaffected - it still
            // depends on the whitelist as its only ownership-check candidate list, see
            // SteamworksLocalBackend.CheckOwnershipAsync.

            // LicenseListCallback (what OwnedLicenses below is built from) is a separate server
            // push with no ordering guarantee relative to the login success this call is triggered
            // by - without this wait, a fetch fired immediately after sign-in on a freshly
            // authenticated bot can race ahead of it and resolve zero owned games. See SteamBot's
            // WaitForLicenseListAsync doc comment.
            await bot.WaitForLicenseListAsync(TimeSpan.FromSeconds(10));
            var resolution = await ResolveOwnedAppIdsAsync(bot);

            var games = new List<OwnedGame>();
            if (resolution.AppIds.Count > 0)
            {
                var appRequests = resolution.AppIds
                    .Select(appId => new SteamApps.PICSRequest(appId))
                    .ToList();

                var appResultSet = await bot.SteamAppsHandler.PICSGetProductInfo(
                    apps: appRequests,
                    packages: Enumerable.Empty<SteamApps.PICSRequest>()
                );

                var playtimes = await GetPlaytimesAsync(bot);

                foreach (var result in appResultSet.Results!)
                {
                    foreach (var (appId, info) in result.Apps)
                    {
                        var rawName = info.KeyValues["common"]["name"].AsString();
                        var name = string.IsNullOrEmpty(rawName) ? null : rawName;
                        playtimes.TryGetValue(appId, out var playtime);
                        resolution.LastRefundEligiblePurchaseUtcByAppId.TryGetValue(
                            appId,
                            out var lastRefundEligiblePurchaseUtc
                        );
                        games.Add(new OwnedGame
                        {
                            AppId = appId,
                            Name = name,
                            PlaytimeForeverMinutes = playtime.PlaytimeForeverMinutes,
                            RtimeLastPlayed = playtime.RtimeLastPlayed,
                            LastRefundEligiblePurchaseUnixSeconds = lastRefundEligiblePurchaseUtc == default
                                ? null
                                : new DateTimeOffset(lastRefundEligiblePurchaseUtc, TimeSpan.Zero).ToUnixTimeSeconds(),
                        });
                    }
                }
            }

            return games;
        }

        // Enriches PICS-based ownership with playtime via SteamKit2's own Player.GetOwnedGames#1
        // unified message, sent over the already-authenticated CM session, requested as the account
        // itself rather than through a public API key - never subject to Steam Community
        // profile-visibility restrictions the way Rust's games::web_api enrichment is.
        // Best-effort: a failure here only means playtime stays null for this fetch, not that the
        // whole ownership list fails - PICS-derived ownership above already succeeded independently.
        private static async Task<
            Dictionary<uint, (uint? PlaytimeForeverMinutes, uint? RtimeLastPlayed)>
        > GetPlaytimesAsync(SteamBot bot)
        {
            var result = new Dictionary<uint, (uint?, uint?)>();
            try
            {
                var playerService = bot.UnifiedMessagesHandler.CreateService<Player>();
                var request = new CPlayer_GetOwnedGames_Request
                {
                    steamid = bot.SteamID!.ConvertToUInt64(),
                    include_appinfo = false,
                    include_played_free_games = true,
                    include_free_sub = true,
                    skip_unvetted_apps = false,
                    include_extended_appinfo = false,
                };

                var response = await playerService.GetOwnedGames(request);
                if (response.Result != EResult.OK)
                {
                    Log.Warn(
                        "OwnershipManager",
                        $"Player.GetOwnedGames returned {response.Result}, playtime will be unavailable this fetch"
                    );
                    return result;
                }

                foreach (var game in response.Body.games)
                {
                    result[(uint)game.appid] = ((uint)game.playtime_forever, game.rtime_last_played);
                }
            }
            catch (Exception ex)
            {
                Log.Warn("OwnershipManager", $"Failed to fetch playtime via Player.GetOwnedGames: {ex.Message}");
            }

            return result;
        }

        private static async Task<OwnedAppResolution> ResolveOwnedAppIdsAsync(SteamBot bot)
        {
            var ownedAppIds = new HashSet<uint>();
            var lastRefundEligiblePurchaseUtcByAppId = new Dictionary<uint, DateTime>();

            var packageRequests = bot
                .OwnedLicenses.Select(license => new SteamApps.PICSRequest(
                    license.PackageID,
                    license.AccessToken
                ))
                .ToList();

            if (packageRequests.Count == 0)
            {
                return new OwnedAppResolution(ownedAppIds, lastRefundEligiblePurchaseUtcByAppId);
            }

            // Grouped rather than a throwing ToDictionary - a duplicate PackageID reported by
            // SteamKit2 must never crash ownership resolution, so we deliberately just keep
            // whichever one we see first.
            var licensesByPackageId = bot.OwnedLicenses.ToLookup(license => license.PackageID);

            var packageResultSet = await bot.SteamAppsHandler.PICSGetProductInfo(
                apps: Enumerable.Empty<SteamApps.PICSRequest>(),
                packages: packageRequests
            );

            foreach (var result in packageResultSet.Results!)
            {
                foreach (var (packageId, package) in result.Packages)
                {
                    var appIdsNode = package.KeyValues["appids"];
                    if (appIdsNode.Children is not { Count: > 0 })
                    {
                        continue;
                    }

                    var appIds = appIdsNode.Children.Select(child => child.AsUnsignedInteger(0)).ToList();

                    foreach (var appId in appIds)
                    {
                        ownedAppIds.Add(appId);
                    }

                    var license = licensesByPackageId[packageId].FirstOrDefault();
                    if (license == null || !IsRefundEligiblePurchase(license.PaymentMethod))
                    {
                        continue;
                    }

                    // SteamKit2 builds TimeCreated from a raw Unix timestamp with DateTimeKind
                    // left as Unspecified - force Utc explicitly so downstream conversion to Unix
                    // seconds is never silently wrong for whatever the calling machine's local
                    // timezone happens to be.
                    var timeCreatedUtc = DateTime.SpecifyKind(license.TimeCreated, DateTimeKind.Utc);

                    foreach (var appId in appIds)
                    {
                        if (
                            !lastRefundEligiblePurchaseUtcByAppId.TryGetValue(appId, out var existing)
                            || timeCreatedUtc > existing
                        )
                        {
                            lastRefundEligiblePurchaseUtcByAppId[appId] = timeCreatedUtc;
                        }
                    }
                }
            }

            return new OwnedAppResolution(ownedAppIds, lastRefundEligiblePurchaseUtcByAppId);
        }
    }
}
