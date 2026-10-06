// Landing-page FAQ - the most common pre-download questions. The full list lives at /docs/faq.
export const FAQ = [
  {
    question: 'Do I need a Steam account to use SGI?',
    answer:
      'SGI gives you two ways to sign in. "Steam Sign-in" is the recommended method and needs no local Steam client at all - you sign in with your Steam username/password or a QR code. "Legacy Sign-in" is the fallback for anyone who\'d rather not enter Steam credentials into SGI - it requires the Steam client to be installed, running, and already signed in.',
  },
  {
    question: 'Do I need to give SGI my username or password?',
    answer:
      'Only if you choose "Steam Sign-in", the recommended method - your credentials are sent directly to Steam\'s own servers, the same as signing in through the official Steam client, and SGI never sees or stores your password. If you\'d rather not enter your username/password at all, use "Legacy Sign-in" instead, which reads the account(s) already signed in through a running local Steam client.',
  },
  {
    question: 'What makes SGI different from other tools?',
    answer:
      'Instead of forcing you to manage separate tools for different tasks, SGI combines them into a single, modern desktop app with a clean, user-friendly interface, and no complex configuration files.',
  },
  {
    question: 'Which operating systems are supported?',
    answer: 'SGI runs on Windows (10 and 11) and Linux (via .deb, .rpm, or AppImage).',
  },
  {
    question: 'Are automation tools safe to use?',
    answer:
      'Historically, Steam does not ban accounts simply for using automation tools. SGI uses the official Steam API and SDK like many legitimate games do. Use it at your own discretion.',
  },
  {
    question: 'How does SGI farm trading cards?',
    answer:
      'SGI launches games in a lightweight idle process that Steam recognizes as a running game. Card drops accumulate at the same rate as they would during normal gameplay.',
  },
  {
    question: 'How does SGI unlock achievements for games?',
    answer:
      "SGI uses the official Steamworks SDK to update a game's achievement states. This is the same method lots of legitimate games use internally to manage their own achievements.",
  },
  {
    question: 'How many games can I idle at once?',
    answer:
      'You can idle up to 32 games simultaneously, which is the maximum Steam allows. SGI handles these limits for you, so you can focus on other things.',
  },
  {
    question: "Can I lock achievements I've already earned?",
    answer:
      'Yes. You can lock any achievement you own, removing it from your profile. This is useful if you want to replay a game for the experience of earning those achievements again.',
  },
]
