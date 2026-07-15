using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Logging;
using SteamUtility.Core.Models;
using SteamUtility.Core.SchemaParsing;
using SteamUtility.Core.Services;
using Steamworks;

namespace SteamUtility.Backends
{
    // Requires a real, running, logged-in local Steam client (via steam_api.dll IPC). This is the
    // "continue without signing in" fallback path - see Cli/Commands/*Command.cs, which dispatch
    // into this backend.
    public sealed class SteamworksLocalBackend : ISteamStatsBackend
    {
        private readonly GameWhitelistProvider _whitelistProvider = new();

        public Task<(
            IReadOnlyList<AchievementDto> Achievements,
            IReadOnlyList<StatDto> Stats
        )> GetAchievementsAndStatsAsync(uint appId, CancellationToken ct)
        {
            using var session = SteamworksSession.Open(appId, ct);
            session.RequestGlobalAchievementPercentages(ct);

            var schemaBytes = LoadLocalSchemaBytes(appId);
            if (schemaBytes == null)
            {
                Log.Warn("SteamworksLocalBackend", $"No local schema found for app {appId}");
                return Task.FromResult<(IReadOnlyList<AchievementDto>, IReadOnlyList<StatDto>)>(
                    (new List<AchievementDto>(), new List<StatDto>())
                );
            }

            var achievementDefs = SchemaWalker.ParseAchievementDefinitions(appId, schemaBytes);
            var statDefs = SchemaWalker.ParseStatDefinitions(appId, schemaBytes);

            var achievements = achievementDefs
                .Select(def =>
                {
                    SteamUserStats.GetAchievement(def.Id, out var achieved);
                    var hasPercent = SteamUserStats.GetAchievementAchievedPercent(
                        def.Id,
                        out var percent
                    );
                    var flags = StatFlagHelper.GetFlags(def.Permission, false, true);

                    // Prefer the live localized display attribute over the schema's raw fallback
                    // text, matching the old local project's behavior; fall back when Steam returns
                    // an empty string.
                    var name = SteamUserStats.GetAchievementDisplayAttribute(def.Id, "name");
                    var description = SteamUserStats.GetAchievementDisplayAttribute(def.Id, "desc");

                    return new AchievementDto
                    {
                        Id = def.Id,
                        Name = string.IsNullOrEmpty(name) ? def.Name : name,
                        Description = string.IsNullOrEmpty(description)
                            ? def.Description
                            : description,
                        IconNormal = def.IconNormal,
                        IconLocked = def.IconLocked,
                        Permission = def.Permission,
                        Hidden = def.Hidden,
                        Achieved = achieved,
                        Percent = hasPercent ? percent : null,
                        ProtectedAchievement = (flags & StatFlags.Protected) != 0,
                        Flags = flags.ToString(),
                    };
                })
                .ToList();

            var stats = statDefs
                .Select(def =>
                {
                    object value;
                    if (def.Type == "integer")
                    {
                        SteamUserStats.GetStat(def.Id, out int intValue);
                        value = intValue;
                    }
                    else
                    {
                        SteamUserStats.GetStat(def.Id, out float floatValue);
                        value = floatValue;
                    }

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

            return Task.FromResult<(IReadOnlyList<AchievementDto>, IReadOnlyList<StatDto>)>(
                (achievements, stats)
            );
        }

        public Task SetAchievementAsync(
            uint appId,
            string achievementId,
            bool unlock,
            CancellationToken ct
        )
        {
            using var session = SteamworksSession.Open(appId, ct);

            if (!SteamUserStats.GetAchievement(achievementId, out _))
            {
                throw new AchievementNotFoundException(achievementId);
            }

            // Protected-flag guard: the pre-merge local commands never checked this before writing,
            // unlike the daemon path. Added here for parity between backends (see Phase 1 plan).
            // Falls back to "unprotected" only when the schema itself can't be read, preserving the
            // old permissive behavior in that edge case rather than blocking a write we can't
            // actually evaluate.
            var permission = GetAchievementPermission(appId, achievementId);
            var flags = StatFlagHelper.GetFlags(permission, false, true);
            if ((flags & StatFlags.Protected) != 0)
            {
                throw new AchievementProtectedException(achievementId);
            }

            var success = unlock
                ? SteamUserStats.SetAchievement(achievementId)
                : SteamUserStats.ClearAchievement(achievementId);

            if (!success || !SteamUserStats.StoreStats())
            {
                throw new StoreStatsFailedException(
                    $"Failed to {(unlock ? "unlock" : "lock")} achievement {achievementId}"
                );
            }

            return Task.CompletedTask;
        }

        // Batched form of SetAchievementAsync (see ISteamStatsBackend's doc comment) - one
        // SteamworksSession and one StoreStats() call for the whole `changes` list, instead of a
        // full init/RequestUserStats/shutdown cycle per achievement. The schema is also loaded once
        // up front rather than once per achievement (GetAchievementPermission re-reads it from disk
        // each call).
        public Task<(IReadOnlyList<string> Succeeded, IReadOnlyList<string> Failed)> SetAchievementsAsync(
            uint appId,
            IReadOnlyList<(string Id, bool Unlock)> changes,
            CancellationToken ct
        )
        {
            using var session = SteamworksSession.Open(appId, ct);

            var schemaBytes = LoadLocalSchemaBytes(appId);
            var permissionById =
                schemaBytes != null
                    ? SchemaWalker
                        .ParseAchievementDefinitions(appId, schemaBytes)
                        .ToDictionary(d => d.Id, d => d.Permission)
                    : new Dictionary<string, int>();

            var succeeded = new List<string>();
            var failed = new List<string>();

            foreach (var (achievementId, unlock) in changes)
            {
                if (!SteamUserStats.GetAchievement(achievementId, out _))
                {
                    Log.Warn("SteamworksLocalBackend", $"Bulk set: achievement not found: {achievementId}");
                    failed.Add(achievementId);
                    continue;
                }

                var permission = permissionById.TryGetValue(achievementId, out var p) ? p : 0;
                var flags = StatFlagHelper.GetFlags(permission, false, true);
                if ((flags & StatFlags.Protected) != 0)
                {
                    Log.Warn("SteamworksLocalBackend", $"Bulk set: achievement protected: {achievementId}");
                    failed.Add(achievementId);
                    continue;
                }

                var success = unlock
                    ? SteamUserStats.SetAchievement(achievementId)
                    : SteamUserStats.ClearAchievement(achievementId);

                if (success)
                {
                    succeeded.Add(achievementId);
                }
                else
                {
                    Log.Warn("SteamworksLocalBackend", $"Bulk set: SetAchievement/ClearAchievement failed: {achievementId}");
                    failed.Add(achievementId);
                }
            }

            if (succeeded.Count > 0 && !SteamUserStats.StoreStats())
            {
                // The one batched StoreStats() call failed - none of the attempted changes above
                // actually persisted, so move them all to failed rather than reporting a false
                // success.
                Log.Warn("SteamworksLocalBackend", $"Bulk set: StoreStats failed for app {appId}, {succeeded.Count} changes not persisted");
                failed.AddRange(succeeded);
                succeeded.Clear();
            }

            return Task.FromResult<(IReadOnlyList<string>, IReadOnlyList<string>)>((succeeded, failed));
        }

        public Task UpdateStatsAsync(
            uint appId,
            IReadOnlyList<StatUpdateRequest> updates,
            CancellationToken ct
        )
        {
            using var session = SteamworksSession.Open(appId, ct);

            var schemaBytes = LoadLocalSchemaBytes(appId);
            var statDefs =
                schemaBytes != null
                    ? SchemaWalker.ParseStatDefinitions(appId, schemaBytes)
                    : new List<StatDefinition>();

            foreach (var update in updates)
            {
                var def = statDefs.FirstOrDefault(d => d.Id == update.Name);
                if (def == null)
                {
                    throw new StatNotFoundException(update.Name);
                }

                var flags = StatFlagHelper.GetFlags(def.Permission, def.IncrementOnly, false);
                if ((flags & StatFlags.Protected) != 0)
                {
                    throw new StatProtectedException(update.Name);
                }

                var success =
                    def.Type == "integer"
                        ? SteamUserStats.SetStat(update.Name, (int)System.Math.Round(update.Value))
                        : SteamUserStats.SetStat(update.Name, (float)update.Value);

                if (!success)
                {
                    throw new StoreStatsFailedException($"Failed to set stat {update.Name}");
                }
            }

            if (!SteamUserStats.StoreStats())
            {
                throw new StoreStatsFailedException("Failed to store updated stats");
            }

            return Task.CompletedTask;
        }

        public Task ResetAllStatsAsync(uint appId, CancellationToken ct)
        {
            using var session = SteamworksSession.Open(appId, ct);

            if (!SteamUserStats.ResetAllStats(false) || !SteamUserStats.StoreStats())
            {
                throw new StoreStatsFailedException("Failed to reset all stats");
            }

            return Task.CompletedTask;
        }

        public async Task<IReadOnlyList<OwnedGame>> CheckOwnershipAsync(
            IReadOnlyList<uint>? candidateAppIds,
            CancellationToken ct
        )
        {
            var candidates =
                candidateAppIds ?? (await _whitelistProvider.GetWhitelistAsync()).ToList();

            // Uses the raw steamclient64.dll interop (Interop/Client.cs), not Steamworks.NET's
            // managed SteamAPI_Init() - Initialize(0) means "no specific app", so this one session
            // can check ownership of every candidate app id without re-initializing per app (unlike
            // the achievement/stat methods above, which are legitimately scoped to one app each).
            using var client = new Interop.Client();

            try
            {
                client.Initialize(0);
            }
            catch (Interop.ClientInitializeException ex)
            {
                var (code, message, suggestion) = ex.FailureReason switch
                {
                    Interop.ClientInitializeFailure.InstallPathNotFound => (
                        "steam_install_not_found",
                        "Could not find Steam installation path",
                        "Make sure Steam is installed"
                    ),
                    Interop.ClientInitializeFailure.LibraryLoadFailed => (
                        "steam_client_load_failed",
                        "Could not load steamclient64.dll",
                        "Make sure Steam is installed correctly"
                    ),
                    Interop.ClientInitializeFailure.UserConnectionFailed => (
                        "steam_not_running",
                        "Could not connect to Steam user",
                        "Make sure Steam is running and you are logged in"
                    ),
                    Interop.ClientInitializeFailure.ClientCreationFailed => (
                        "steam_client_creation_failed",
                        "Could not create Steam client interface",
                        ""
                    ),
                    Interop.ClientInitializeFailure.PipeCreationFailed => (
                        "steam_pipe_creation_failed",
                        "Could not create Steam pipe",
                        ""
                    ),
                    _ => ("steam_client_error", ex.Message, ""),
                };
                throw new SteamClientInteropException(code, message, suggestion);
            }

            var owned = new List<OwnedGame>();
            foreach (var appId in candidates)
            {
                ct.ThrowIfCancellationRequested();

                bool isOwned;
                try
                {
                    isOwned = client.SteamApps008.IsSubscribedApp(appId);
                }
                catch
                {
                    // Matches the pre-merge behavior: if a specific app id's check fails, skip it
                    // rather than aborting the whole batch.
                    continue;
                }

                if (!isOwned)
                {
                    continue;
                }

                string? name = null;
                try
                {
                    name = client.SteamApps001.GetAppData(appId, "name");
                }
                catch
                {
                    // Name resolution is best-effort - ownership is still reported without it.
                }

                owned.Add(new OwnedGame { AppId = appId, Name = name });
            }

            return owned;
        }

        private static byte[]? LoadLocalSchemaBytes(uint appId)
        {
            var installPath = SteamPathHelper.GetSteamInstallPath();
            if (string.IsNullOrEmpty(installPath))
            {
                return null;
            }

            var path = Path.Combine(
                installPath,
                "appcache",
                "stats",
                $"UserGameStatsSchema_{appId}.bin"
            );
            return File.Exists(path) ? File.ReadAllBytes(path) : null;
        }

        private static int GetAchievementPermission(uint appId, string achievementId)
        {
            var schemaBytes = LoadLocalSchemaBytes(appId);
            if (schemaBytes == null)
            {
                return 0;
            }

            var def = SchemaWalker
                .ParseAchievementDefinitions(appId, schemaBytes)
                .FirstOrDefault(d => d.Id == achievementId);
            return def?.Permission ?? 0;
        }
    }
}
