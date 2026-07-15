using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using SteamKit2;
using SteamUtility.Core.Errors;
using SteamUtility.Core.Logging;
using SteamUtility.Core.Models;
using SteamUtility.Daemon.Bot;
using SteamUtility.Daemon.Ipc;

namespace SteamUtility.Daemon
{
    // Persistent daemon/IPC mode entry point - the "sign in with real Steam credentials" path
    // (SteamKit2-backed, no local Steam client needed). Instance-constructed (unlike the pre-merge
    // SteamAgent's static Program class) for easier manual testing. Preserves the exact IPC command
    // set and wire shapes the current Rust integration (src-tauri/src/steam_agent.rs) already
    // depends on - the Rust/Tauri rewrite is a separate, later phase, so this phase doesn't change
    // the protocol surface.
    public sealed class DaemonHost
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        private SteamBot _bot = null!;
        private AuthFlow _authFlow = null!;
        private IdlingManager _idlingManager = null!;
        private PresenceManager _presenceManager = null!;
        private AchievementHandler _achievementHandler = null!;
        private OwnershipManager _ownershipManager = null!;
        private FreeLicenseManager _freeLicenseManager = null!;

        public int Run(string[] args)
        {
            Log.Info("Daemon", "Starting daemon (agent) mode");

            _bot = new SteamBot();
            _authFlow = new AuthFlow(_bot);
            _idlingManager = new IdlingManager(_bot);
            _presenceManager = new PresenceManager(_bot);
            _achievementHandler = new AchievementHandler();
            _bot.Client.AddHandler(_achievementHandler);
            _ownershipManager = new OwnershipManager();
            _freeLicenseManager = new FreeLicenseManager();

            _bot.LogOnStatusChanged += result =>
            {
                IpcServer.SendEvent(
                    "status_changed",
                    new
                    {
                        loggedOn = result == EResult.OK,
                        result = result.ToString(),
                        steamId = _bot.SteamID != null ? ((ulong)_bot.SteamID).ToString() : null,
                    }
                );
            };
            _bot.Disconnected += willReconnect =>
            {
                IpcServer.SendEvent(
                    "status_changed",
                    new
                    {
                        loggedOn = false,
                        // "Reconnecting" lets the Rust host (steam_agent/process.rs) tell this
                        // transient, self-recovering disconnect apart from a genuinely dead
                        // session - see that file's handle_line for why the distinction matters.
                        result = willReconnect ? "Reconnecting" : "Disconnected",
                        steamId = (string?)null,
                    }
                );
            };

            _bot.Start();

            string? line;
            while ((line = Console.In.ReadLine()) != null)
            {
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                var capturedLine = line;
                _ = Task.Run(() => HandleLineAsync(capturedLine));
            }

            return 0;
        }

