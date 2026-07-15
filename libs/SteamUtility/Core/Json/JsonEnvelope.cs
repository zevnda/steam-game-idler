using System.Collections.Generic;
using System.Text.Json;

namespace SteamUtility.Core.Json
{
    // Single {ok, result, error} envelope shape (with an optional id for the daemon's IPC
    // request/response correlation), used for both the CLI's one stdout line per invocation and the
    // daemon's IPC responses/events - one shared serialization point instead of the two independent
    // ad hoc JSON-building implementations the pre-merge projects had (Newtonsoft.Json anonymous
    // objects in the old CLI, a hand-built Dictionary<string,object?> in the old IpcServer).
    public static class JsonEnvelope
    {
        public static readonly JsonSerializerOptions Options = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };

        public static string SerializeResponse(
            string? id,
            bool ok,
            object? result = null,
            string? error = null
        )
        {
            var envelope = new Dictionary<string, object?>();
            if (id != null)
            {
                envelope["id"] = id;
            }
            envelope["ok"] = ok;
            if (ok)
            {
                envelope["result"] = result;
            }
            else
            {
                envelope["error"] = error;
            }
            return JsonSerializer.Serialize(envelope, Options);
        }

        public static string SerializeEvent(string eventName, object? payload = null)
        {
            var envelope = new Dictionary<string, object?> { ["event"] = eventName };
            if (payload != null)
            {
                var json = JsonSerializer.SerializeToElement(payload, Options);
                foreach (var prop in json.EnumerateObject())
                {
                    envelope[prop.Name] = prop.Value;
                }
            }
            return JsonSerializer.Serialize(envelope, Options);
        }
    }
}
