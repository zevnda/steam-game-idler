[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.7.6/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.7.6/Steam.Game.Idler_1.7.6_x64_en-US.msi)

## Changelog
- Improved the method for unlocking/locking all achievements, and updating multiple statistics in `achievements manager`
  - SGI no longer iterates through each achievement or statistic and unlocks or updates them. Instead they are now unlocked or updated in bulk
  - You will now see a single `success` toast if the entire task is successful. Or an `error` toast if the task fails at any point
- The `unlock` and `lock` buttons in `achievements manager` will now change state when clicked
  - They are still not a real-time reflection of the data stored on Steam's server. Changed can still take up to 5 minutes to be reflected in SGI
  - Refreshing the achievements list will result in the button's state reflecting the state on Steam's server again
- Fixed an issue in the `edit list modal` where if `in list` was active and you removed the last game from the list you could not disable `in list`
- Added an `in list` button to the `edit list modal` to filter by games already in the list
- Made the search bar in `edit list modal` clearable
- Optimized rust dependencies and and build profile to reduce built binary size
