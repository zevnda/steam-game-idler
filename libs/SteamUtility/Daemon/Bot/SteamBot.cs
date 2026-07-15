using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using SteamKit2;

namespace SteamUtility.Daemon.Bot
{
    public sealed class SteamBot
    {
        private const int InitialReconnectDelayMs = 1000;
        private const int MaxReconnectDelayMs = 60_000;

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
        // bool argument: whether this disconnect is one Start()'s own auto-reconnect/backoff below
        // is about to retry on its own (network drop mid-session), as opposed to a permanent one
        // (Stop() called, or the disconnect happened before any LogOnAsync was ever issued).
        // Consumers that cache connection-derived state (e.g. AgentProcess's steam_id in the Rust
        // host) need this to avoid treating a transient reconnect-in-progress as a fully-gone
        // session.
        public event Action<bool>? Disconnected;

        private volatile bool _running;
        private SteamUser.LogOnDetails? _pendingLogOnDetails;
        private TaskCompletionSource<EResult>? _pendingLogOnTcs;
        private TaskCompletionSource? _pendingConnectTcs;
        private TaskCompletionSource<bool>? _licenseListTcs;
        private int _reconnectDelayMs = InitialReconnectDelayMs;

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
            Manager.Subscribe<SteamApps.LicenseListCallback>(OnLicenseList);
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

        private void OnDisconnected(SteamClient.DisconnectedCallback callback)
        {
            IsLoggedOn = false;

            _pendingConnectTcs?.TrySetException(
                new InvalidOperationException("Disconnected before connection completed")
            );
            _pendingConnectTcs = null;

            _pendingLogOnTcs?.TrySetResult(EResult.NoConnection);
            _pendingLogOnTcs = null;

            // Computed before invoking the event so subscribers get an accurate signal, not just a
            // bare "disconnected" they'd have to re-derive the same reconnect eligibility for
            // themselves.
            var willReconnect = _running && !callback.UserInitiated && _pendingLogOnDetails != null;
            Disconnected?.Invoke(willReconnect);

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
            }

            // Persona state is no longer set here - PresenceManager subscribes to
            // LogOnStatusChanged itself (mirroring IdlingManager's own resend-on-reconnect
            // pattern) and applies the account's chosen state, defaulting to Online.
            LogOnStatusChanged?.Invoke(callback.Result);

            _pendingLogOnTcs?.TrySetResult(callback.Result);
            _pendingLogOnTcs = null;
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
    }
}
