using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SteamKit2;
using SteamUtility.Core.Logging;

namespace SteamUtility.Daemon.Bot
{
    public sealed class SteamBot
    {
        private const int InitialReconnectDelayMs = 1000;
        private const int MaxReconnectDelayMs = 60_000;

        // How long Steam must keep reporting "not blocked" before PlayingBlocked flips back to
        // false - the same 60s ASF uses (its MinPlayingBlockedTTL). Absorbs brief blocked->unblocked
        // blips (a launcher handing off to the real game exe, a quick restart of the same game)
        // that would otherwise have idling resume for a few seconds and trip the user's own client
        // into a "your account is in use elsewhere" prompt on their next launch.
        private static readonly TimeSpan PlayingResumeGrace = TimeSpan.FromSeconds(60);

        // Upper bound for the fallback unblock delay's doubling - see _fallbackUnblockDelay.
        private static readonly TimeSpan MaxFallbackUnblockDelay = TimeSpan.FromMinutes(15);

        public SteamClient Client { get; }
        public CallbackManager Manager { get; }
        public SteamUser SteamUserHandler { get; }
        public SteamApps SteamAppsHandler { get; }
        public SteamFriends SteamFriendsHandler { get; }
        public SteamUnifiedMessages UnifiedMessagesHandler { get; }

        public bool IsLoggedOn { get; private set; }
        public SteamID? SteamID => IsLoggedOn ? SteamUserHandler.SteamID : null;

        // Set by AuthFlow on every successful LogOnAsync (credentials or refresh-token resume) -
        // the same long-lived token already used for LogOnDetails.AccessToken, kept here too so a
        // web session can be minted on demand via SteamAuthentication.GenerateAccessTokenForAppAsync
        // without a fresh interactive login. Survives reconnects since it's only ever overwritten by
        // a new successful logon, never cleared on disconnect.
        public string? RefreshToken { get; set; }

        // Resent by Steam on every successful logon/reconnect - cached here rather than
        // re-requested on demand so OwnershipManager always has a fresh set to build PICS
        // package requests (with access tokens) from.
        public IReadOnlyList<SteamApps.LicenseListCallback.License> OwnedLicenses
        {
            get;
            private set;
        } = Array.Empty<SteamApps.LicenseListCallback.License>();

        public event Action? Connected;
        public event Action<EResult>? LogOnStatusChanged;

        // Fires on every LicenseListCallback after the first (post-login) one, which
        // WaitForLicenseListAsync's one-shot _licenseListTcs already covers - lets a caller elsewhere
        // in the bot's lifetime (FreeLicenseManager) wait for a subsequent push rather than only the
        // very first one. See WaitForPackagesInLicensesAsync below for why this is needed.
        public event Action? LicenseListUpdated;

        // First bool: whether this disconnect is one Start()'s own auto-reconnect/backoff below is
        // about to retry on its own (network drop mid-session, or a "playing elsewhere" kick - see
        // below), as opposed to a permanent one (Stop() called, or the disconnect happened before
        // any LogOnAsync was ever issued). Consumers that cache connection-derived state (e.g.
        // AgentProcess's steam_id in the Rust host) need this to avoid treating a transient
        // reconnect-in-progress as a fully-gone session. Second bool: whether the server
        // force-logged this client off *terminally* - EResult.LogonSessionReplaced (a second client
        // of the same logon type, e.g. another SteamKit2-based client on the same machine, no
        // game-playing involved at all - confirmed by real-world testing: two SGI instances signed
        // into the same account with nothing idling on either side kicked each other in a tight ~2s
        // loop). Reconnecting there would just restart that fight, so it never auto-reconnects.
        //
        // EResult.LoggedInElsewhere is deliberately NOT terminal: it means another session took
        // over the account's single "playing a game" slot (the user launched a game on their real
        // Steam client, or elsewhere) - logging on itself is never exclusive, only playing is. That
        // kick reconnects like a network drop and marks PlayingBlocked, so idling stays paused
        // until Steam reports the other session stopped playing (see OnPlayingSessionState).
        public event Action<bool, bool>? Disconnected;

