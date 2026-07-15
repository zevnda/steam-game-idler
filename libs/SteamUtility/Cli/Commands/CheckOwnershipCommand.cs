using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Core;

namespace SteamUtility.Cli.Commands
{
    // Stdout-only (matches the daemon path's get_owned_apps shape) - the pre-merge project's file
    // write side effect and its required output-path first argument are both dropped per the
    // Phase 1 plan's output-behavior decision. Ownership itself is resolved via
    // Backends/SteamworksLocalBackend.cs's placeholder-AppID approach, replacing the dropped raw
    // Interop/ vtable layer.
    public sealed class CheckOwnershipCommand : ICliCommand
    {
        private readonly ISteamStatsBackend _backend;

        public CheckOwnershipCommand(ISteamStatsBackend backend)
        {
            _backend = backend;
        }

        public async Task<CliResult> ExecuteAsync(string[] args, CancellationToken ct)
        {
            List<uint>? candidateAppIds = null;

            if (args.Length >= 2)
            {
                var arg = args[1];
                try
                {
                    var json = File.Exists(arg) ? File.ReadAllText(arg) : arg;
                    candidateAppIds = JsonSerializer.Deserialize<List<uint>>(json);
                }
                catch (Exception ex)
                {
                    return CliResult.Failure("invalid_app_ids", ex.Message);
                }

                if (candidateAppIds == null || candidateAppIds.Count == 0)
                {
                    return CliResult.Failure(
                        "invalid_app_ids",
                        "Expected a JSON array of app ids or a file path containing one"
                    );
                }
            }

            var owned = await _backend.CheckOwnershipAsync(candidateAppIds, ct);
            return CliResult.Success(new { games = owned, ownedCount = owned.Count });
        }
    }
}
