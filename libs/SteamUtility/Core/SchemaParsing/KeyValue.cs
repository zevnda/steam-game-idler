using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace SteamUtility.Core.SchemaParsing
{
    public enum KeyValueType
    {
        None = 0,
        String = 1,
        Int32 = 2,
        Float32 = 3,
        Pointer = 4,
        WideString = 5,
        Color = 6,
        UInt64 = 7,
        End = 8,
    }

    // Binary VDF ("KeyValue") reader for Steam's stats/achievement schema format - the same format
    // used both by the local Steam client's cached UserGameStatsSchema_<appid>.bin files and by the
    // schema bytes returned over the wire in a ClientGetUserStatsResponse. One canonical copy,
    // replacing the two previously-duplicated implementations in the pre-merge SteamUtility and
    // SteamAgent projects.
    public class KeyValue
    {
        private static readonly KeyValue s_invalid = new();

        public string Name = "<root>";
        public KeyValueType Type = KeyValueType.None;
        public object? Value;
        public bool Valid;
        public List<KeyValue>? Children;

        public KeyValue this[string key]
        {
            get
            {
                if (Children == null)
                {
                    return s_invalid;
                }

                var child = Children.SingleOrDefault(c =>
                    string.Compare(c.Name, key, StringComparison.InvariantCultureIgnoreCase) == 0
                );

                return child ?? s_invalid;
            }
        }

        public string AsString(string defaultValue)
        {
            if (!Valid || Value == null)
            {
                return defaultValue;
            }
            return Value.ToString() ?? defaultValue;
        }

        public int AsInteger(int defaultValue)
        {
            if (!Valid)
            {
                return defaultValue;
            }

            switch (Type)
            {
                case KeyValueType.String:
                case KeyValueType.WideString:
                    return int.TryParse((string)Value!, out var value) ? value : defaultValue;
                case KeyValueType.Int32:
                    return (int)Value!;
                case KeyValueType.Float32:
                    return (int)(float)Value!;
                case KeyValueType.UInt64:
                    return (int)((ulong)Value! & 0xFFFFFFFF);
                default:
                    return defaultValue;
            }
        }

        public float AsFloat(float defaultValue)
        {
            if (!Valid)
            {
                return defaultValue;
            }

            switch (Type)
            {
                case KeyValueType.String:
                case KeyValueType.WideString:
                    return float.TryParse((string)Value!, out var value) ? value : defaultValue;
                case KeyValueType.Int32:
                    return (int)Value!;
                case KeyValueType.Float32:
                    return (float)Value!;
                case KeyValueType.UInt64:
                    return (ulong)Value!;
                default:
                    return defaultValue;
            }
        }

        public bool AsBoolean(bool defaultValue)
        {
            if (!Valid)
            {
                return defaultValue;
            }

            switch (Type)
            {
                case KeyValueType.String:
                case KeyValueType.WideString:
                    return int.TryParse((string)Value!, out var value) ? value != 0 : defaultValue;
                case KeyValueType.Int32:
                    return (int)Value! != 0;
                case KeyValueType.Float32:
                    return (int)(float)Value! != 0;
                case KeyValueType.UInt64:
                    return (ulong)Value! != 0;
                default:
                    return defaultValue;
            }
        }

        public static KeyValue? LoadFromBytes(byte[] data)
        {
            using var input = new MemoryStream(data);
            var kv = new KeyValue();
            return kv.ReadAsBinary(input) ? kv : null;
        }

        // File-based entry point, restoring the old SteamUtility project's convenience wrapper for
        // reading the local Steam client's cached schema file directly (used by the local-client
        // backend; the daemon backend only ever has schema bytes already in memory from the wire).
        public static KeyValue? LoadFromFile(string path)
        {
            if (!File.Exists(path))
            {
                return null;
            }

            try
            {
                var bytes = File.ReadAllBytes(path);
                return LoadFromBytes(bytes);
            }
            catch
            {
                return null;
            }
        }

        public bool ReadAsBinary(Stream input)
        {
            Children = new List<KeyValue>();
            try
            {
                while (true)
                {
                    var type = (KeyValueType)ReadValueU8(input);
                    if (type == KeyValueType.End)
                    {
                        break;
                    }

                    var current = new KeyValue { Type = type, Name = ReadStringUnicode(input) };

                    switch (type)
                    {
                        case KeyValueType.None:
                            current.ReadAsBinary(input);
                            break;
                        case KeyValueType.String:
                            current.Valid = true;
                            current.Value = ReadStringUnicode(input);
                            break;
                        case KeyValueType.WideString:
                            throw new FormatException("wstring is unsupported");
                        case KeyValueType.Int32:
                            current.Valid = true;
                            current.Value = ReadValueS32(input);
                            break;
                        case KeyValueType.UInt64:
                            current.Valid = true;
                            current.Value = ReadValueU64(input);
                            break;
                        case KeyValueType.Float32:
                            current.Valid = true;
                            current.Value = ReadValueF32(input);
                            break;
                        case KeyValueType.Color:
                        case KeyValueType.Pointer:
                            current.Valid = true;
                            current.Value = ReadValueU32(input);
                            break;
                        default:
                            throw new FormatException();
                    }

                    if (input.Position >= input.Length)
                    {
                        throw new FormatException();
                    }

                    Children.Add(current);
                }

                Valid = true;
                return input.Position == input.Length;
            }
            catch
            {
                return false;
            }
        }

        // `Stream.ReadByte()` returns -1 at end-of-stream rather than throwing - casting that
        // straight to `byte` silently wraps to 255, which doesn't match any real KeyValueType
        // (including End=8), so the caller's read loop just keeps going past EOF instead of
        // stopping. That mattered in practice for a 0-byte schema (an achievement-unlocker scan
        // hitting a schema-less game - see AchievementHandler's IsNoStatsResult): the very first
        // byte read hit this immediately, and the type byte fell straight through into
        // ReadStringUnicode's read loop below, which has the same EOF gap and would spin forever
        // growing an unbounded byte list until the process ran out of memory. Throwing here lets
        // ReadAsBinary's existing catch-and-fail-gracefully handling take over instead.
        private static byte ReadValueU8(Stream input)
        {
            var value = input.ReadByte();
            if (value < 0)
            {
                throw new EndOfStreamException("Unexpected end of stream reading a KeyValue byte.");
            }
            return (byte)value;
        }

        // `Stream.Read` can return fewer bytes than requested at EOF (unlike ReadByte, it doesn't
        // signal this with a sentinel) - the four fixed-size readers below used to ignore that and
        // just ran BitConverter over a partially/never-filled buffer, silently turning truncated
        // input into a bogus zero-ish value instead of the parse failure ReadAsBinary's catch is
        // built to handle. Same root cause class as ReadValueU8/ReadStringUnicode above.
        private static void ReadFully(Stream input, byte[] buffer)
        {
            if (input.Read(buffer, 0, buffer.Length) != buffer.Length)
            {
                throw new EndOfStreamException(
                    "Unexpected end of stream reading a KeyValue value."
                );
            }
        }

        private static int ReadValueS32(Stream input)
        {
            var data = new byte[4];
            ReadFully(input, data);
            return BitConverter.ToInt32(data, 0);
        }

        private static uint ReadValueU32(Stream input)
        {
            var data = new byte[4];
            ReadFully(input, data);
            return BitConverter.ToUInt32(data, 0);
        }

        private static ulong ReadValueU64(Stream input)
        {
            var data = new byte[8];
            ReadFully(input, data);
            return BitConverter.ToUInt64(data, 0);
        }

        private static float ReadValueF32(Stream input)
        {
            var data = new byte[4];
            ReadFully(input, data);
            return BitConverter.ToSingle(data, 0);
        }

        private static string ReadStringUnicode(Stream input)
        {
            var chars = new List<byte>();
            while (true)
            {
                var b = input.ReadByte();
                // See ReadValueU8's comment - EOF (-1) is not the same as a null terminator (0)
                // and must not be treated as ordinary string content, or this loop never ends.
                if (b < 0)
                {
                    throw new EndOfStreamException(
                        "Unexpected end of stream reading a KeyValue string."
                    );
                }
                if (b == 0)
                {
                    break;
                }
                chars.Add((byte)b);
            }
            return System.Text.Encoding.UTF8.GetString(chars.ToArray());
        }
    }
}