        // Fires whenever PlayingBlocked (or the blocking app id) changes - see OnPlayingSessionState
        // for the full state machine. Args: (blocked, appId), where appId is 0 when unknown (a
        // LoggedInElsewhere kick before Steam has told us which game) or when unblocked.
        public event Action<bool, uint>? PlayingBlockedChanged;

        // Whether another session on this account currently holds the "playing a game" slot, so
        // sending ClientGamesPlayed would just get *this* client logged off with LoggedInElsewhere
        // (per SteamKit2's own PlayingSessionStateCallback docs) - it can never preempt the other
        // session, only ClientKickPlayingSession can, and this client never sends that. IdlingManager
        // holds its announce while this is true and re-announces when it flips back to false.
        public bool PlayingBlocked
        {
            get
            {
                lock (_playingLock)
                {
                    return _playingBlocked;
                }
            }
        }

        private volatile bool _running;
        private SteamUser.LogOnDetails? _pendingLogOnDetails;
        private TaskCompletionSource<EResult>? _pendingLogOnTcs;
        private TaskCompletionSource? _pendingConnectTcs;
        private TaskCompletionSource<bool>? _licenseListTcs;
        private int _reconnectDelayMs = InitialReconnectDelayMs;

        // Captured by OnLoggedOff (fired by the server before the matching DisconnectedCallback when
        // it force-logs the client off) and consumed/cleared by the very next OnDisconnected - see
        // that method for why the reason isn't otherwise available there.
        private EResult? _lastLoggedOffResult;

        // Guards every _playing* field below - written from the callback thread
        // (OnPlayingSessionState/OnDisconnected/OnLoggedOn) and from ScheduleUnblock's thread-pool
        // continuations.
        private readonly object _playingLock = new();
        private bool _playingBlocked;
        private uint _playingAppId;

        // Bumped on every blocked-state change or newly scheduled unblock, so a pending
        // ScheduleUnblock continuation can tell it's been superseded (Steam reported "blocked"
        // again, or a newer unblock was scheduled) and drop itself instead of resuming early.
        private int _playingGeneration;

        // Fallback for when Steam never sends a PlayingSessionState after a (re)logon while we still
        // believe we're blocked (e.g. the kick arrived, but the post-reconnect state push didn't).
        // Without it PlayingBlocked could stay true forever. Doubles on every use so a wrong guess
        // (resume -> kicked again) backs off instead of looping every minute; reset to the base
        // grace whenever Steam reports an explicit state, since that's the authoritative signal.
        private TimeSpan _fallbackUnblockDelay = PlayingResumeGrace;

        public SteamBot()
        {
            Client = new SteamClient();
            Manager = new CallbackManager(Client);
            SteamUserHandler = Client.GetHandler<SteamUser>()!;
            SteamAppsHandler = Client.GetHandler<SteamApps>()!;
            SteamFriendsHandler = Client.GetHandler<SteamFriends>()!;
            UnifiedMessagesHandler = Client.GetHandler<SteamUnifiedMessages>()!;

            Manager.Subscribe<SteamClient.ConnectedCallback>(OnConnected);
            Manager.Subscribe<SteamClient.DisconnectedCallback>(OnDisconnected);
            Manager.Subscribe<SteamUser.LoggedOnCallback>(OnLoggedOn);
            Manager.Subscribe<SteamUser.LoggedOffCallback>(OnLoggedOff);
            Manager.Subscribe<SteamApps.LicenseListCallback>(OnLicenseList);
            Manager.Subscribe<SteamUser.PlayingSessionStateCallback>(OnPlayingSessionState);
        }

        public void Start()
        {
            _running = true;
            var thread = new Thread(RunCallbackLoop)
            {
                IsBackground = true,
                Name = "SteamUtilityAgentCallbacks",
            };
            thread.Start();
        }

        public void Stop()
        {
            _running = false;
            _pendingLogOnDetails = null;
            if (Client.IsConnected)
            {
                Client.Disconnect();
            }
        }

