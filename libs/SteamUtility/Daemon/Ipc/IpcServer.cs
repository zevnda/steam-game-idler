using System;
using SteamUtility.Core.Json;

namespace SteamUtility.Daemon.Ipc
{
    public static class IpcServer
    {
        private static readonly object WriteLock = new();

        public static void SendResponse(
            string? id,
            bool ok,
            object? result = null,
            string? error = null
        )
        {
            WriteLine(JsonEnvelope.SerializeResponse(id, ok, result, error));
        }

        public static void SendEvent(string eventName, object? payload = null)
        {
            WriteLine(JsonEnvelope.SerializeEvent(eventName, payload));
        }

        private static void WriteLine(string json)
        {
            lock (WriteLock)
            {
                Console.Out.WriteLine(json);
                Console.Out.Flush();
            }
        }
    }
}
