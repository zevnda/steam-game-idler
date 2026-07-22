using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SteamKit2;
using SteamKit2.Internal;
using SteamUtility.Core;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Logging;
using SteamUtility.Core.Models;
using SteamUtility.Core.SchemaParsing;

namespace SteamUtility.Daemon.Bot
{
    // SteamKit2 has no built-in high-level stats/achievements handler, so this talks the raw
    // ClientGetUserStats/ClientStoreUserStats2 protobuf messages directly - the same wire messages
    // the real Steam client's ISteamUserStats uses internally. Schema parsing itself now lives in
    // Core/SchemaParsing/SchemaWalker.cs, shared with the local-client backend; this class only
    // handles the wire protocol and joins schema definitions with live wire values.
    public sealed class AchievementHandler : ClientMsgHandler
    {
        // Titles with a Valve Game Coordinator (TF2, CS2, Dota 2, etc.) don't use this generic
        // stats path - the GC has its own item/stat backend, unreachable via these generic
        // messages. This restriction is specific to this wire-protocol path: the local-client
        // backend's real Steam client handles GC titles fine via its own ISteamUserStats, so this
        // blocklist must NOT be applied there (see Backends/SteamworksLocalBackend.cs).
        private static readonly HashSet<uint> GameCoordinatorAppIds = new()
        {
            440, // Team Fortress 2
            570, // Dota 2
            730, // Counter-Strike 2
            550, // Left 4 Dead 2 (some GC-routed stats)
            620, // Portal 2 (co-op stats via GC)
        };

        public static bool IsGameCoordinatorTitle(uint appId) =>
            GameCoordinatorAppIds.Contains(appId);

        // Caps concurrent in-flight ClientGetUserStats round trips. Without this, a burst of
        // schema-less games in the achievement unlocker's scan phase (Rust's
        // achievements_get_agent_racing_schema_check races this call against a fast Web API
        // schema check and abandons its own future the instant the Web API wins - see that
        // function's doc comment) lets scan workers fire a new request here every time the Web
        // API resolves, without ever waiting out the ~7-10s this call takes for a schema-less
        // title. Dropping the Rust future doesn't stop this side's request - the bytes are
        // already on the wire by the time the race is decided - so nothing upstream throttles how
        // many of these pile up. Each one holds a SteamKit2 AsyncJob (job-manager bookkeeping,
        // protobuf buffers) alive for the full round trip, all funneled through one
        // single-threaded callback pump (SteamBot.RunCallbackLoop) - a large queue of no-
        // achievement games at high worker concurrency could stack up hundreds to thousands of
        // these at once, which is what drove SteamUtility.exe to spike to several GB of memory and
        // 100% CPU. Scoped to this one wire call (not the whole achievements_get/etc. method) so
        // only the actual expensive network round trip is rate-limited, not StoreStats or the
        // in-memory schema/stat processing around it.
        private static readonly SemaphoreSlim StatsRequestThrottle = new(6, 6);

        private async Task<StatsResult> GetStatsThrottled(uint appId, ulong steamId)
        {
            await StatsRequestThrottle.WaitAsync();
            try
            {
                return await GetStats(appId, steamId);
            }
            finally
            {
                StatsRequestThrottle.Release();
            }
        }

        // Mirrors SteamworksSession.RequestUserStats's CLI-mode handling: EResult.Fail from
        // ClientGetUserStats commonly just means "this game has no stats/achievements schema"
        // (e.g. Once Human 2139460, Banana Hellp 2068520), not a real request failure. Treating it
        // as a genuine error surfaced a misleading "stats_request_failed" toast for perfectly
        // normal games with no achievements.
        private static bool IsNoStatsResult(EResult result) => result == EResult.Fail;

        public sealed class StatsResult : CallbackMsg
        {
            public EResult Result;
            public uint CrcStats;
            public byte[] Schema;
            public List<CMsgClientGetUserStatsResponse.Stats> Stats;

            public StatsResult(JobID jobID, CMsgClientGetUserStatsResponse body)
            {
                JobID = jobID;
                Result = (EResult)body.eresult;
                CrcStats = body.crc_stats;
                Schema = body.schema ?? System.Array.Empty<byte>();
                Stats = body.stats ?? new List<CMsgClientGetUserStatsResponse.Stats>();
            }
        }

        public sealed class StoreStatsResult : CallbackMsg
        {
            public EResult Result;
            public List<CMsgClientStoreUserStatsResponse.Stats_Failed_Validation> StatsFailedValidation;

            public StoreStatsResult(JobID jobID, CMsgClientStoreUserStatsResponse body)
            {
                JobID = jobID;
                Result = (EResult)body.eresult;
                StatsFailedValidation =
                    body.stats_failed_validation
                    ?? new List<CMsgClientStoreUserStatsResponse.Stats_Failed_Validation>();
            }
        }

