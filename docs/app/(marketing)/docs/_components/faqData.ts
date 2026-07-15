export const faqData = [
  { section: 'General' },
  {
    question: 'Why are some games not showing up in my games list in SGI?',
    markdown:
      '**Why are some games not showing up in my games list in SGI?**\n' +
      '> There are several reasons why a game may not appear in your SGI games list:\n' +
      '> * You need to click the "Refresh" button in "Your Games" to update the list\n' +
      "> * Family shared games currently don't appear in SGI's games list, and can't be added to Card Farming, Achievement Unlocker, Auto-Idle, or Favorites\n" +
      '> * Free-to-play games only appear in your library after you\'ve launched them at least once, which grants you a license. Simply clicking "Add to library" on the store page doesn\'t grant you a license\n' +
      '> * Some demos and playtests (unvetted apps) may not show up correctly in SGI, or be able to be idled\n' +
      '> * The game may be [marked as private](https://help.steampowered.com/en/faqs/view/1150-C06F-4D62-4966) on your Steam profile\n' +
      '> * The game may have been removed from the Steam store or your license for the game may have been revoked\n' +
      '> * The game was part of a subscription service such as EA Play, and your subscription has expired\n' +
      '> * Some games may have region specific restrictions and you may not own the game in your current region\n' +
      '> * One or more of your [Steam profile privacy settings](https://steamcommunity.com/my/edit/settings) is set to private\n' +
      '>\n' +
      '> ![Profile settings](/examples/profile-settings.webp)',
  },
  {
    question:
      'Do I need to make my Steam profile and game details public for the Steam card idler to work?',
    markdown:
      '**Do I need to make my Steam profile and game details public for the Steam card idler to work?**\n' +
      '> In most cases, yes. For some features to function correctly SGI requires your Steam profile and game details to be set to public in your [Steam profile privacy settings](https://steamcommunity.com/my/edit/settings).\n' +
      '>\n' +
      '> However, providing your own Steam Web API key in [Settings → General](/docs/settings/general#steam-web-api-key) will allow you to use SGI with a private profile.\n' +
      '>\n' +
      '> ![Profile settings](/examples/profile-settings.webp)',
  },
  {
    question: 'What makes this different from other Steam tools?',
    markdown:
      '**What makes this different from other Steam tools?**\n' +
      '> Other Steam tools available today only specialize in one specific feature. Some require you to buy a subscription, download and install add-ons and plugins to gain access to other features, and even requiring you to use multiple applications.\n' +
      '>\n' +
      '> SGI streamlines this by integrating all of these features into a single free and comprehensive app with an easy-to-use interface.',
  },
  {
    question: 'Do I need an internet connection to use SGI?',
    markdown:
      '**Do I need an internet connection to use SGI?**\n' +
      "> Yes, SGI requires an active internet connection to communicate with Steam's servers for signing in, fetching games lists, idling games, managing achievements, farming trading cards, and more.",
  },
  {
    question:
      'What is the "Do you want to allow public/private networks to access this app" message when I first launched SGI?',
    markdown:
      '**What is the "Do you want to allow public/private networks to access this app" message when I first launched SGI?**\n' +
      "> SGI needs to make outbound HTTP requests to communicate with Steam's servers and check for automatic updates. For SGI to function correctly, you will need to accept this prompt.\n" +
      '>\n' +
      '> If you declined the prompt already, you will need to add SGI as an allowed app in Windows Defender Firewall:\n' +
      '>\n' +
      '> 1. Open the Windows Control Panel\n' +
      '> 2. Go to System and Security > Windows Defender Firewall\n' +
      '> 3. Click on "Allow an app or feature through Windows Defender Firewall"\n' +
      '> 4. Click "Change settings" then "Allow another app..." and then "Browse"\n' +
      '> 5. Navigate to the install directory of the app you want to add, select it, and click "Open"\n' +
      '> 6. Check the boxes for "Private" and/or "Public" networks as needed\n' +
      '> 7. Click "OK" to save the changes',
  },
  {
    question: 'Can I get banned for using a Steam idler or achievement unlocker?',
    markdown:
      '**Can I get banned for using a Steam idler or achievement unlocker?**\n' +
      '> No. Steam idlers and achievement unlockers have been around for 10+ years with no valid reports of people getting banned.\n' +
      '>\n' +
      "> SGI interacts with Steam through Valve's official Steamworks SDK ([Legacy Sign In](/docs/get-started/how-to-sign-in#legacy-sign-in)) or the same protocol the official Steam apps use ([Sign in with Steam](/docs/get-started/how-to-sign-in#sign-in-with-steam)) — either way, just like normal gaming activity.",
  },
  {
    question: "What's the difference between 'Sign in with Steam' and 'Legacy Sign In'?",
    markdown:
      "**What's the difference between 'Sign in with Steam' and 'Legacy Sign In'?**\n" +
      '> See the full breakdown on the [How to Sign In](/docs/get-started/how-to-sign-in) page. In short: **Sign in with Steam** is the recommended method and needs no local Steam client, while **Legacy Sign In** requires the Steam client to be installed, running, and signed in.',
  },
  {
    question: 'Is it possible to run SGI in sleep/hibernation mode?',
    markdown:
      '**Is it possible to run SGI in sleep mode?**\n' +
      '> No. Sleep and hibernation modes suspend most running processes on your computer, including SGI. This means that SGI will not be able to idle games, farm cards, or unlock achievements while your computer is in sleep or hibernation mode.\n' +
      '>\n' +
      '> However, with a little setup, you can schedule a task using Windows Task Scheduler to wake up and put your computer to sleep at specific times. This way, you can ensure that SGI is running and able to perform its functions when you need it to.',
  },
  { section: 'Farming cards' },
  {
    question: 'What are trading cards and how do they work with Steam idlers?',
    markdown:
      '**What are trading cards and how do they work with Steam idlers?**\n' +
      "> This is covered in great detail in [Steam's Trading Cards FAQ](https://steamcommunity.com/tradingcards/faq). Our Steam trading card idler automates the process of collecting these cards.",
  },
  {
    question: 'Why am I not getting any card drops with the Steam card idler?',
    markdown:
      '**Why am I not getting any card drops with the Steam card idler?**\n' +
      '> * You can only receive a limited amount of card drops per game, check "[How do I know if my games have card drops remaining?](/docs/faq#How%20do%20I%20know%20if%20my%20games%20have%20card%20drops%20remaining?:~:text=How%20do%20I%20know%20if%20my%20games%20have%20card%20drops%20remaining%3F,-Go%20to%20https)" below for more information\n' +
      '> * New accounts, accounts with recently refunded games, or accounts with [other restrictions](https://help.steampowered.com/en/faqs/view/71D3-35C2-AD96-AA3A) might experience a delay of up to 3 hours before receiving their first card drop, or even no card drops at all\n' +
      '> * You must have a stable internet connection while farming cards. If you lose connection, card drops may not be tracked correctly\n' +
      '> * Free-to-play games require you to spend at least $9 USD (or equivalent) in-game to become eligible for card drops\n' +
      "> * Games (which usually have a price) obtained for free during promotional giveaways typically won't drop cards\n" +
      '> * You need to own a license for the game on your account\n' +
      '> * You can not farm cards for family shared games\n' +
      '> * Games must not be [marked as private](https://help.steampowered.com/en/faqs/view/1150-C06F-4D62-4966)\n' +
      '> * The game may be in your [Card Farming blacklist](/docs/features/card-farming/blacklisting-games) — check the Blacklisted tab',
  },
  {
    question: 'How do I know if my games have card drops remaining?',
    markdown:
      '**How do I know if my games have card drops remaining?**\n' +
      '> 1. Go to [https://steamcommunity.com/my/badges/](https://steamcommunity.com/my/badges/)\n' +
      "> 2. Scroll down, or press `CTRL+F` to search for the game's title\n" +
      '> 3. In the top-right of the game card, you will see either `X card drops remaining` or `no card drops remaining`',
  },
  {
    question: 'How long does it take for cards to drop?',
    markdown:
      '**How long does it take for cards to drop?**\n' +
      '> Card drop timers can be different for every game. The developer sets these timers and they can vary anywhere from 10 minutes to 2 hours between drops.',
  },
  { section: 'Idling games' },
  {
    question: 'Can I idle family shared games?',
    markdown:
      '**Can I idle family shared games?**\n' +
      "> Not currently. SGI only shows and manages games you own a direct license for — family shared games don't appear in your games list and can't be idled, farmed for cards, or have achievements managed.",
  },
  {
    question: 'Why am I unable to idle some games?',
    markdown:
      '**Why am I unable to idle some games?**\n' +
      '> There could be several reasons why you are unable to idle certain games:\n' +
      '> * If using [Legacy Sign In](/docs/get-started/how-to-sign-in#legacy-sign-in), the Steam client may not be running, or you may not be signed in to the correct account\n' +
      '> * Another person may be currently playing the game on your account\n' +
      '> * You may not own the game on your account\n' +
      '> * The game may be [marked as private](https://help.steampowered.com/en/faqs/view/1150-C06F-4D62-4966) on your Steam profile\n' +
      '> * Some demos and playtests may not show up correctly in SGI, or be able to be idled\n' +
      '> * Some games may have restrictions that prevent them from being idled, such as region locks or account bans\n' +
      '> * Some games may have their own third-party launcher that needs to be used to launch the game instead of the Steam client (EA, Ubisoft, etc.)\n' +
      "> * [Game Coordinator titles](/docs/get-started/how-to-sign-in#whats-different-between-the-two) (TF2, Dota 2, CS2, Left 4 Dead 2, Portal 2) don't idle correctly when signed in with Steam — use Legacy Sign In for these\n" +
      '>\n' +
      '> If using Legacy Sign In, sometimes running SGI as an administrator can help resolve some issues with idling certain games.',
  },
  {
    question: 'Why is my playtime not increasing on Steam when using SGI?',
    markdown:
      '**Why is my playtime not increasing on Steam?**\n' +
      "> Playtime not being counted when idling games in SGI isn't strictly an issue with SGI, but rather, it's an issue on Steam's servers. This issue has been reported many times over the years and happens even when playing games legitimately.\n" +
      '>\n' +
      '> The Steam client also shows inconsistencies between playtime displayed in the "Library" tab versus the playtime displayed on the "Profile". Be sure to check both to see if one is showing the correct playtime.\n' +
      '>\n' +
      '> Some users have reported that simply closing the Steam client completely, or signing out and then back in can fix this inconsistency. And sometimes it resolves on its own after a few hours.\n' +
      '>\n' +
      '> While this is generally always a Steam server issue, there are some things that can affect playtime being tracked correctly:\n' +
      '> * If using Legacy Sign In, the Steam client may have been closed while idling, or you may not be signed in to the correct account\n' +
      '> * You were disconnected from the internet while idling and only playtime before the disconnection was recorded\n' +
      "> * The game didn't exit properly when stopping idling. Try restarting SGI (and the Steam client, if using Legacy Sign In) to resolve this issue",
  },
  {
    question: 'Can I use SGI to idle in-game items or join game servers?',
    markdown:
      '**Can I use SGI to idle in-game items or join game servers?**\n' +
      "> No. SGI cannot idle in-game items or join game servers as it doesn't run an actual instance of the game.",
  },
  {
    question: 'Can I use SGI and play Steam games at the same time?',
    markdown:
      '**Can I use SGI and play Steam games at the same time?**\n' +
      '> Yes. You can idle games with SGI while playing others.\n' +
      '>\n' +
      "> Keep in mind that Steam only allows a maximum of 32 simultaneous game instances across all of SGI's features combined (and the Steam client, if you're also playing a game through it). So, just make sure that the total number of games being idled by SGI and the game you are playing does not exceed this limit, and that you are not trying to idle the same game you are trying to play.",
  },
  {
    question: 'How many games can SGI idle simultaneously?',
    markdown:
      '**How many games can SGI idle simultaneously?**\n' +
      '> You can idle a maximum of 32 games simultaneously, combined across manual [Idling](/docs/features/idling), [Auto-Idle](/docs/features/auto-idle), [Card Farming](/docs/features/card-farming), and the [Achievement Unlocker](/docs/features/achievement-unlocker). This limit is imposed by the Steam client.',
  },
  { section: 'Unlocking & locking achievements (auto & manual)' },
  {
    question: 'Why am I unable to unlock/lock some achievement for some games?',
    markdown:
      '**Why am I unable to unlock/lock some achievement for some games?**\n' +
      "> While most achievements for most games can be unlocked with SGI, some can't be. Some games contain `protected` achievements and statistics that can only be modified by official game servers. [Learn more](https://partner.steamgames.com/doc/features/achievements#game_server_stats:~:text=Stats%20and%20achievements%20that%20are%20settable%20by%20game%20servers%20cannot%20be%20set%20by%20clients).\n" +
      '>\n' +
      '> Additionally, some games may have removed their achievements entirely, or have other restrictions that prevent achievements from being unlocked/locked.',
  },
  {
    question:
      'Why do I see "No achievements found" and "No statistics found" on the game\'s achievement manager screen?',
    markdown:
      '**Why do I see "No achievements found" and "No statistics found" on the game\'s achievement manager screen?**\n' +
      '> * The game you are trying to view achievements for does not have any achievements\n' +
      '> * Your "Game Details" are set to private in your [Steam profile privacy settings](https://steamcommunity.com/my/edit/settings)',
  },
  {
    question: 'Will unlocking achievements affect my completion percentage on tracking sites?',
    markdown:
      '**Will unlocking achievements affect my completion percentage on tracking sites?**\n' +
      '> Yes, achievements unlocked with SGI will count toward your completion percentage on sites like Steam, TrueSteamAchievements, SteamHunters, and others that track Steam achievements.',
  },
  {
    question: "Can I unlock achievements for games I don't own?",
    markdown:
      "**Can I unlock achievements for games I don't own?**\n" +
      '> No. You can only unlock achievements for games that are owned by your Steam account. The game must be in your library.',
  },
  {
    question: 'Can I unlock achievements for family shared games?',
    markdown:
      '**Can I unlock achievements for family shared games?**\n' +
      "> Not currently. Family shared games don't appear in SGI's games list, so they can't be added to the Achievement Unlocker or Achievement Manager.",
  },
  {
    question: 'Is there a way to unlock achievements in a specific order?',
    markdown:
      '**Is there a way to unlock achievements in a specific order?**\n' +
      '> By default, the automatic [Achievement Unlocker](/docs/features/achievement-unlocker) will unlock achievements in the order of global completion percentage (Legacy Sign In only).\n' +
      '>\n' +
      '> If you need to unlock achievements in a specific order, see [Custom Order & Unlock Delay](/docs/features/achievement-unlocker/custom-order-and-unlock-delay).',
  },
  { section: 'Error messages' },
  {
    question: 'Steam is not running',
    markdown:
      '**Steam is not running**\n' +
      '> This only affects accounts using [Legacy Sign In](/docs/get-started/how-to-sign-in#legacy-sign-in) — this method requires the Steam client to be running, and you must be signed in to the same account you are currently signed in to SGI with.\n' +
      '>\n' +
      "> If you'd rather not depend on the Steam client at all, switch to [Sign in with Steam](/docs/get-started/how-to-sign-in#sign-in-with-steam) instead.",
  },
  {
    question: 'No Steam users found',
    markdown:
      '**No Steam users found**\n' +
      '> This error only appears when using [Legacy Sign In](/docs/get-started/how-to-sign-in#legacy-sign-in):\n' +
      '> * The Steam client needs to be installed\n' +
      '> * You need to be signed in to at least one Steam account in the Steam client\n' +
      '> * SGI failed to find the install directory for Steam. Try reinstalling Steam in its default location `C:\\Program Files (x86)\\Steam`\n' +
      '>\n' +
      '> SGI will automatically search for the Steam install directory by referencing Windows registry keys. Make sure the registry keys are correct by following these steps:\n' +
      '> 1. Press `WinKey + S` to open the search bar\n' +
      '> 2. Type `Registry Editor` and press `Enter` to open the Registry Editor\n' +
      '> 3. Navigate to `HKEY_CURRENT_USER\\Software\\Valve\\Steam` and make sure the value of `SteamPath` is set to the correct path of your Steam installation\n' +
      '> 4. If the value is not set to the correct path of your Steam installation, you can manually set it by right-clicking on `SteamPath`, selecting `Modify`, and entering the correct path (e.g., `c:/program files (x86)/steam`)\n' +
      '> 5. Close the Registry Editor and restart SGI\n' +
      '>\n' +
      '> Alternatively, use [Sign in with Steam](/docs/get-started/how-to-sign-in#sign-in-with-steam) to skip this requirement entirely.',
  },
  {
    question: 'There are no games in your queue',
    markdown:
      '**There are no games in your queue**\n' +
      '> The queue you are trying to start a feature for is empty. You can add games to your queue by following these steps for [Achievement Unlocker](/docs/features/achievement-unlocker), [Card Farming](/docs/features/card-farming), or [Auto-Idle](/docs/features/auto-idle) — or enable that feature\'s "Farm/idle all games" setting instead.',
  },
  {
    question: 'Account mismatch between Steam and SGI',
    markdown:
      '**Account mismatch between Steam and SGI**\n' +
      '> This error can be thrown for a few reasons. The most common one is:\n' +
      '>\n' +
      '> * If using [Legacy Sign In](/docs/get-started/how-to-sign-in#legacy-sign-in), you are logged in to the Steam client with a different account than you are using in SGI. This method requires you to be logged in to the same account in both the Steam client and SGI\n' +
      '>\n' +
      '> If you confirm that you are logged in to the same account in both SGI and the Steam client and the error message persists, please report the issue on the [GitHub Issues page](https://github.com/zevnda/steam-game-idler/issues).',
  },
  {
    question: 'Incorrect Steam Credentials',
    markdown:
      '**Incorrect Steam Credentials**\n' +
      '> * You have entered the incorrect cookies. Follow the steps found in the [Steam Credentials](/docs/steam-credentials) section\n' +
      "> * Steam accounts with [Family View](https://store.steampowered.com/parental/) _(parental restrictions)_ enabled will also have a `steamParental` cookie that needs to be saved in SGI's settings\n" +
      '> * If you are using the [Automated Method](/docs/steam-credentials#automated-method), you must disable [Family View](https://store.steampowered.com/parental/) to use this method\n' +
      "> * In some cases, Steam accounts might have a `steamMachineAuth` cookie that needs to be saved in SGI's settings",
  },
  {
    question: 'Missing Steam Credentials',
    markdown:
      '**Missing Steam Credentials**\n' +
      '> SGI requires [Steam Credentials](/docs/steam-credentials) for the account you plan to farm cards or manage inventory on, to check card drops and access the Steam marketplace. If you [signed in with Steam](/docs/get-started/how-to-sign-in#sign-in-with-steam) on a Gamer tier account this is handled automatically — otherwise, read the [Steam Credentials](/docs/steam-credentials) page for how to add them.',
  },
  {
    question: 'Steam Credentials need to be updated',
    markdown:
      '**Steam Credentials need to be updated**\n' +
      '> From time to time the cookies you supply to SGI will expire for several reasons and they will need to be updated. Follow the [Steam Credentials](/docs/steam-credentials) steps to get updated cookies.',
  },
  {
    question: 'Please wait X seconds before fetching more card prices',
    markdown:
      '**Please wait X seconds before fetching more card prices**\n' +
      '> SGI uses an undocumented Steam API endpoint with strict rate limits to fetch card prices. To avoid being rate limited by Steam, SGI enforces a 5 second cooldown when manually fetching prices. This ensures that users have a smooth experience when fetching card prices without running into rate limit issues.',
  },
  {
    question: 'Rate limited when fetching card prices',
    markdown:
      '**Rate limited when fetching card prices**\n' +
      '> SGI uses an undocumented Steam API endpoint with strict rate limits to fetch card prices. If you encounter this message, it means that the rate limit has been exceeded while listing cards on the Steam market.\n' +
      '>\n' +
      '> Rate limit times can vary, so you may need to wait a few minutes to an hour before trying again.\n' +
      '>\n' +
      '> To avoid hitting the rate limit in the future, consider increasing the [Sell Delay](/docs/settings/inventory-manager#sell-delay) in [Settings → Inventory Manager](/docs/settings/inventory-manager).',
  },
]
