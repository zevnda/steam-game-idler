using System;
using System.Collections.Generic;
using System.IO;
using System.Text.RegularExpressions;
using System.Windows.Forms;
using Microsoft.Win32;
using Steamworks;

namespace SteamUtility.Commands
{
    public class GetSteamUsers : ICommand
    {
        public void Execute(string[] args)
        {
            try
            {
                // Find the Steam directory and get the path to loginusers
                string configPath = FindSteamDirectory();

                // Parse the loginusers file to get the list of users
                Dictionary<string, string> users = ParseLoginUsers(configPath);
                if (users.Count > 0)
                {
                    var userList = new List<Dictionary<string, string>>();
                    foreach (var user in users)
                    {
                        userList.Add(
                            new Dictionary<string, string>
                            {
                                { "personaName", user.Value },
                                { "steamId", user.Key },
                            }
                        );
                    }

                    // Serialize the list of users to JSON and print it
                    string usersJson = Newtonsoft.Json.JsonConvert.SerializeObject(userList);
                    Console.WriteLine($"steamUsers {usersJson}");
                }
            }
            catch (DirectoryNotFoundException ex)
            {
                MessageBox.Show(ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        // Find the Steam directory by checking Windows registry and looking for the loginusers file
        private string FindSteamDirectory()
        {
            string steamPath = GetSteamPathFromRegistry();
            if (steamPath != null)
            {
                string configPath = Path.Combine(steamPath, "config", "loginusers.vdf");
                if (File.Exists(configPath))
                {
                    return configPath;
                }
                MessageBox.Show(
                    $@"A loginusers.vdf file was not found in the Steam config directory.            
Steam Path: {steamPath}",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
            else
            {
                MessageBox.Show(
                    $@"A Steam config directory was not found in the Steam directory.            
Steam Path: {steamPath}",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
            throw new DirectoryNotFoundException("Steam directory not found.");
        }

        // Retrieve the Steam installation path from the Windows registry
        private string GetSteamPathFromRegistry()
        {
            using (RegistryKey key = Registry.CurrentUser.OpenSubKey(@"Software\Valve\Steam"))
            {
                if (key != null)
                {
                    Object o = key.GetValue("SteamPath");
                    if (o != null)
                    {
                        return o as string;
                    }
                }
            }
            MessageBox.Show(
                "Unable to find Steam's installation directory. Is it installed?",
                "Error",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            return null;
        }

        // Parses the loginusers file to extract Steam IDs and persona names
        private Dictionary<string, string> ParseLoginUsers(string configPath)
        {
            var users = new Dictionary<string, string>();
            string content = File.ReadAllText(configPath);

            var userRegex = new Regex(
                "\"(\\d{17})\"\\s*\\{[^}]*\"PersonaName\"\\s*\"([^\"]*)\"",
                RegexOptions.Compiled
            );
            var matches = userRegex.Matches(content);

            foreach (Match match in matches)
            {
                string steamID = match.Groups[1].Value;
                string personaName = match.Groups[2].Value;
                users.Add(steamID, personaName);
            }

            return users;
        }
    }
}
