using System;
using System.Runtime.InteropServices;
using SteamUtility.Interop.Interfaces;

namespace SteamUtility.Interop.Wrappers
{
    public class SteamApps001 : NativeWrapper<ISteamApps001>
    {
        [UnmanagedFunctionPointer(CallingConvention.ThisCall)]
        private delegate int NativeGetAppData(
            IntPtr self,
            uint appId,
            IntPtr key,
            IntPtr value,
            int valueLength
        );

        public string? GetAppData(uint appId, string key)
        {
            using var nativeHandle = NativeStrings.StringToStringHandle(key);

            const int valueLength = 1024;
            var valuePointer = Marshal.AllocHGlobal(valueLength);
            try
            {
                var result = Call<int, NativeGetAppData>(
                    NativeFunctions.GetAppData,
                    InstanceAddress,
                    appId,
                    nativeHandle.Handle,
                    valuePointer,
                    valueLength
                );
                return result == 0
                    ? null
                    : NativeStrings.PointerToString(valuePointer, valueLength);
            }
            finally
            {
                Marshal.FreeHGlobal(valuePointer);
            }
        }
    }
}
