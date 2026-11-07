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
  Delete "$INSTDIR\libs\icon.ico"
  Delete "$INSTDIR\libs\Newtonsoft.Json.dll"
  Delete "$INSTDIR\libs\steam_api.dll"
  Delete "$INSTDIR\libs\Steamworks.NET.dll"
!macroend
