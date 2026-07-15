using System.Collections.Generic;
using SteamUtility.Core.Models;

namespace SteamUtility.Daemon.Ipc
{
    // One `{id, unlock}` pair for the `achievement_set_bulk` command - mirrors
    // src-tauri/src/steam_agent/ipc.rs's `AchievementChange` wire shape exactly.
    public sealed class AchievementChangeRequest
    {
        public string Id { get; set; } = "";
        public bool Unlock { get; set; }
    }

    public class IpcRequest
    {
        public string? Id { get; set; }
        public string Cmd { get; set; } = "";
        public string? User { get; set; }
        public string? PassB64 { get; set; }
        public string? RefreshTokenB64 { get; set; }
        public string? Code { get; set; }
        public List<uint>? AppIds { get; set; }
        public uint? AppId { get; set; }
        public string? AchievementId { get; set; }
        public bool? Unlock { get; set; }
        public List<StatUpdateRequest>? Stats { get; set; }
        public List<AchievementChangeRequest>? AchievementChanges { get; set; }
        public string? PersonaState { get; set; }

        // `idle_set` only - replaces the "Playing <game>" text friends see for the idling
        // announcement with this text instead. Only takes visible effect when paired with a real,
        // owned app id; Steam silently ignores it for a synthetic/unowned game_id.
        public string? GameExtraInfo { get; set; }
    }
}
