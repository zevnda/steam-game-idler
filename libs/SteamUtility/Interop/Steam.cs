using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Runtime.Versioning;
using Microsoft.Win32;

namespace SteamUtility.Interop
{
    [SupportedOSPlatform("windows")]
    public static class Steam
    {
        private static class NativeMethods
        {
            [DllImport(
                "kernel32.dll",
                SetLastError = true,
                BestFitMapping = false,
                ThrowOnUnmappableChar = true
            )]
            internal static extern IntPtr GetProcAddress(IntPtr moduleHandle, string functionName);

            [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
            internal static extern IntPtr LoadLibraryEx(
                string libraryPath,
                IntPtr fileHandle,
                uint flags
            );

            [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
            [return: MarshalAs(UnmanagedType.Bool)]
            internal static extern bool SetDllDirectory(string directoryPath);

            internal const uint LOAD_WITH_ALTERED_SEARCH_PATH = 8;
        }

        private static Delegate? GetExportDelegate<TDelegate>(
            IntPtr moduleHandle,
            string exportName
        )
        {
            var functionAddress = NativeMethods.GetProcAddress(moduleHandle, exportName);

            if (functionAddress == IntPtr.Zero)
            {
                return null;
            }

            return Marshal.GetDelegateForFunctionPointer(functionAddress, typeof(TDelegate));
        }

        private static TDelegate? GetExportFunction<TDelegate>(
            IntPtr moduleHandle,
            string exportName
        )
            where TDelegate : class
        {
            return GetExportDelegate<TDelegate>(moduleHandle, exportName) as TDelegate;
        }

        private static IntPtr s_libraryHandle = IntPtr.Zero;

        public static string? GetInstallPath()
        {
            return Registry.GetValue(
                    @"HKEY_LOCAL_MACHINE\Software\Valve\Steam",
                    "InstallPath",
                    null
                ) as string;
        }

        [UnmanagedFunctionPointer(CallingConvention.Cdecl, CharSet = CharSet.Ansi)]
        private delegate IntPtr CreateInterfaceDelegate(string versionString, IntPtr returnCode);

        private static CreateInterfaceDelegate? s_createInterface;

        public static TInterface? CreateInterface<TInterface>(string versionString)
            where TInterface : INativeWrapper, new()
        {
            var interfaceAddress = s_createInterface!(versionString, IntPtr.Zero);

            if (interfaceAddress == IntPtr.Zero)
            {
                return default;
            }

            var wrapper = new TInterface();
            wrapper.Initialize(interfaceAddress);
            return wrapper;
        }

        public static bool Load()
        {
            if (s_libraryHandle != IntPtr.Zero)
            {
                return true;
            }

            var installPath = GetInstallPath();
            if (string.IsNullOrEmpty(installPath))
            {
                return false;
            }

            // Set DLL search path to include Steam installation and bin directories
            var dllSearchPath = $"{installPath};{Path.Combine(installPath, "bin")}";
            NativeMethods.SetDllDirectory(dllSearchPath);

            // Load the 64-bit Steam client library - this process is win-x64 only, so it must load
            // steamclient64.dll, not the x86 steamclient.dll the pre-merge project used.
            var clientLibraryPath = Path.Combine(installPath, "steamclient64.dll");
            var libraryHandle = NativeMethods.LoadLibraryEx(
                clientLibraryPath,
                IntPtr.Zero,
                NativeMethods.LOAD_WITH_ALTERED_SEARCH_PATH
            );

            if (libraryHandle == IntPtr.Zero)
            {
                return false;
            }

            // Get the CreateInterface function
            s_createInterface = GetExportFunction<CreateInterfaceDelegate>(
                libraryHandle,
                "CreateInterface"
            );
            if (s_createInterface == null)
            {
                return false;
            }

            s_libraryHandle = libraryHandle;
            return true;
        }
    }
}
