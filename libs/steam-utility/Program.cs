﻿using System;
using System.Collections.Generic;
using System.Windows.Forms;
using SteamUtility.Commands;

namespace SteamUtility
{
    static class Program
    {
        static Dictionary<string, ICommand> commands = new Dictionary<string, ICommand>
        {
            { "get_steam_users", new GetSteamUsers() },
            { "idle", new Idle() },
            { "update_stats", new UpdateStats() },
            { "reset_stats", new ResetStats() },
            { "toggle_achievement", new ToggleAchievement() },
            { "unlock_achievement", new UnlockAchievement() },
            { "lock_achievement", new LockAchievement() },
        };

        static void Main(string[] args)
        {
            if (args.Length == 0)
            {
                ShowUsage();
                return;
            }

            string command = args[0].ToLower();

            if (commands.TryGetValue(command, out ICommand commandHandler))
            {
                commandHandler.Execute(args);
            }
            else
            {
                ShowUsage();
            }
        }

        static void ShowUsage()
        {
            string usageMessage =
                "Usage: SteamUtility.exe <command> [arguments]\n\n"
                + "Commands:\n"
                + "     check_steam\n"
                + "     idle <AppID> <true|false>\n"
                + "     update_stats <AppID> <StatName> <NewValue>\n"
                + "     toggle_achievement <AppID> <AchievementID>\n"
                + "     lock_achievement <AppID> <AchievementID>\n"
                + "     unlock_achievement <AppID> <AchievementID>";

            MessageBox.Show(
                usageMessage,
                "Usage Instructions",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information
            );
        }
    }
}
