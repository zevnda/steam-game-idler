using System;
using SteamUtility.Cli;
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
                CliDispatcher.ShowUsage();
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
                CliDispatcher.ShowUsage();
                return 0;
            }

            return CliDispatcher.Dispatch(args);
        }
    }
}
