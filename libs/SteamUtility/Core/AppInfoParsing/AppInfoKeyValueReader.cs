using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using SteamUtility.Core.SchemaParsing;

namespace SteamUtility.Core.AppInfoParsing
{
    // A second binary-VDF ("KeyValue") reader alongside SchemaParsing/KeyValue.cs, deliberately
    // separate rather than extending that type - KeyValue.cs is scoped to the plain schema-blob
    // format (achievement/stat schemas), and appinfo.vdf's version-41+ format needs one extra
    // capability that format never has: KV *key* names can be a 4-byte string-table index instead
    // of an inline string (confirmed against ValveResourceFormat/ValveKeyValue's KV1BinaryReader
    // and its byte-annotated string-table test fixture - only keys are indexed, value strings stay
    // inline UTF-8 in every version, so value decoding is identical to KeyValue.cs's). Produces
    // plain SchemaParsing.KeyValue trees so callers can reuse its indexer/AsString/AsInteger
    // accessors and SchemaWalker.ResolveLocalizedString unchanged.
    internal static class AppInfoKeyValueReader
    {
        public static KeyValue ReadNode(Stream input, IReadOnlyList<string>? stringTable)
        {
            var root = new KeyValue { Valid = true };
            ReadChildren(input, stringTable, root);
            return root;
        }

        private static void ReadChildren(Stream input, IReadOnlyList<string>? stringTable, KeyValue parent)
        {
            parent.Children = new List<KeyValue>();

            while (true)
            {
                var type = (KeyValueType)ReadU8(input);
                if (type == KeyValueType.End)
                {
                    break;
                }

                var current = new KeyValue { Type = type, Name = ReadName(input, stringTable) };

                switch (type)
                {
                    case KeyValueType.None:
                        ReadChildren(input, stringTable, current);
                        current.Valid = true;
                        break;
                    case KeyValueType.String:
                        current.Valid = true;
                        current.Value = ReadInlineString(input);
                        break;
                    case KeyValueType.WideString:
                        throw new NotSupportedException("wstring is unsupported");
                    case KeyValueType.Int32:
                        current.Valid = true;
                        current.Value = ReadS32(input);
                        break;
                    case KeyValueType.UInt64:
                        current.Valid = true;
                        current.Value = ReadU64(input);
                        break;
                    case KeyValueType.Float32:
                        current.Valid = true;
                        current.Value = ReadF32(input);
                        break;
                    case KeyValueType.Color:
                    case KeyValueType.Pointer:
                        current.Valid = true;
                        current.Value = ReadU32(input);
                        break;
                    default:
                        // Tags beyond None..End (ProbablyBinary/Int64/AlternateEnd in the wider KV1
                        // format) belong to a separate VBKV-wrapper use case that doesn't apply to
                        // appinfo.vdf - fail loudly instead of silently misparsing the rest of the
                        // stream if one somehow shows up.
                        throw new FormatException($"Unexpected appinfo.vdf KV type tag {(int)type}.");
                }

                parent.Children.Add(current);
            }

            parent.Valid = true;
        }

        private static string ReadName(Stream input, IReadOnlyList<string>? stringTable)
        {
            if (stringTable == null)
            {
                return ReadInlineString(input);
            }

            var index = ReadS32(input);
            return index >= 0 && index < stringTable.Count ? stringTable[index] : "";
        }

        private static byte ReadU8(Stream input)
        {
            var value = input.ReadByte();
            if (value < 0)
            {
                throw new EndOfStreamException("Unexpected end of stream reading an appinfo.vdf KV byte.");
            }
            return (byte)value;
        }

        private static void ReadFully(Stream input, byte[] buffer)
        {
            if (input.Read(buffer, 0, buffer.Length) != buffer.Length)
            {
                throw new EndOfStreamException("Unexpected end of stream reading an appinfo.vdf KV value.");
            }
        }

        private static int ReadS32(Stream input)
        {
            var data = new byte[4];
            ReadFully(input, data);
            return BitConverter.ToInt32(data, 0);
        }

        private static uint ReadU32(Stream input)
        {
            var data = new byte[4];
            ReadFully(input, data);
            return BitConverter.ToUInt32(data, 0);
        }

        private static ulong ReadU64(Stream input)
        {
            var data = new byte[8];
            ReadFully(input, data);
            return BitConverter.ToUInt64(data, 0);
        }

        private static float ReadF32(Stream input)
        {
            var data = new byte[4];
            ReadFully(input, data);
            return BitConverter.ToSingle(data, 0);
        }

        // Also used for the file's top-level string table entries (AppInfoReader), which share the
        // same null-terminated UTF-8 encoding as every inline string in this format.
        public static string ReadInlineString(Stream input)
        {
            var bytes = new List<byte>();
            while (true)
            {
                var b = input.ReadByte();
                if (b < 0)
                {
                    throw new EndOfStreamException("Unexpected end of stream reading an appinfo.vdf string.");
                }
                if (b == 0)
                {
                    break;
                }
                bytes.Add((byte)b);
            }
            return Encoding.UTF8.GetString(bytes.ToArray());
        }
    }
}
