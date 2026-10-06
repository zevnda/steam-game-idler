// Landing-page FAQ - the most common pre-download questions, ordered and phrased after the real
// Search Console queries that land on this page (see seo-brief.md). The full list lives at
// /docs/faq. Also the single source for the page's FAQPage JSON-LD (layout.tsx), so the markup can
// never drift from what's actually shown.
export const FAQ = [
  {
    question: 'What is a Steam idler?',
    answer:
      "A Steam idler makes Steam think you're playing a game without you actually playing it. That earns the game's trading card drops and adds hours to your playtime. Steam Game Idler idles up to 32 games at once, and adds achievement tools, inventory selling and free-game claiming on top.",
  },
  {
    question: 'Is Steam Game Idler safe? Can I get banned?',
    answer:
      "Steam Game Idler is legitimate software, and tools like it have been around for more than 10 years. Historically, Steam hasn't banned accounts just for using them. SGI talks to Steam through the official Steam API and SDK, the same way many games do, and its full source code is public on GitHub. As with any third-party tool, use it at your own discretion.",
  },
  {
    question: 'Is Steam Game Idler free?',
    answer:
      'Yes. The app and every core feature, including card farming, the achievement tools and the playtime booster, are free. An optional Pro subscription adds a few extras for people who want to support development.',
  },
  {
    question: 'Do I need to give SGI my username or password?',
    answer:
      'Only if you choose "Steam Sign-in", the recommended method. Your credentials go directly to Steam\'s own servers, the same as signing in through the official Steam client, and SGI never sees or stores your password. You can also scan a QR code with the Steam mobile app instead. If you\'d rather not sign in through SGI at all, use "Legacy Sign-in" on Windows, which uses the account already signed in to your running Steam client.',
  },
  {
    question: 'Do I need the Steam client installed?',
    answer:
      'Not with "Steam Sign-in", the recommended method: you sign in with your Steam username and password or a QR code, and no local Steam client is needed. "Legacy Sign-in" is the Windows-only fallback for anyone who\'d rather not enter Steam credentials into SGI. It requires the Steam client to be installed, running and already signed in.',
  },
  {
    question: 'How does SGI farm trading cards?',
    answer:
      'SGI runs each game in a lightweight idle process that Steam recognizes as a running game. Cards drop at the same rate as they would during normal play. It works through every game in your library that still has drops, up to 32 at a time. Sell the cards on the Community Market, or craft them into badges to level up your Steam profile.',
  },
  {
    question: 'Can SGI farm Steam hours?',
    answer:
      'Yes. The Playtime Booster idles up to 32 games at once, the most Steam allows. Each one adds hours to your playtime just as if you were playing it. The Automatic Idler can also start your chosen games every time SGI launches.',
  },
  {
    question: 'How is SGI different from Idle Master, ArchiSteamFarm or SAM?',
    answer:
      'Idle Master focuses on card farming and Steam Achievement Manager on achievements, and neither is actively developed anymore. ArchiSteamFarm covers a lot, but you set it up through configuration files. SGI puts card farming, achievements, playtime, inventory selling and free games in one actively maintained desktop app that you set up by signing in.',
  },
  {
    question: 'Which operating systems are supported?',
    answer:
      'Windows 10 and 11 (installer or portable zip) and Linux (.deb, .rpm or AppImage). Steam Sign-in works on both. Legacy Sign-in is Windows-only.',
  },
  {
    question: 'How does SGI unlock achievements for games?',
    answer:
      "SGI uses the official Steamworks SDK to update a game's achievement states. This is the same method lots of legitimate games use internally to manage their own achievements.",
  },
  {
    question: "Can I lock achievements I've already earned?",
    answer:
      'Yes. You can lock any achievement you own, removing it from your profile. This is useful if you want to replay a game for the experience of earning those achievements again.',
  },
]
