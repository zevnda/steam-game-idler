[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.8.5/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.8.5/Steam.Game.Idler_1.8.5_x64-setup.exe)

## Changelog
- Custom lists *(card farming, achievement unlocker, etc.)* are now stored in `C:\Users\<user>\AppData\Roaming\com.zevnda.steam-game-idler` along with other games list caches
  - This allows custom lists to be preserved when switching between accounts as they are now stored in user specific files *(`<steam_id>_card_farming_list.json`)*
  - They were previously stored in `localStorage` which could cause issues with large lists, and were deleted when logging out
  - All cached data can still be deleted via `settings > clear data`
- Games list caches now only store required information *(`appid`, `name`, `playtime_forever`)* to reduce the overall file size of caches
- Added an `add all` button to the `edit list modal` for `achievement unlocker` to easily add all of your games to the list

**Note**: I recommended clearing your data via `settings > clear data` to remove any old data stores