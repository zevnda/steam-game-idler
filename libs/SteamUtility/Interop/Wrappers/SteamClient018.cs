using System;
using System.Runtime.InteropServices;
using SteamUtility.Interop.Interfaces;

namespace SteamUtility.Interop.Wrappers
{
    public class SteamClient018 : NativeWrapper<ISteamClient018>
    {
        [UnmanagedFunctionPointer(CallingConvention.ThisCall)]
        private delegate int CreateSteamPipeNative(IntPtr thisPtr);

        public int CreateSteamPipe()
        {
            return Call<int, CreateSteamPipeNative>(
                NativeFunctions.CreateSteamPipe,
                InstanceAddress
            );
        }

        [UnmanagedFunctionPointer(CallingConvention.ThisCall)]
        [return: MarshalAs(UnmanagedType.I1)]
        private delegate bool ReleaseSteamPipeNative(IntPtr thisPtr, int pipeHandle);

        public bool ReleaseSteamPipe(int pipeHandle)
        {
            return Call<bool, ReleaseSteamPipeNative>(
                NativeFunctions.ReleaseSteamPipe,
                InstanceAddress,
                pipeHandle
            );
        }

        [UnmanagedFunctionPointer(CallingConvention.ThisCall)]
        private delegate int ConnectToGlobalUserNative(IntPtr thisPtr, int pipeHandle);

        public int ConnectToGlobalUser(int pipeHandle)
        {
            return Call<int, ConnectToGlobalUserNative>(
                NativeFunctions.ConnectToGlobalUser,
                InstanceAddress,
                pipeHandle
            );
        }

        [UnmanagedFunctionPointer(CallingConvention.ThisCall)]
        private delegate void ReleaseUserNative(IntPtr thisPtr, int pipeHandle, int userHandle);

        public void ReleaseUser(int pipeHandle, int userHandle)
        {
            Call<ReleaseUserNative>(
                NativeFunctions.ReleaseUser,
                InstanceAddress,
                pipeHandle,
                userHandle
            );
        }

        [UnmanagedFunctionPointer(CallingConvention.ThisCall)]
        private delegate IntPtr GetISteamUtilsNative(
            IntPtr thisPtr,
            int pipeHandle,
            IntPtr versionPtr
        );

        public TInterface GetISteamUtils<TInterface>(int pipeHandle, string version)
            where TInterface : INativeWrapper, new()
        {
            using var versionHandle = NativeStrings.StringToStringHandle(version);

            var interfaceAddress = Call<IntPtr, GetISteamUtilsNative>(
                NativeFunctions.GetISteamUtils,
                InstanceAddress,
                pipeHandle,
                versionHandle.Handle
            );

            var wrapper = new TInterface();
            wrapper.Initialize(interfaceAddress);
            return wrapper;
        }

        public SteamUtils005 GetSteamUtils004(int pipeHandle) =>
            GetISteamUtils<SteamUtils005>(pipeHandle, "SteamUtils005");

        [UnmanagedFunctionPointer(CallingConvention.ThisCall)]
        private delegate IntPtr GetISteamAppsNative(
            IntPtr thisPtr,
            int userHandle,
            int pipeHandle,
            IntPtr versionPtr
        );

        private TInterface GetISteamApps<TInterface>(int userHandle, int pipeHandle, string version)
            where TInterface : INativeWrapper, new()
        {
            using var versionHandle = NativeStrings.StringToStringHandle(version);

            var interfaceAddress = Call<IntPtr, GetISteamAppsNative>(
                NativeFunctions.GetISteamApps,
                InstanceAddress,
                userHandle,
                pipeHandle,
                versionHandle.Handle
            );

            var wrapper = new TInterface();
            wrapper.Initialize(interfaceAddress);
            return wrapper;
        }

        public SteamApps008 GetSteamApps008(int userHandle, int pipeHandle) =>
            GetISteamApps<SteamApps008>(userHandle, pipeHandle, "STEAMAPPS_INTERFACE_VERSION008");

        public SteamApps001 GetSteamApps001(int userHandle, int pipeHandle) =>
            GetISteamApps<SteamApps001>(userHandle, pipeHandle, "STEAMAPPS_INTERFACE_VERSION001");
    }
}
