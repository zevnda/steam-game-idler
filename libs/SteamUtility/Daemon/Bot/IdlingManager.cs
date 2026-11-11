using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SteamKit2;
using SteamKit2.Internal;
using SteamUtility.Core.Logging;

namespace SteamUtility.Daemon.Bot
{
    // Announces this session's idled games to Steam (ClientGamesPlayed), and keeps Steam Families
    // from turning one shared game into a log-off loop.
    //
    // Steam Families lets only one person play a copy at a time, and whoever started first keeps
    // it - announcing a game someone else in the family is already playing doesn't take it from
    // them, even when this account owns it. Instead Steam sends ClientSharedLibraryStopPlaying
    // (naming the game and who holds it) with a 180s countdown, repeats it every 60s, and at 0
    // logs this session off with LoggedInElsewhere - the same result SteamBot reads as "another
    // session on this account started playing", which paused every feature on the account and
    // showed the user the wrong reason. After the reconnect the game was announced again and the
    // whole cycle repeated for as long as the family member played (observed 2026-11).
    //
    // So on the first warning the game is dropped from the announce straight away, well inside
    // the countdown - the log-off never happens and every other game keeps idling. It stays in the
    // desired set and is reported to the Rust host as family-locked. Steam's
    // FamilyGroupsClient.NotifyRunningApps push (within seconds of the other person stopping, in
    // testing) says when it's free again; a periodic re-check covers a missed push.
    public sealed class IdlingManager
    {
        // Steam only reports up to 32 concurrently "played" games per connection.
        private const int MaxConcurrentGames = 32;

        // How often a family-locked game is re-announced in case Steam's "it's free" push was
        // missed. Harmless when it's still locked: Steam answers with another warning within a
        // couple of seconds and the game is dropped again, long before any log-off.
        private static readonly TimeSpan FamilyLockRecheckInterval = TimeSpan.FromMinutes(5);

        // How long a re-check waits for a fresh warning before treating the game as free. Steam's
        // warning arrived 1.5-2.5s after an announce in testing.
        private static readonly TimeSpan FamilyLockProbeWindow = TimeSpan.FromSeconds(15);

        private readonly SteamBot _bot;

        // Guards every field below - this class is driven from the IPC request threads
        // (SetGames), SteamKit2's callback thread (logon/unblock/NotifyRunningApps), its network
        // thread (StopPlaying, via SharedLibraryHandler) and the re-check timer.
        private readonly object _gate = new();
        private List<uint> _currentAppIds = new();

        // Replaces the "Playing <game>" text friends see with this text instead - only takes
        // visible effect when at least one currently-idled app id is actually owned by the
        // account; Steam silently ignores it otherwise. Applied to every concurrently-idled
        // game's entry uniformly, since
        // Steam's rendering of multiple simultaneous GamePlayed entries with different extra info
        // hasn't been individually verified.
        private string? _gameExtraInfo;

        // Desired games someone else in the family is playing, with when Steam last warned about
        // each - always a subset of _currentAppIds. Left out of every announce until freed.
        private readonly Dictionary<uint, DateTime> _familyLocked = new();

        private readonly Timer _familyLockRecheckTimer;

        // Fires whenever the family-locked set changes - DaemonHost reports it with idle_state.
        public event Action? FamilyLockChanged;

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

            // Unified-message notifications are only dispatched for a service that's been created.
            _bot.UnifiedMessagesHandler.CreateService<FamilyGroupsClient>();
            _bot.Manager.SubscribeServiceNotification<
                FamilyGroupsClient,
                CFamilyGroupsClient_NotifyRunningApps_Notification
            >(notification => OnRunningApps(notification.Body));
            _bot.Client.AddHandler(new SharedLibraryHandler(this));

            _familyLockRecheckTimer = new Timer(
                _ => RecheckFamilyLocks(),
                null,
                FamilyLockRecheckInterval,
                FamilyLockRecheckInterval
            );
        }

        public IReadOnlyList<uint> CurrentAppIds
        {
            get
            {
                lock (_gate)
                {
                    return _currentAppIds;
                }
            }
        }

        public IReadOnlyList<uint> FamilyLockedAppIds
        {
            get
            {
                lock (_gate)
                {
                    return _familyLocked.Keys.ToList();
                }
            }
        }

        public void SetGames(List<uint> appIds, string? gameExtraInfo = null)
        {
            bool lockChanged;
            lock (_gate)
            {
                _currentAppIds = appIds.Distinct().Take(MaxConcurrentGames).ToList();
                _gameExtraInfo = gameExtraInfo;
                // A game the host stopped asking for isn't "locked" anymore, just not idling.
                var dropped = _familyLocked.Keys.Where(id => !_currentAppIds.Contains(id)).ToList();
                foreach (var id in dropped)
                {
                    _familyLocked.Remove(id);
                }
                lockChanged = dropped.Count > 0;
            }
            Resend();
            if (lockChanged)
            {
                FamilyLockChanged?.Invoke();
            }
        }