        public AsyncJob<StatsResult> GetStats(uint appId, ulong steamId)
        {
            var request = new ClientMsgProtobuf<CMsgClientGetUserStats>(EMsg.ClientGetUserStats);
            request.SourceJobID = Client.GetNextJobID();
            request.Body.game_id = appId;
            request.Body.steam_id_for_user = steamId;
            Client.Send(request);
            return new AsyncJob<StatsResult>(Client, request.SourceJobID);
        }

        public AsyncJob<StoreStatsResult> StoreStats(
            uint appId,
            ulong steamId,
            uint crcStats,
            List<CMsgClientStoreUserStats2.Stats> stats
        )
        {
            var request = new ClientMsgProtobuf<CMsgClientStoreUserStats2>(
                EMsg.ClientStoreUserStats2
            );
            request.SourceJobID = Client.GetNextJobID();
            request.Body.game_id = appId;
            request.Body.settor_steam_id = steamId;
            request.Body.settee_steam_id = steamId;
            request.Body.crc_stats = crcStats;
            request.Body.stats.AddRange(stats);
            Client.Send(request);
            return new AsyncJob<StoreStatsResult>(Client, request.SourceJobID);
        }

        public override void HandleMsg(IPacketMsg packetMsg)
        {
            switch (packetMsg.MsgType)
            {
                case EMsg.ClientGetUserStatsResponse:
                    var statsResponse = new ClientMsgProtobuf<CMsgClientGetUserStatsResponse>(
                        packetMsg
                    );
                    Client.PostCallback(
                        new StatsResult(statsResponse.TargetJobID, statsResponse.Body)
                    );
                    break;
                case EMsg.ClientStoreUserStatsResponse:
                    var storeResponse = new ClientMsgProtobuf<CMsgClientStoreUserStatsResponse>(
                        packetMsg
                    );
                    Client.PostCallback(
                        new StoreStatsResult(storeResponse.TargetJobID, storeResponse.Body)
                    );
                    break;
            }
        }

        // `language` is one of Steam's schema language keys (e.g. "english", "italian",
        // "schinese") - see Rust's `achievements::steam_language::steam_language_for_locale`,
        // which is what maps this app's own locale to that key before this ever gets called.
        // Defaults to English so every other caller of this method (SetAchievementAsync,
        // SetAchievementsBulkAsync, etc., none of which surface display text back to the
        // frontend) doesn't need to change.
        public async Task<(
            IReadOnlyList<AchievementDto> Achievements,
            IReadOnlyList<StatDto> Stats
        )> GetAchievementsAndStatsAsync(uint appId, SteamID steamId, string language = "english")
        {
            if (IsGameCoordinatorTitle(appId))
            {
                throw new GameCoordinatorUnsupportedException();
            }

            var statsResult = await GetStatsThrottled(appId, steamId);
            if (statsResult.Result != EResult.OK && !IsNoStatsResult(statsResult.Result))
            {
                throw new StatsRequestFailedException(statsResult.Result.ToString());
            }

            var achievementDefs = SchemaWalker.ParseAchievementDefinitions(
                appId,
                statsResult.Schema,
                language
            );
            var statDefs = SchemaWalker.ParseStatDefinitions(appId, statsResult.Schema, language);
            var statValues = statsResult.Stats.ToDictionary(s => s.stat_id, s => s.stat_value);

            var achievements = achievementDefs
                .Select(def =>
                {
                    var value = statValues.TryGetValue(def.StatId, out var v) ? v : 0;
                    var achieved = ((value >> def.BitNumber) & 1) != 0;
                    var flags = StatFlagHelper.GetFlags(def.Permission, false, true);
                    return new AchievementDto
                    {
                        Id = def.Id,
                        Name = def.Name,
                        Description = def.Description,
                        IconNormal = def.IconNormal,
                        IconLocked = def.IconLocked,
                        Permission = def.Permission,
                        Hidden = def.Hidden,
                        Achieved = achieved,
                        // No SteamKit2 wire-protocol equivalent of GetAchievementAchievedPercent
                        // exists, so this stays null (omitted from JSON) rather than faked. Not a
                        // permanent gap for callers, though: the percentage is public, session-
                        // independent data (Steam's GetGlobalAchievementPercentagesForApp Web API),
                        // so the Rust side backfills it after the fact - see
                        // achievements::commands::backfill_global_percentages.
                        Percent = null,
                        ProtectedAchievement = (flags & StatFlags.Protected) != 0,
                        Flags = flags.ToString(),
                    };
                })
                .ToList();

            var stats = statDefs
                .Select(def =>
                {
                    var rawValue = statValues.TryGetValue(def.StatId, out var v) ? v : 0;
                    object value =
                        def.Type == "integer"
                            ? (int)rawValue
                            : System.BitConverter.UInt32BitsToSingle(rawValue);
                    var flags = StatFlagHelper.GetFlags(def.Permission, def.IncrementOnly, false);
                    return new StatDto
                    {
                        Id = def.Id,
                        Name = def.DisplayName,
                        StatType = def.Type,
                        Permission = def.Permission,
                        Value = value,
                        IncrementOnly = def.IncrementOnly,
                        ProtectedStat = (flags & StatFlags.Protected) != 0,
                        Flags = flags.ToString(),
                    };
                })
                .ToList();

            return (achievements, stats);
        }