        // The credential auth handshake (BeginAuthSessionViaCredentialsAsync) runs over an
        // already-established CM connection - it is not an out-of-band REST call. Callers must
        // await this before starting an auth session or calling LogOnAsync.
        public Task ConnectAsync()
        {
            if (Client.IsConnected)
            {
                return Task.CompletedTask;
            }

            var tcs = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
            _pendingConnectTcs = tcs;
            Client.Connect();
            return tcs.Task;
        }

        // Assumes the client is already connected (via ConnectAsync). Persists the details so
        // reconnects (network drop, etc.) automatically re-log-on with the same credentials/token.
        public Task<EResult> LogOnAsync(SteamUser.LogOnDetails details)
        {
            var tcs = new TaskCompletionSource<EResult>(
                TaskCreationOptions.RunContinuationsAsynchronously
            );
            _pendingLogOnDetails = details;
            _pendingLogOnTcs = tcs;
            _reconnectDelayMs = InitialReconnectDelayMs;
            SteamUserHandler.LogOn(details);
            return tcs.Task;
        }

        private void RunCallbackLoop()
        {
            while (_running)
            {
                Manager.RunWaitCallbacks(TimeSpan.FromMilliseconds(150));
            }
        }

        private void OnConnected(SteamClient.ConnectedCallback callback)
        {
            _reconnectDelayMs = InitialReconnectDelayMs;

            _pendingConnectTcs?.TrySetResult();
            _pendingConnectTcs = null;

            Connected?.Invoke();

            // Reconnect case: we already have credentials/token from a prior successful LogOnAsync.
            if (_pendingLogOnDetails != null && _pendingLogOnTcs == null)
            {
                SteamUserHandler.LogOn(_pendingLogOnDetails);
            }
        }

        private void OnLoggedOff(SteamUser.LoggedOffCallback callback)
        {
            // Just captures the reason for the OnDisconnected that immediately follows - the server
            // sends this over the still-open connection right before tearing it down, so ordering
            // relative to DisconnectedCallback is reliable.
            _lastLoggedOffResult = callback.Result;
        }

        private void OnDisconnected(SteamClient.DisconnectedCallback callback)
        {
            IsLoggedOn = false;

            _pendingConnectTcs?.TrySetException(
                new InvalidOperationException("Disconnected before connection completed")
            );
            _pendingConnectTcs = null;

            _pendingLogOnTcs?.TrySetResult(EResult.NoConnection);
            _pendingLogOnTcs = null;

            var loggedOffResult = _lastLoggedOffResult;
            _lastLoggedOffResult = null;
            var wasKicked = loggedOffResult == EResult.LogonSessionReplaced;

            if (loggedOffResult == EResult.LoggedInElsewhere)
            {
                // Marked before Disconnected fires so every consumer (IdlingManager, the Rust host
                // via DaemonHost's playing_session event) already sees "paused, not gone" by the
                // time it hears about the disconnect - see the `Disconnected` event's doc comment.
                Log.Info(
                    "Daemon",
                    "Logged off because another session started playing a game - reconnecting and pausing idling until it stops"
                );
                SetPlayingBlocked(true, 0);
            }

            // Computed before invoking the event so subscribers get an accurate signal, not just a
            // bare "disconnected" they'd have to re-derive the same reconnect eligibility for
            // themselves. Never reconnect after a terminal kick - see the `Disconnected` event's
            // doc comment.
            var willReconnect =
                !wasKicked && _running && !callback.UserInitiated && _pendingLogOnDetails != null;
            Disconnected?.Invoke(willReconnect, wasKicked);

            if (wasKicked)
            {
                // Drop the cached credentials/token too, not just skip this round's reconnect -
                // otherwise a later, unrelated Client.Connect() (if one ever happened) would hit
                // OnConnected's own reconnect-case branch and silently re-log-on with stale details,
                // re-triggering the exact fight this is meant to stop.
                _pendingLogOnDetails = null;
            }

            if (!willReconnect)
            {
                return;
            }

            var delay = _reconnectDelayMs;
            _reconnectDelayMs = Math.Min(_reconnectDelayMs * 2, MaxReconnectDelayMs);

            Task.Delay(delay)
                .ContinueWith(_ =>
                {
                    if (_running && _pendingLogOnDetails != null)
                    {
                        Client.Connect();
                    }
                });
        }

