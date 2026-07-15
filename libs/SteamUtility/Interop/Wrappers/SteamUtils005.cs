using System;
using System.Runtime.InteropServices;
using SteamUtility.Interop.Interfaces;

namespace SteamUtility.Interop.Wrappers
{
    public class SteamUtils005 : NativeWrapper<ISteamUtils005>
    {
        [UnmanagedFunctionPointer(CallingConvention.ThisCall)]
        private delegate uint GetAppIdNative(IntPtr thisPtr);

        public uint GetAppId()
        {
            return Call<uint, GetAppIdNative>(NativeFunctions.GetAppID, InstanceAddress);
        }
    }
}
