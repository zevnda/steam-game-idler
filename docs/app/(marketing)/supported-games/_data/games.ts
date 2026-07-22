export interface GameFaq {
  question: string
  answer: string
}

export interface GameHighlight {
  title: string
  description: string
}

export interface GameData {
  slug: string
  name: string
  genre: string
  developer: string
  tagline: string
  summary: string[]
  highlights: GameHighlight[]
  // Valve's Game Coordinator titles - per src-tauri, these aren't reachable via the SteamKit2
  // daemon (agent mode) at all, only via a real local Steam client (CLI/"Legacy Sign In" mode).
  // Worth calling out on these pages since it's a genuine, user-relevant capability difference.
  gcTitle?: boolean
  // Tri-state: `true` for games confirmed to have a Steam trading card badge, `false` for the
  // three Valve titles confirmed to have none (CS2/Dota 2/TF2), `undefined` for games where card
  // availability has shifted (e.g. a free-to-play transition) and should read as "varies" rather
  // than a flat yes/no we can't stand behind.
  hasCards?: boolean
  // `false` for the handful of games confirmed to have no Steam achievement list at all (CS2,
  // Dota 2, Garry's Mod, Valheim) - everything else defaults to having one.
  hasAchievements?: boolean
  faqs: GameFaq[]
}

