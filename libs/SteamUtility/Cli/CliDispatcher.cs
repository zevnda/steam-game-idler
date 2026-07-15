using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SteamUtility.Backends;
using SteamUtility.Cli.Commands;
using SteamUtility.Core;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Json;
using SteamUtility.Core.Logging;

namespace SteamUtility.Cli
{
    // One-shot CLI mode dispatch - the "continue without signing in" fallback path
    // (Steamworks.NET-backed, requires a real local running/logged-in Steam client). Replaces the
    // dictionary+switch logic that used to live directly in Program.cs.
    public static class CliDispatcher
    {
        private static readonly ISteamStatsBackend Backend = new SteamworksLocalBackend();

        private static readonly Dictionary<string, ICliCommand> Commands = new(
            StringComparer.OrdinalIgnoreCase
        )
        {
            ["unlock_achievement"] = new UnlockAchievementCommand(Backend),
            ["lock_achievement"] = new LockAchievementCommand(Backend),
            ["toggle_achievement"] = new ToggleAchievementCommand(Backend),
            ["unlock_all_achievements"] = new UnlockAllAchievementsCommand(Backend),
            ["lock_all_achievements"] = new LockAllAchievementsCommand(Backend),
            ["update_stats"] = new UpdateStatsCommand(Backend),
            ["reset_all_stats"] = new ResetAllStatsCommand(Backend),
            ["get_achievement_data"] = new GetAchievementDataCommand(Backend),
            ["check_ownership"] = new CheckOwnershipCommand(Backend),
        };

        public static int Dispatch(string[] args)
        {
            var command = args[0];

            // "idle" is architecturally different from every other CLI command: it's the only one
            // that stays resident (one process per idling game - a hard Steamworks.NET/native-client
            // constraint, not a code structure choice) rather than doing one thing and exiting. It
            // prints its own status line immediately and then blocks forever, so it can't fit the
            // generic "await a result, then print it" pattern the rest of CliDispatcher uses.
            if (string.Equals(command, "idle", StringComparison.OrdinalIgnoreCase))
            {
                return IdleCommand.Run(args);
            }

            if (!Commands.TryGetValue(command, out var handler))
            {
                Console.WriteLine(
                    JsonEnvelope.SerializeResponse(null, false, error: $"unknown_command:{command}")
                );
                return 2;
            }

            using var cts = new CancellationTokenSource();
            Console.CancelKeyPress += (_, e) =>
            {
                e.Cancel = true;
                cts.Cancel();
            };

            CliResult result;
            try
            {
                result = handler.ExecuteAsync(args, cts.Token).GetAwaiter().GetResult();
            }
            catch (Exception ex)
            {
                var (code, message) = ExceptionMapper.Map(ex, $"Cli.{command}");
                result = CliResult.Failure(code, message);
            }

            Console.WriteLine(
                JsonEnvelope.SerializeResponse(
                    null,
                    result.Ok,
                    result.Result,
                    // The envelope's `error` field is the stable machine code (matches the daemon
                    // side - DaemonHost.cs sends `code`, not message), not the human-readable
                    // message - callers on the Rust side match on codes like
                    // `achievement_protected`/`steam_pipe_creation_failed` verbatim.
                    result.ErrorCode ?? result.ErrorMessage
                )
            );
            return result.Ok ? 0 : 1;
        }

        public static void ShowUsage()
        {
            var commandUsages = new Dictionary<string, string>
            {
                {
                    "check_ownership [app_ids_json]",
                    "Check if the user owns a list of games (defaults to the curated whitelist)"
                },
                { "idle <app_id> [app_name]", "Start idling a specific game" },
                { "get_achievement_data <app_id> [specific_id]", "Get achievement/stat data" },
                { "unlock_achievement <app_id> <ach_id>", "Unlock a single achievement" },
                { "lock_achievement <app_id> <ach_id>", "Lock a single achievement" },
                {
                    "toggle_achievement <app_id> <ach_id>",
                    "Toggle a single achievement's lock state"
                },
                { "unlock_all_achievements <app_id>", "Unlock all achievements" },
                { "lock_all_achievements <app_id>", "Lock all achievements" },
                { "update_stats <app_id> <[stat_objects...]>", "Update achievement statistics" },
                { "reset_all_stats <app_id>", "Reset all statistics" },
            };

            var version = System.Reflection.Assembly.GetExecutingAssembly().GetName().Version;
            Console.WriteLine(
                $"SteamUtility {version} by zevnda - https://github.com/zevnda/steam-game-idler"
            );
            Console.WriteLine();
            Console.WriteLine("Usage:");
            Console.WriteLine(
                "    SteamUtility.exe agent               Start persistent daemon mode (sign in with Steam credentials)"
            );
            Console.WriteLine(
                "    SteamUtility.exe <command> [args...] Run a one-shot command against a local, running Steam client"
            );
            Console.WriteLine("    SteamUtility.exe [--help | -h]");
            Console.WriteLine();
            Console.WriteLine("Commands:");
            foreach (var cmd in commandUsages)
            {
                Console.WriteLine($"    {cmd.Key, -45} {cmd.Value}");
            }
        }
    }
}
