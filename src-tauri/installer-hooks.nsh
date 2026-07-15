; NSIS's stock resource copy only adds/overwrites files the current build actually ships — it
; never removes a file that existed in a prior install but isn't part of the current one. An
; upgrade from v5.4.6 (main) otherwise leaves these pre-merge SteamUtility helper files orphaned
; in $INSTDIR\libs forever. Confirmed live against a real v5.4.6 -> v6.0.0 upgrade (2026-07-15),
; and cross-checked against a clean-room `dotnet publish` matching release.yml exactly: a correct
; build's libs/ contains only SteamUtility.exe + steam_api64.dll (everything else, including
; Steamworks.NET.dll, is bundled into the single-file exe, not shipped as a loose copy).
!macro NSIS_HOOK_PREINSTALL
  Delete "$INSTDIR\libs\icon.ico"
  Delete "$INSTDIR\libs\Newtonsoft.Json.dll"
  Delete "$INSTDIR\libs\steam_api.dll"
  Delete "$INSTDIR\libs\Steamworks.NET.dll"
!macroend
