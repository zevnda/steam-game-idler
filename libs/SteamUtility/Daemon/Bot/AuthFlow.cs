using System;
using System.Text;
using System.Threading.Tasks;
using SteamKit2;
using SteamKit2.Authentication;
using SteamKit2.Internal;
using SteamUtility.Core.Errors;
using SteamUtility.Daemon.Ipc;

namespace SteamUtility.Daemon.Bot
{
    // Result of deriving a Steam Community web session directly from an already-authenticated
    // SteamKit2 connection - see AuthFlow.GetWebSessionAsync.
    public sealed class WebSessionResult
    {
        public required string SteamId { get; init; }
        public required string SteamLoginSecure { get; init; }
    }

    public sealed class AuthFlow
    {
        private readonly SteamBot _bot;

        private TaskCompletionSource<string>? _pendingGuardCodeTcs;
        private string? _pendingLoginRequestId;
        private bool _guardResponseSent;

        public AuthFlow(SteamBot bot)
        {
            _bot = bot;
        }

        public async Task LoginWithCredentialsAsync(
            string? requestId,
            string username,
            string passwordBase64
        )
        {
            _pendingLoginRequestId = requestId;
            _guardResponseSent = false;
            _pendingGuardCodeTcs = null;

            string password;
            try
            {
                password = Encoding.UTF8.GetString(Convert.FromBase64String(passwordBase64));
            }
            catch (Exception)
            {
                IpcServer.SendResponse(requestId, false, error: "invalid_password_encoding");
                return;
            }

            try
            {
                // BeginAuthSessionViaCredentialsAsync runs over the CM connection itself, not an
                // out-of-band call - the client must already be connected before starting it.
                await _bot.ConnectAsync();

                var authSession =
                    await _bot.Client.Authentication.BeginAuthSessionViaCredentialsAsync(
                        new AuthSessionDetails
                        {
                            Username = username,
                            Password = password,
                            IsPersistentSession = true,
                            PlatformType =
                                EAuthTokenPlatformType.k_EAuthTokenPlatformType_SteamClient,
                            ClientOSType = EOSType.Win11,
                            Authenticator = new IpcAuthenticator(this),
                        }
                    );

                var pollResult = await authSession.PollingWaitForResultAsync();

                var logOnResult = await _bot.LogOnAsync(
                    new SteamUser.LogOnDetails
                    {
                        Username = pollResult.AccountName,
                        AccessToken = pollResult.RefreshToken,
                        ShouldRememberPassword = true,
                    }
                );

                if (logOnResult != EResult.OK)
                {
                    RespondOnce(false, error: $"logon_failed:{logOnResult}");
                    return;
                }

                _bot.RefreshToken = pollResult.RefreshToken;

                if (!_guardResponseSent)
                {
                    _guardResponseSent = true;
                    IpcServer.SendResponse(requestId, true, new { status = "success" });
                }

                IpcServer.SendEvent(
                    "refresh_token",
                    new
                    {
                        username = pollResult.AccountName,
                        tokenB64 = Convert.ToBase64String(
                            Encoding.UTF8.GetBytes(pollResult.RefreshToken)
                        ),
                    }
                );
            }
            catch (Exception ex)
            {
                RespondOnce(false, error: ex.Message);
            }
        }

        // QR sign-in is a sibling of the credentials flow, not a separate mechanism - both go
        // through SteamAuthentication and resolve to the same AuthPollResult/LogOnAsync tail.
        // Unlike credentials, no username is known until the mobile app scan resolves one, so this
        // reuses the same RespondOnce/_guardResponseSent one-shot-response-then-events plumbing:
        // the request's response carries the initial challenge URL, and everything after arrives
        // as async events instead, reusing the same "refresh_token"/"login_failed" events
        // LoginWithCredentialsAsync already emits.
        public async Task LoginWithQrAsync(string? requestId)
        {
            _pendingLoginRequestId = requestId;
            _guardResponseSent = false;
            _pendingGuardCodeTcs = null;

            try
            {
                await _bot.ConnectAsync();

                var authSession = await _bot.Client.Authentication.BeginAuthSessionViaQRAsync(
                    new AuthSessionDetails
                    {
                        IsPersistentSession = true,
                        PlatformType = EAuthTokenPlatformType.k_EAuthTokenPlatformType_SteamClient,
                        ClientOSType = EOSType.Win11,
                    }
                );

                // Steam periodically rotates the embedded challenge URL until the code is
                // scanned - each rotation must be re-rendered client-side or the previously
                // displayed QR code goes stale before the user gets to it.
                authSession.ChallengeURLChanged = () =>
                    IpcServer.SendEvent(
                        "qr_challenge_url",
                        new { challengeUrl = authSession.ChallengeURL }
                    );

                RespondOnce(
                    true,
                    new { status = "qr_challenge", challengeUrl = authSession.ChallengeURL }
                );

                var pollResult = await authSession.PollingWaitForResultAsync();

                var logOnResult = await _bot.LogOnAsync(
                    new SteamUser.LogOnDetails
                    {
                        Username = pollResult.AccountName,
                        AccessToken = pollResult.RefreshToken,
                        ShouldRememberPassword = true,
                    }
                );

                if (logOnResult != EResult.OK)
                {
                    RespondOnce(false, error: $"logon_failed:{logOnResult}");
                    return;
                }

                _bot.RefreshToken = pollResult.RefreshToken;

                IpcServer.SendEvent(
                    "refresh_token",
                    new
                    {
                        username = pollResult.AccountName,
                        tokenB64 = Convert.ToBase64String(
                            Encoding.UTF8.GetBytes(pollResult.RefreshToken)
                        ),
                    }
                );
            }
            catch (Exception ex)
            {
                RespondOnce(false, error: ex.Message);
            }
        }

