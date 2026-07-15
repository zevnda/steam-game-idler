using SteamKit2;

namespace SteamUtility.Daemon.Bot
{
    // Owns the account's desired persona state (Online/Away/Busy/...) and re-applies it on every
    // successful (re)login, mirroring IdlingManager's own self-resend-on-reconnect pattern -
    // without this, SteamBot's hardcoded EPersonaState.Online would win back over a user's chosen
    // state after every reconnect. Defaults to Online, matching the behavior this replaces
    // (SteamBot.cs previously called SetPersonaState(Online) directly in OnLoggedOn).
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