export const GAMES: GameData[] = [
  {
    slug: 'counter-strike-2',
    name: 'Counter-Strike 2',
    genre: 'Tactical Shooter',
    developer: 'Valve',
    tagline: 'Idle CS2 for its weekly playtime-gated item drops',
    summary: [
      "Counter-Strike 2 doesn't use the standard Steam trading card system, so idling it works a little differently than most games on this list. Instead, Valve gates a handful of free weapon case drops behind weekly playtime - once you've played (or idled) enough in a given week, the drop is queued up automatically.",
      "Steam Game Idler tracks CS2's playtime requirement in the background so you don't have to leave the game window open and focused to make progress toward it.",
    ],
    highlights: [
      {
        title: 'Weekly Drop Tracking',
        description:
          "Idle toward CS2's weekly item drop threshold without keeping the game in focus.",
      },
      {
        title: 'Runs Alongside Other Games',
        description:
          'Queue CS2 in a multi-game idling session instead of dedicating a whole session to it.',
      },
      {
        title: 'No Manual Babysitting',
        description:
          'Set it going and check back later - no need to alt-tab into CS2 periodically.',
      },
    ],
    gcTitle: true,
    hasCards: false,
    hasAchievements: false,
    faqs: [
      {
        question: 'Does idling CS2 give you trading cards?',
        answer:
          "No - Counter-Strike 2 has never had a Steam trading card badge. What idling does give you is progress toward Valve's weekly playtime-gated case drop.",
      },
      {
        question: 'Can I idle CS2 while signed in with Agent Mode?',
        answer:
          "Not currently. CS2 is one of a handful of Valve Game Coordinator titles that only work through Steam Game Idler's Legacy Sign In (CLI) method, which needs a real Steam client running locally. Agent Mode can't reach CS2's Game Coordinator.",
      },
      {
        question: 'Are there Steam achievements for CS2?',
        answer:
          "No, Counter-Strike 2 doesn't expose a Steam achievement list, so Achievement Manager and Achievement Unlocker won't show anything for it - idling for the weekly drop is the main benefit here.",
      },
    ],
  },
  {
    slug: 'dota-2',
    name: 'Dota 2',
    genre: 'MOBA',
    developer: 'Valve',
    tagline: 'Idle Dota 2 for playtime - no cards, no achievements, just time',
    summary: [
      "Dota 2 is another Valve title without a Steam trading card badge or a Steam achievement list - its reward loop runs through its own in-client Battle Pass and seasonal events instead. That said, plenty of players still idle Dota 2 for straightforward playtime tracking or to keep the app 'active' on Steam friends/status without actually queuing into a match.",
      'Steam Game Idler treats Dota 2 the same as any other title in a multi-game idling session, so it can sit in the background alongside games that do earn cards or achievements.',
    ],
    highlights: [
      {
        title: 'Passive Playtime',
        description: 'Rack up recorded Steam playtime for Dota 2 without a match actually running.',
      },
      {
        title: 'Multi-Game Sessions',
        description: 'Idle Dota 2 alongside other games in your library in the same session.',
      },
      {
        title: 'Lightweight Background Process',
        description:
          "Runs with minimal resource usage so it never competes with what you're actively playing.",
      },
    ],
    gcTitle: true,
    hasCards: false,
    hasAchievements: false,
    faqs: [
      {
        question: 'Does Dota 2 have Steam trading cards?',
        answer:
          'No. Dota 2 has never issued Steam trading cards - its cosmetic and reward economy is entirely separate from the standard Steam badge system.',
      },
      {
        question: 'Why would I idle a game with no cards or achievements?',
        answer:
          'Mainly for recorded playtime - useful if you track your Steam stats, or if you just want Dota 2 to show as running without committing to a full match.',
      },
      {
        question: 'Does Dota 2 work with Agent Mode sign-in?',
        answer:
          "No - Dota 2 is a Game Coordinator title, so idling it requires Steam Game Idler's Legacy Sign In (CLI) method with a real local Steam client, not Agent Mode.",
      },
    ],
  },
  {
    slug: 'team-fortress-2',
    name: 'Team Fortress 2',
    genre: 'Class-Based Shooter',
    developer: 'Valve',
    tagline: "Unlock TF2's huge class-specific achievement list while you idle",
    summary: [
      "Team Fortress 2 has one of the largest achievement lists on Steam - hundreds of them, many tied to a specific class or weapon. Unlike most Valve multiplayer titles, TF2's achievements are genuinely trackable through Steam, which makes it a good fit for Steam Game Idler's Achievement Manager.",
      "TF2 doesn't have a Steam trading card badge, so idling here is mostly about achievement visibility and playtime rather than card farming.",
    ],
    highlights: [
      {
        title: 'Achievement Manager',
        description: "Browse and track TF2's full class-by-class achievement list from one screen.",
      },
      {
        title: 'Achievement Unlocker',
        description: 'Automatically work through eligible achievements with human-like timing.',
      },
      {
        title: 'Idle Toward Playtime Milestones',
        description:
          'Some TF2 achievements are gated behind cumulative playtime - idling counts toward them.',
      },
    ],
    gcTitle: true,
    hasCards: false,
    faqs: [
      {
        question: 'How many achievements does TF2 have?',
        answer:
          "TF2's achievement list runs into the hundreds, split across each class plus general and event-specific achievements - one of the largest achievement sets on Steam.",
      },
      {
        question: 'Does TF2 have trading cards?',
        answer:
          "No - TF2 predates the Steam trading card system and was never retrofitted with a badge, so Card Farming won't apply here.",
      },
      {
        question: 'Why does TF2 need Legacy Sign In instead of Agent Mode?',
        answer:
          'TF2 is a Game Coordinator title. Its achievement and item systems only respond to requests routed through a real local Steam client, which is what Legacy Sign In (CLI mode) provides.',
      },
    ],
  },
  {
    slug: 'pubg-battlegrounds',
    name: 'PUBG: Battlegrounds',
    genre: 'Battle Royale',
    developer: 'KRAFTON',
    tagline: 'Idle PUBG toward its Steam trading card badge and achievement list',
    summary: [
      "PUBG went free-to-play in 2022 but kept its Steam trading card badge and achievement list intact, making it a straightforward game to idle if you're chasing a completed badge or want its achievements ticked off without grinding matches.",
      'Since PUBG is a large, resource-heavy game when actually launched, idling it through Steam Game Idler is a lighter way to keep progress moving without the game genuinely running in the foreground.',
    ],
    highlights: [
      {
        title: 'Card Farming',
        description:
          "Collect PUBG's trading card drops in the background instead of leaving matches running.",
      },
      {
        title: 'Low Resource Usage',
        description: 'Idling avoids the overhead of a full PUBG match session.',
      },
      {
        title: 'Achievement Tracking',
        description:
          "View which of PUBG's achievements you're missing and unlock the eligible ones.",
      },
    ],
    hasCards: true,
    faqs: [
      {
        question: "Is PUBG free to idle for cards even though it's free-to-play?",
        answer:
          "Yes - PUBG's trading card badge survived its transition to free-to-play, so idling it for cards still works the same as with a paid title.",
      },
      {
        question: 'Do I need PUBG installed to idle it?',
        answer:
          "With Legacy Sign In (CLI mode) you need a local Steam client running with the game in your library, though it doesn't need to actually launch. Agent Mode idling doesn't require a local install at all.",
      },
      {
        question: 'Will idling PUBG affect my in-game stats or ban status?',
        answer:
          "Idling only registers playtime with Steam - it doesn't launch matchmaking or touch gameplay stats, so it carries the same standing as any other Steam idling activity.",
      },
    ],
  },
  {
    slug: 'grand-theft-auto-v',
    name: 'Grand Theft Auto V',
    genre: 'Open-World Action',
    developer: 'Rockstar Games',
    tagline: "Farm GTA V's trading cards and chip away at its achievement list",
    summary: [
      'GTA V has stayed one of the most-played games on Steam for over a decade, and it carries a full Steam trading card badge alongside a long list of story-mode and GTA Online achievements. A lot of that achievement list is playtime- or milestone-gated, which makes idling a reasonable way to make background progress.',
      "Steam Game Idler lets you idle GTA V for card drops without launching Rockstar's own launcher overhead every time, and lets you queue the achievement unlocker for anything genuinely eligible without manual intervention.",
    ],
    highlights: [
      {
        title: 'Card Farming',
        description: "Work through GTA V's trading card set passively in the background.",
      },
      {
        title: 'Achievement Manager',
        description: "See your current GTA V completion percentage and what's left to unlock.",
      },
      {
        title: 'Favorites',
        description:
          'Pin GTA V to your favorites list for one-click access on your next idling session.',
      },
    ],
    hasCards: true,
    faqs: [
      {
        question: 'Does idling GTA V affect GTA Online progress?',
        answer:
          "No - idling only registers Steam playtime and card drop eligibility. It doesn't launch GTA Online or interact with Rockstar's own servers or progression systems.",
      },
      {
        question: 'How many trading cards does GTA V have?',
        answer:
          "GTA V has a full badge-eligible trading card set - exact counts can shift with Steam's own configuration, but Card Farming will show your live progress once you start idling.",
      },
      {
        question: 'Can I idle GTA V and other games at the same time?',
        answer:
          "Yes - GTA V isn't a Game Coordinator title, so it idles the same as any other game and can run alongside up to 32 other games in a single session.",
      },
    ],
  },
  {
    slug: 'rust',
    name: 'Rust',
    genre: 'Survival',
    developer: 'Facepunch Studios',
    tagline: 'Idle Rust for card drops without surviving a single wipe',
    summary: [
      "Rust's brutal early-game survival loop is exactly the kind of thing people don't want running unattended - which makes it a good candidate for idling instead of playing when all you actually want is the trading card drops and playtime.",
      'Rust also has a modest Steam achievement list tied to specific survival milestones, most of which are better suited to actual play, but idling still contributes toward the playtime some of them require.',
    ],
    highlights: [
      {
        title: 'Card Farming',
        description:
          "Collect Rust's trading cards without exposing a character to an active server.",
      },
      {
        title: 'Auto-Idle',
        description:
          'Schedule Rust idling sessions automatically instead of remembering to start them manually.',
      },
      {
        title: 'Idle Multiple Accounts',
        description:
          'Agent Mode supports idling Rust across several Steam accounts at once, tier limits permitting.',
      },
    ],
    hasCards: true,
    faqs: [
      {
        question: 'Do I need to be on a Rust server to idle it?',
        answer:
          "No - idling just registers Steam playtime and card eligibility. It doesn't connect to a Rust server or put a character into the world.",
      },
      {
        question: 'Is idling Rust against its rules?',
        answer:
          "Idling only interacts with Steam's own playtime and card systems, the same as idling any other game - it doesn't touch Rust's server-side anti-cheat or game state.",
      },
      {
        question: 'Does Rust support Agent Mode idling?',
        answer:
          "Yes - Rust isn't a Game Coordinator title, so it works through both Agent Mode and Legacy Sign In (CLI) without restriction.",
      },
    ],
  },
  {
    slug: 'garrys-mod',
    name: "Garry's Mod",
    genre: 'Sandbox',
    developer: 'Facepunch Studios',
    tagline: "Idle Garry's Mod for its Steam trading card badge",
    summary: [
      "Garry's Mod has no real end-state - it's a sandbox, not a game with a campaign to finish - so most of what's worth automating is its Steam trading card badge rather than achievements (it doesn't have a Steam achievement list at all).",
      "Steam Game Idler idles Garry's Mod the same as any other card-eligible title: no need to load into a server or spawn a single prop to make progress toward the badge.",
    ],
    highlights: [
      {
        title: 'Card Farming',
        description: "Collect Garry's Mod's trading cards passively without joining a server.",
      },
      {
        title: 'Lightweight Idling',
        description: 'No need to load Source engine maps or addons just to accrue playtime.',
      },
      {
        title: 'Favorites & Auto-Idle',
        description:
          "Keep Garry's Mod in a recurring idling rotation without manually restarting it.",
      },
    ],
    hasCards: true,
    hasAchievements: false,
    faqs: [
      {
        question: "Does Garry's Mod have Steam achievements?",
        answer:
          "No - Garry's Mod has never had a Steam achievement list, so Card Farming and idling for playtime are the main things worth automating for it.",
      },
      {
        question: "Do I need addons installed to idle Garry's Mod?",
        answer:
          "No - idling doesn't load the game's content at all, addons included. It only needs the game to appear in your Steam library.",
      },
      {
        question: "Can I idle Garry's Mod alongside other Source engine games?",
        answer:
          "Yes - there's no restriction on running it in the same multi-game idling session as other titles, Source-engine or otherwise.",
      },
    ],
  },
  {
    slug: 'left-4-dead-2',
    name: 'Left 4 Dead 2',
    genre: 'Co-op Shooter',
    developer: 'Valve',
    tagline: 'Idle L4D2 for its trading cards and work through its achievement list',
    summary: [
      'Left 4 Dead 2 carries both a Steam trading card badge and a real achievement list (including some genuinely difficult campaign-completion ones), which makes it a solid fit for idling toward the easier playtime-based unlocks while you decide whether to tackle the harder ones yourself.',
      "Unlike Dota 2, TF2, and CS2, L4D2's Steam-facing systems are reachable a little differently under the hood - it's still a Game Coordinator title, so it needs Legacy Sign In rather than Agent Mode.",
    ],
    highlights: [
      {
        title: 'Card Farming',
        description: "Work through L4D2's card badge in the background.",
      },
      {
        title: 'Achievement Manager',
        description:
          "Track which of L4D2's campaign and general achievements are still outstanding.",
      },
      {
        title: 'Achievement Unlocker',
        description: 'Automatically unlock playtime- and milestone-eligible achievements.',
      },
    ],
    gcTitle: true,
    hasCards: true,
    faqs: [
      {
        question: 'Does Left 4 Dead 2 have trading cards?',
        answer:
          "Yes - L4D2 has a standard Steam trading card badge, unlike some of Valve's other multiplayer titles.",
      },
      {
        question: 'Why does L4D2 need Legacy Sign In?',
        answer:
          "L4D2 is one of Valve's Game Coordinator titles, so its achievement and idling data only respond to requests from a real local Steam client - that's what Legacy Sign In (CLI mode) provides.",
      },
      {
        question: 'Can Achievement Unlocker complete every L4D2 achievement automatically?',
        answer:
          'It can unlock the ones that are genuinely playtime- or stat-gated. Achievements tied to specific in-match actions still need to be earned by actually playing.',
      },
    ],
  },
  {
    slug: 'portal-2',
    name: 'Portal 2',
    genre: 'Puzzle-Platformer',
    developer: 'Valve',
    tagline: 'Idle Portal 2 for its trading cards while you work through its puzzles',
    summary: [
      "Portal 2's achievement list is mostly tied to specific puzzle solutions and co-op moments, so it's better suited to actually playing than idling - but its Steam trading card badge is exactly the kind of thing worth farming passively in the background.",
      'Like TF2, Dota 2, CS2, and L4D2, Portal 2 is a Game Coordinator title, so idling it requires Legacy Sign In (CLI mode) with a real local Steam client rather than Agent Mode.',
    ],
    highlights: [
      {
        title: 'Card Farming',
        description:
          "Collect Portal 2's trading cards without needing to solve a single test chamber.",
      },
      {
        title: 'Achievement Manager',
        description:
          'Check your current Portal 2 completion status across single-player and co-op.',
      },
      {
        title: 'Idle Alongside Other Games',
        description: 'Run Portal 2 in a queued multi-game idling session.',
      },
    ],
    gcTitle: true,
    hasCards: true,
    faqs: [
      {
        question: 'Does Portal 2 have a trading card badge?',
        answer: 'Yes - Portal 2 has a standard Steam trading card badge available to farm.',
      },
      {
        question: 'Can I unlock co-op achievements just by idling?',
        answer:
          "No - Portal 2's co-op achievements require an actual co-op session with a real partner. Idling only helps with playtime- or stat-based unlocks.",
      },
      {
        question: 'Why is Portal 2 grouped with CS2 and TF2 as a special case?',
        answer:
          'All five (CS2, Dota 2, TF2, L4D2, Portal 2) are Valve Game Coordinator titles, meaning they need a real local Steam client (Legacy Sign In) rather than Agent Mode to idle.',
      },
    ],
  },
  {
    slug: 'terraria',
    name: 'Terraria',
    genre: '2D Sandbox Survival',
    developer: 'Re-Logic',
    tagline: 'Idle Terraria for its trading cards and huge achievement list',
    summary: [
      "Terraria has one of the largest achievement lists in its genre - well over 500 - covering everything from boss kills to item collection. Most of those genuinely require playing, but Terraria also has a full Steam trading card badge that's a natural fit for background idling.",
      'Steam Game Idler idles Terraria the same way it idles any card-eligible title: no world needs to be loaded, and no character needs to exist.',
    ],
    highlights: [
      {
        title: 'Card Farming',
        description: "Collect Terraria's trading cards without loading into a world.",
      },
      {
        title: 'Achievement Manager',
        description: "Browse Terraria's full achievement list and see exactly what's left.",
      },
      {
        title: 'Auto-Idle Scheduling',
        description:
          'Set Terraria to idle on a recurring schedule instead of starting it manually each time.',
      },
    ],
    hasCards: true,
    faqs: [
      {
        question: 'How many achievements does Terraria have?',
        answer:
          "Terraria's achievement list runs past 500, covering boss fights, item collection, and world milestones - most require actual play, though a few are progress-tracking based.",
      },
      {
        question: 'Do I need a Terraria world save to idle it?',
        answer: "No - idling for cards or playtime doesn't require loading a save file at all.",
      },
      {
        question: 'Does Terraria support multi-account idling?',
        answer:
          'Yes - Terraria has no Game Coordinator restrictions, so it works fine across multiple Agent Mode accounts.',
      },
    ],
  },
  {
    slug: 'stardew-valley',
    name: 'Stardew Valley',
    genre: 'Farming Simulation',
    developer: 'ConcernedApe',
    tagline: 'Idle Stardew Valley for its trading cards and full achievement set',
    summary: [
      'Stardew Valley ships with 40 Steam achievements and a full trading card badge - a manageable, well-defined set that makes it a favorite for people working through their Steam completion percentage across their whole library.',
      "Since most of Stardew's achievements are tied to actual farm progress (a specific harvest, a completed collection, an in-game relationship milestone), idling mainly helps with card farming and the handful of playtime-adjacent unlocks rather than full completion.",
    ],
    highlights: [
      {
        title: 'Card Farming',
        description: "Collect all of Stardew Valley's trading cards passively.",
      },
      {
        title: 'Achievement Manager',
        description: "Track your progress against Stardew's full 40-achievement list.",
      },
      {
        title: 'Favorites',
        description: 'Keep Stardew Valley one click away for your next idling session.',
      },
    ],
    hasCards: true,
    faqs: [
      {
        question: 'How many achievements does Stardew Valley have?',
        answer:
          'Stardew Valley has 40 Steam achievements, most tied to specific farm and story milestones.',
      },
      {
        question: 'Can idling unlock Stardew Valley achievements for me?',
        answer:
          "Only ones based on stats Steam already tracks passively. Most of Stardew's achievements need an actual save file with real progress - idling is mainly useful here for card farming.",
      },
      {
        question: 'Does Stardew Valley need a local Steam client to idle?',
        answer:
          "No - it isn't a Game Coordinator title, so it works through both Agent Mode and Legacy Sign In.",
      },
    ],
  },
  {
    slug: 'among-us',
    name: 'Among Us',
    genre: 'Social Deduction',
    developer: 'Innersloth',
    tagline: 'Idle Among Us for its trading cards without joining a lobby',
    summary: [
      'Among Us carries a Steam trading card badge and a set of achievements mostly tied to specific in-lobby actions (ejections, tasks, sabotages), which makes it a common one to idle purely for the card drops rather than achievement hunting.',
      'Since Among Us is a lightweight game to begin with, idling it barely registers on system resources - useful if you want it running in a large multi-game idling session without it competing for CPU or memory.',
    ],
    highlights: [
      {
        title: 'Card Farming',
        description: 'Collect Among Us trading cards without needing an active lobby.',
      },
      {
        title: 'Minimal Resource Usage',
        description: 'One of the lightest games to idle in a large multi-game session.',
      },
      {
        title: 'Achievement Manager',
        description: 'See which of the lobby-action achievements you still need to earn manually.',
      },
    ],
    hasCards: true,
    faqs: [
      {
        question: 'Can I earn Among Us achievements just by idling?',
        answer:
          "Most of them need an actual in-lobby action (an ejection, a completed task, a sabotage), so idling won't unlock them - it mainly helps with card farming and playtime.",
      },
      {
        question: 'Does idling Among Us put me in a public lobby?',
        answer:
          'No - idling only registers Steam playtime and card eligibility, it never joins a lobby or matchmaking queue.',
      },
      {
        question: 'How many trading cards does Among Us have?',
        answer:
          'Among Us has a standard-size trading card badge - Card Farming shows your live drop progress once you start idling.',
      },
    ],
  },
  {
    slug: 'valheim',
    name: 'Valheim',
    genre: 'Survival',
    developer: 'Iron Gate AB',
    tagline: 'Idle Valheim for playtime without braving the Black Forest',
    summary: [
      "Valheim doesn't ship a Steam achievement list, so idling it is mostly about Steam-tracked playtime and, if your account has it enabled, trading card progress - rather than unlocking anything achievement-specific.",
      'Since Valheim is a fairly heavy game to actually launch, idling is a much lighter way to keep it "active" on your account without loading a world.',
    ],
    highlights: [
      {
        title: 'Passive Playtime',
        description: 'Build up recorded Valheim playtime without loading into a world.',
      },
      {
        title: 'Card Farming',
        description:
          "Collect Valheim's trading cards, if enabled on your account, without the game actually running.",
      },
      {
        title: 'Multi-Game Idling',
        description: 'Queue Valheim alongside other survival titles in the same idling session.',
      },
    ],
    hasAchievements: false,
    faqs: [
      {
        question: 'Does Valheim have Steam achievements?',
        answer:
          "No - Valheim doesn't currently expose a Steam achievement list, so idling here is mainly about playtime and card progress.",
      },
      {
        question: 'Do I need mods disabled to idle Valheim?',
        answer:
          "Idling doesn't launch the game or load any mods at all - it only interacts with Steam's playtime tracking.",
      },
      {
        question: 'Does Valheim work with Agent Mode?',
        answer:
          "Yes - Valheim isn't a Game Coordinator title, so both Agent Mode and Legacy Sign In work without restriction.",
      },
    ],
  },
  {
    slug: 'sea-of-thieves',
    name: 'Sea of Thieves',
    genre: 'Open-World Adventure',
    developer: 'Rare',
    tagline: 'Idle Sea of Thieves for Steam achievements and playtime',
    summary: [
      "Sea of Thieves has a full Steam achievement list covering voyages, Tall Tales, and reputation milestones, most of which need real in-game progress through Rare's own account systems rather than anything idling can shortcut.",
      'Idling here is mainly useful for Steam-tracked playtime, and for keeping Sea of Thieves in a multi-game idling rotation without launching its full client every time.',
    ],
    highlights: [
      {
        title: 'Passive Playtime',
        description: 'Build up recorded Steam playtime for Sea of Thieves in the background.',
      },
      {
        title: 'Achievement Manager',
        description: 'Track your current Sea of Thieves achievement completion from one screen.',
      },
      {
        title: 'Lighter Than a Full Launch',
        description:
          "Idling avoids booting Rare's full client and account services just to register activity.",
      },
    ],
    faqs: [
      {
        question: 'Can idling unlock Sea of Thieves achievements?',
        answer:
          "Most Sea of Thieves achievements are tied to real voyage and reputation progress tracked through Rare's own systems, so they need to be earned by actually playing.",
      },
      {
        question: 'Does Sea of Thieves need an Xbox/Rare account linked to idle?',
        answer:
          "No - idling only interacts with Steam's own playtime tracking, not Rare's account services.",
      },
      {
        question: 'Is Sea of Thieves a Game Coordinator title?',
        answer:
          'No - it idles the same as any standard Steam game, through either Agent Mode or Legacy Sign In.',
      },
    ],
  },
  {
    slug: 'rocket-league',
    name: 'Rocket League',
    genre: 'Vehicular Soccer',
    developer: 'Psyonix',
    tagline: 'Idle Rocket League for Steam achievements without queuing a match',
    summary: [
      "Rocket League has been free-to-play since 2020 and moved most of its economy to Epic's account system, but it kept a Steam achievement list covering competitive milestones, goals scored, and specific mechanical feats.",
      'Most of those achievements genuinely need match play, so idling Rocket League is mainly about background playtime rather than a shortcut to unlocking everything.',
    ],
    highlights: [
      {
        title: 'Passive Playtime',
        description: 'Register Rocket League playtime without sitting in matchmaking.',
      },
      {
        title: 'Achievement Manager',
        description: 'Check your current Rocket League achievement completion in one place.',
      },
      {
        title: 'Runs in the Background',
        description:
          'Idle Rocket League alongside other games without an active match consuming resources.',
      },
    ],
    faqs: [
      {
        question: 'Does Rocket League still have Steam trading cards?',
        answer:
          "Rocket League's move to free-to-play changed a lot of its reward economy - card availability can vary, so check Card Farming directly to see if your account has drops eligible.",
      },
      {
        question: 'Can idling unlock competitive Rocket League achievements?',
        answer:
          'No - competitive and mechanical achievements need real match play. Idling only contributes background playtime.',
      },
      {
        question: 'Does Rocket League need Epic Games linked to idle through Steam?',
        answer:
          "No - idling only interacts with Steam's playtime tracking, independent of your Epic account link.",
      },
    ],
  },
  {
    slug: 'payday-2',
    name: 'Payday 2',
    genre: 'Co-op Heist Shooter',
    developer: 'Overkill Software',
    tagline: 'Idle Payday 2 for its huge heist-specific achievement list and trading cards',
    summary: [
      "Payday 2 has one of the deepest achievement lists on Steam thanks to years of heist DLC, each with its own set of unlocks - alongside a standard trading card badge that's straightforward to farm passively.",
      'Most Payday 2 achievements are heist-specific and need real runs to earn, but idling is the easy part: card drops and background playtime without loading into a single job.',
    ],
    highlights: [
      {
        title: 'Card Farming',
        description: "Work through Payday 2's trading card badge in the background.",
      },
      {
        title: 'Achievement Manager',
        description: 'Browse achievements across every heist and DLC pack in one list.',
      },
      {
        title: 'Achievement Unlocker',
        description: 'Automatically pick up any achievements that are stat- or playtime-eligible.',
      },
    ],
    hasCards: true,
    faqs: [
      {
        question: 'How many achievements does Payday 2 have?',
        answer:
          "Payday 2's achievement count has grown into the hundreds across its base game and heist DLC packs - Achievement Manager shows the full list for whatever you own.",
      },
      {
        question: 'Can Achievement Unlocker complete heist-specific achievements?',
        answer:
          'It can unlock the ones based on stats Steam already tracks. Achievements tied to a specific heist objective still need to be earned by actually running that heist.',
      },
      {
        question: 'Does Payday 2 support idling multiple DLC heists at once?',
        answer:
          "Idling itself doesn't distinguish between DLC - it just registers playtime and card eligibility for the base app.",
      },
    ],
  },
  {
    slug: 'cyberpunk-2077',
    name: 'Cyberpunk 2077',
    genre: 'Open-World RPG',
    developer: 'CD Projekt Red',
    tagline: 'Idle Cyberpunk 2077 for its trading cards and story-driven achievements',
    summary: [
      "Cyberpunk 2077 has a full Steam trading card badge and a story-driven achievement list covering main quests, side content, and the Phantom Liberty expansion. It's a natural game to idle for card drops while you plan out (or finish) your actual playthrough of Night City.",
      'Since Cyberpunk is a demanding game to actually launch, idling it in the background is a much lighter way to make card progress than leaving a full session running.',
    ],
    highlights: [
      {
        title: 'Card Farming',
        description: "Collect Cyberpunk 2077's trading cards without loading into Night City.",
      },
      {
        title: 'Achievement Manager',
        description: 'Track your completion across the base game and Phantom Liberty.',
      },
      {
        title: 'Lighter Than a Full Launch',
        description: 'Idle for progress without the overhead of actually running the game.',
      },
    ],
    hasCards: true,
    faqs: [
      {
        question: 'Does idling Cyberpunk 2077 spoil story content?',
        answer:
          'No - idling never launches the game or touches your save, it only registers Steam playtime and card eligibility.',
      },
      {
        question: 'Are Phantom Liberty achievements included in Achievement Manager?',
        answer:
          "Yes - if you own the expansion, its achievements appear alongside the base game's in Achievement Manager.",
      },
      {
        question: 'How many trading cards does Cyberpunk 2077 have?',
        answer:
          'Cyberpunk 2077 has a standard-size trading card badge - Card Farming shows your live progress once idling starts.',
      },
    ],
  },
  {
    slug: 'dead-by-daylight',
    name: 'Dead by Daylight',
    genre: 'Asymmetric Horror',
    developer: 'Behaviour Interactive',
    tagline: 'Idle Dead by Daylight for Steam achievements and playtime',
    summary: [
      'Dead by Daylight went free-to-play in 2023, which changed parts of its Steam economy, but it kept a full achievement list covering Killer and Survivor milestones, chapter-specific unlocks, and community events.',
      'Most of those achievements need real trial completions to earn, so idling Dead by Daylight is mainly useful for background playtime and keeping it in a recurring idling rotation.',
    ],
    highlights: [
      {
        title: 'Passive Playtime',
        description: 'Register Dead by Daylight playtime without entering the fog.',
      },
      {
        title: 'Achievement Manager',
        description: 'Track completion across base achievements and chapter-specific DLC.',
      },
      {
        title: 'Auto-Idle Scheduling',
        description:
          'Keep Dead by Daylight idling on a recurring schedule without manual restarts.',
      },
    ],
    faqs: [
      {
        question: 'Does Dead by Daylight still have Steam trading cards after going free-to-play?',
        answer:
          "Card availability can change with a free-to-play transition - check Card Farming directly to confirm what's currently eligible on your account.",
      },
      {
        question: 'Can idling unlock Killer- or Survivor-specific achievements?',
        answer:
          'No - those need real trial completions. Idling only contributes background playtime toward whatever is playtime-gated.',
      },
      {
        question: 'Does Dead by Daylight need a local Steam client to idle?',
        answer:
          "No - it isn't a Game Coordinator title, so it idles through both Agent Mode and Legacy Sign In.",
      },
    ],
  },
]

export function getGameData(slug: string) {
  return GAMES.find(game => game.slug === slug)
}