        public async Task<bool> LoginWithRefreshTokenAsync(
            string username,
            string refreshTokenBase64
        )
        {
            string refreshToken;
            try
            {
                refreshToken = Encoding.UTF8.GetString(
                    Convert.FromBase64String(refreshTokenBase64)
                );
            }
            catch (Exception)
            {
                return false;
            }

            await _bot.ConnectAsync();

            var logOnResult = await _bot.LogOnAsync(
                new SteamUser.LogOnDetails
                {
                    Username = username,
                    AccessToken = refreshToken,
                    ShouldRememberPassword = true,
                }
            );

            if (logOnResult == EResult.OK)
            {
                _bot.RefreshToken = refreshToken;
            }

            return logOnResult == EResult.OK;
        }

        // Derives a Steam Community web session (steamLoginSecure) directly from the live
        // SteamKit2 connection, no interactive login/webview needed: mint a short-lived access
        // token subordinate to the already-possessed refresh token via
        // SteamAuthentication.GenerateAccessTokenForAppAsync, then build steamLoginSecure in the
        // same "{steamId}||{accessToken}" (URL-escaped) shape real Steam Community cookies use.
        // CLI mode has no equivalent, hence Rust's card_farming::session module only ever calls
        // this for agent-mode accounts.
        public async Task<WebSessionResult> GetWebSessionAsync()
        {
            if (!_bot.IsLoggedOn || _bot.SteamID == null)
            {
                throw new NotLoggedOnException();
            }

            if (string.IsNullOrEmpty(_bot.RefreshToken))
            {
                throw new NoRefreshTokenException();
            }

            var result = await _bot.Client.Authentication.GenerateAccessTokenForAppAsync(
                _bot.SteamID,
                _bot.RefreshToken,
                allowRenewal: false
            );

            var steamId = ((ulong)_bot.SteamID).ToString();
            var steamLoginSecure = Uri.EscapeDataString($"{steamId}||{result.AccessToken}");

            return new WebSessionResult { SteamId = steamId, SteamLoginSecure = steamLoginSecure };
        }

        public void SubmitGuardCode(string? requestId, string code)
        {
            if (_pendingGuardCodeTcs == null)
            {
                IpcServer.SendResponse(requestId, false, error: "no_pending_guard_code");
                return;
            }

            _pendingGuardCodeTcs.TrySetResult(code);
            IpcServer.SendResponse(requestId, true);
        }

        private void RespondOnce(bool ok, object? result = null, string? error = null)
        {
            if (_guardResponseSent)
            {
                IpcServer.SendEvent("login_failed", new { error });
                return;
            }

            _guardResponseSent = true;
            IpcServer.SendResponse(_pendingLoginRequestId, ok, result, error);
        }

        private Task<string> WaitForGuardCodeAsync(string guardType, string? detail)
        {
            _pendingGuardCodeTcs = new TaskCompletionSource<string>(
                TaskCreationOptions.RunContinuationsAsynchronously
            );

            if (!_guardResponseSent)
            {
                _guardResponseSent = true;
                IpcServer.SendResponse(
                    _pendingLoginRequestId,
                    true,
                    new
                    {
                        status = "need_guard_code",
                        guardType,
                        detail,
                    }
                );
            }
            else
            {
                IpcServer.SendEvent("guard_code_incorrect", new { guardType, detail });
            }

            return _pendingGuardCodeTcs.Task;
        }

        private void NotifyGuardConfirmationNeeded()
        {
            if (_guardResponseSent)
            {
                return;
            }

            _guardResponseSent = true;
            IpcServer.SendResponse(
                _pendingLoginRequestId,
                true,
                new { status = "need_guard_confirmation" }
            );
        }

        // Bridges SteamKit2's interactive 2FA prompts to the IPC protocol: instead of blocking on
        // console input like SteamKit2's own UserConsoleAuthenticator, it relays the prompt as an
        // IPC response/event and waits for the frontend to round-trip a code via submit_guard_code.
        private sealed class IpcAuthenticator : IAuthenticator
        {
            private readonly AuthFlow _owner;

            public IpcAuthenticator(AuthFlow owner)
            {
                _owner = owner;
            }

            public Task<string> GetDeviceCodeAsync(bool previousCodeWasIncorrect) =>
                _owner.WaitForGuardCodeAsync("device", null);

            public Task<string> GetEmailCodeAsync(string email, bool previousCodeWasIncorrect) =>
                _owner.WaitForGuardCodeAsync("email", email);

            public Task<bool> AcceptDeviceConfirmationAsync()
            {
                _owner.NotifyGuardConfirmationNeeded();
                return Task.FromResult(true);
            }
        }
    }
}
