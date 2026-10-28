using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SteamKit2;
using SteamKit2.Internal;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Logging;

namespace SteamUtility.Daemon.Bot
{
    // One game's achievement completion counts - mirrors src-tauri/src/games/mod.rs's
    // `AchievementProgress` wire shape (camelCase via DaemonHost's JsonOptions).
    public sealed record AchievementProgressDto(uint AppId, uint Unlocked, uint Total);

    // Per-game achievement completion counts for many games at once, via SteamKit2's
    // Player.GetTopAchievementsForGames#1 unified message over the already-authenticated CM
    // session. Counts-only and batched, unlike AchievementHandler's per-app ClientGetUserStats
    // (full schema + every stat, one round trip per game), so a whole library resolves in a
    // handful of round trips. Requested as the account itself, so it's never subject to Steam
    // Community privacy settings the way the same endpoint over the public Web API is (CLI mode's
    // src-tauri games::web_api::fetch_achievement_progress).
    //
    // Deliberately NOT Player.GetAchievementsProgress#1, even though that's the counts-only call
    // the Steam client's own library uses: measured live (2026-10), its results are cached
    // server-side - a lock still read as unlocked minutes later, and even an unlock sometimes lagged.
    // This call reflected both an unlock and a lock immediately in the same test.
    public sealed class AchievementProgressManager
    {
        // Measured live against the Web API form of this call (2026-10): 350 app ids per request
        // worked, 400 was rejected - this leaves headroom under that undocumented cap.
        private const int BatchSize = 200;

        // The response lists each game's *unlocked* achievements (with name/icon text), capped at
        // this many - asking for far more than any game has makes the list length the unlocked
        // count. Verified against a 1,342-achievement game's full schema fetch.
        private const uint MaxAchievementsPerGame = 10_000;

        public async Task<IReadOnlyList<AchievementProgressDto>> GetProgressAsync(
            SteamBot bot,
            IReadOnlyCollection<uint> appIds
        )
        {
            var steamId = bot.SteamID ?? throw new NotLoggedOnException();
            var playerService = bot.UnifiedMessagesHandler.CreateService<Player>();
            var result = new List<AchievementProgressDto>(appIds.Count);

            foreach (var batch in appIds.Distinct().Chunk(BatchSize))
            {
                var request = new CPlayer_GetTopAchievementsForGames_Request
                {
                    steamid = steamId.ConvertToUInt64(),
                    language = "english",
                    max_achievements = MaxAchievementsPerGame,
                };
                request.appids.AddRange(batch);

                // A failed batch is skipped, not fatal - its games just stay absent, and the Rust
                // side keeps their previously cached counts. Same best-effort contract as
                // OwnershipManager.GetPlaytimesAsync.
                try
                {
                    var response = await playerService.GetTopAchievementsForGames(request);
                    if (response.Result != EResult.OK)
                    {
                        Log.Warn(
                            "AchievementProgressManager",
                            $"Player.GetTopAchievementsForGames returned {response.Result} for a batch of {batch.Length}"
                        );
                        continue;
                    }

                    foreach (var game in response.Body.games)
                    {
                        var total = game.total_achievements;
                        // Min guards the one inconsistency that would read as "over 100%".
                        var unlocked = Math.Min((uint)game.achievements.Count, total);
                        result.Add(new AchievementProgressDto(game.appid, unlocked, total));
                    }
                }
                catch (Exception ex) when (ex is not NotLoggedOnException)
                {
                    Log.Warn(
                        "AchievementProgressManager",
                        $"Player.GetTopAchievementsForGames failed for a batch of {batch.Length}: {ex.Message}"
                    );
                }
            }

            return result;
        }
    }
}
