using SteamKit2;

namespace SteamUtility.Daemon.Bot
{
    // Owns the account's desired persona state (Online/Away/Busy/...) and re-applies it on every
    // successful (re)login, mirroring IdlingManager's own self-resend-on-reconnect pattern -
    // without this, SteamBot's hardcoded EPersonaState.Online would win back over a user's chosen
    // state after every reconnect. Defaults to Online, matching the behavior this replaces
    // (SteamBot.cs previously called SetPersonaState(Online) directly in OnLoggedOn).
    //
    // DaemonHost's "login"/"login_with_token" cases call SetPersonaState() to pre-seed this field
    // *before* logging on, whenever Rust already knows this account's saved preference (see
    // AgentManager::cached_persona_state). That call's own Apply() no-ops harmlessly while not yet
    // logged on (see below) - its only effect is making sure the LogOnStatusChanged-triggered
    // Apply() that fires the moment logon succeeds broadcasts the *correct* state on the very
    // first try, instead of this class's Online default, which a user who wants Invisible/Offline
    // would otherwise see broadcast to their friends for the length of one extra IPC round trip
    // (Rust's own post-login correction, kept as a fallback for whenever no pre-seed was sent).
    public sealed class PresenceManager
    {
        private readonly SteamBot _bot;
        private EPersonaState _personaState = EPersonaState.Online;

        public PresenceManager(SteamBot bot)
        {
            _bot = bot;
            _bot.LogOnStatusChanged += result =>
            {
                if (result == EResult.OK)
                {
                    Apply();
                }
            };
        }

        public void SetPersonaState(EPersonaState state)
        {
            _personaState = state;
            Apply();
        }

        private void Apply()
        {
            if (!_bot.IsLoggedOn)
            {
                return;
            }

            _bot.SteamFriendsHandler.SetPersonaState(_personaState);
        }
    }
}
