const DOCS_URL = 'https://steamgameidler.com/docs'
// The docs' much longer troubleshooting guide, linked from the page rather than repeated in it
export const TROUBLESHOOTING_URL = `${DOCS_URL}/troubleshooting`
const STEAM_PRIVACY_SETTINGS_URL = 'https://steamcommunity.com/my/edit/settings'
const STEAM_TRADING_CARDS_FAQ_URL = 'https://steamcommunity.com/tradingcards/faq'
const STEAM_BADGES_URL = 'https://steamcommunity.com/my/badges/'

export interface HelpItem {
  id: string
  question: string
  answer: string
  // Rendered as the answer's "Learn more" link, for a real published page only
  href?: string
}

export interface HelpSection {
  id: string
  title: string
  items: HelpItem[]
}

// Settings > Help's questions, grouped by feature. Condensed from the docs FAQ
// (docs/app/(marketing)/docs/_components/faqData.ts) and the landing page FAQ.
//
// The section names, questions and answers are English-only, a deliberate exception to the project's
// "every string goes through t()" rule: putting a full FAQ through Crowdin was judged not worth the
// word count. So don't add these to en-US.json or flag them as hardcoded strings. The subscription
// answers are copies of the Go Pro modal's FAQ, and the error questions copies of the app's real error
// messages, so keep those in step if they change.
//
// Deliberately leaves out whether family-shared games can be idled or have their achievements
// managed: the docs say they don't appear at all, but Steam Sign-in's ownership check does list them
// (see steam_agent/ownership_settings.rs), so that needs a verified answer first.
export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'general',
    title: 'General',
    items: [
      {
        id: 'whatIsIdler',
        question: 'What is a Steam idler?',
        answer:
          "A Steam idler makes Steam think you're playing a game without you actually playing it. That earns the game's trading card drops and adds hours to your playtime.",
      },
      {
        id: 'free',
        question: 'Is Steam Game Idler free?',
        answer:
          'Yes. The app and every core feature are free. An optional Pro subscription adds a few extras for people who want to support development.',
      },
      {
        id: 'safe',
        question: 'Can I get banned for using Steam Game Idler?',
        answer:
          "Tools like this have been around for more than 10 years and, historically, Steam hasn't banned accounts just for using them. The full source code is public on GitHub. As with any third-party tool, use it at your own discretion.",
      },
      {
        id: 'signInMethods',
        question: "What's the difference between Steam Sign-in and Local Sign-in?",
        answer:
          "Steam Sign-in is the recommended method. You sign in with your Steam username and password or a QR code, and no Steam client is needed. Local Sign-in is the Windows-only fallback for anyone who'd rather not enter their credentials. It requires the Steam client to be installed, running and signed in.",
        href: `${DOCS_URL}/get-started/how-to-sign-in`,
      },
      {
        id: 'password',
        question: 'Is my Steam password stored?',
        answer:
          'No. With Steam Sign-in your password is only used to sign in with Steam, and the app keeps a sign-in token instead. To avoid entering it at all, scan a QR code with the Steam mobile app or use Local Sign-in.',
      },
      {
        id: 'platforms',
        question: 'Which operating systems are supported?',
        answer:
          'Windows 10 and 11, and Linux. Steam Sign-in works on both. Local Sign-in is Windows-only.',
      },
      {
        id: 'internet',
        question: 'Do I need an internet connection?',
        answer:
          "Yes. The app talks to Steam's servers to sign in, load your games, idle, manage achievements and farm cards.",
      },
      {
        id: 'firewall',
        question: 'Why did Windows ask me to allow network access?',
        answer:
          'The app needs network access to reach Steam\'s servers and check for updates, so accept the prompt. If you declined it:\n1. Open Control Panel > System and Security > Windows Defender Firewall\n2. Click "Allow an app or feature through Windows Defender Firewall"\n3. Click "Change settings", then "Allow another app..."\n4. Browse to the app, then add it\n5. Tick "Private" and/or "Public", then click OK',
      },
      {
        id: 'sleep',
        question: 'Does it keep running while my computer is asleep?',
        answer:
          'No. Sleep and hibernation suspend the app, so nothing idles, farms or unlocks until your computer wakes up.',
      },
      {
        id: 'missingGames',
        question: 'Why are some games missing from my list?',
        answer:
          "• Press the refresh button on the Games page to update your list\n• Free-to-play games only appear after you've launched them once\n• Some demos and playtests may not show up correctly\n• The game may be marked as private on your Steam profile\n• Your license may have been revoked or expired, as with a lapsed EA Play subscription\n• Your Steam profile or game details may be set to private",
      },
      {
        id: 'publicProfile',
        question: 'Does my Steam profile need to be public?',
        answer:
          'In most cases, yes. Some features need your profile and game details to be public in your Steam privacy settings. Adding your own Steam Web API key in Settings → General lets you use the app with a private profile.',
        href: STEAM_PRIVACY_SETTINGS_URL,
      },
    ],
  },
  {
    id: 'idling',
    title: 'Idling',
    items: [
      {
        id: 'maxGames',
        question: 'How many games can I idle at once?',
        answer:
          'Up to 32, combined across manual idling, the Automatic Idler, Card Farming and the Achievement Unlocker. Steam sets this limit.',
      },
      {
        id: 'playWhileIdling',
        question: 'Can I play games while idling?',
        answer:
          "Yes, as long as you aren't playing a game that's being idled and your total stays within Steam's limit of 32 games.",
      },
      {
        id: 'cantIdle',
        question: "Why can't I idle some games?",
        answer:
          "• With Local Sign-in, the Steam client may be closed or signed in to a different account\n• Someone else may be playing a game on your account\n• You may not own the game\n• Some demos and playtests can't be idled\n• Region locks or bans may apply\n• Some games need their own launcher, such as EA or Ubisoft\n• TF2, Dota 2, CS2, Left 4 Dead 2 and Portal 2 need Local Sign-in",
      },
      {
        id: 'playtimeStuck',
        question: "Why isn't my playtime increasing?",
        answer:
          "This is usually on Steam's side and can happen during normal play too. Compare the playtime in your Library and on your Profile, as they can differ, and give it a few hours.\nIf it still doesn't move, check that you stayed connected to the internet, then restart the app. With Local Sign-in, also restart the Steam client and check it's signed in to the right account.",
      },
      {
        id: 'itemsServers',
        question: 'Can I idle in-game items or join game servers?',
        answer: "No. Idling doesn't run an actual instance of the game.",
      },
    ],
  },
  {
    id: 'cardFarming',
    title: 'Card Farming',
    items: [
      {
        id: 'whatAreCards',
        question: 'What are trading cards?',
        answer:
          "Collectible items that drop as you play eligible games. You can sell them on the Community Market or craft them into badges. Steam's Trading Cards FAQ covers the details.",
        href: STEAM_TRADING_CARDS_FAQ_URL,
      },
      {
        id: 'noDrops',
        question: 'Why am I not getting card drops?',
        answer:
          "• Each game only drops a limited number of cards\n• New accounts, recently refunded games and restricted accounts can see a delay of up to 3 hours, or no drops at all\n• Free-to-play games need at least $9 USD (or equivalent) spent in-game\n• Games given away for free typically don't drop cards\n• Family-shared games don't drop cards\n• The game may be marked as private on your profile\n• The game may be in your Card Farming blacklist",
      },
      {
        id: 'dropsLeft',
        question: 'How do I see which games have drops left?',
        answer:
          'Your Steam badges page shows "X card drops remaining" on each game that still has some.',
        href: STEAM_BADGES_URL,
      },
      {
        id: 'dropTime',
        question: 'How long do cards take to drop?',
        answer:
          'It varies by game, usually from 10 minutes to 2 hours between drops. Farming multiple games at once can make cards drop significantly slower.',
        href: `${DOCS_URL}/features/card-farming/card-drop-times`,
      },
      {
        id: 'cookiesNeeded',
        question: 'Why does Card Farming need Steam Credentials?',
        answer:
          "They're used to check your card drops and access the Steam marketplace, for both Card Farming and the Inventory Manager. Gamer tier accounts using Steam Sign-in get them automatically. Otherwise, add them in Settings → Steam Credentials.",
        href: `${DOCS_URL}/steam-credentials`,
      },
    ],
  },
  {
    id: 'achievements',
    title: 'Achievements',
    items: [
      {
        id: 'cantUnlock',
        question: "Why can't I unlock or lock some achievements?",
        answer:
          'Some games have protected achievements that only official game servers can change. Some games have also removed their achievements. TF2, Dota 2, CS2, Left 4 Dead 2 and Portal 2 need Local Sign-in.',
      },
      {
        id: 'noAchievements',
        question: 'Why does a game show no achievements or statistics?',
        answer:
          "Either the game doesn't have any, or your game details are set to private in your Steam privacy settings.",
        href: STEAM_PRIVACY_SETTINGS_URL,
      },
      {
        id: 'trackingSites',
        question: 'Do unlocked achievements count on tracking sites?',
        answer:
          'Yes. They count toward your completion on Steam and on sites that track Steam achievements.',
      },
      {
        id: 'notOwned',
        question: "Can I unlock achievements for games I don't own?",
        answer: 'No. The game must be in your library.',
      },
      {
        id: 'unlockOrder',
        question: 'Can I unlock achievements in a specific order?',
        answer:
          'Yes. The Achievement Unlocker goes from most to least common by default, and you can set a custom order and delays for each game.',
        href: `${DOCS_URL}/features/achievement-unlocker/custom-order-and-unlock-delay`,
      },
      {
        id: 'lockEarned',
        question: "Can I lock achievements I've already earned?",
        answer:
          'Yes. Locking one removes it from your profile, which is useful if you want to earn it again.',
      },
    ],
  },
  {
    id: 'subscription',
    title: 'Subscription',
    items: [
      {
        id: 'subscriptionNotActivated',
        question: 'I purchased PRO but my subscription is not activated?',
        answer:
          'After checking out, you will receive an email containing your license key. Open the app, go to Settings → Subscription, paste your license key into the input field, and click Activate. If you are still experiencing issues, contact us via the help desk at the top-right of the app or at contact@steamgameidler.com.',
      },
      {
        id: 'transferDevice',
        question: 'How do I transfer my license key to a new device?',
        answer:
          'Your license key is tied to one device at a time. To transfer it, open the app on your new device, go to Settings → Subscription, enter your license key, and click Activate. A prompt will ask you to confirm the transfer. Once confirmed, your new device is active and the previous device loses access on its next launch. If you reinstalled the app on the same machine, no transfer is needed — your device is recognised by its hardware ID.',
      },
      {
        id: 'cancel',
        question: 'How do I cancel my subscription?',
        answer:
          'Go to Settings → Subscription → Manage Subscription, and follow the cancellation prompts. After cancellation, you will retain access to PRO benefits until the end of your current billing period.',
      },
      {
        id: 'switchTier',
        question: 'Can I switch between tiers?',
        answer:
          'Yes. Cancel your current subscription then re-subscribe to your desired tier following the standard subscription process.',
      },
      {
        id: 'invoices',
        question: 'Where can I find invoices and receipts?',
        answer:
          "You'll receive an email receipt after subscribing. For full billing history, go to Settings → Subscription → Manage Subscription.",
      },
      {
        id: 'refund',
        question: 'What is the refund policy?',
        answer:
          'PRO subscriptions are treated as donations and are generally non-refundable. Refunds are considered on a case-by-case basis. Contact us via the help desk at the top-right of the app or at contact@steamgameidler.com.',
      },
      {
        id: 'chargeback',
        question: 'What happens if I file a chargeback?',
        answer:
          'Fraudulent chargebacks significantly impact this small independent project. Filing one without prior communication may result in your access to this app being permanently revoked. If there was a billing error, we are always happy to work with you to get it sorted as fast as possible, so please contact us via the help desk at the top-right of the app or at contact@steamgameidler.com.',
      },
    ],
  },
  {
    id: 'errors',
    title: 'Error messages',
    items: [
      {
        id: 'steamNotFound',
        question: "Couldn't find a local Steam installation.",
        answer:
          "This only affects Local Sign-in. Install the Steam client, then sign in to at least one account. If it's already installed, try reinstalling it in its default location, or use Steam Sign-in, which doesn't need the client.",
      },
      {
        id: 'sessionFailed',
        question: "Couldn't sign in to Steam Community. Check your cookies and try again.",
        answer:
          "Your saved cookies are wrong or incomplete. Add them again in Settings → Steam Credentials. If Family View is enabled, you'll also need the steamParental cookie, and some accounts need steamMachineAuth.",
        href: `${DOCS_URL}/steam-credentials`,
      },
      {
        id: 'sessionExpired',
        question: 'Your Steam Community session has expired. Please reconnect to continue.',
        answer:
          'Steam Community cookies expire from time to time. Add new ones in Settings → Steam Credentials.',
        href: `${DOCS_URL}/steam-credentials`,
      },
      {
        id: 'familyView',
        question:
          'Family View is enabled on your Steam account. Disable Family View and try again.',
        answer:
          "Automatic cookie retrieval doesn't work with Family View enabled. Disable it, or add your cookies by hand in Settings → Steam Credentials, including steamParental.",
        href: `${DOCS_URL}/steam-credentials`,
      },
      {
        id: 'priceCooldown',
        question: 'Please wait 5 seconds before fetching more item prices',
        answer:
          'Steam limits how often prices can be fetched, so the app waits 5 seconds between manual lookups to avoid hitting that limit.',
      },
      {
        id: 'priceRateLimit',
        question: 'Steam is rate-limiting price lookups right now. Please try again in a moment.',
        answer:
          "Steam's limit was reached. Wait anywhere from a few minutes to an hour, then try again. Increasing the sell delay in Settings → Inventory Manager makes this less likely.",
        href: `${DOCS_URL}/settings/inventory-manager`,
      },
    ],
  },
]