        public async Task UpdateStatsAsync(
            uint appId,
            SteamID steamId,
            IReadOnlyList<StatUpdateRequest> updates
        )
        {
            if (IsGameCoordinatorTitle(appId))
            {
                throw new GameCoordinatorUnsupportedException();
            }

            var statsResult = await GetStatsThrottled(appId, steamId);
            if (statsResult.Result != EResult.OK && !IsNoStatsResult(statsResult.Result))
            {
                throw new StatsRequestFailedException(statsResult.Result.ToString());
            }

            var definitions = SchemaWalker.ParseStatDefinitions(appId, statsResult.Schema);
            var storeStats = new List<CMsgClientStoreUserStats2.Stats>();

            foreach (var update in updates)
            {
                var def = definitions.FirstOrDefault(d => d.Id == update.Name);
                if (def == null)
                {
                    throw new StatNotFoundException(update.Name);
                }

                var flags = StatFlagHelper.GetFlags(def.Permission, def.IncrementOnly, false);
                if ((flags & StatFlags.Protected) != 0)
                {
                    throw new StatProtectedException(update.Name);
                }

                var rawValue =
                    def.Type == "integer"
                        ? (uint)(int)System.Math.Round(update.Value)
                        : System.BitConverter.SingleToUInt32Bits((float)update.Value);

                storeStats.Add(
                    new CMsgClientStoreUserStats2.Stats
                    {
                        stat_id = def.StatId,
                        stat_value = rawValue,
                    }
                );
            }

            var storeResult = await StoreStats(appId, steamId, statsResult.CrcStats, storeStats);
            if (storeResult.Result != EResult.OK)
            {
                throw new StoreStatsFailedException(storeResult.Result.ToString());
            }
            if (storeResult.StatsFailedValidation.Count > 0)
            {
                throw new StoreStatsFailedException("stats_failed_validation");
            }
        }

        // Mirrors the native ISteamUserStats.ResetAllStats(false) semantics: zero every plain stat
        // (to its schema default) and clear every achievement group's underlying stat in one
        // StoreStats call, bypassing per-stat Protected flags the same way the native privileged
        // reset call does.
        public async Task ResetAllStatsAsync(uint appId, SteamID steamId)
        {
            if (IsGameCoordinatorTitle(appId))
            {
                throw new GameCoordinatorUnsupportedException();
            }

            var statsResult = await GetStatsThrottled(appId, steamId);
            if (statsResult.Result != EResult.OK && !IsNoStatsResult(statsResult.Result))
            {
                throw new StatsRequestFailedException(statsResult.Result.ToString());
            }

            var achievementDefs = SchemaWalker.ParseAchievementDefinitions(
                appId,
                statsResult.Schema
            );
            var statDefs = SchemaWalker.ParseStatDefinitions(appId, statsResult.Schema);
            var resetStats = new List<CMsgClientStoreUserStats2.Stats>();

            foreach (var groupStatId in achievementDefs.Select(d => d.StatId).Distinct())
            {
                resetStats.Add(
                    new CMsgClientStoreUserStats2.Stats { stat_id = groupStatId, stat_value = 0 }
                );
            }

            foreach (var def in statDefs)
            {
                var defaultRaw =
                    def.Type == "integer"
                        ? (uint)(int)def.DefaultValue
                        : System.BitConverter.SingleToUInt32Bits((float)def.DefaultValue);
                resetStats.Add(
                    new CMsgClientStoreUserStats2.Stats
                    {
                        stat_id = def.StatId,
                        stat_value = defaultRaw,
                    }
                );
            }

            var storeResult = await StoreStats(appId, steamId, statsResult.CrcStats, resetStats);
            if (storeResult.Result != EResult.OK)
            {
                throw new StoreStatsFailedException(storeResult.Result.ToString());
            }
            if (storeResult.StatsFailedValidation.Count > 0)
            {
                throw new StoreStatsFailedException("stats_failed_validation");
            }
        }

