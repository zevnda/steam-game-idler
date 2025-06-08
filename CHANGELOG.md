<!-- 1.12.0 -->

### Changes in v1.12.0

- Added a `start minimized` option got `settings > general` (#465)
  - When enabled SGI will be minimized to the system tray instead of showing the main window on startup, and will remain hidden until manually opened from the system tray

<!-- 1.11.7 -->

### Changes in v1.11.7

- Implement better checks for if Steam is running before attempting to idle games in `automatic idler` (#431)

<!-- 1.11.6 -->

### Changes in v1.11.6

- Added a `remove all` button to `trading card manager`
  - Allows users to remove all their active trading card listings on the Steam market
- Added a `disable tooltips` options to `settings > general`
  - Disable all non-important UI tooltips that you see when hovering certain UI components (e.g. icons, buttons)
- Better icons for `trading card manager` and its buttons
- Fixed an issue where the trading card manager list wasn't updated if no cards were available

<!-- 1.11.5 -->

### Changes in v1.11.5

- Fixed an incorrect price value error when try to list all cards

<!-- 1.11.4 -->

### Changes in v1.11.4

- Added a method to account for Steam fees when listing trading cards
  - Previously, if you tried to list a card for `0.10` it would be listed as `0.12` _(buyer pays)_ due to Steam adding their fees on top 

<!-- 1.11.3 -->

### Changes in v1.11.3

- Added a `currency` select menu to `settings > general` (#391)
  - Allows certain data such as trading card market prices to be returned in specific currencies
  - If you change your currency, you will need to refresh your trading cards list to clear old currency data
- Fixed an issue where game names weren't displayed correctly when being idled by the `card farming` feature (#390)

<!-- 1.11.2 -->

### Changes in v1.11.2

- Added a `list all cards` button to `trading card manager`
  - This option will attempt to list each card for its `median price` if available, falling back to using its `lowest price` if not. If neither are available the card will not be listed
- More layout improvements for `trading card manager`

<!-- 1.11.1 -->

### Changes in v1.11.1

- Improved the layout of `trading card manager`
- Added an individual `sell` button for each card
- Added a confirmation modal before listing trading cards
- Added toasts for different actions, successes and errors in `trading card manager`
- The `list selected cards` button now shows a loading state while cards a being listed

<!-- 1.11.0 -->

### Changes in v1.11.0

- Added a `trading card manager` **<sup>BETA FEATURE</sup>**
  - Allows users to view and sell their Steam trading cards directly within SGI
  - Enabled `beta features` in `settings general` to use it
  - Read the [Trading Card Manager docs](https://steamgameidler.vercel.app/features/trading-card-manager) for a guide on how to use this feature
  - If you run into any issues, report them on GitHub

<!-- 1.10.3 -->

### Changes in v1.10.3

- Improved the method for getting Steam users for the sign in screen (#350)
- Fixed an issue where resetting all statistics wouldn't update the cached data values

<!-- 1.10.2 -->

### Changes in v1.10.2

- Add translations for Polish
  - [Contribute to SGI by helping with translations](https://github.com/zevnda/steam-game-idler/discussions/148)
  - Credit:
    - @danieo for the Polish translation

<!-- 1.10.1 -->

### Changes in v1.10.1

- Reworked the layout of the settings page
- The title bar now displays the current active page and tab titles
- Improved the contrast of inputs and select menus in different areas of the UI for all themes
- Improved the logic for getting games with card drops remaining
  - Speeds things up for users who have a lot of pages of badges by breaking early when a specific condition is met
- Fixed a few inconsistent styles with the new themes
- Add translations for Romanian
  - [Contribute to SGI by helping with translations](https://github.com/zevnda/steam-game-idler/discussions/148)
  - Credit:
    - @SirDanielFTW for the Romanian translation

<!-- 1.10.0 -->

### Changes in v1.10.0

- UI and theme improvements
  - Removed all of the color themes and replaced them with a couple variations of the original dark theme
    - **Slate**: Lighter than the original dark theme with more contrast between background and foreground elements
    - **OLED**: Very deep, almost pure blacks, easy on the eyes at night
  - Converted some text buttons to icon buttons
    - Icon buttons provide a tooltip when hovered
  - Added a window title to the header

<!-- 1.9.18 -->

### Changes in v1.9.18

- Added partial translations for Czech
  - [Contribute to SGI by helping with translations](https://github.com/zevnda/steam-game-idler/discussions/148)
  - Credit:
    - @RussianAirplane for the Czech translation

<!-- 1.9.17 -->

### Changes in v1.9.17

- Added an `enable beta features` setting to `settings > general`
  - New features and potentially breaking changes will now be rolled out under the beta flag *(where possible)* for testing before they are fully implemented
  - If a beta feature causes a critical error preventing you from disabling the setting in the UI, you can force `useBeta: false` in `cache\<user_id>\settings.json`
  - If you experience issues with any beta features, please report them on GitHub

<!-- 1.9.16 -->

### Changes in v1.9.16

- When you have succesfully validated your credentials in `settings > card farming` you will now be able to see how many `games with drops` and the `total drops remaining` for those games
  - If you were already validated before this update, click `refresh` to fetch your data
  - Currently, this data does not update automatically when you farm cards, you will need to click `refresh` to view the most recent data

<!-- 1.9.15 -->

### Changes in v1.9.15

- Fixed an issue where old free games and new free games weren't being compared correctly, causing a notification to be shown multiple times

<!-- 1.9.14 -->

### Changes in v1.9.14

- The games list is now sorted by playtime high to low by default

<!-- 1.9.13 -->

### Changes in v1.9.13

- Add missing translations for the changelog modal 
- Simplified the language names in the language select menu

<!-- 1.9.12 -->

### Changes in v1.9.12

- Added Turkish language
  - [Contribute to SGI by helping with translations](https://github.com/zevnda/steam-game-idler/discussions/148)
  - Credit:
    - @61netpa for the Turkish translation

<!-- 1.9.11 -->

### Changes in v1.9.11

- Remove old `localStorage` data stores to prevent it being included/duplicated via `export data`

<!-- 1.9.10 -->

### Changes in v1.9.10

- Improve error handling of client-side errors

<!-- 1.9.9 -->

### Changes in v1.9.9

- Fixed a issue where `game settings` values were unable to be changes (#183)
- Fixed a memory leak

<!-- 1.9.8 -->

### Changes in v1.9.8

- Remove sensitive data when using `settings > export data`

<!-- 1.9.7 -->

### Changes in v1.9.7

- `settings` and `game settings` are now stored in `AppData\Roaming\com.zevnda.steam-game-idler`
  - This allows users to configure different settings for each account, and allows settings such as `custom Steam API key` and `card farming credentials` to persists when switching accounts
- Fixed an issue where `card farming` wasn't checking for potential account mismatch before starting
- Added French language
  - [Contribute to SGI by helping with translations](https://github.com/zevnda/steam-game-idler/discussions/148)
  - Credit:
    - @Logiinx for the French translation

- **BREAKING CHANGE**: previous version of SGI will no longer be able to display the changelog modal due to the new structure of CHANGELOG.md

<!-- 1.9.6 -->

### Changes in v1.9.6

- Added Portuguese (Brazil) language
  - [Contribute to SGI by helping with translations](https://github.com/zevnda/steam-game-idler/discussions/148)
  - Credit:
    - @Qjeh for the Portuguese (Brazil) translation

<!-- 1.9.5 -->

### Changes in v1.9.5

- Added Italian, Russian and Ukrainian languages
  - [Contribute to SGI by helping with translations](https://github.com/zevnda/steam-game-idler/discussions/148)
  - Credit:
    - @Maniots for the Italian translation
    - @Jesewe for the Russian translation
    - @Bl0ck154 for the Ukrainian translation

<!-- 1.9.4 -->

### Changes in v1.9.4

- Added support for multiple languages
  - Change the app's language via `settings > general > language`
  - [Contribute to SGI by helping with translations](https://github.com/zevnda/steam-game-idler/discussions/148)
- Fixed incorrect system tray icon

<!-- 1.9.3 -->

### Changes in v1.9.3

- #141 #142: Fixed an issue causing an `invalid utf-8 sequence` error on systems using non-English locales
- Fixed an issue where idling games were not being stopped before installing updates
- Logging out of the current user via the `sidebar` will now cause all idling games to be stopped
- Moved the dropdown menu that was previously in `settings` to the header

<!-- 1.9.2 -->

### Changes in v1.9.2

- #141 #142: Fixed an issue causing an `invalid utf-8 sequence` error on systems using non-English locales

<!-- 1.9.1 -->

### Changes in v1.9.1

- Added an idling timer to `game cards` to track how long each game has been idling
  - Removed the pulsing border animation from `game cards`
- Added stricter checks of Steam client status
  - The Steam client must be running to select an account on the `account selection` screen
  - If the Steam client closes while using SGI, the following will occur
    - All idling games will be stopped
    - `card farming` and `achievement unlocker` features will be stopped
    - A modal will appear asking you to start the Steam client to continue
- The `account selection` screen will now show which account you are currently signed in to Steam client with
  - You will see an account mismatch warning if you select a different account then you are currently signed in to the Steam client with. You can proceed to use SGI with an account mismatch, but most features will not work
  - If you switch accounts in the Steam client you will need to press `refresh` to update the `account selection` user list

<!-- 1.9.0 -->

### Changes in v1.9.0

- #100: Reworked the `manual add` feature to allow users to add games, programs, or tools that aren't publicly available on the Steam store
  - Previously, this feature would check if the `appid` had a Steam store page and would fail if it didn't
  - For example, you can now add `Source SDK Base 2007 (218)`, which is used by FiveM *(GTA V multiplayer mod)*, even though it doesn't have a Steam store page and doesn't show up in `Steam profile > games`
  - Note: This doesn't always guarantee that these games/programs/tools can be used with all SGI features, though most can
- SteamUtility *(idle)* processes no longer display a window or taskbar icon when idling games
  - Currently idling games can be viewed on the `idling games` screen *(play icon)* accessed via the `sidebar`
- Improved how SteamUtility creates processes, reducing their memory usage by 50% *(from ~10MB to ~5MB per process)*
- Removed the `hide idle windows` option from `settings > general` as it is now redundant with the new `idling games` feature
- Fixed an issue where some SteamUtility *(idle)* processes weren't being closed before initiating an update

<!-- 1.8.13 -->

### Changes in v1.8.13

- Added `idling games` to the `sidebar` *(beta)*
  - This will hopefully replace the need for showing external SteamUtility *(idle)* windows for every game you idle
  - When a game begins idling it will be shown in the `idling games` list
  - You can stop idling individual games by hovering over their `game card` and clicking the stop icon
  - You can stop idling all games by clicking the `stop all` button
  - While this feature is in beta you will continue to see the external idle windows *(unless you use the `hide idle windows` setting)* just in case there are any problems
  - If you do have any problems, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)
- #60: Added a pulsing border around `game cards` of currently idling games
- #134: Fix `achievement unlocker` getting stuck at 1 second

<!-- 1.8.12 -->

### Changes in v1.8.12

This release contains the [v1.8.13 changes](https://github.com/zevnda/steam-game-idler/releases/tag/1.8.13) minus a few additions

<!-- 1.8.11 -->

### Changes in v1.8.11

- Fixed an issue were achievement percentages were sometimes `0`

<!-- 1.8.10 -->

### Changes in v1.8.10

- `achievement unlocker` now uses the same method as `achievement manager` when fetching achievement data

<!-- 1.8.9 -->

### Changes in v1.8.9

- Improvements to yesterday's changes for fetching achievement data for `achievement manager`
  - Yesterday's changes made it so that every single time the user viewed a game's achievements it would show the user as `playing` that game on Steam
  - Today's changes improve this by only showing the user as `playing` that game a single time when initially fetching the achievement data and caching it
    - Users will no longer be shown as `playing` that game when viewing its achievements after the cache file has been created
    - Deleting the cache file for that game will require fetching the data and caching it again
- Cache file paths have also been improved for clarity
   - User path: `\AppData\Roaming\com.zevnda.steam-game-idler\cache\<steam_id>`
     - Games list: `..\games_list.json`
     - Recent games: `..\recent_games.json`
     - Custom lists: `..\custom_lists\<list_name>.json`
     - Achievement data: `..\achievement_data\<app_id>.json`

**Note:** I recommended clearing your data via `settings > clear data` to remove any old data stores

<!-- 1.8.8 -->

### Changes in v1.8.8

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
- The `settings > clear data` button now deletes achievement data files
- Fixed an issue in `achievement manager` causing a duplicate achievement to appear in the list when toggling its lock state

<!-- 1.8.7 -->

### Changes in v1.8.7

This release contains the [v1.8.8 changes](https://github.com/zevnda/steam-game-idler/releases/tag/1.8.8) minus a few additional fixes

<!-- 1.8.6 -->

### Changes in v1.8.6

- Custom lists *(card farming, achievement unlocker, etc.)* are now stored in `AppData\Roaming\com.zevnda.steam-game-idler` along with other games list caches
  - This allows custom lists to be preserved when switching between accounts as they are now stored in user specific files *(`<steam_id>_card_farming_list.json`)*
  - They were previously stored in `localStorage` which could cause issues with large lists, and were deleted when logging out
  - All cached data can still be deleted via `settings > clear data`
- Games list caches now only store required information *(`appid`, `name`, `playtime_forever`)* to reduce the overall size of cache files
- Added an `add all` button to the `edit list modal` for `achievement unlocker` to easily add all of your games to the list
  - This wont be available for other custom lists as those features only allow a max of 32 simultaneous running games

**Note**: I recommended clearing your data via `settings > clear data` to remove any old data stores

<!-- 1.8.5 -->

### Changes in v1.8.5

- More robust fix for the "flash of unstyled content" issue when launching SGI

<!-- 1.8.4 -->

### Changes in v1.8.4

- Fixed a "flash of unstyled content" issue during launch by hiding the Tauri window until the frontend is ready

<!-- 1.8.3 -->

### Changes in v1.8.3

- Fixed an issue where the slider intervals were not being displayed in `settings > achievement unlocker`

<!-- 1.8.2 -->

### Changes in v1.8.2

- Migrated the app data directory to be inline with Tauri's v2 format
  - The old data directory was `C:\Users\<user>\AppData\Roaming\steam-game-idler` and should be automatically deleted when launching this version
  - The new data directory is `C:\Users\<user>\AppData\Roaming\com.zevnda.steam-game-idler`
  - The install directory remains the same `C:\Program Files\Steam Game Idler`
- Improved the handling of games lists caches
  - Previously, SGI used a single `games_list.json` file to store games lists caches. The file was deleted when switching between users via the `account selection` screen, causing the games lists to be refetched more than necessary.
  - Games lists caches are now user specific `<steam_id>_games_list.json` and are now preserved until manually deleted via `settings > clear data`
  - Outdated games lists can be updated every 30 minutes by clicking the `refresh` icon at the top of the `games list` screen
    - This forces games lists for that specific user to be deleted and refetched, creating a fresh cache
  - The new cache directory is `C:\Users\<user>\AppData\Roaming\com.zevnda.steam-game-idler\cache`
  - This also reduces the load time when switching accounts
- Improved the logic for free games notifications
  - Previously, users would be notified once every 24 hours if there were any free games available. Free games often don't change for days or even weeks so this would result in receiving multiple notifications for the same free games every day
  - Notifications will now only be sent if the games are different to when the user was previously notified
- Fix changelog modal height

<!-- 1.8.1 -->

### Changes in v1.8.1

- #109: Fix an issue where SteamUtility *(idle)* processes were not being closed when exiting SGI
- Improve theme styles

<!-- 1.8.0 -->

### Changes in v1.8.0

- Updated Tauri from v1 to v2
- Updated project deps
- Migrated toast messages from react-toastify to heroui
- Refactored frontend contexts providers
- Other miscellaneous UI tweaks and improvement

<!-- 1.7.25 -->

### Changes in v1.7.25

- Fixed an issue where the `blossom` theme was not being removed correctly
- Fixed an error with `reset settings` and `clear data` functions
- Add styling to `in list` toggle button in `edit list modal`
- Dim `game card` images for all dark themes

<!-- 1.7.24 -->

### Changes in v1.7.24

- Added 8 new light themes and 8 new dark themes
  - Light
    - Nordic *(personal favorite)*
    - Pastel
    - Sunshine
    - Seafoam
    - Blossom
    - Meadow
    - Sandstone
    - Icicle
  - Dark
    - Midnight *(personal favorite)*
    - Amethyst
    - Emerald
    - Cherry
    - Cosmic
    - Mint
    - Arctic
    - Nightshade
  - `Settings > general > themes` to choose between them
  - The regular `light` and `dark` themes still exist

<!-- 1.7.23 -->

### Changes in v1.7.23

- Replaced the msi installer (.msi) with the nsis installer (.exe)
  - Smaller portable installer file
  - Faster initial installation and automatic updates
  - Supports patch updates by downloading only changed files instead of the full installer for each update, saving on bandwidth

Note: The transition between installers should be seamless, but in some cases users might end up with duplicate installations of SGI. If this is the case, just uninstall the older version

<!-- 1.7.22 -->

### Changes in v1.7.22

- SteamUtility (idle) windows now display a fallback image if the game's banner image was not found
- Include LICENCE in release

<!-- 1.7.21 -->

### Changes in v1.7.21

- Improve card farming logic
  - Games are now idled and stopped in bulk rather than iterating through each game and idling/stopping them individually. This eliminates UI blocking issues, reduces system lag on lower-end systems and improves overall efficiency

<!-- 1.7.20 -->

### Changes in v1.7.20

- #97: Refactor `start_idle` and `stop_idle` commands to use a more robust method to work across different Windows systems and versions

<!-- 1.7.19 -->

### Changes in v1.7.19

- #90: Improve the `stop_idle` function to prevent buffer overflow

<!-- 1.7.18 -->

### Changes in v1.7.18

- #90: Potential fix for buffer overflow exception causing crashes during `card farming`
- Fix `run at startup` checkbox missing dynamic color
- Improve `card farming` logic to prevent orphaned/zombie idle processes and better cleanup of listeners and intervals

<!-- 1.7.17 -->

### Changes in v1.7.17

- #86: Fixed the spacing and layout of `game cards` when changing the window size
- #87: Added a color picker to `settings > general` to allow users to choose their own UI color
  - Moved the theme switch to `settings > general`
- #88 #89: Fixed an error in `card farming` causing idle game processes to not be stopped between actions leading to excessive duplicate windows

<!-- 1.7.16 -->

### Changes in v1.7.16

- #85: Miscellaneous UI changes

<!-- 1.7.15 -->

### Changes in v1.7.15

- #81: Make the `manual add` button available for all custom list

<!-- 1.7.14 -->

### Changes in v1.7.14

- #83: Delete games list json files when clearing data

<!-- 1.7.13 -->

### Changes in v1.7.13

- #81: Re-added the `manual add` button for adding games that you do not own but have access to, such as family shared games
  - Games can be manually added by going to the Favorites List, clicking the `+` button and entering the game's ID

<!-- 1.7.12 -->

### Changes in v1.7.12

- #79: remove games with server-side achievements from achievement unlocker

<!-- 1.7.11 -->

### Changes in v1.7.11

- #76: Truncate long statistic name
- #77: Prevent layout shift when loading images in achievements list
- #78: Fix percentage toFixed error when viewing some game achievements

<!-- 1.7.10 -->

### Changes in v1.7.10

- #73: Fixed an issue when storing a cached version of the user's games list
  - Attempting to store large games lists in `sessionStorage` would throw a storage quota exceeded error
  - The users games list and recent games are now stored locally in `.json` files in `C:\Users\<user>\AppData\Roaming\steam-game-idler`

<!-- 1.7.9 -->

### Changes in v1.7.9

- #72: Fixed an issue in `card farming` where `start_idle` was being passed an `appId` string instead of u32 when `Farm cards for all games with card drops remaining` was enabled

<!-- 1.7.8 -->

### Changes in v1.7.8

- #71: Added a check to see if a game has server-side achievements and display an alert on the `achievements manager` screen if it does
  - Even if only 1/50 achievements are server-side, this message will still appear but other achievements can still be modified
  - References this list of games https://gist.github.com/zevnda/c7ebc4de0fb3e9ff6caac4df0a3fd06c
    - Feel free to leave a comment on the gist if any games need to be added/removed

<!-- 1.7.7 -->

### Changes in v1.7.7

- Added an `install update` button to the `header` which will be visible when an update is available
  - Removed the toast notification for updates
- Using the `check for updates` option in the `settings menu` will now install new updates immediately if they are available
  - Previously a toast was displayed
- Minor backend changes
  - `unlock_all_achievements` no longer takes an array of achievements name
  - `update_stats` now takes `name` and `value` keys
- Fixed some typos in log events

<!-- 1.7.6 -->

### Changes in v1.7.6

- Improved the method for unlocking/locking all achievements, and updating multiple statistics in `achievements manager`
  - SGI no longer iterates through each achievement or statistic and unlocks or updates them. Instead they are now unlocked or updated in bulk
  - You will now see a single `success` toast if the entire task is successful. Or an `error` toast if the task fails at any point
- The `unlock` and `lock` buttons in `achievements manager` will now change state when clicked
  - They are still not a real-time reflection of the data stored on Steam's server. Changes can still take up to 5 minutes to be reflected in SGI
  - Refreshing the achievements list will result in the button's state reflecting the state on Steam's server again
- Fixed an issue in the `edit list modal` where if `in list` was active and you removed the last game from the list you could not disable `in list`
- Optimized Rust dependencies and build configuration
  - Reduced MSI installer size by ~2MB
  - Reduced final application installation footprint by ~7MB

<!-- 1.7.5 -->

### Changes in v1.7.5

- Added an `in list` button to the `edit list modal` to filter by games already in the list
- Made the search bar in `edit list modal` clearable

<!-- 1.7.4 -->

### Changes in v1.7.4

- Miscellaneous UI styling changes

<!-- 1.7.3 -->

### Changes in v1.7.3

- New icons, again 😬
- Replaced the icon in the `header` for a drag region
- Added an `export data` button to `settings`
  - Useful for debugging issues

<!-- 1.7.2 -->

### Changes in v1.7.2

- Fixed some changelog modal styles
- Update system icon to match UI
  - Idle windows have a blue variant of the icon

<!-- 1.7.1 -->

### Changes in v1.7.1

- Reworked the way `custom lists` are handled (`favorites`, `card farming`, `achievement unlocker`, `auto idle`)
  - Custom lists can now be viewed and managed via the `sidebar`. Each list has its own `sidebar` icon
  - To manage a list, click the appropriate icon in the `sidebar` and click `edit list`. Add and remove games to the list by clicking them in the `edit list modal`
- Custom lists now support drag and drop reordering
  - The order of games in the `card farming` and `achievement unlocker` lists determines which game is first in the queue for those features
  - To reorder games in a custom list:
    1. Hover over a game card
    2. Click and hold the card
    3. Drag the card to the desired position
    4. Release the mouse button to drop the card in its new location
  - #56 by @Jesewe
- Reworked the way `card farming` and `achievement unlocker` screens appear to the user
  - Both screens will now be displayed within their respective list screen
  - This changes a couple of things:
    - Users will now be able to continue using SGI for other tasks while either or both of the features is running
    - Allows for the `card farming` and `achievement unlocker` features to be used at the same time
      - Conflicts might come from having the same game in both of these lists and running both features at the same time. This will probably be an unsolvable side effect, and it is up to the user to avoid doing this. If you do have any issues, please open a new issue
  - #57 by @AtifDesign
- Moved the `start card farming` and `start achievement unlocker` buttons to their respective list screen
- The `card farming` and `achievement unlocker` icons in the `sidebar` will now pulse to indicate that that feature is running
- Changed the labels of the options in `settings` for better clarity about what they do
- Improved the rendering of games in the `edit list` modal
  - Significantly increases loading times when the user has a large Steam library
- Improved the rendering of achievements on the `achievement manager` screen
  - Significantly increases loading times when the game has a lot of achievements
- Improved the method for setting and restoring `windowState` between launches
- Improved checks for games with no achievements in `achievement unlocker`
- Fixed an issue with `card farming` where games with drops weren't being fetched if the user had a `steamparental` cookie saved
  - #66 by @Orangecoat42
- Added a `clear data` button to `settings`
  - Clears practically all data that SGI stores and logs the current user out
  - Useful for debugging issues
- Removed unused env var from release workflow
- Updated url for changelog modal
- Removed the `minimize to tray` option in `settings > general`
  - SGI will now always be minimized to the system tray when clicking `x` in the `titlebar`
- Removed the option to filter the `games list` by `custom lists` in the `dropdown sort menu`
- Removed the option to add/remove games to/from `custom lists` in the `game card menu`
- Switched the `header` logo to a black/white variant
- Other miscellaneous UI improvements

<!-- 1.7.0 -->

### Changes in v1.7.0

- Reworked the way `custom lists` are handled (`favorites`, `card farming`, `achievement unlocker`, `auto idle`)
  - Custom lists can now be viewed and managed via the `sidebar`. Each list has its own `sidebar` icon
  - To manage a list, click the appropriate icon in the `sidebar` and click `edit list`. Add and remove games to the list by clicking them in the `edit list modal`
- Custom lists now support drag and drop reordering
  - The order of games in the `card farming` and `achievement unlocker` lists determines which game is first in the queue for those features
  - To reorder games in a custom list:
    1. Hover over a game card
    2. Click and hold the card
    3. Drag the card to the desired position
    4. Release the mouse button to drop the card in its new location
  - #56 by @Jesewe
- Reworked the way `card farming` and `achievement unlocker` screens appear to the user
  - Both screens will now be displayed within their respective list screen
  - This changes a couple of things:
    - Users will now be able to continue using SGI for other tasks while either or both of the features is running
    - Allows for the `card farming` and `achievement unlocker` features to be used at the same time
      - Conflicts might come from having the same game in both of these lists and running both features at the same time. This will probably be an unsolvable side effect, and it is up to the user to avoid doing this. If you do have any issues, please open a new issue
  - #57 by @AtifDesign
- Moved the `start card farming` and `start achievement unlocker` buttons to their respective list screen
- The `card farming` and `achievement unlocker` icons in the `sidebar` will now pulse to indicate that that feature is running
- Changed the labels of the options in `settings` for better clarity about what they do
- Improved the rendering of games in the `edit list` modal
  - Significantly increases loading times when the user has a large Steam library
- Improved the rendering of achievements on the `achievement manager` screen
  - Significantly increases loading times when the game has a lot of achievements
- Improved the method for setting and restoring `windowState` between launches
- Improved checks for games with no achievements in `achievement unlocker`
- Fixed an issue with `card farming` where games with drops weren't being fetched if the user had a `steamparental` cookie saved
  - #66 by @Orangecoat42
- Added a `clear data` button to `settings`
  - Clears practically all data that SGI stores and logs the current user out
  - Useful for debugging issues
- Removed the `minimize to tray` option in `settings > general`
  - SGI will now always be minimized to the system tray when clicking `x` in the `titlebar`
- Removed the option to filter the `games list` by `custom lists` in the `dropdown sort menu`
- Removed the option to add/remove games to/from `custom lists` in the `game card menu`
- Switched the `header` logo to a black/white variant
- Other miscellaneous UI improvements

<!-- 1.7.0-beta.9 -->

### Changes in v1.7.0-beta.9

- All beta users who use the chat feature between now and the release of stable version `1.7.0` will get an `early supporter` role with an exclusive badge next to their username
- Improved the styling of the chat

If you have any issues while using this beta version, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)

<!-- 1.7.0-beta.10 -->

### Changes in v1.7.0-beta.10

- Fixed an issue with `card farming` where games with drops weren't being fetched if the user had a `steamparental` cookie saved
  - #66 by @Orangecoat42

If you have any issues while using this beta version, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)

<!-- 1.7.0-beta.8 -->

### Changes in v1.7.0-beta.8

- Added a chat feature which can be accessed via the sidebar
  - Jury is still out on whether this makes it to the stable release of `1.7.0`. I guess you can let me know in the chat if it should stay or go 😅

If you have any issues while using this beta version, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)

<!-- 1.7.0-beta.7 -->

### Changes in v1.7.0-beta.7

- Added a `clear data` button to `settings`
  - Clears practically all data that SGI stores and logs the current user out
  - Useful for debugging issues
- Changed the labels of the options in `settings` for better clarity about what they do
- Improved the rendering of games in the `edit list` modal
  - Significantly increases loading times when the user has a large Steam library
- Improved the rendering of achievements on the `achievement manager` screen
  - Significantly increases loading times when the game has a lot of achievements

If you have any issues while using this beta version, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)

<!-- 1.7.0-beta.6 -->

### Changes in v1.7.0-beta.6

- Improved checks for games with no achievements in `achievement unlocker`

If you have any issues while using this beta version, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)

<!-- 1.7.0-beta.5 -->

### Changes in v1.7.0-beta.5

- Removed the feature for tracking currently idling games as it was causing a significant memory leak
- The `card farming` and `achievement unlocker` icons in the `sidebar` will now pulse to indicate that that feature is running
- Improved the method for setting and restoring `windowState` between launches
- Fixed an issue where the `start idle` and `view achievements` button on `game cards` in `custom lists` were not clickable
- Fixed the height of the games list in the `edit list` modal
  - #64 by @Jesewe
- Switched the `header` logo to a black/white variant

If you have any issues while using this beta version, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)

<!-- 1.7.0-beta.4 -->

### Changes in v1.7.0-beta.4

- Rerender custom list components to reflect changes made to their lists during automation
- Fixed incorrect buttons on `custom list` screens
- Fixed a error when a `game card` was dragged outside of its parent element

If you have any issues while using this beta version, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)

<!-- 1.7.0-beta.3 -->

### Changes in v1.7.0-beta.3

- Fixed incorrect `custom list` page titles and descriptions

If you have any issues while using this beta version, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)

<!-- 1.7.0-beta.2 -->

### Changes in v1.7.0-beta.2

- Reworked the way `custom lists` are handled (`favorites`, `card farming`, `achievement unlocker`, `auto idle`)
  - Custom lists can now be viewed and managed via the `sidebar`. Each list has its own `sidebar` icon
  - To manage a list, click the appropriate icon in the `sidebar` and click `edit list`. Add and remove games to the list by clicking them in the `edit list modal`
- Custom lists now support drag and drop reordering
  - The order of games in the `card farming` and `achievement unlocker` lists determines which game is first in the queue for those features
  - To reorder games in a custom list:
    1. Hover over a game card
    2. Click and hold the card
    3. Drag the card to the desired position
    4. Release the mouse button to drop the card in its new location
  - #56 by @Jesewe
- Moved the `start card farming` and `start achievement unlocker` buttons to their respective list screen
- Reworked the way `card farming` and `achievement unlocker` screens appear to the user
  - Both screens will now be displayed within their respective list screen
  - This changes a couple of things:
    - Users will now be able to continue using SGI for other tasks while either or both of the features is running
    - Allows for the `card farming` and `achievement unlocker` features to be used at the same time
      - Conflicts might come from having the same game in both of these lists and running both features at the same time. This will probably be an unsolvable side effect, and it is up to the user to avoid doing this. If you do have any issues, please open a new issue
  - #57 by @AtifDesign
- Added an idling indicator to `game cards` of currently idling games
  - A pulsing border will now be visible around the `game card` of games that are currently being idled
  - #60 by @GlennDoesGit
- Removed the option to filter the `games list` by `custom lists` in the `dropdown sort menu`
- Removed the option to add/remove games to/from `custom lists` in the `game card menu`
- Removed `minimize to tray` option in `settings > general`
  - SGI will now always be minimized to the system tray when clicking `x` in the `titlebar`
- Other miscellaneous UI improvements

If you have any issues while using this beta version, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)

<!-- 1.7.0-beta.1 -->

### Changes in v1.7.0-beta.1

- Reworked the way `custom lists` are handled (`favorites`, `card farming`, `achievement unlocker`, `auto idle`)
  - Custom lists can now be viewed and managed via the `sidebar`. Each list has its own `sidebar` icon
  - To manage a list, click the appropriate icon in the `sidebar` and click `edit list`. Add and remove games to the list by clicking them in the `edit list modal`
- Moved the `start card farming` and `start achievement unlocker` buttons to their respective list screen
- Reworked the way `card farming` and `achievement unlocker` screens appear to the user
  - Both screens will now be displayed within their respective list screen
  - This changes a couple of things:
    - Users will now be able to continue using SGI for other tasks while either or both of the features is running
    - Allows for the `card farming` and `achievement unlocker` features to be used at the same time
      - Conflicts might come from having the same game in both of these lists and running both features at the same time. This will probably be an unsolvable side effect, and it is up to the user to avoid doing this. If you do have any issues, please open a new issue
  - #57 by @AtifDesign
- Added an idling indicator to `game cards` of currently idling games
  - A pulsing border will now be visible around the `game card` of games that are currently being idled
  - #60 by @GlennDoesGit
- Removed the option to filter the `games list` by `custom lists` in the `dropdown sort menu`
- Removed the option to add/remove games to/from `custom lists` in the `game card menu`
- Removed `minimize to tray` option in `settings > general`
  - SGI will now always be minimized to the system tray when clicking `x` in the `titlebar`
- Other miscellaneous UI improvements

If you have any issues while using this beta version, please [open a new issue](https://github.com/zevnda/steam-game-idler/issues/new?template=issue_report.yml)

<!-- 1.6.7 -->

### Changes in v1.6.7

- Fixed an issue where `achievement unlocker` wasn't correctly checking for private games or profile
  - #63 by @s0uthbound

<!-- 1.6.6 -->

### Changes in v1.6.6

- Fixed intervals for `card farming`

<!-- 1.6.5 -->

### Changes in v1.6.5

- Reverted changes made in `1.6.4` to the `card farming` and `achievement unlocker` as they proved not to be the issue
- Updated existing wiki links to point to the new docs site at https://steamgameidler.vercel.app/
- Updated background videos

<!-- 1.6.4 -->

### Changes in v1.6.4

- Fixed an issue causing the `notifications` panel to be hidden by the `games list` page header
- Reverted changes made in `1.6.0` to the `card farming` and `achievement unlocker` components that were causing the timer to get stuck at `00:01/00:00`
  - #54 by @ialsca
  - #58 by @Jesewe

<!-- 1.6.3 -->

### Changes in v1.6.3

- Fixed an issue causing the timer on the `card farming` screen to be set multiple times when farming more than one game

<!-- 1.6.2 -->

### Changes in v1.6.2

- New logo/icon for both the SGI and SteamUtility windows
  - If anyone is good at making custom logos/icons, let me know
- Fixed the height of the draggable area of the `titlebar` when on the `settings` screen

<!-- 1.6.1 -->

### Changes in v1.6.1

- Fixed an issue where the video div was hiding the information for the `card farming` screen

<!-- 1.6.0 -->

### Changes in v1.6.0

- Major refactor of all components
- Some backend improvements to speed things up
- New login screen and login method for getting account information
  - If you have multiple accounts saved on the Steam desktop app, the login screen will now display each account for you to choose from
  - Logging in no longer requires Steam to be running
  - Logging in no longer adds a `Spacewars` game to your recently played games
- Added `game settings` to the `game card menu` which allows you to set game-specific limits that SGI will follow. [Read more here](https://github.com/zevnda/steam-game-idler/wiki/Settings#game-settings)
- The `achievement unlocker` will now delay unlocking the first achievement for 15 seconds
- Added a `remove all` button to the page when the filtering games by `favorites`, `card farming`, `achievement unlocker`, and `auto idle`
- SGI will now prevent duplicate idling games by checking if the game is already being idled
- Most error toasts will now contain a link to the [FAQ wiki](https://github.com/zevnda/steam-game-idler/wiki/faq) that references the issue
- The `achievements` and `statistics` pages no longer lag/freeze while scrolling when there are a lot of achievements or statistics to display
- The search bar for the `games list` is now hidden when not viewing the `games list`
- The search bar for the `achievements list` has moved to the `title bar`
- Replaced the `automate` button with individual buttons for `card farming` and `achievement unlocker`
- Ensure the current SGI user and current Steam user match in certain situations to prevent errors and confusion
- Now shows details about the account used for `card farming` in `settings > card farming` when credentials are validated
- Added a `Reset all` button to the `achievements > statistics` tab
- Ensure data returned from some http requests is using `?l=english`
- Other miscellaneous UI styling

<!-- 1.6.0-beta.4 -->

### Changes in v1.6.0-beta.4

- Added `game settings` to the `game card menu` which allows you to set game-specific limits that SGI will follow
   - Hover over a `game card` in the `games list` and click the 3 vertical dots to show the `game card menu`, then click `game settings`
   - **Max idle time (minutes)**: Set the max amount of time (in minutes) this game should be idled for. SGI will stop idling this game when the time limit is reached
     - This only affects games that are idled by `manual idle` or `auto idle`, and does not affect games idled by `card farming` or `achievement unlocker`
   - **Max card drops**: Set the max amount of card drops you want `card farming` to farm before it stops farming that game
     - There are no set times or guarantees on card drop intervals, so even though SGI will try to stay within this limit as best as it can, it may not always be perfect
   - **Max achievement unlocks**: Set the max amount of achievements you want `achievement unlocker` to unlock for you. SGI will stop unlocking achievements for this game and remove it from the `achievement unlocker` list 
- `achievement unlocker` will now delay unlocking the first achievement for 15 seconds
- Added a `remove all` button to the page when the `drop down filter menu` is filtering games by `favorites`, `card farming`, `achievement unlocker`, and `auto idle` which will remove all games from that list
- SGI will now prevent duplicate idling games by checking if the game is already being idled
- Most error toasts will now contain a link to the [FAQ wiki](https://github.com/zevnda/steam-game-idler/wiki/faq) that references the issue and why it might be occurring

<!-- 1.6.0-beta.3 -->

### Changes in v1.6.0-beta.3

- Replaced the `automate` button with individual buttons for `card farming` and `achievement unlocker`
- Ensure the current SGI user and current Steam user match in certain situations to prevent errors and confusion
- Now shows details about the account used for `card farming` in `settings > card farming` when credentials are validated
- Added a `Reset all` button to the `achievements > statistics` tab
- Fixed an issue where some elements weren't being displayed on the `card farming` screen
- Fixed an issue with the login background video

<!-- 1.6.0-beta.2 -->

### Changes in v1.6.0-beta.2

- New login screen and login method for getting account information
  - If you have multiple accounts saved on the Steam desktop app, the login screen will now display each account for you to choose from
  - Logging in no longer requires Steam to be running
  - Logging in no longer adds a `Spacewars` game to your recently played games
- The `achievements` and `statistics` pages no longer lag/freeze while scrolling when there are a lot of achievements or statistics to display
- The search bar for the `games list` is now hidden when not viewing the `games list`
- The search bar for the `achievements list` has moved to the `title bar`
- Fixed an error when searching in the `achievements list`
- Fixed some major prop drilling issues
- Other miscellaneous UI styling

<!-- 1.6.0-beta.1 -->

### Changes in v1.6.0-beta.1

- Major refactor of all components
  - Main concern here is making sure `card farming` and `achievement unlocker` function as intended as these are the hardest things to test on my own
- Some backend improvements to speed things up
- Miscellaneous UI changes and improvements

<!-- 1.5.32 -->

### Changes in v1.5.32

- Added `notifications` to the window header
  - Any important information regarding SGI such as known bugs, breaking changes, etc will be shown here
- Fixed an issue with `logs` being malformed
- Added a `clear logs` button to `settings > logs`

<!-- 1.5.31 -->

### Changes in v1.5.31

- This time I actually fixed the missing `steamid` param in `startCardFarming` 🙃
  - (#51) by @FireLostBoy-Tech
- Display a toast for success/errors when updating `card farming` credentials
- SGI will now check if a game is already idling before trying to `auto idle` it
- SGI will now show a changelog modal after updating

<!-- 1.5.30 -->

### Changes in v1.5.30

- Fixes missing `steamid` param in `startCardFarming`
  - (#50) by @Dr4gOnsFuRy

<!-- 1.5.29 -->

### Changes in v1.5.29

- Added an `auto idle games` feature.
  - This works similar to the `card farming` and `achievement unlocker` lists
  - Add a max of 32 games to the `auto idle` list by clicking the 3 vertical dots on a game's card
  - View games in the `auto idle` list by choosing it from the drop down `filter` menu
  - When SGI launches, all games in this list will be automatically idled
    - (#35, #48) by @Nevenit, @TiimmyTuurner
- Added a `steamParental/steamMachineAuth` input field to `settings > card farming`
  - **This field is optional** and is **only required if** a `steamParental` and/or `steamMachineAuth` cookie is present when following [these steps](https://github.com/probablyraging/steam-game-idler/wiki/Settings#steam-credentials)
    - (#49) by @FireLostBoy-Tech

<!-- 1.5.28 -->

### Changes in v1.5.28

- Replaced the individual `Update` buttons with a single `Save changes` button on the `Achievement > Statistics` tab
  - (#36) by @Jesewe

<!-- 1.5.27 -->

### Changes in v1.5.27

- Fixed some UI blocking issues when running specific Tauri commands
- Improved handling for unlocking/locking achievements, especially when done in bulk
- Refactored the `SteamUtility` lib

<!-- 1.5.26 -->

### Changes in v1.5.26

- Added `Free game notifications` to `settings > general`
  - Receive native Windows notifications when free Steam games are available to add to your account

<!-- 1.5.25 -->

### Changes in v1.5.25

- Added a `steam web api key` option to `settings > general`
  - Allows users to supply their own Steam web API key for fetching user summary and game data
  - Useful if users want to keep their Steam profile and game details set to private, but still use SGI as normal
    - This works only when using an API key that is attached to the account you are logged in to SGI as
    - Some feature still wont work if your profile or game details are private, such as;
      - Displaying recently played games
      - Displaying lock/unlock state of achievements
  - API keys are free for all users with a Steam account, you can [get your API key here](https://steamcommunity.com/dev/apikey)
- Sensitive credentials on the `settings` screen are now treated as passwords, and can be viewed as plain text when adding them, but will be permanently hidden afterwards

<!-- 1.5.23 -->

### Changes in v1.5.23

- Made the `anti-away status` setting `false` by default

<!-- 1.5.22 -->

### Changes in v1.5.22

- Show an error screen when the games list is unable to be retrieved
  - This usually occurs when:
    - Your profile is set to private
    - Your game details are set to private
    - You have no games in your library

<!-- 1.5.21 -->

### Changes in v1.5.21

- Fixed an issue caused by the recent Steam client update, which prevented achievements from being unlocked

<!-- 1.5.19 -->

### Changes in v1.5.19

- Added a `run at startup` option to `settings > general`
- Fixed an issue where the Steam desktop client would be forced to open if the `anti-away status` setting was enabled

<!-- 1.5.18 -->

### Changes in v1.5.18

- Further improvements of the `free games` features
  - Now, if there are any free Steam games available, there will be a `gift` icon below the `games list` icon in the sidebar. Clicking on it will display a list of the currently free games
  - Removed the notification associated with free games as it is no longer needed
  - Removed the `get notified about free games` option in `settings > general` as it is no longer needed

<!-- 1.5.17 -->

### Changes in v1.5.17

- Improved the method for checking for free games
  - SGI will now check for free games - once on launch, and again every hour while SGI is running
  - Notifications about free games being available will only be shown once every 24 hours

<!-- 1.5.16 -->

### Changes in v1.5.16

- Close all external processes _(idle windows)_ opened by the main window when exiting the app
- Added a tooltip to the system tray icon when hovered
- Fixed an issue where logs would show an `unknown` version when updating SGI

<!-- 1.5.15 -->

### Changes in v1.5.15

- Added an `anti-away status` option to `settings > general`
  - Prevents your Steam status from automatically switching to `away` while SGI is running
- SGI by default will now be minimized to the system tray when clicking the `close` button on the `title bar`
  - Allows users to hide SGI while it continues to work in the background by minimizing it to the system tray
  - Exit SGI completely by right-clicking the icon in the system tray and clicking exit
  - You can disable this feature by unchecking `minimize to tray` in `settings > general`

<!-- 1.5.14 -->

### Changes in v1.5.14

- Added a `get notified about free games` option to `settings > general`
  - When active, SGI will check if there are any Steam games with a discount of `100%` _(making them free)_
  - This will not notify you about free to play game releases, but rather paid games that are on sale for free
  - SGI will check for free games when it launches, and will only check once every 6 hours. If one or more free games are found, you will see a notification in the bottom-right corner
- Fixed an issue where the `between the hours of` setting was reversed
  - Now, the `achievement unlocker` task will only run within the time frame you have chosen, and not the other way around
- Fixed an issue where sorting the games list by `recently played` would default to showing the entire list in no particular order
  - (#27) by @AskaLangly

<!-- 1.5.13 -->

### Changes in v1.5.13

- Added Windows 11 window styling (rounded edges, shadow, etc..)

<!-- 1.5.12 -->

### Changes in v1.5.12

- Changed the update modal to a toast

<!-- 1.5.11 -->

### Changes in v1.5.11

- Fixed an issue causing the `check for updates` button to not install updates
- Increased the max lines for `logs.txt` from `150` to `500`
- Miscellaneous element styling

<!-- 1.5.10 -->

### Changes in v1.5.10

- Improved the flow for inline updates
  - Users will now see an `update modal` when a new version of SGI is released. They can either choose to `install update` or `not now` to postpone the update
  - Major updates _(mandatory updates or updates that come with breaking changes)_ will still be automatically installed. This is to ensure that SGI continues to work correctly for everyone in the future
- Removed the `disable automatic updates` option from `settings > general` as the new update flow doesn't require it

<!-- 1.5.9 -->

### Changes in v1.5.9

- Re-added statistics tracking for shield.io badges
- Include an update manifest when updating via `check for updates` in the `settings menu`

<!-- 1.5.8 -->

### Changes in v1.5.8

- Decreased the `autoClose` delay of toast messages and moved their position to `top-center`
- The `log.txt` file location can now be directly opened via `settings > logs`
- Fixed some miscellaneous element styles

<!-- 1.5.7 -->

### Changes in v1.5.7

- Fixed an issue where after the `1.4.5` window state update, sometimes the main window would open off screen
  - (#25) by @the-infinite-moon
- Fixed an issue where idler windows were not being closed once all achievements were unlocked with `achievement unlocker`
  - (#24) by @Jesewe
- Added a `stealth idle windows` to `settings > general`
  - Allows users to idle games with no external idle window appearing on the desktop/taskbar
  - When active, if manually idling one or more games, you will have to manually end the idler process `(SteamUtility.exe)` for each game from Windows task manager. This task is done automatically during `card farming` and `achievement unlocker` tasks
  - If you manually idle multiple games at once, you can tell which process belongs to which game by clicking the drop down next to it <sub>_[[image](https://i.imgur.com/YHf5PSv.png)]_</sub>
  - (#23) by @Jesewe
- Moved toast messages to `bottom-center` as they would get in the way of frequently used elements

<!-- 1.5.6 -->

### Changes in v1.5.6

- Fixed an error that prevented the `card farming` feature from working

<!-- 1.5.5 -->

### Changes in v1.5.5

- Fixed an issue in `achievement unlocker` where game achievements was always `0` when the `skip hidden achievements` options was selected
- Added a confirmation modal when logging out
- Added version to log events

<!-- 1.5.4 -->

### Changes in v1.5.4

- Fixed an issue caused by the previous update to `achievement unlocker`
  - (#21) by @jesewe

<!-- 1.5.3 -->

### Changes in v1.5.3

- Fixed an issue that caused an infinite loading screen when a game with no achievements was in the `achievement unlocker` list
  - (https://github.com/probablyraging/steam-game-idler/issues/20) by @Jesewe

<!-- 1.5.2 -->

### Changes in v1.5.2

- Fixed an issue where already unlocked achievements were not being filtered when running the `achievement unlocker`
- Idler windows now have a different icon color to easily distinguish it from the main SGI window in the task bar
- Better handling and logging of errors

<!-- 1.5.1 -->

### Changes in v1.5.1

- Fixed an issue causing some games list sorting filters to not work
- Fixed an issue causing some `game banner images` to not load

<!-- 1.5.0 -->

### Changes in v1.5.0

- Moved all http requests to Tauri's rust backend so that SGI no longer relies on a proxy endpoint to make its http requests
  - This means that the API endpoint used in previous version of SGI will likely be retired, breaking previous versions of SGI completely, so updating to `v1.5.0` or later is mandatory

<!-- 1.4.6 -->

### Changes in v1.4.6

- Fixed an issue that caused a temp directory to be included in the release bundle

<!-- 1.4.5 -->

### Changes in v1.4.5

- Added a `general` tab to the `settings` screen
- Added an option to `disable automatic updates` in `settings > general`
  - You can manually install updates by going to `settings > click the 3 vertical dots in the top-right > check for updates`
- Aded an option to `delete locally saved data on logout` in `settings > general`
  - This includes `steam credentials`, `favorites`, `card farming`, and `achievement unlocker` lists
- SGI now remembers the window state, position, and size between sessions/updates
- Added a `tooltip` that displays the achievement's API name when hovering `achievement names` in `achievement manager > achievements`
  - This can sometimes be useful to know which achievement `statistic` pairs to which achievement

<!-- 1.4.4 -->

### Changes in v1.4.4

- Fixed an issue that caused duplicate idler windows to be opened while the `achievement unlocker` feature was running

<!-- 1.4.3 -->

### Changes in v1.4.3

- Added a `schedule` setting to `settings > achievement unlocker` called `between the hours of`
   - Allows users to choose a time frame for when the `achievement unlocker` feature should actively unlock achievements. When outside of the set time frame, SGI will sleep, only resuming again once within the set time frame
   - Feature requested by @Meszaros91 in #17

<!-- 1.4.2 -->

### Changes in v1.4.2

- Added a `statistics` tab to the `achievement manager` screen which allows users to edit game achievement statistics
- Fixed an issue that prevented some elements from filling the screen if the window was resized

<!-- 1.3.18 -->

### Changes in v1.3.18

- Fixed an issue where SGI wasn't checking if Steam was running when bulk unlocking/locking achievements from the `achievement manager` screen
- Added a timer to the title of the external idling windows
- Improved the look of modal components

<!-- 1.3.17 -->

### Changes in v1.3.17

- Simplified the UI by merging the `game idler list` and `achievement unlocker list` into a single component/tab called `games list`
  - `game cards` now have both a `start idling` and `achievement manager` button when hovered
- Fixed an issue where trying to idle a game from within the `game card` `drop down menu` would result in an error

<!-- 1.3.16 -->

### Changes in v1.3.16

- Added a `manually add games` button to the `games list` screen which allows users to add games that they do not own, but have in their Steam library, such as family shared games
  - Manually added games will appear in the `favorites` list
  - Adding games that you do not have access to will not allow you to idle or unlock achievement for them

<!-- 1.3.14 -->

### Changes in v1.3.14

- Fixed the background colors when hovering titlebar buttons on the `update` screen
- Fixed the div width of achievement descriptions on the `achievements manager` screen

<!-- 1.3.13 -->

### Changes in v1.3.13

- Added a `refresh` button to the `games list` to allow users to manually pull game library changes and update the cached games list
  - Refreshing the games list is on a 3 minute cooldown
- Added a `lock all` button the the `achievements manager` screen
- Fixed an issue where toast components would become bugged if the component that displayed them was updated while the toast was visible
- Changed idler window title so Discord can detect game names for activity presences

<!-- 1.3.11 -->

### Changes in v1.3.11

- Added a `skip hidden achievements` button to the `achievement unlocker` settings
- Improved event logging

<!-- 1.3.10 -->

### Changes in v1.3.10

- Fixed incorrect theme colors for toast popups and `card menu` buttons
- Fixed text sizing for `card menu`, `automate menu`, and `settings menu` buttons
- Made the game `banner images` a little darker when using the `dark` theme
- Improved the page tabs on the `settings` screen
- Improved event logging messages

<!-- 1.3.9 -->

### Changes in v1.3.9

- Removed the need to constantly recheck if Steam is running
  - This caused a `Spacewar` game to be added to the user's recently played list on Steam. Now it should only happen once when signing in
- Reworked some UI components such as the `game cards`, `sort drop down`, and more, to match the style of other UI components
- Made some elements darker when using the `dark` theme

<!-- 1.3.8 -->

### Changes in v1.3.8

- Fixed an issue where some default settings were being set incorrectly causing the interval slider to break
- Added a `reset settings` button to the `settings` screen, this will reset all settings to default

<!-- 1.3.7 -->

### Changes in v1.3.7

- SGI no longer requires users to enter their `Steam profile name` or `Steam ID64`. It will now get the Steam profile and games list of the user currently logged in to the Steam desktop app
  - The Steam desktop app must be running and signed in to your account in order to proceed to the `dashboard` screen
- Added page tabs to the `settings` screen
- Merged the `Idler` and `AchievementUnlocker` C# projects into a single project: `/libs/steam-utility/SteamUtility.csproj`
- Fixed a component flashing issue

<!-- 1.3.6 -->

### Changes in v1.3.6

- Fixed an issue where the `Unlock all` achievements buttons would lock already unlocked achievements

<!-- 1.3.5 -->

### Changes in v1.3.5

- Replaced the `add all games with drops remaining` button with two new options in the `settings` screen
   - **Games in list**: when active only games you manually add to the `card farming list` will be farmed
   - **All games with drops**: all games in your library with 1 or more card drops remaining will be farmed
- Fixed an issue where SGI would become temporarily unresponsive when stopping the `card farming` feature if there were a lot of games in the `card farming list`

<!-- 1.3.4 -->

### Changes in v1.3.4

- Fixed an issue where a command terminal window would flash open and close every time a game started or stopped idling

<!-- 1.3.3 -->

### Changes in v1.3.3

- Added an `Add All Games With Drops` when your `sort` filter is set to `Card Farming Games`
   - This will find all games in your Steam library that have 1 or more card drops remaining and add them all to your `Card Farming List`
- Updates will now be handled inline
   - Now, when an update for SGI is available, you will see an updating screen while the update in automatically downloaded in the background, rather than the previous dialog prompt
   - Because of this change, there will no longer be a `portable` version of SGI in any future releases

<!-- 1.3.2 -->

### Changes in v1.3.2

- Updated all API routes to use a standalone API
   - This change may break older versions of SGI in the future, as I intend to remove the current API endpoints at some point
- Added internal version checks to notify users of breaking changes *(like this one)* in the future and direct them on how to update
   - This is more for `portable` version users as the `installer` version already does automatic updates when a new version is available

<!-- 1.3.1 -->

### Changes in v1.3.1

- Fixed an error where idled games were being logged by their ID instead of their name
- Added simple statistic logging

<!-- 1.3.0 -->

### Changes in v1.3.0

- Added automatic card farmer
  - Check the [Card Farming Wiki Page](https://github.com/probablyraging/steam-game-idler/wiki/Automated-features#card-farming) for more information about how the feature works and how to use it
- Added automatic achievement unlocker
  - Check the [Achievement Unlocker Wiki Page](https://github.com/probablyraging/steam-game-idler/wiki/Automated-features#achievement-unlocker) for more information about how the feature works and how to use it
- Added a [settings screen](https://github.com/probablyraging/steam-game-idler/wiki/Settings) for controlling aspects of the new features
- Added internal logs to the settings screen for easy debugging *(needs work)*
- Reworked some UI elements;
  - **Sidebar:** moved the sorting function to a drop down list in the [main window](https://github.com/probablyraging/steam-game-idler/wiki/User-interface#main-window) and replaced the previous buttons with buttons for navigating between the [Game Idler](https://github.com/probablyraging/steam-game-idler/wiki/Features#game-idler) and [Achevement Unlocker](https://github.com/probablyraging/steam-game-idler/wiki/Features#achievement-unlocker) screens
  - **Game list:** 
    - Clicking on the game's banner image, depending on which screen you're on, now allows you to perform actions such as manually idling or viewing the achievements unlocker screen for that game
    - Added a drop down menu to game cards for easy access to multiple features, such as, adding games to `favorites`, `card farming`, and `achievement unlocker` list
    - Added an `Automate` button that presents a drop down menu for starting [automated features](https://github.com/probablyraging/steam-game-idler/wiki/Automated-features)
  - **Achievements list:**
     - Reworked the layout to better display achievements
- Added a [GitHub wiki](https://github.com/probablyraging/steam-game-idler/wiki) page

<!-- 1.2.2 -->

### Changes in v1.2.2

- Added an unlock all button to the achievements menu
- Deprecated SGI lite version as of v1.2.2

<!-- 1.2.1 -->

### Changes in v1.2.1

- Fixed an issue where an error occurred if the game had no achievements
- Added a warning message about private game details

<!-- 1.2.0 -->

### Changes in v1.2.0

- Added the ability to unlock game achievements from within the SGI user interface
- Added an achievements button to game cards *(click the trophy button on any game card to bring up the achievements menu)*

<!-- 1.1.6 -->

### Changes in v1.1.6

- Removed 'list view' and 'grid view' buttons
- Added 'game information' button

<!-- 1.1.5 -->

### Changes in v1.1.5

- Added tooltips to the sidebar *(sort bar)* to show what each button does

<!-- 1.1.4 -->

### Changes in v1.1.4

- Updated icon for idler window
- Idler window now shows game names
- Added unbuilt idler directory

<!-- 1.1.3 -->

### Changes in v1.1.3

- Removed unused modules, imports, and tailwind utils
- Optimized assets
- Other minor fixes

<!-- 1.1.2 -->

### Changes in v1.1.2

- New icon
- Updated UI to feel more modern and less "Windows"
- Automatic updates added for the `.msi` package. The portable `.exe` version will not receive automatic updates, manual updating required

<!-- 1.1.0 -->

### Changes in v1.1.0

- Opted to use Tauri over Electron to reduce file size of the bundled app. Bringing the total bundle size down from 133MB > ~8.7MB *(~3.8MB when zipped)*
- Added both a portable `.exe` and an `.msi` installer *(use of the `.msi` installer recommended as it comes bundled with dependencies, check [README](https://github.com/ProbablyRaging/steam-game-idler/blob/main/README.md#notes) for more information)*
- Added `Lite` bundles

<!-- 1.0.1 -->

### Changes in v1.0.1

- Spawn child processes *(idling game windows)* as detached processes to prevent them closing when the main window is closed

<!-- 1.0.0 -->

### Changes in v1.0.0

- Reduce build package size
