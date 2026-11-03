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
        // SteamKit2 cancels a job after 10 seconds without a response by default. A normal fetch of
        // around 800 games already takes about 8 seconds in total, so a slow or throttling Steam
        // pushed these full-library requests past that limit and failed them outright. Each part of
        // a multi-part response extends the deadline, so this only limits silence between parts.
        private static readonly TimeSpan PicsJobTimeout = TimeSpan.FromSeconds(30);

        // Fetches running right now, shared by anyone asking for the same thing. Each one requests
        // the account's entire license and app list from Steam, and repeated triggers (reloading the
        // window, an account switch landing during a refresh) used to stack up as separate full
        // requests that all then competed for the same slow responses.
        private readonly object _inFlightLock = new();
        private readonly Dictionary<
            (bool GamesOnly, string Language),
            Task<IReadOnlyList<OwnedGame>>
        > _inFlightFetches = new();

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

        // PICS's own app classification (common.type - SteamKit2's EAppType as a raw string:
        // "Game", "DLC", "Demo", "Tool", "Application", "Music", "Video", "Config", etc.) is what
        // gamesOnly filters on below. Deliberately not GameWhitelistProvider's curated external
        // list (unlike CLI mode's SteamworksLocalBackend.CheckOwnershipAsync, which has no choice -
        // Steamworks' IsSubscribedApp only answers yes/no for an app id you already have, so CLI
        // mode depends on the whitelist as its candidate list, not just a filter). Agent mode
        // already resolves the real, complete owned-app-id set via PICS with no candidate list
        // needed, so it isn't bound by that constraint - and a store-delisted-but-still-owned game
        // (e.g. Rocket League, 252950, delisted 2020) keeps its PICS common.type of "Game" even
        // after falling out of whatever active-store-listing source the external whitelist is
        // built from, so classifying from PICS directly (rather than an externally curated list)
        // catches those correctly.
        private static readonly HashSet<string> GameAppTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "Game",
        };

        public Task<IReadOnlyList<OwnedGame>> GetOwnedGamesAsync(
            SteamBot bot,
            bool gamesOnly,
            string language
        )
        {
            var key = (gamesOnly, language);
            lock (_inFlightLock)
            {
                if (_inFlightFetches.TryGetValue(key, out var inFlight))
                {
                    return inFlight;
                }

                var fetch = RunFetchAsync(bot, gamesOnly, language);
                _inFlightFetches[key] = fetch;
                return fetch;
            }
        }

        private async Task<IReadOnlyList<OwnedGame>> RunFetchAsync(
            SteamBot bot,
            bool gamesOnly,
            string language
        )
        {
            // Hands control back straight away, so GetOwnedGamesAsync has registered this fetch and
            // released its lock before the removal below can possibly run.
            await Task.Yield();
            try
            {
                return await FetchOwnedGamesAsync(bot, gamesOnly, language);
            }
            finally
            {
                lock (_inFlightLock)
                {
                    _inFlightFetches.Remove((gamesOnly, language));
                }
            }
        }

        private async Task<IReadOnlyList<OwnedGame>> FetchOwnedGamesAsync(
            SteamBot bot,
            bool gamesOnly,
            string language
        )
        {
            if (!bot.IsLoggedOn)
            {
                throw new NotLoggedOnException();
            }

            // By default (gamesOnly: false) this is deliberately unfiltered: every PICS-resolved
            // app id tied to an owned license comes through as-is (games, videos/movies, DLC,
            // tools, demos, soundtracks) - some users specifically want this, including non-game
            // owned content (e.g. Steam movies like 518440/518450) that gamesOnly would drop. When
            // gamesOnly is true (a user-facing setting - see
            // src-tauri/src/steam_agent/ownership_settings.rs), each resolved app id's own PICS
            // common.type (see GameAppTypes above) decides whether it's kept - applied per-app
            // below, once PICSGetProductInfo's response is in hand, since type isn't known until
            // then. Family Sharing / borrowed games are unaffected either way - that's inherent to
            // bot.OwnedLicenses below, not something either mode filters.

            // LicenseListCallback (what OwnedLicenses below is built from) is a separate server
            // push with no ordering guarantee relative to the login success this call is triggered
            // by - without this wait, a fetch fired immediately after sign-in on a freshly
            // authenticated bot can race ahead of it and resolve zero owned games. See SteamBot's
            // WaitForLicenseListAsync doc comment.
            await bot.WaitForLicenseListAsync(TimeSpan.FromSeconds(10));
            var resolution = await ResolveOwnedAppIdsAsync(bot);

            var appIds = resolution.AppIds;

            var games = new List<OwnedGame>();
            if (appIds.Count > 0)
            {
                var appRequests = appIds
                    .Select(appId => new SteamApps.PICSRequest(appId))
                    .ToList();

                var appsJob = bot.SteamAppsHandler.PICSGetProductInfo(
                    apps: appRequests,
                    packages: Enumerable.Empty<SteamApps.PICSRequest>()
                );
                appsJob.Timeout = PicsJobTimeout;
                var appResultSet = await appsJob;

                var playtimes = await GetPlaytimesAsync(bot);

                foreach (var result in appResultSet.Results!)
                {
                    foreach (var (appId, info) in result.Apps)
                    {
                        var commonNode = info.KeyValues["common"];
                        if (gamesOnly && !GameAppTypes.Contains(commonNode["type"].AsString() ?? ""))
                        {
                            continue;
                        }

                        var name = ResolveLocalizedName(commonNode, language);
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

        // Fills in AchievementGroupDto.Owned for every DLC Achievement Set, from the same
        // license-based PICS resolution GetOwnedGamesAsync uses - that set covers every owned app id
        // including DLC (package `appids` list them), regardless of the gamesOnly display filter.
        // Skips the lookup entirely for a game without DLC sets. Best-effort: on failure the groups
        // come back with Owned left null, which every consumer treats as owned (fail open - see
        // AchievementGroupDto), so a flaky PICS call never blocks an unlock outright.
        public async Task<IReadOnlyList<AchievementGroupDto>> ApplyDlcOwnershipAsync(
            SteamBot bot,
            IReadOnlyList<AchievementGroupDto> groups
        )
        {
            if (!groups.Any(group => group.DlcAppId != null))
            {
                return groups;
            }

            try
            {
                await bot.WaitForLicenseListAsync(TimeSpan.FromSeconds(10));
                var owned = (await ResolveOwnedAppIdsAsync(bot)).AppIds;
                return groups
                    .Select(group =>
                        group.DlcAppId is uint dlcAppId
                            ? group with { Owned = owned.Contains(dlcAppId) }
                            : group
                    )
                    .ToList();
            }
            catch (Exception ex)
            {
                Log.Warn(
                    "OwnershipManager",
                    $"Failed to resolve DLC ownership for achievement sets: {ex.Message}"
                );
                return groups;
            }
        }

        // Mirrors CLI mode's AppInfoReader.BuildResult (SteamUtility/Core/AppInfoParsing/) - same
        // `common.name_localized` field, same reasoning for not reusing an achievement-style
        // preferred->english->first-available walker: common.name (the flat, always-present
        // field) is a reliable fallback, so falling through to some other unrelated language
        // present in name_localized instead of the flat name would be actively wrong, not just
        // imprecise. The only difference from CLI mode's version is the KeyValue type this walks -
        // SteamKit2's own `KeyValue` (from the live PICS response), not this project's hand-rolled
        // SchemaParsing/AppInfoParsing readers used for the local appinfo.vdf cache file - but the
        // wire and on-disk formats carry the same data shape once decoded.
        private static string? ResolveLocalizedName(KeyValue common, string preferredLanguage)
        {
            var englishName = common["name"].AsString();

            var localizedNode = common["name_localized"];
            if (localizedNode.Children is { Count: > 0 })
            {
                var preferred = localizedNode.Children.FirstOrDefault(child =>
                    string.Equals(child.Name, preferredLanguage, StringComparison.OrdinalIgnoreCase)
                );
                var resolved = preferred?.AsString();
                if (!string.IsNullOrEmpty(resolved))
                {
                    return resolved;
                }
            }

            return string.IsNullOrEmpty(englishName) ? null : englishName;
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

            var packagesJob = bot.SteamAppsHandler.PICSGetProductInfo(
                apps: Enumerable.Empty<SteamApps.PICSRequest>(),
                packages: packageRequests
            );
            packagesJob.Timeout = PicsJobTimeout;
            var packageResultSet = await packagesJob;

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