        private void OnLoggedOn(SteamUser.LoggedOnCallback callback)
        {
            IsLoggedOn = callback.Result == EResult.OK;

            if (IsLoggedOn)
            {
                // LicenseListCallback is a separate, independently-timed server push with no
                // ordering guarantee relative to this one - reset the waiter on every successful
                // logon/reconnect so OwnershipManager can block on the fresh set actually arriving
                // instead of racing ahead on whatever OwnedLicenses held from before (empty, on a
                // brand-new login).
                _licenseListTcs = new TaskCompletionSource<bool>(
                    TaskCreationOptions.RunContinuationsAsynchronously
                );

                // Still blocked from before this (re)logon - normally Steam pushes a fresh
                // PlayingSessionState right after logon, which supersedes this, but schedule a
                // fallback unblock in case it never arrives. Before LogOnStatusChanged below so
                // IdlingManager's resend-on-logon already sees the correct (still blocked) state.
                lock (_playingLock)
                {
                    if (_playingBlocked)
                    {
                        var delay = _fallbackUnblockDelay;
                        _fallbackUnblockDelay = TimeSpan.FromTicks(
                            Math.Min(delay.Ticks * 2, MaxFallbackUnblockDelay.Ticks)
                        );
                        ScheduleUnblockLocked(delay);
                    }
                }
            }

            // Persona state is no longer set here - PresenceManager subscribes to
            // LogOnStatusChanged itself (mirroring IdlingManager's own resend-on-reconnect
            // pattern) and applies the account's chosen state, defaulting to Online.
            LogOnStatusChanged?.Invoke(callback.Result);

            _pendingLogOnTcs?.TrySetResult(callback.Result);
            _pendingLogOnTcs = null;
        }

        // Steam's own authoritative signal for the "only one session can play at a time" rule -
        // sent when another session on this account starts or stops playing a game, and after
        // logon. "Blocked" applies immediately (never idle over the user's real game); "not
        // blocked" only takes effect after PlayingResumeGrace of staying unblocked, see that
        // constant's comment.
        private void OnPlayingSessionState(SteamUser.PlayingSessionStateCallback callback)
        {
            if (callback.PlayingBlocked)
            {
                Log.Info(
                    "Daemon",
                    $"Another session is playing app {callback.PlayingAppID} - idling paused"
                );
                lock (_playingLock)
                {
                    _fallbackUnblockDelay = PlayingResumeGrace;
                }
                SetPlayingBlocked(true, callback.PlayingAppID);
                return;
            }

            lock (_playingLock)
            {
                _fallbackUnblockDelay = PlayingResumeGrace;
                if (!_playingBlocked)
                {
                    return;
                }
                Log.Info(
                    "Daemon",
                    $"Other session stopped playing - resuming idling in {PlayingResumeGrace.TotalSeconds:0}s unless it starts again"
                );
                ScheduleUnblockLocked(PlayingResumeGrace);
            }
        }

        private void SetPlayingBlocked(bool blocked, uint appId)
        {
            lock (_playingLock)
            {
                SetPlayingBlockedLocked(blocked, appId);
            }
        }