        // Batched form of SetAchievementAsync (see ISteamStatsBackend.SetAchievementsAsync's doc
        // comment) - one GetStats + one StoreStats network round trip for the whole `changes` list,
        // instead of a round-trip pair per achievement. Multiple achievements can share the same
        // packed StatId (several bits in one stat value), so every change is folded into a shared
        // `workingValues` map before building the final StoreStats payload, rather than each change
        // reading/writing its own stat_id in isolation.
        public async Task<(
            IReadOnlyList<string> Succeeded,
            IReadOnlyList<string> Failed
        )> SetAchievementsBulkAsync(
            uint appId,
            SteamID steamId,
            IReadOnlyList<(string Id, bool Unlock)> changes
        )
        {
            if (IsGameCoordinatorTitle(appId))
            {
                throw new GameCoordinatorUnsupportedException();
            }

            var statsResult = await GetStatsThrottled(appId, steamId);
            if (statsResult.Result != EResult.OK && !IsNoStatsResult(statsResult.Result))
            {
                throw new StatsRequestFailedException(statsResult.Result.ToString());
            }

            var definitions = SchemaWalker.ParseAchievementDefinitions(appId, statsResult.Schema);
            var defById = definitions.ToDictionary(d => d.Id);
            var workingValues = statsResult.Stats.ToDictionary(s => s.stat_id, s => s.stat_value);

            var succeeded = new List<string>();
            var failed = new List<string>();
            var touchedStatIds = new HashSet<uint>();

            foreach (var (achievementId, unlock) in changes)
            {
                if (!defById.TryGetValue(achievementId, out var def))
                {
                    Log.Warn(
                        "AchievementHandler",
                        $"Bulk set: achievement not found: {achievementId}"
                    );
                    failed.Add(achievementId);
                    continue;
                }

                var flags = StatFlagHelper.GetFlags(def.Permission, false, true);
                if ((flags & StatFlags.Protected) != 0)
                {
                    Log.Warn(
                        "AchievementHandler",
                        $"Bulk set: achievement protected: {achievementId}"
                    );
                    failed.Add(achievementId);
                    continue;
                }

                var current = workingValues.TryGetValue(def.StatId, out var v) ? v : 0;
                workingValues[def.StatId] = unlock
                    ? current | (1u << def.BitNumber)
                    : current & ~(1u << def.BitNumber);
                touchedStatIds.Add(def.StatId);
                succeeded.Add(achievementId);
            }

            if (succeeded.Count == 0)
            {
                return (succeeded, failed);
            }

            var storeStats = touchedStatIds
                .Select(statId => new CMsgClientStoreUserStats2.Stats
                {
                    stat_id = statId,
                    stat_value = workingValues[statId],
                })
                .ToList();

            var storeResult = await StoreStats(appId, steamId, statsResult.CrcStats, storeStats);
            if (storeResult.Result != EResult.OK || storeResult.StatsFailedValidation.Count > 0)
            {
                // The one batched StoreStats call failed - none of the attempted changes above
                // actually persisted, so move them all to failed rather than reporting a false
                // success.
                Log.Warn(
                    "AchievementHandler",
                    $"Bulk set: StoreStats failed for app {appId}, {succeeded.Count} changes not persisted"
                );
                failed.AddRange(succeeded);
                succeeded.Clear();
            }

            return (succeeded, failed);
        }

        public async Task SetAchievementAsync(
            uint appId,
            SteamID steamId,
            string achievementId,
            bool unlock
        )
        {
            if (IsGameCoordinatorTitle(appId))
            {
                throw new GameCoordinatorUnsupportedException();
            }

            var statsResult = await GetStatsThrottled(appId, steamId);
            if (statsResult.Result != EResult.OK && !IsNoStatsResult(statsResult.Result))
            {
                throw new StatsRequestFailedException(statsResult.Result.ToString());
            }

            var definitions = SchemaWalker.ParseAchievementDefinitions(appId, statsResult.Schema);
            var def = definitions.FirstOrDefault(d => d.Id == achievementId);
            if (def == null)
            {
                throw new AchievementNotFoundException(achievementId);
            }

            var flags = StatFlagHelper.GetFlags(def.Permission, false, true);
            if ((flags & StatFlags.Protected) != 0)
            {
                throw new AchievementProtectedException(achievementId);
            }

            var currentValue =
                statsResult.Stats.FirstOrDefault(s => s.stat_id == def.StatId)?.stat_value ?? 0;
            var newValue = unlock
                ? currentValue | (1u << def.BitNumber)
                : currentValue & ~(1u << def.BitNumber);

            var storeResult = await StoreStats(
                appId,
                steamId,
                statsResult.CrcStats,
                new List<CMsgClientStoreUserStats2.Stats>
                {
                    new() { stat_id = def.StatId, stat_value = newValue },
                }
            );

            if (storeResult.Result != EResult.OK)
            {
                throw new StoreStatsFailedException(storeResult.Result.ToString());
            }
            if (storeResult.StatsFailedValidation.Count > 0)
            {
                throw new StoreStatsFailedException("stats_failed_validation");
            }
        }
    }
}
