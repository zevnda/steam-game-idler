using System;
using System.Runtime.InteropServices;

namespace SteamUtility.Interop.Interfaces
{
    [StructLayout(LayoutKind.Sequential, Pack = 1)]
    public struct ISteamClient018
    {
        public IntPtr CreateSteamPipe;
        public IntPtr ReleaseSteamPipe;
        public IntPtr ConnectToGlobalUser;
        public IntPtr CreateLocalUser;
        public IntPtr ReleaseUser;
        public IntPtr GetISteamUser;
        public IntPtr GetISteamGameServer;
        public IntPtr SetLocalIPBinding;
        public IntPtr GetISteamFriends;
        public IntPtr GetISteamUtils;
        public IntPtr GetISteamMatchmaking;
        public IntPtr GetISteamMatchmakingServers;
        public IntPtr GetISteamGenericInterface;
        public IntPtr GetISteamUserStats;
        public IntPtr GetISteamGameServerStats;
        public IntPtr GetISteamApps;
        public IntPtr GetISteamNetworking;
        public IntPtr GetISteamRemoteStorage;
        public IntPtr GetISteamScreenshots;
        public IntPtr GetISteamGameSearch;
        public IntPtr RunFrame;
        public IntPtr GetIPCCallCount;
        public IntPtr SetWarningMessageHook;
        public IntPtr ShutdownIfAllPipesClosed;
        public IntPtr GetISteamHTTP;
        public IntPtr DEPRECATED_GetISteamUnifiedMessages;
        public IntPtr GetISteamController;
        public IntPtr GetISteamUGC;
        public IntPtr GetISteamAppList;
        public IntPtr GetISteamMusic;
        public IntPtr GetISteamMusicRemote;
        public IntPtr GetISteamHTMLSurface;
        public IntPtr DEPRECATED_Set_SteamAPI_CPostAPIResultInProcess;
        public IntPtr DEPRECATED_Remove_SteamAPI_CPostAPIResultInProcess;
        public IntPtr Set_SteamAPI_CCheckCallbackRegisteredInProcess;
        public IntPtr GetISteamInventory;
        public IntPtr GetISteamVideo;
        public IntPtr GetISteamParentalSettings;
        public IntPtr GetISteamInput;
        public IntPtr GetISteamParties;
    }
}
