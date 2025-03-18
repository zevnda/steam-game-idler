[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.8.8/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.8.8/Steam.Game.Idler_1.8.8_x64-setup.exe)

## Changelog
- Improvements to yesterday's changes for fetching achievement data for `achievement manager`
 - Yesterday's changes made it so that every single time the user viewed a game's achievements it would show the user as `playing` that game on Steam
 - Today's changes improves this by only showing the user as `playing` that game once when initially fetching the achievement data and caching it
   - Users will no longer be shown as `playing` that game when viewing its achievements after the cache file has been created
   - Deleting the cache file for that game will require fetching the data and caching it again
   - Users will still be shown as `playing` that game when locking/unlocking achievements or changing statistic values
- Cache file paths have also been improved for clarity
  - User path: `\AppData\Roaming\com.zevnda.steam-game-idler\cache\<steam_id>`
    - Games list: `..\games_list.json`
    - Recent games: `..\recent_games.json`
    - Custom lists: `..\custom_lists\<list_name>.json`
    - Achievement data: `..\achievement_data\<app_id>.json`

**Note:** I recommended clearing your data via `settings > clear data` to remove any old data stores