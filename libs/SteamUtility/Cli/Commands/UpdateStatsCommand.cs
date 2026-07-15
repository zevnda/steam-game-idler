using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Models;

namespace SteamUtility.Cli.Commands
{
    public sealed class UpdateStatsCommand : ICliCommand
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        private readonly ISteamStatsBackend _backend;

        public UpdateStatsCommand(ISteamStatsBackend backend)
        {
            _backend = backend;
        }

        public async Task<CliResult> ExecuteAsync(string[] args, CancellationToken ct)
        {
            if (args.Length < 3)
            {
                return CliResult.Failure(
                    "invalid_args",
                    "Usage: SteamUtility.exe update_stats <app_id> <[stat_objects...]>"
                );
            }
            if (!uint.TryParse(args[1], out var appId))
            {
                throw new InvalidAppIdException();
            }

            List<StatUpdateRequest>? updates;
            try
            {
                var jsonArray = string.Join(" ", args.Skip(2));
                updates = JsonSerializer.Deserialize<List<StatUpdateRequest>>(
                    jsonArray,
                    JsonOptions
                );
            }
            catch (Exception ex)
            {
                return CliResult.Failure("invalid_stats_format", ex.Message);
            }

            if (updates == null || updates.Count == 0)
            {
                return CliResult.Failure(
                    "invalid_stats_format",
                    "Expected a JSON array of {name, value} objects"
                );
            }

            await _backend.UpdateStatsAsync(appId, updates, ct);
            return CliResult.Success(new { status = "updated" });
        }
    }
}
