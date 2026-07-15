using System;
using System.Globalization;
using SteamUtility.Interop.Wrappers;

namespace SteamUtility.Interop
{
    // Bootstraps a raw Steam pipe/user handle via steamclient64.dll's CreateInterface, bypassing
    // Steamworks.NET's managed SteamAPI_Init() entirely - that's what lets Initialize(0) mean
    // "no specific app", so one session can check ownership of many arbitrary app IDs without
    // re-initializing per app. Used by Backends/SteamworksLocalBackend.cs for check_ownership.
    public class Client : IDisposable
    {
        public SteamClient018 SteamClient = null!;
        public SteamUtils005 SteamUtils = null!;
        public SteamApps008 SteamApps008 = null!;
        public SteamApps001 SteamApps001 = null!;

        private bool m_disposed;
        private int m_pipeHandle;
        private int m_userHandle;

        public void Initialize(long applicationId)
        {
            var installPath = Steam.GetInstallPath();
            if (string.IsNullOrEmpty(installPath))
            {
                throw new ClientInitializeException(
                    ClientInitializeFailure.InstallPathNotFound,
                    "Unable to locate Steam installation path"
                );
            }

            if (applicationId != 0)
            {
                Environment.SetEnvironmentVariable(
                    "SteamAppId",
                    applicationId.ToString(CultureInfo.InvariantCulture)
                );
            }

            if (!Steam.Load())
            {
                throw new ClientInitializeException(
                    ClientInitializeFailure.LibraryLoadFailed,
                    "Failed to load Steam client library"
                );
            }

            SteamClient = Steam.CreateInterface<SteamClient018>("SteamClient018")!;
            if (SteamClient == null)
            {
                throw new ClientInitializeException(
                    ClientInitializeFailure.ClientCreationFailed,
                    "Failed to create ISteamClient018 interface"
                );
            }

            m_pipeHandle = SteamClient.CreateSteamPipe();
            if (m_pipeHandle == 0)
            {
                throw new ClientInitializeException(
                    ClientInitializeFailure.PipeCreationFailed,
                    "Failed to create Steam pipe"
                );
            }

            m_userHandle = SteamClient.ConnectToGlobalUser(m_pipeHandle);
            if (m_userHandle == 0)
            {
                throw new ClientInitializeException(
                    ClientInitializeFailure.UserConnectionFailed,
                    "Failed to connect to global Steam user"
                );
            }

            SteamUtils = SteamClient.GetSteamUtils004(m_pipeHandle);
            if (applicationId > 0 && SteamUtils.GetAppId() != (uint)applicationId)
            {
                throw new ClientInitializeException(
                    ClientInitializeFailure.ApplicationIdMismatch,
                    "Application ID mismatch detected"
                );
            }

            SteamApps008 = SteamClient.GetSteamApps008(m_userHandle, m_pipeHandle);
            SteamApps001 = SteamClient.GetSteamApps001(m_userHandle, m_pipeHandle);
        }

        ~Client()
        {
            Dispose(false);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (m_disposed)
            {
                return;
            }

            if (SteamClient != null && m_pipeHandle > 0)
            {
                if (m_userHandle > 0)
                {
                    SteamClient.ReleaseUser(m_pipeHandle, m_userHandle);
                    m_userHandle = 0;
                }

                SteamClient.ReleaseSteamPipe(m_pipeHandle);
                m_pipeHandle = 0;
            }

            m_disposed = true;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}
