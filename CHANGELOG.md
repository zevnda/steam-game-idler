[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.8.13/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.8.13/Steam.Game.Idler_1.8.13_x64-setup.exe)

## Changelog
- #100: Reworked the `manual add` feature to allow users to add games, programs, or tools that aren't publicly available on the Steam store
  - Previously, this feature would check if the `appid` had a Steam store page and would fail if it didn't
  - For example, you can now add `Source SDK Base 2007 (218)`, which is used by FiveM *(GTA V multiplayer mod)*, even though it doesn't have a Steam store page and doesn't show up in `Steam profile > games`
  - Note: This doesn't always guarantee that these games/programs/tools can be used with all SGI features, though most can
- SteamUtility *(idle)* processes no longer display a window or taskbar icon when idling games
  - Currently idling games can be viewed on the `idling games` screen *(play icon)* accessed via the `sidebar`
- Improved how SteamUtility creates processes, reducing their memory usage by 50% *(from ~10MB to ~5MB per process)*
- Removed the `hide idle windows` option from `settings > general` as it is now redundant with the new `idling games` feature
- Fixed an issue where some SteamUtility *(idle)* processes weren't being closed before initiating an update