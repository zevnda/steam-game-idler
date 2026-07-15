using System;
using System.Threading;
using SteamUtility.Core.Json;
using Steamworks;

namespace SteamUtility.Cli.Commands
{
    // Idles a game by spoofing the running AppID to a live local SteamAPI_Init() session - the
    // mechanism Steam's own client watches for to grant playtime/card-drop accrual. Architecturally
    // different from every other CLI command (see CliDispatcher.Dispatch): prints its own status
    // line immediately, then blocks forever until the process is killed - one process per idling
    // game, since SteamAPI_Init() hard-binds one AppID per process.
    public static class IdleCommand
    {
        public static int Run(string[] args)
        {
            if (args.Length < 2)
            {
                Console.WriteLine("Usage: SteamUtility.exe idle <app_id> [app_name]");
                return 2;
            }

            if (!uint.TryParse(args[1], out var appId))
            {
                Console.WriteLine(
                    JsonEnvelope.SerializeResponse(null, false, error: "invalid_app_id")
                );
                return 1;
            }

            var appName = args.Length >= 3 ? args[2] : "Idling";

            Environment.SetEnvironmentVariable("SteamAppId", appId.ToString());

            if (!SteamAPI.Init())
            {
                Console.WriteLine(
                    JsonEnvelope.SerializeResponse(null, false, error: "steam_not_running")
                );
                return 1;
            }

            Console.WriteLine(
                JsonEnvelope.SerializeResponse(null, true, new { status = "Steam API initialized" })
            );

            AppDomain.CurrentDomain.ProcessExit += (_, _) => SteamAPI.Shutdown();

            try
            {
                using var window = new IdleWindow(appId, appName);
                while (true)
                {
                    Thread.Sleep(1000);
                }
            }
            finally
            {
                SteamAPI.Shutdown();
            }
        }
    }
}
