; NSIS's stock resource copy only adds/overwrites files the current build actually ships — it
; never removes a file that existed in a prior install but isn't part of the current one. An
; upgrade from v5.4.6 (main) otherwise leaves these pre-merge SteamUtility helper files orphaned
; in $INSTDIR\libs forever. Confirmed live against a real v5.4.6 -> v6.0.0 upgrade (2026-07-15),
; when a correct build's libs/ held only SteamUtility.exe + steam_api64.dll (a single-file publish).
; Since 6.1.0 libs/ holds SteamUtility's whole trimmed .NET runtime again, Steamworks.NET.dll
; included - deleting that one here is harmless, since the install copies the current one straight
; back. The full list of files any per-machine release ever shipped lives in
; src-tauri/src/legacy_install/known_files.rs.
!macro NSIS_HOOK_PREINSTALL
  ; Close any SteamUtility still running from this install before files get copied - otherwise
  ; the copy stops on "Error opening file for writing: ...\libs\SteamUtility.dll" (seen on a
  ; 6.4.1 update). The app kills SteamUtility itself before launching the installer
  ; (`updater::kill_all_steam_utility_processes`), but automation can start a fresh one in the
  ; gap, and a manual reinstall over a running SGI gets no app-side kill at all. Tauri's own
  ; Restart Manager macro (utils.nsh), the same one the template runs on the main exe right
  ; after this hook: closes it silently in passive/silent mode (every update), asks first in a
  ; normal install, and aborts the install with a message if it can't.
  !insertmacro CheckIfAppIsRunning "$INSTDIR\libs\SteamUtility.exe" "${PRODUCTNAME}"

  Delete "$INSTDIR\libs\icon.ico"
  Delete "$INSTDIR\libs\Newtonsoft.Json.dll"
  Delete "$INSTDIR\libs\steam_api.dll"
  Delete "$INSTDIR\libs\Steamworks.NET.dll"
!macroend
