using System;
using System.Threading;
using System.Windows.Forms;
using Steamworks;

namespace SteamUtility.Commands
{
    public class LockAchievement : ICommand
    {
        static bool statsReceived = false;
        static Callback<UserStatsReceived_t> statsReceivedCallback;

        public void Execute(string[] args)
        {
            if (args.Length < 2)
            {
                MessageBox.Show(
                    "Usage: SteamUtility.exe lock_achievement <AppID> <true|false>",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            uint appId;
            string achievementId = args[2];

            // Validate the AppID
            if (!uint.TryParse(args[1], out appId))
            {
                MessageBox.Show(
                    "Invalid AppID. Please provide a valid Steam App ID (e.g. 221100).",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            // Set the Steam App ID environment variable
            Environment.SetEnvironmentVariable("SteamAppId", appId.ToString());

            // Initialize the Steam API
            if (!SteamAPI.Init())
            {
                Console.WriteLine("error");
                return;
            }

            try
            {
                // Get the Steam user ID and create a callback for receiving user stats
                CSteamID steamId = SteamUser.GetSteamID();
                statsReceivedCallback = Callback<UserStatsReceived_t>.Create(OnUserStatsReceived);
                // Request user stats from Steam
                SteamAPICall_t apiCall = SteamUserStats.RequestUserStats(steamId);

                // Check if the API call was successful
                if (apiCall == SteamAPICall_t.Invalid)
                {
                    MessageBox.Show(
                        "Failed to request stats from Steam.",
                        "Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                // Wait for the stats to be received
                DateTime startTime = DateTime.Now;
                while (!statsReceived)
                {
                    SteamAPI.RunCallbacks();
                    if ((DateTime.Now - startTime).TotalSeconds > 10)
                    {
                        MessageBox.Show(
                            "Timed out waiting for stats from Steam.",
                            "Error",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Error
                        );
                        return;
                    }
                    Thread.Sleep(100);
                }

                // Check if the achievement exists and lock it
                if (SteamUserStats.GetAchievement(achievementId, out _))
                {
                    if (SteamUserStats.ClearAchievement(achievementId))
                    {
                        SteamUserStats.StoreStats();
                        Console.WriteLine("Achievement locked successfully.");
                    }
                    else
                    {
                        MessageBox.Show(
                            "Failed to lock achievement",
                            "Error",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Error
                        );
                    }
                }
                else
                {
                    MessageBox.Show(
                        "Failed to get achievement data. It might not exist.",
                        "Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"An error occurred: {ex.Message}",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
            finally
            {
                // Shutdown the Steam API
                SteamAPI.Shutdown();
            }
        }

        // Callback method for when user stats are received
        static void OnUserStatsReceived(UserStatsReceived_t pCallback)
        {
            if (pCallback.m_nGameID == SteamUtils.GetAppID().m_AppId)
            {
                if (pCallback.m_eResult == EResult.k_EResultOK)
                {
                    statsReceived = true;
                }
                else
                {
                    MessageBox.Show(
                        $"Failed to receive stats from Steam. Error code: {pCallback.m_eResult}",
                        "Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                }
            }
        }
    }
}
