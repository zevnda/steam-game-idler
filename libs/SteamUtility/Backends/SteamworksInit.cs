using System;
using System.Threading;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Logging;
using Steamworks;

namespace SteamUtility.Backends
{
    // The one place that starts a per-app Steamworks session (SteamworksSession.Open and
    // IdleCommand both go through here), and the one place that turns a failed start into a
    // specific error code instead of a blanket "Steam isn't running".
    //
    // SteamAPI.InitEx only distinguishes three failures. Two map directly: NoSteamClient (no IPC
    // pipe - Steam really isn't running) and VersionMismatch. The third, FailedGeneric, covers
    // every other case with the same message ("ConnectToGlobalUser failed."), so it gets a
    // follow-up ownership check through the app-0 interop (Interop/Client.cs). Probed against a
    // real Steam client (2026-11):
    //
    //   Steam still starting, or at its sign-in screen  -> app 7 not owned yet  -> steam_not_ready
    //   Game not owned (or an invalid app id)           -> app 7 owned, game not -> game_not_owned
    //   Family-shared game its owner is playing         -> both owned            -> steam_game_unavailable
    //
    // App 7 is "Steam Client", which every account owns. While Steam is starting or signed out
    // the interop connects fine but reports nothing owned at all, so app 7 is what separates
    // "not loaded yet" from "not owned". Without it, a game the user owns read as not owned for
    // about 4 seconds of every Steam startup.
    //
    // For roughly half a second after the licenses load, an owned game still fails init. That
    // lands in steam_game_unavailable, which the Rust caller (steam_utility_exe.rs) retries
    // briefly for exactly this reason.
    public static class SteamworksInit
    {
        private const string Category = "SteamInit";

        // Steam's own "Steam Client" app - owned by every account once its licenses have loaded.
        private const uint SteamClientAppId = 7;

        // How long to wait before re-checking a "not owned" answer. In testing, app 7 and the
        // account's games appeared in the same instant, but those accounts owned few games - this
        // guards against a big library whose licenses land in more than one batch.
        private static readonly TimeSpan NotOwnedRecheckDelay = TimeSpan.FromSeconds(1);

        // Starts a Steamworks session bound to appId, or throws a SteamUtilityException naming why
        // it couldn't. On success the caller owns the session and must call SteamAPI.Shutdown().
        public static void InitOrThrow(uint appId)
        {
            Environment.SetEnvironmentVariable("SteamAppId", appId.ToString());

            var result = SteamAPI.InitEx(out var steamMessage);
            if (result == ESteamAPIInitResult.k_ESteamAPIInitResult_OK)
            {
                return;
            }

            Log.Warn(Category, $"Steam init failed for app {appId}: {result} ({steamMessage})");

            switch (result)
            {
                case ESteamAPIInitResult.k_ESteamAPIInitResult_NoSteamClient:
                    throw new SteamNotRunningException();
                case ESteamAPIInitResult.k_ESteamAPIInitResult_VersionMismatch:
                    throw new SteamClientOutdatedException();
                default:
                    throw ClassifyGenericFailure(appId);
            }
        }

        private static SteamUtilityException ClassifyGenericFailure(uint appId)
        {
            // The interop's ConnectToGlobalUser reads SteamAppId too. Left set to the game that
            // just failed, it fails the same way and the check below can't run at all.
            Environment.SetEnvironmentVariable("SteamAppId", null);

            try
            {
                using var client = new Interop.Client();
                client.Initialize(0);

                if (!client.SteamApps008.IsSubscribedApp(SteamClientAppId))
                {
                    Log.Warn(Category, "Steam hasn't loaded this account's licenses yet");
                    return new SteamNotReadyException();
                }

                var owned = client.SteamApps008.IsSubscribedApp(appId);
                if (!owned)
                {
                    Thread.Sleep(NotOwnedRecheckDelay);
                    owned = client.SteamApps008.IsSubscribedApp(appId);
                }

                if (!owned)
                {
                    Log.Warn(Category, $"The signed-in account doesn't own app {appId}");
                    return new GameNotOwnedException();
                }

                Log.Warn(
                    Category,
                    $"App {appId} is owned but Steam wouldn't start it (likely a Steam Families lock)"
                );
                return new SteamGameUnavailableException();
            }
            catch (Interop.ClientInitializeException ex)
            {
                // Seen only while Steam is still starting (its pipe isn't up yet even though
                // SteamAPI got far enough to report FailedGeneric), so it's retryable like the
                // not-loaded-yet case above.
                Log.Warn(Category, $"Ownership check couldn't reach Steam: {ex.Message}");
                return new SteamNotReadyException();
            }
        }
    }
}
