[![Downloads](https://img.shields.io/github/downloads/zevnda/steam-game-idler/1.8.7/total?style=for-the-badge&logo=github&color=137eb5)](https://github.com/zevnda/steam-game-idler/releases/download/1.8.7/Steam.Game.Idler_1.8.7_x64-setup.exe)

## Changelog
- Refactored the `achievement manager` feature that comes with significant changes
  - Achievement data was previously fetched from the Steam web API, this came with some issue
    - The UI was not able to correctly display achievement states and statistic values in real time as the web API would take ~5 minutes to reflect the user's changes
    - This data didn't include important information such as protected achievements and statistics
  - Achievement data is now pulled directly from the Steam client, this means
    - **Important**: This change now means that viewing achievements will briefly show the user as `playing` that game on Steam
      - This is more inline with other Steam achievement manager apps, and occurs because the Steamworks API needs to be initialized with the `appid` in order to pull it's data
      - I know this may not be a favorable change for all users, but it eliminates the inconsistencies between the data states and UI states, and improves UX by making it less confusing to manage achievements and statistics which I think is most important
    - The UI can now correctly display achievement states and statistic values in real time with no delay
    - Achievement data is stored locally in `AppData\Roaming\com.zevnda.steam-game-idler\achievement_data`. These files are generally only a few KiB
    - #71: Games with achievements and/or statistics that are protected are now shown as such, and those achievements/statistics are disabled
      - `Protected` achievements/statistics can only be modified by offical game servers, so SGI can't modify them
    - Statistics now show specific `flags` such as `IncrementOnly` and `Protected`
      - `IncrementOnly` statistic values can only be increased *(i.e. 5 -> 6*) and cannot be decreased without resetting the actual statistic to `0`
- The `statistics` tab in `achievement manager` now has a search bar for filtering statistics by name
- Achievements that are marked as `hidden` by game developers now have their descriptions blurred to prevent spoilers
  - Hover over the blurred description to reveal it
- Added a `check for updates` menu item to the system tray icon
- Fixed an issue in `achievement manager` where the lock/unlock buttons would display the incorrect state when searching or reordering the list
- Clear the search query when leaving the `achievements manager` screen
- The `settings > clear data` now deletes achievement data files
- Fixed an issue in `achievement manager` causing a duplicate achievement to appear in the list when toggling its lock state