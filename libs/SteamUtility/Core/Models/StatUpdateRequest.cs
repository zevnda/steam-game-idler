namespace SteamUtility.Core.Models
{
    // Field is "Name" (not "Id") to match the frontend's StatValue shape ({ name, value }) sent over
    // the wire for both the daemon's stats_update IPC command and the CLI's update_stats command.
    public sealed class StatUpdateRequest
    {
        public string Name { get; set; } = "";
        public double Value { get; set; }
    }
}
