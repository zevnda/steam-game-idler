using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SteamKit2;
using SteamKit2.Internal;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Logging;
using SteamUtility.Core.Models;
using SteamUtility.Core.Services;

namespace SteamUtility.Daemon.Bot
{
    // Resolves ownership straight from the authenticated CM session's licenses via PICS - no local
    // Steam client needed. Correctly reflects Family Sharing / borrowed games.
    public sealed class OwnershipManager
    {
        private readonly GameWhitelistProvider _whitelistProvider = new();

        public async Task<IReadOnlyList<OwnedGame>> GetOwnedGamesAsync(SteamBot bot)
        {
            if (!bot.IsLoggedOn)
            {
                throw new NotLoggedOnException();
            }

            var whitelist = await _whitelistProvider.GetWhitelistAsync();

            // LicenseListCallback (what OwnedLicenses below is built from) is a separate server
            // push with no ordering guarantee relative to the login success this call is triggered
            // by - without this wait, a fetch fired immediately after sign-in on a freshly
            // authenticated bot can race ahead of it and resolve zero owned games. See SteamBot's
            // WaitForLicenseListAsync doc comment.
            await bot.WaitForLicenseListAsync(TimeSpan.FromSeconds(10));
            var ownedAppIds = await ResolveOwnedAppIdsAsync(bot);
            ownedAppIds.IntersectWith(whitelist);

            var games = new List<OwnedGame>();
            if (ownedAppIds.Count > 0)
            {
                var appRequests = ownedAppIds
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
                        games.Add(new OwnedGame
                        {
                            AppId = appId,
                            Name = name,
                            PlaytimeForeverMinutes = playtime.PlaytimeForeverMinutes,
                            RtimeLastPlayed = playtime.RtimeLastPlayed,
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

        private static async Task<HashSet<uint>> ResolveOwnedAppIdsAsync(SteamBot bot)
        {
            var ownedAppIds = new HashSet<uint>();

            var packageRequests = bot
                .OwnedLicenses.Select(license => new SteamApps.PICSRequest(
                    license.PackageID,
                    license.AccessToken
                ))
                .ToList();

            if (packageRequests.Count == 0)
            {
                return ownedAppIds;
            }

            var packageResultSet = await bot.SteamAppsHandler.PICSGetProductInfo(
                apps: Enumerable.Empty<SteamApps.PICSRequest>(),
                packages: packageRequests
            );

            foreach (var result in packageResultSet.Results!)
            {
                foreach (var package in result.Packages.Values)
                {
                    var appIdsNode = package.KeyValues["appids"];
                    if (appIdsNode.Children is not { Count: > 0 })
                    {
                        continue;
                    }

                    foreach (var child in appIdsNode.Children)
                    {
                        ownedAppIds.Add(child.AsUnsignedInteger(0));
                    }
                }
            }

            return ownedAppIds;
        }
    }
}