        // Caller must hold _playingLock. PlayingBlockedChanged is deliberately invoked while still
        // holding it, so two near-simultaneous transitions (a grace timer firing just as Steam
        // reports "blocked" again) can never reach subscribers out of order. Safe because every
        // subscriber (IdlingManager.Resend, DaemonHost's IPC event write) only reads PlayingBlocked
        // back on the same thread - Monitor locks are reentrant - and never waits on another thread
        // that needs this lock.
        private void SetPlayingBlockedLocked(bool blocked, uint appId)
        {
            // A newer report always cancels any pending unblock, even when nothing visible changed -
            // that's what stops a stale grace timer from resuming idling while the other session is
            // (again) playing.
            _playingGeneration++;
            // An unknown app id (0, from a kick) never overwrites an already-known one.
            var effectiveAppId = blocked && appId == 0 ? _playingAppId : appId;
            var changed = _playingBlocked != blocked || _playingAppId != effectiveAppId;
            _playingBlocked = blocked;
            _playingAppId = blocked ? effectiveAppId : 0;
            if (changed)
            {
                PlayingBlockedChanged?.Invoke(_playingBlocked, _playingAppId);
            }
        }

        // Caller must hold _playingLock.
        private void ScheduleUnblockLocked(TimeSpan delay)
        {
            var generation = ++_playingGeneration;
            Task.Delay(delay)
                .ContinueWith(_ =>
                {
                    lock (_playingLock)
                    {
                        if (generation != _playingGeneration || !_playingBlocked)
                        {
                            return;
                        }
                        Log.Info("Daemon", "No other session is playing anymore - idling resumed");
                        SetPlayingBlockedLocked(false, 0);
                    }
                });
        }

        private void OnLicenseList(SteamApps.LicenseListCallback callback)
        {
            if (callback.Result == EResult.OK)
            {
                OwnedLicenses = callback.LicenseList.ToList();
            }

            // Unblock waiters even on a non-OK result - there's no retry for this callback, so
            // holding a caller for the full timeout when it's already known to have failed just
            // adds latency for no benefit.
            _licenseListTcs?.TrySetResult(true);
            LicenseListUpdated?.Invoke();
        }

        // Lets OwnershipManager block until the post-logon license list has actually been
        // delivered, rather than trusting whatever OwnedLicenses held at the moment it happens to
        // be read (which is empty immediately after a fresh logon, before this arrives). Bounded so
        // a missing/delayed callback degrades to the old racy-empty behavior instead of hanging the
        // caller - comfortably under the Rust host's 30s per-request IPC timeout.
        public Task WaitForLicenseListAsync(TimeSpan timeout)
        {
            var tcs = _licenseListTcs;
            return tcs == null ? Task.CompletedTask : Task.WhenAny(tcs.Task, Task.Delay(timeout));
        }

        // Blocks until OwnedLicenses includes at least one of `packageIds`, or `timeout` elapses -
        // whichever first. Needed because RequestFreeLicense's grant response and the LicenseListCallback
        // that actually updates OwnedLicenses are two independent server pushes with no ordering
        // guarantee (the same class of race WaitForLicenseListAsync already guards at login, see its
        // own doc comment) - a caller that re-checks ownership immediately after a "Granted" response
        // can otherwise still read back the pre-grant license set. Checks before and after subscribing
        // to LicenseListUpdated to avoid missing an update that lands in between; degrades to a timeout
        // (not an exception) if the callback never arrives, since the license was still genuinely
        // granted at the Steam-network level regardless of when/whether this local state catches up.
        public async Task WaitForPackagesInLicensesAsync(
            IReadOnlyCollection<uint> packageIds,
            TimeSpan timeout
        )
        {
            if (packageIds.Count == 0 || OwnedLicenses.Any(l => packageIds.Contains(l.PackageID)))
            {
                return;
            }

            var tcs = new TaskCompletionSource<bool>(TaskCreationOptions.RunContinuationsAsynchronously);
            void OnUpdated()
            {
                if (OwnedLicenses.Any(l => packageIds.Contains(l.PackageID)))
                {
                    tcs.TrySetResult(true);
                }
            }

            LicenseListUpdated += OnUpdated;
            try
            {
                if (OwnedLicenses.Any(l => packageIds.Contains(l.PackageID)))
                {
                    return;
                }
                await Task.WhenAny(tcs.Task, Task.Delay(timeout));
            }
            finally
            {
                LicenseListUpdated -= OnUpdated;
            }
        }
    }
}
