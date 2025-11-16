// FAQ data: id -> { question, markdown }
export const faqData: Record<string, { id: string; question: string; markdown: string }> = {
  q1: {
    id: 'q1',
    question: 'Why are some games not showing up in my games list in SGI?',
    markdown:
      '**Why are some games not showing up in my games list in SGI?**\n' +
      '> There are several reasons why a game may not appear in your SGI games list:\n' +
      '> * Family shared games don\'t appear in the games list by default, but you can add them to any of the lists *(Card Farming, Achievement Unlocker, etc..)*  by using the `+` button, entering the game\'s AppID and name, and clicking "Add"\n' +
      '> * The game may be [marked as private](https://help.steampowered.com/en/faqs/view/1150-C06F-4D62-4966) on your Steam profile\n' +
      '> * Some demos and playtests may not show up correctly in SGI, or be able to be idled\n' +
      '> * The game may have been removed from the Steam store or your license for the game may have been revoked\n' +
      '> * The game was part of a subscription service such as an EA Play, and your subscription has expired\n' +
      '> * Some games may have region specific restrictions that prevent them from being displayed',
  },
  q2: {
    id: 'q2',
    question: 'Do I need to make my Steam profile and game details public for the Steam card idler to work?',
    markdown:
      '**Do I need to make my Steam profile and game details public for the Steam card idler to work?**\n' +
      '> In most cases, yes. For some features to function correctly SGI requires your Steam profile and game details to be set to public in your [privacy settings](https://steamcommunity.com/id/undefined/edit/settings).\n' +
      '>\n' +
      '> However, providing your own Steam Web API key in the [settings > general](/docs/settings/general) will allow you to use SGI with a private profile.',
  },
  q3: {
    id: 'q3',
    question: 'What makes this different from other Steam tools?',
    markdown:
      '**What makes this different from other Steam tools?**\n' +
      '> SGI combines multiple useful features from a range of other tools, while other tools may focus on a single aspect. SGI offers card farming, achievement management, trading card management, and playtime boosting in a single, user-friendly interface.',
  },
  q4: {
    id: 'q4',
    question: 'Do I need an internet connection to use SGI?',
    markdown:
      '**Do I need an internet connection to use SGI?**\n' +
      '> Yes, SGI requires an active internet connection to communicate with the Steam servers for idling games, unlocking achievements, and farming trading cards.',
  },
  q5: {
    id: 'q5',
    question:
      'What is the "Do you want to allow public/private networks to access this app" message when I first launched SGI?',
    markdown:
      '**What is the "Do you want to allow public/private networks to access this app" message when I first launched SGI?**\n' +
      '> SGI needs to handle multiple inbound/outbound HTTP requests to fetch data from Steam. For SGI to function correctly you will need to accept this prompt.\n' +
      '>\n' +
      '> If you declined the prompt already, you will need to add SGI as an allowed app in Windows Defender Firewall:\n' +
      '>\n' +
      '> 1. Open the Windows Control Panel\n' +
      '> 2. Go to System and Security > Windows Defender Firewall\n' +
      '> 3. Click on "Allow an app or feature through Windows Defender Firewall"\n' +
      '> 4. Click "Change settings" then "Add another app..." and then "Browse"\n' +
      '> 5. Navigate to the install directory of the app you want to add, select it, and click "Open"\n' +
      '> 6. Check the boxes for "Private" and/or "Public" networks as needed\n' +
      '> 7. Click "OK" to save the changes',
  },
  q6: {
    id: 'q6',
    question: 'Can I get banned for using a Steam idler or achievement unlocker?',
    markdown:
      '**Can I get banned for using a Steam idler or achievement unlocker?**\n' +
      '> No. Steam idlers and achievement unlockers have been around for 10+ years with no valid reports of people getting banned.\n' +
      '>\n' +
      "> SGI also uses Valve's official [Steamworks SDK](https://partner.steamgames.com/doc/sdk) and interacts with Steam just like normal gaming activity.",
  },
  q7: {
    id: 'q7',
    question: 'What are trading cards and how do they work with Steam idlers?',
    markdown:
      '**What are trading cards and how do they work with Steam idlers?**\n' +
      "> This is covered in great detail in [Steam's Trading Cards FAQ](https://steamcommunity.com/tradingcards/faq). Our Steam trading card idler automates the process of collecting these cards.",
  },
  q8: {
    id: 'q8',
    question: 'Why am I not getting any card drops with the Steam card idler?',
    markdown:
      '**Why am I not getting any card drops with the Steam card idler?**\n' +
      '> * You can only receive a limited amount of card drops per game, check "How do I know if my games have card drops remaining?" below for more information\n' +
      '> * New accounts, accounts with recently refunded games, or accounts with [other restrictions](https://help.steampowered.com/en/faqs/view/71D3-35C2-AD96-AA3A) might experience a delay of up to 3 hours before receiving their first card drop, or even no card drops at all\n' +
      '> * You must be connected to the internet and signed in to the Steam client\n' +
      '> * Free-to-play (F2P) games typically require in-game purchases to drop cards\n' +
      "> * You need to own the game on your account. It can't be a family-shared game\n" +
      '> * Games must not be [marked as private](https://help.steampowered.com/en/faqs/view/1150-C06F-4D62-4966)\n' +
      "> * Paid games earned from promotions typically won't drop cards\n" +
      '> * You must have a stable internet connection while idling for card drops to be tracked correctly',
  },
  q9: {
    id: 'q9',
    question: 'How do I know if my games have card drops remaining?',
    markdown:
      '**How do I know if my games have card drops remaining?**\n' +
      '> 1. Go to [https://steamcommunity.com/my/badges/](https://steamcommunity.com/my/badges/)\n' +
      "> 2. Scroll down, or press `CTRL+F` to search for the game's title\n" +
      '> 3. In the top-right of the game card, you will see either `X card drops remaining` or `no card drops remaining`',
  },
  q10: {
    id: 'q10',
    question: 'How long does it take for cards to drop?',
    markdown:
      '**How long does it take for cards to drop?**\n' +
      '> Card drop timers can be different for every game. The developer sets these timers, and they can vary from 15 minutes to 3 hours.',
  },
  q11: {
    id: 'q11',
    question: 'Can I idle family shared games?',
    markdown:
      '**Can I idle family shared games?**\n' +
      '> Yes, you can idle family shared games by manually adding them to one of your lists using the `+` button, entering the game\'s AppID and name, and clicking "Add". Once the game is added to your list, you can idle it like any other game.',
  },
  q12: {
    id: 'q12',
    question: 'Why am I unable to idle some games?',
    markdown:
      '**Why am I unable to idle some games?**\n' +
      '> There could be several reasons why you are unable to idle certain games:\n' +
      '> * The Steam client may not be running, or you may not be signed in to the correct account\n' +
      '> * Another person may be currently playing the game on your account, or via family share\n' +
      '> * You may not own the game on your account. While most family shared games can be idled, some games may not work\n' +
      '> * The game may be [marked as private](https://help.steampowered.com/en/faqs/view/1150-C06F-4D62-4966) on your Steam profile\n' +
      '> * Some demos and playtests may not show up correctly in SGI, or be able to be idled\n' +
      '> * Some games may have restrictions that prevent them from being idled, such as region locks or account bans\n' +
      '> * Some games may have their own third-party launcher that needs to be used to launch the game instead of the Steam client (EA, Ubisoft, etc.)\n' +
      '>\n' +
      '> Sometimes running SGI as an administrator can help resolve some issues with idling certain games.',
  },
  q13: {
    id: 'q13',
    question: 'Why is my playtime not increasing on Steam?',
    markdown:
      '**Why is my playtime not increasing on Steam?**\n' +
      '> There could be several reasons for this:\n' +
      '> * The Steam client may have been closed while idling, or you may not be signed in to the correct account\n' +
      '> * You were disconnected from the internet while idling and only playtime before the disconnection was recorded\n' +
      "> * Steam's cloud sync may be down or has not updated your playtime yet. You can try restarting the Steam client to force a sync",
  },
  q14: {
    id: 'q14',
    question: 'Can I use SGI to idle in-game items or join game servers?',
    markdown:
      '**Can I use SGI to idle in-game items or join game servers?**\n' +
      "> No. SGI cannot idle in-game items or join game servers as it doesn't run an actual instance of the game.",
  },
  q15: {
    id: 'q15',
    question: 'How many games can SGI idle simultaneously?',
    markdown:
      '**How many games can SGI idle simultaneously?**\n' +
      '> You can idle a max of 32 games simultaneously. This limit is imposed by the Steam client.',
  },
  q16: {
    id: 'q16',
    question: 'Why am I unable to unlock/lock some achievement for some games?',
    markdown:
      '**Why am I unable to unlock/lock some achievement for some games?**\n' +
      "> While most achievements for most games can be unlocked with SGI, some can't be. Some games contain `protected` achievements and statistics that can only be modified by official game servers. [Learn more](https://partner.steamgames.com/doc/features/achievements#game_server_stats:~:text=Stats%20and%20achievements%20that%20are%20settable%20by%20game%20servers%20cannot%20be%20set%20by%20clients).\n" +
      '>\n' +
      '> Additionally, some games may have removed their achievements entirely, or have other restrictions that prevent achievements from being unlocked/locked.',
  },
  q17: {
    id: 'q17',
    question:
      'Why do I see "No achievements found" and "No statistics found" on the game\'s achievement manager screen?',
    markdown:
      '**Why do I see "No achievements found" and "No statistics found" on the game\'s achievement manager screen?**\n' +
      '> * The game you are trying to view achievements for does not have any achievements\n' +
      "> * Your 'Game Details' are set to private in your Steam profile settings",
  },
  q18: {
    id: 'q18',
    question: 'Will unlocking achievements affect my completion percentage on tracking sites?',
    markdown:
      '**Will unlocking achievements affect my completion percentage on tracking sites?**\n' +
      '> Yes, achievements unlocked with SGI will count toward your completion percentage on sites like Steam, TrueSteamAchievements, SteamHunters, and others that track Steam achievements.',
  },
  q19: {
    id: 'q19',
    question: "Can I unlock achievements for games I don't own?",
    markdown:
      "**Can I unlock achievements for games I don't own?**\n" +
      '> No. You can only unlock achievements for games that are owned by your Steam account, or shared via family share. The game must be in your library.',
  },
  q20: {
    id: 'q20',
    question: 'Can I unlock achievements for family shared games?',
    markdown:
      '**Can I unlock achievements for family shared games?**\n' +
      '> Yes, you can unlock achievements for family shared games by manually adding them to one of your lists using the `+` button, entering the game\'s AppID and name, and clicking "Add". Once the game is added to your list, you can unlock achievements for it like any other game.',
  },
  q21: {
    id: 'q21',
    question: 'Is there a way to unlock achievements in a specific order?',
    markdown:
      '**Is there a way to unlock achievements in a specific order?**\n' +
      '> The automatic [achievement unlocker](/docs/features/achievement-unlocker) will unlock achievements in the order of completion percentage. If you need to unlock achievements in a specific order, you can manually unlock them in the [achievement manager](/docs/features/achievement-manager) in any order you like.',
  },
  q22: {
    id: 'q22',
    question: 'Steam is not running',
    markdown:
      '**Steam is not running**\n' +
      '> Most features of SGI require the Steam client to be running, and you must be signed in to the same account you are currently logged in to SGI with.',
  },
  q23: {
    id: 'q23',
    question: 'No Steam users found',
    markdown:
      '**No Steam users found**\n' +
      '> * The Steam client needs to be installed\n' +
      '> * You need to be signed in to at least one Steam account in the Steam client\n' +
      '> * SGI failed to find the install directory for Steam. Try reinstalling Steam in its default location `C:\\Program Files (x86)\\Steam`\n' +
      '>\n' +
      '> SGI will automatically search for the Steam install directory by referencing Windows registry keys. Make sure the registry keys are correct by following these steps:\n' +
      '> 1. Press `WinKey + S` to open the search bar\n' +
      '> 2. Type `Registry Editor` and press `Enter` to open the Registry Editor\n' +
      '> 3. Navigate to `HKEY_CURRENT_USER\\Software\\Valve\\Steam` and make sure the value of `SteamPath` is set to the correct path of your Steam installation\n' +
      '> 4. If the value is not set to the correct path of your Steam installation, you can manually set it by right-clicking on `SteamPath`, selecting `Modify`, and entering the correct path (e.g., `C:\\Program Files (x86)\\Steam`)\n' +
      '> 5. Close the Registry Editor and restart SGI',
  },
  q24: {
    id: 'q24',
    question: "Add some games to your card farming list or enable 'all games' in 'settings > card farming'",
    markdown:
      "**Add some games to your card farming list or enable 'all games' in 'settings > card farming'**\n" +
      '> Your `card farming list` is empty. You either need to add games to the list by following [these steps](/docs/features/card-farming), or enable the `all games` setting in [Settings > Card Farming](/docs/settings/card-farming).',
  },
  q25: {
    id: 'q25',
    question: 'There are no games in your achievement unlocker list',
    markdown:
      '**There are no games in your achievement unlocker list**\n' +
      '> Your `achievement unlocker list` is empty. You can add games to your list by following [these steps](/docs/features/achievement-unlocker)',
  },
  q26: {
    id: 'q26',
    question: 'Account mismatch between Steam and SGI',
    markdown:
      '**Account mismatch between Steam and SGI**\n' +
      '> You are logged in to the Steam client with a different account than you are using in SGI. Most features in SGI require you to be logged in to the same account in both the Steam client and SGI.',
  },
  q27: {
    id: 'q27',
    question: 'Incorrect card farming credentials',
    markdown:
      '**Incorrect card farming credentials**\n' +
      '> * You have entered the incorrect cookies. Follow the steps found in the [Steam Credentials](/docs/steam-credentials) section\n' +
      "> * Steam accounts with [Family View](https://store.steampowered.com/parental/) _(parental restrictions)_ enabled will also have a `steamParental` cookie that needs to be saved in SGI's settings\n" +
      "> * In some cases, Steam accounts might have a `steamMachineAuth` cookie that needs to be saved in SGI's settings",
  },
  q28: {
    id: 'q28',
    question: 'Missing card farming credentials in "settings > card farming"',
    markdown:
      '**Missing card farming credentials in "settings > card farming"**\n' +
      '> SGI requires your Steam community credentials for the account that you plan to farm cards on to see if games in your library have card drops remaining or not. Read the [Steam Credentials](/docs/steam-credentials) section for more information.',
  },
  q29: {
    id: 'q29',
    question: 'Card farming credentials need to be updated in "settings > general"',
    markdown:
      '**Card farming credentials need to be updated in "settings > general"**\n' +
      '> From time to time the cookies you supply to SGI will expire for several reasons and they will need to be updated. Follow the [Steam Credentials](/docs/steam-credentials) steps to get the updated cookies.',
  },
}
