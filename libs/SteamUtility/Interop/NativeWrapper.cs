using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace SteamUtility.Interop
{
    // Vtable structs (see Interfaces/*.cs) are declared with IntPtr fields throughout, so
    // Marshal.PtrToStructure already lays them out with 8-byte (x64) pointer slots automatically -
    // this class and the vtable structs needed no changes to go from the pre-merge project's x86
    // build to this project's win-x64 target. The only x64-specific change was the native DLL name
    // itself (steamclient.dll -> steamclient64.dll, see Steam.cs).
    public abstract class NativeWrapper<TNativeFunctions> : INativeWrapper
    {
        protected IntPtr InstanceAddress;
        protected TNativeFunctions NativeFunctions = default!;

        private readonly Dictionary<IntPtr, Delegate> m_delegateCache = new();

        public override string ToString()
        {
            return $"Steam Interface<{typeof(TNativeFunctions).Name}> [0x{InstanceAddress.ToInt64():X}]";
        }

        public void Initialize(IntPtr instanceAddress)
        {
            InstanceAddress = instanceAddress;

            var nativeInstance = (NativeClass)
                Marshal.PtrToStructure(InstanceAddress, typeof(NativeClass))!;

            NativeFunctions = (TNativeFunctions)
                Marshal.PtrToStructure(nativeInstance.VTablePointer, typeof(TNativeFunctions))!;
        }

        protected Delegate GetDelegate<TDelegate>(IntPtr functionPointer)
        {
            if (!m_delegateCache.TryGetValue(functionPointer, out var cachedDelegate))
            {
                cachedDelegate = Marshal.GetDelegateForFunctionPointer(
                    functionPointer,
                    typeof(TDelegate)
                );
                m_delegateCache[functionPointer] = cachedDelegate;
            }
            return cachedDelegate;
        }

        protected TDelegate? GetFunction<TDelegate>(IntPtr functionPointer)
            where TDelegate : class
        {
            return GetDelegate<TDelegate>(functionPointer) as TDelegate;
        }

        protected void Call<TDelegate>(IntPtr functionPointer, params object[] arguments)
        {
            GetDelegate<TDelegate>(functionPointer).DynamicInvoke(arguments);
        }

        protected TReturn Call<TReturn, TDelegate>(
            IntPtr functionPointer,
            params object[] arguments
        )
        {
            return (TReturn)GetDelegate<TDelegate>(functionPointer).DynamicInvoke(arguments)!;
        }
    }
}
