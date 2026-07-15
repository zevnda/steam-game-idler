using System;

namespace SteamUtility.Interop
{
    public interface INativeWrapper
    {
        void Initialize(IntPtr instanceAddress);
    }
}
