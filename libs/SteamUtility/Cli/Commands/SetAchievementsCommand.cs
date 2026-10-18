using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;
using SteamUtility.Core.Errors;

namespace SteamUtility.Cli.Commands
{
    // Batched form of unlock_achievement/lock_achievement for an arbitrary unlock+lock mix (the
    // Achievement Manager's staged "Save changes"): one SteamworksSession and one StoreStats for the
    // whole list via the backend's SetAchievementsAsync, instead of one process spawn and full
    // init/RequestUserStats/shutdown cycle per achievement. CLI-mode counterpart of the daemon's
    // achievement_set_bulk.
    public sealed class SetAchievementsCommand : ICliCommand
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        private sealed class ChangeRequest
        {
            public string Id { get; set; } = "";
            public bool Unlock { get; set; }
        }

        private readonly ISteamStatsBackend _backend;

        public SetAchievementsCommand(ISteamStatsBackend backend)
        {
            _backend = backend;
        }

        public async Task<CliResult> ExecuteAsync(string[] args, CancellationToken ct)
        {
            if (args.Length < 3)
            {
                return CliResult.Failure(
                    "invalid_args",
                    "Usage: SteamUtility.exe set_achievements <app_id> <[{id, unlock}...]>"
                );
            }
            if (!uint.TryParse(args[1], out var appId))
            {
                throw new InvalidAppIdException();
            }

            List<ChangeRequest>? changes;
            try
            {
                // Re-joined like update_stats, in case the JSON arg got split on spaces.
                changes = JsonSerializer.Deserialize<List<ChangeRequest>>(
                    string.Join(" ", args.Skip(2)),
                    JsonOptions
                );
            }
            catch (Exception ex)
            {
                return CliResult.Failure("invalid_changes_format", ex.Message);
            }

            if (changes == null || changes.Count == 0)
            {
                return CliResult.Failure(
                    "invalid_changes_format",
                    "Expected a JSON array of {id, unlock} objects"
                );
            }

            var (succeeded, failed) = await _backend.SetAchievementsAsync(
                appId,
                changes.Select(c => (c.Id, c.Unlock)).ToList(),
                ct
            );
            return CliResult.Success(new { succeeded, failed });
        }
    }
}
