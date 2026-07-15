using System;
using System.Runtime.InteropServices;
using System.Text;
using Microsoft.Win32.SafeHandles;

namespace SteamUtility.Interop
{
    internal class NativeStrings
    {
        public sealed class StringHandle : SafeHandleZeroOrMinusOneIsInvalid
        {
            internal StringHandle(IntPtr existingHandle, bool ownsHandle)
                : base(ownsHandle)
            {
                SetHandle(existingHandle);
            }

            public IntPtr Handle => handle;

            protected override bool ReleaseHandle()
            {
                if (handle == IntPtr.Zero)
                {
                    return false;
                }

                Marshal.FreeHGlobal(handle);
                handle = IntPtr.Zero;
                return true;
            }
        }

        public static unsafe StringHandle StringToStringHandle(string? value)
        {
            if (value == null)
            {
                return new StringHandle(IntPtr.Zero, true);
            }

            var utf8Bytes = Encoding.UTF8.GetBytes(value);
            var byteCount = utf8Bytes.Length;

            var nativePtr = Marshal.AllocHGlobal(byteCount + 1);
            Marshal.Copy(utf8Bytes, 0, nativePtr, utf8Bytes.Length);
            ((byte*)nativePtr)[byteCount] = 0; // Null terminator

            return new StringHandle(nativePtr, true);
        }

        public static unsafe string? PointerToString(sbyte* ptr)
        {
            if (ptr == null)
            {
                return null;
            }

            if (*ptr == 0)
            {
                return string.Empty;
            }

            var charCount = 0;
            var current = ptr;
            while (*current != 0)
            {
                charCount++;
                current++;
            }

            return new string(ptr, 0, charCount, Encoding.UTF8);
        }

        public static unsafe string? PointerToString(byte* ptr) => PointerToString((sbyte*)ptr);

        public static unsafe string? PointerToString(IntPtr ptr) =>
            PointerToString((sbyte*)ptr.ToPointer());

        public static unsafe string? PointerToString(sbyte* ptr, int maxLength)
        {
            if (ptr == null)
            {
                return null;
            }

            if (maxLength == 0 || *ptr == 0)
            {
                return string.Empty;
            }

            var charCount = 0;
            var current = ptr;
            while (*current != 0 && charCount < maxLength)
            {
                charCount++;
                current++;
            }

            return new string(ptr, 0, charCount, Encoding.UTF8);
        }

        public static unsafe string? PointerToString(byte* ptr, int maxLength) =>
            PointerToString((sbyte*)ptr, maxLength);

        public static unsafe string? PointerToString(IntPtr ptr, int maxLength) =>
            PointerToString((sbyte*)ptr.ToPointer(), maxLength);
    }
}
