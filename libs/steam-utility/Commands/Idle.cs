using System;
using System.Diagnostics;
using System.Threading;
using System.Windows.Forms;
using Steamworks;

namespace SteamUtility.Commands
{
    public class Idle : ICommand
    {
        public void Execute(string[] args)
        {
            if (args.Length < 3)
            {
                MessageBox.Show(
                    "Usage: SteamUtility.exe idle <AppID> <true|false>",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // Validate the AppID
            if (!uint.TryParse(args[1], out uint appId))
            {
                MessageBox.Show(
                    "Invalid AppID. Please provide a valid Steam AppID (e.g. 221100).",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // Set the SteamAppId environment variable
            Environment.SetEnvironmentVariable("SteamAppId", appId.ToString());

            // Initialize the Steam API
            if (!SteamAPI.Init())
            {
                return;
            }

            // Determine if quiet mode is enabled
            bool quietMode = args[2].ToLower() == "true";

            // Run the FormIdler if not in quiet mode
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new FormIdler(appId, quietMode));

            // Shutdown the Steam API
            SteamAPI.Shutdown();
        }

        // Check if a process with the given name is running
        static bool IsProcessRunning(string processName)
        {
            return Process.GetProcessesByName(processName).Length > 0;
        }
    }
}