        private async Task HandleLineAsync(string line)
        {
            IpcRequest? request;
            try
            {
                request = JsonSerializer.Deserialize<IpcRequest>(line, JsonOptions);
            }
            catch (Exception ex)
            {
                Log.Warn("Daemon", $"Failed to parse IPC request line: {ex.Message}");
                IpcServer.SendResponse(null, false, error: "invalid_json");
                return;
            }

            if (request == null)
            {
                IpcServer.SendResponse(null, false, error: "empty_request");
                return;
            }

            try
            {
                switch (request.Cmd)
                {
                    case "login":
                        await _authFlow.LoginWithCredentialsAsync(
                            request.Id,
                            request.User ?? "",
                            request.PassB64 ?? ""
                        );
                        break;

                    case "begin_qr_login":
                        await _authFlow.LoginWithQrAsync(request.Id);
                        break;

                    case "login_with_token":
                    {
                        var success = await _authFlow.LoginWithRefreshTokenAsync(
                            request.User ?? "",
                            request.RefreshTokenB64 ?? ""
                        );
                        if (success)
                        {
                            IpcServer.SendResponse(request.Id, true);
                        }
                        else
                        {
                            IpcServer.SendResponse(
                                request.Id,
                                false,
                                error: "refresh_token_invalid"
                            );
                            IpcServer.SendEvent("auth_required");
                        }
                        break;
                    }

                    case "submit_guard_code":
                        _authFlow.SubmitGuardCode(request.Id, request.Code ?? "");
                        break;

                    case "logout":
                        _bot.Stop();
                        IpcServer.SendResponse(request.Id, true);
                        break;

                    case "get_web_session":
                    {
                        var session = await _authFlow.GetWebSessionAsync();
                        IpcServer.SendResponse(request.Id, true, session);
                        break;
                    }

                    case "idle_set":
                    {
                        var appIds = request.AppIds ?? new List<uint>();
                        _idlingManager.SetGames(appIds, request.GameExtraInfo);
                        IpcServer.SendResponse(request.Id, true);
                        IpcServer.SendEvent(
                            "idle_state",
                            new { appIds = _idlingManager.CurrentAppIds }
                        );
                        break;
                    }

                    case "set_persona_state":
                    {
                        if (
                            !Enum.TryParse<EPersonaState>(
                                request.PersonaState,
                                ignoreCase: true,
                                out var state
                            )
                        )
                        {
                            IpcServer.SendResponse(request.Id, false, error: "invalid_persona_state");
                            break;
                        }
                        _presenceManager.SetPersonaState(state);
                        IpcServer.SendResponse(request.Id, true);
                        break;
                    }

                    case "get_owned_apps":
                    {
                        var games = await _ownershipManager.GetOwnedGamesAsync(_bot);
                        IpcServer.SendResponse(request.Id, true, new { games });
                        break;
                    }

                    case "request_free_license":
                    {
                        var appId = request.AppId ?? throw new InvalidAppIdException();
                        var result = await _freeLicenseManager.RequestFreeLicenseAsync(_bot, appId);
                        IpcServer.SendResponse(request.Id, true, result);
                        break;
                    }

                    case "achievements_get":
                    {
                        var steamId = RequireSteamId();
                        var (achievements, stats) =
                            await _achievementHandler.GetAchievementsAndStatsAsync(
                                request.AppId ?? 0,
                                steamId
                            );
                        IpcServer.SendResponse(request.Id, true, new { achievements, stats });
                        break;
                    }

                    case "achievement_set":
                    {
                        var steamId = RequireSteamId();
                        await _achievementHandler.SetAchievementAsync(
                            request.AppId ?? 0,
                            steamId,
                            request.AchievementId ?? "",
                            request.Unlock ?? false
                        );
                        IpcServer.SendResponse(request.Id, true, new { success = true });
                        break;
                    }

                    case "achievement_set_bulk":
                    {
                        var steamId = RequireSteamId();
                        var changes = (request.AchievementChanges ?? new List<AchievementChangeRequest>())
                            .Select(c => (c.Id, c.Unlock))
                            .ToList();
                        var (succeeded, failed) = await _achievementHandler.SetAchievementsBulkAsync(
                            request.AppId ?? 0,
                            steamId,
                            changes
                        );
                        IpcServer.SendResponse(request.Id, true, new { succeeded, failed });
                        break;
                    }

                    case "stats_update":
                    {
                        var steamId = RequireSteamId();
                        await _achievementHandler.UpdateStatsAsync(
                            request.AppId ?? 0,
                            steamId,
                            request.Stats ?? new List<StatUpdateRequest>()
                        );
                        IpcServer.SendResponse(request.Id, true, new { success = true });
                        break;
                    }

                    case "stats_reset_all":
                    {
                        var steamId = RequireSteamId();
                        await _achievementHandler.ResetAllStatsAsync(request.AppId ?? 0, steamId);
                        IpcServer.SendResponse(request.Id, true, new { success = true });
                        break;
                    }

                    default:
                        IpcServer.SendResponse(
                            request.Id,
                            false,
                            error: $"unknown_command:{request.Cmd}"
                        );
                        break;
                }
            }
            catch (Exception ex)
            {
                var (code, _) = ExceptionMapper.Map(ex, "Daemon");
                IpcServer.SendResponse(request.Id, false, error: code);
            }
        }

        private SteamID RequireSteamId() => _bot.SteamID ?? throw new NotLoggedOnException();
    }
}
