using System;
using System.Collections.Generic;
#if !LINUX_DAEMON_ONLY
using SteamUtility.Cli;
#endif
using SteamUtility.Core.Logging;
using SteamUtility.Daemon;

namespace SteamUtility
{
    internal static class Program
    {
        private static int Main(string[] args)
        {
            Log.Initialize();

            if (args.Length == 0)
            {
                ShowUsage();
                return 0;
            }

            var mode = args[0];

            if (
                string.Equals(mode, "agent", StringComparison.OrdinalIgnoreCase)
                || string.Equals(mode, "--agent", StringComparison.OrdinalIgnoreCase)
            )
            {
                return new DaemonHost().Run(args[1..]);
            }

            if (
                string.Equals(mode, "--help", StringComparison.OrdinalIgnoreCase)
                || string.Equals(mode, "-h", StringComparison.OrdinalIgnoreCase)
            )
            {
                ShowUsage();
                return 0;
            }

#if LINUX_DAEMON_ONLY
            // This Linux publish is agent (daemon) mode only - CLI mode requires Steamworks.NET and
            // a real local running Steam client, neither of which this RID builds (see
            // SteamUtility.csproj's RuntimeIdentifier-conditioned Compile-Remove ItemGroup). Anything
            // other than "agent" is a usage error rather than a dispatch attempt.
            Console.WriteLine($"Unknown command: {mode}. This build only supports 'agent' mode.");
            ShowUsage();
            return 2;
#else
            return CliDispatcher.Dispatch(args);
#endif
        }

        // Lives here (not Cli/CliDispatcher.cs) so it stays available on every RID, including the
        // Linux daemon-only build where the rest of Cli/** is excluded from compilation entirely.
        private static void ShowUsage()
        {
            var version = System.Reflection.Assembly.GetExecutingAssembly().GetName().Version;
            Console.WriteLine(
                $"SteamUtility {version} by zevnda - https://github.com/zevnda/steam-game-idler"
            );
            Console.WriteLine();
            Console.WriteLine("Usage:");
#if LINUX_DAEMON_ONLY
            Console.WriteLine(
                "    SteamUtility agent               Start persistent daemon mode (sign in with Steam credentials)"
            );
            Console.WriteLine("    SteamUtility [--help | -h]");
#else
            // Byte-for-byte the pre-Linux-work Windows text - do not reword without checking whether
            // anything (docs, issue templates) matches against it verbatim.
            Console.WriteLine(
                "    SteamUtility.exe agent               Start persistent daemon mode (sign in with Steam credentials)"
            );
            Console.WriteLine(
                "    SteamUtility.exe <command> [args...] Run a one-shot command against a local, running Steam client"
            );
            Console.WriteLine("    SteamUtility.exe [--help | -h]");
#endif

#if !LINUX_DAEMON_ONLY
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

            Console.WriteLine();
            Console.WriteLine("Commands:");
            foreach (var cmd in commandUsages)
            {
                Console.WriteLine($"    {cmd.Key, -45} {cmd.Value}");
            }
#endif
        }
    }
}
