using System.Runtime.Versioning;
using Microsoft.Win32;

namespace SteamUtility.Core.Services
{
    // Local-client-backend-only: resolving the Steam install path from the registry is inherently
    // local-machine-only and has no equivalent for the network-based (SteamKit2) backend.
    [SupportedOSPlatform("windows")]
    public static class SteamPathHelper
    {
        public static string? GetSteamInstallPath()
        {
            return (string?)
                Registry.GetValue(@"HKEY_LOCAL_MACHINE\Software\Valve\Steam", "InstallPath", null);
        }
    }
}
