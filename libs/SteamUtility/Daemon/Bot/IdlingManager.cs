using System.Collections.Generic;
using System.Linq;
using SteamKit2;
using SteamKit2.Internal;

namespace SteamUtility.Daemon.Bot
{
    public sealed class IdlingManager
    {
        // Steam only reports up to 32 concurrently "played" games per connection.
        private const int MaxConcurrentGames = 32;

        private readonly SteamBot _bot;
        private List<uint> _currentAppIds = new();
        // Replaces the "Playing <game>" text friends see with this text instead - only takes
        // visible effect when at least one currently-idled app id is actually owned by the
        // account; Steam silently ignores it otherwise. Applied to every concurrently-idled
        // game's entry uniformly, since
        // Steam's rendering of multiple simultaneous GamePlayed entries with different extra info
        // hasn't been individually verified.
        private string? _gameExtraInfo;

        public IdlingManager(SteamBot bot)
        {
            _bot = bot;
            _bot.LogOnStatusChanged += result =>
            {
                if (result == EResult.OK)
                {
                    Resend();
                }
            };
            // The desired set (_currentAppIds) is kept untouched for the whole time another session
            // holds the playing slot - only the announce is held back - so the moment it's released
            // everything the Rust host last asked for resumes, with no re-sync needed from its side.
            _bot.PlayingBlockedChanged += (blocked, _) =>
            {
                if (!blocked)
                {
                    Resend();
                }
            };
        }

        public IReadOnlyList<uint> CurrentAppIds => _currentAppIds;

        public void SetGames(List<uint> appIds, string? gameExtraInfo = null)
        {
            _currentAppIds = appIds.Distinct().Take(MaxConcurrentGames).ToList();
            _gameExtraInfo = gameExtraInfo;
            Resend();
        }

        private void Resend()
        {
            if (!_bot.IsLoggedOn)
            {
                return;
            }

            // Announcing while another session is playing would only get this client logged off
            // again (LoggedInElsewhere) - never the user's real game session, see
            // SteamBot.PlayingBlocked. Nothing to "stop" either: Steam already dropped this
            // client's games when the other session took over the slot.
            if (_bot.PlayingBlocked)
            {
                return;
            }

            var request = new ClientMsgProtobuf<CMsgClientGamesPlayed>(
                EMsg.ClientGamesPlayedWithDataBlob
            );
            foreach (var appId in _currentAppIds)
            {
                request.Body.games_played.Add(
                    new CMsgClientGamesPlayed.GamePlayed
                    {
                        game_id = appId,
                        game_extra_info = _gameExtraInfo ?? "",
                    }
                );
            }

            _bot.Client.Send(request);
        }
    }
}
