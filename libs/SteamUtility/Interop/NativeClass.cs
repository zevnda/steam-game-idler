using System;
using System.Runtime.InteropServices;

namespace SteamUtility.Interop
{
    [StructLayout(LayoutKind.Sequential, Pack = 1, CharSet = CharSet.Ansi)]
    internal struct NativeClass
    {
        public IntPtr VTablePointer;
    }
}
