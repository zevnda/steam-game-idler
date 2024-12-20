using System;
using System.Threading;
using System.Windows.Forms;
using Steamworks;

namespace SteamUtility.Commands
{
    public class StatsCommand : ICommand
    {
        static bool statsReceived = false;
        static Callback<UserStatsReceived_t> statsReceivedCallback;

        public void Execute(string[] args)
        {
            if (args.Length < 3)
            {
                MessageBox.Show(
                    "Usage: SteamUtility.exe update_stat <AppID> <StatName> <NewValue>",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            uint appId;
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

            string statName = args[2];
            string newValue = args[3];

            Environment.SetEnvironmentVariable("SteamAppId", appId.ToString());

            if (!SteamAPI.Init())
            {
                MessageBox.Show(
                    "Failed to initialize the Steam API. Is Steam running?",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                return;
            }

            try
            {
                CSteamID steamId = SteamUser.GetSteamID();
                statsReceivedCallback = Callback<UserStatsReceived_t>.Create(OnUserStatsReceived);
                SteamAPICall_t apiCall = SteamUserStats.RequestUserStats(steamId);

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

                bool success = false;
                if (int.TryParse(newValue, out int intValue))
                {
                    success = SteamUserStats.SetStat(statName, intValue);
                }
                else if (float.TryParse(newValue, out float floatValue))
                {
                    success = SteamUserStats.SetStat(statName, floatValue);
                }
                else
                {
                    MessageBox.Show(
                        "Invalid new value. Please provide a valid integer or float.",
                        "Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                if (success)
                {
                    if (SteamUserStats.StoreStats())
                    {
                        Console.WriteLine($"Stat '{statName}' updated successfully to {newValue}.");
                    }
                    else
                    {
                        MessageBox.Show(
                            "Failed to store updated stats.",
                            "Error",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Error
                        );
                    }
                }
                else
                {
                    Console.WriteLine($"Failed to update stat '{statName}'. It might not exist.");
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
                SteamAPI.Shutdown();
            }
        }

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