        // `includeFamilyLocked` is only set by RecheckFamilyLocks' probe.
        private void Resend(bool includeFamilyLocked = false)
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
            lock (_gate)
            {
                foreach (var appId in _currentAppIds)
                {
                    if (!includeFamilyLocked && _familyLocked.ContainsKey(appId))
                    {
                        continue;
                    }
                    request.Body.games_played.Add(
                        new CMsgClientGamesPlayed.GamePlayed
                        {
                            game_id = appId,
                            game_extra_info = _gameExtraInfo ?? "",
                        }
                    );
                }
            }

            _bot.Client.Send(request);
        }

        // Steam's countdown warning - see the class comment. Every warning re-sends the announce
        // without the locked games, not just the first: one may arrive mid-probe (see
        // RecheckFamilyLocks), when the locked game is back in the announce.
        private void OnSharedLibraryStopPlaying(CMsgClientSharedLibraryStopPlaying body)
        {
            var self = _bot.SteamID?.AccountID;
            var newlyLocked = new List<string>();
            lock (_gate)
            {
                foreach (var app in body.stop_apps)
                {
                    // owner_id is whoever currently holds the copy, never this account in
                    // testing - skipped if it ever is, since that's not a lock against us.
                    if (!_currentAppIds.Contains(app.app_id) || app.owner_id == self)
                    {
                        continue;
                    }
                    if (!_familyLocked.ContainsKey(app.app_id))
                    {
                        newlyLocked.Add($"{app.app_id} (held by account {app.owner_id})");
                    }
                    _familyLocked[app.app_id] = DateTime.UtcNow;
                }
            }

            Resend();
            if (newlyLocked.Count > 0)
            {
                Log.Info(
                    "Idling",
                    $"Steam Families: someone else is playing {string.Join(", ", newlyLocked)} - idling it is paused until they stop ({body.seconds_left}s before Steam would have signed this session out)"
                );
                FamilyLockChanged?.Invoke();
            }
        }

        // Which family games are running and who's playing them - a game this session has locked
        // is free once nobody but this account is listed as playing it.
        private void OnRunningApps(CFamilyGroupsClient_NotifyRunningApps_Notification body)
        {
            var self = _bot.SteamID?.ConvertToUInt64();
            List<uint> freed;
            lock (_gate)
            {
                freed = _familyLocked
                    .Keys.Where(appId =>
                        !body.running_apps.Any(app =>
                            app.appid == appId
                            && app.playing_members.Any(member => member.member_steamid != self)
                        )
                    )
                    .ToList();
                foreach (var appId in freed)
                {
                    _familyLocked.Remove(appId);
                }
            }

            if (freed.Count > 0)
            {
                Log.Info(
                    "Idling",
                    $"Steam Families: {string.Join(", ", freed)} is free again - resuming idling it"
                );
                Resend();
                FamilyLockChanged?.Invoke();
            }
        }

        // Fallback for a missed NotifyRunningApps push: briefly re-announce the locked games and
        // free any that Steam doesn't warn about again within the probe window.
        private void RecheckFamilyLocks()
        {
            lock (_gate)
            {
                if (_familyLocked.Count == 0)
                {
                    return;
                }
            }
            if (!_bot.IsLoggedOn || _bot.PlayingBlocked)
            {
                return;
            }

            var probeStartedAt = DateTime.UtcNow;
            Resend(includeFamilyLocked: true);

            _ = Task.Delay(FamilyLockProbeWindow)
                .ContinueWith(_ =>
                {
                    List<uint> freed;
                    lock (_gate)
                    {
                        freed = _familyLocked
                            .Where(entry => entry.Value < probeStartedAt)
                            .Select(entry => entry.Key)
                            .ToList();
                        foreach (var appId in freed)
                        {
                            _familyLocked.Remove(appId);
                        }
                    }
                    // Re-sent either way: a game still locked was put back into the announce by
                    // the probe, and only a fresh warning would otherwise take it out again.
                    Resend();
                    if (freed.Count > 0)
                    {
                        Log.Info(
                            "Idling",
                            $"Steam Families: no warning for {string.Join(", ", freed)} on re-check - resuming idling it"
                        );
                        FamilyLockChanged?.Invoke();
                    }
                });
        }

        // ClientSharedLibraryStopPlaying has no SteamKit2 callback of its own, so it's picked off
        // the raw message stream - the same way AchievementHandler handles the stats messages.
        private sealed class SharedLibraryHandler : ClientMsgHandler
        {
            private readonly IdlingManager _owner;

            public SharedLibraryHandler(IdlingManager owner)
            {
                _owner = owner;
            }

            public override void HandleMsg(IPacketMsg packetMsg)
            {
                if (packetMsg.MsgType != EMsg.ClientSharedLibraryStopPlaying)
                {
                    return;
                }
                var message = new ClientMsgProtobuf<CMsgClientSharedLibraryStopPlaying>(packetMsg);
                _owner.OnSharedLibraryStopPlaying(message.Body);
            }
        }
    }
}
