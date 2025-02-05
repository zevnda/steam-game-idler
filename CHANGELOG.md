[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.7.6/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.7.6/Steam.Game.Idler_1.7.6_x64_en-US.msi)

## Changelog
- Added an `install update` button to the `header` which will be visible when an update is available
  - Removed the toast notification for updates
- Using the `check for updates` option in the `settings menu` will now install new updates immediately if they are available
  - Previously a toast was displayed
- Minor backend changes
  - `unlock_all_achievements` no longer takes an array of achievements name
  - `update_stats` now takes `name` and `value` keys
- Fixed some typos in log events