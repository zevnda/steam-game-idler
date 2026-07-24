export interface ComparisonFeatureRow {
  name: string
  steamGameIdler: boolean | string
  alt: boolean | string
}

export interface ComparisonCategory {
  category: string
  features: ComparisonFeatureRow[]
}

export interface WhyChooseCard {
  icon: string
  title: string
  description: string
}

export interface Competitor {
  slug: string
  name: string
  shortTagline: string
  badgeLabel: string
  accentClassName: string
  accentBorderClassName: string
  accentBgClassName: string
  accentTextClassName: string
  gradientFrom: string
  gradientTo: string
  // Glow treatment for the "Steam Game Idler" comparison-table header column, mirroring /pro's
  // ComparisonTable "Gamer" tier glow (dark saturated gradient + colored box-shadow bloom) - kept
  // per-competitor so each page's glow matches its own accent hue instead of one fixed color.
  headerGlowGradient: string
  headerGlowShadow: string
  headerGlowTextColor: string
  // Subtle persistent tint carried down every row's "Steam Game Idler" column, mirroring /pro's
  // Gamer column background - makes the highlighted column read as one continuous lane rather
  // than just a highlighted header. Check icons/values in that column use headerGlowTextColor.
  rowTintGradient: string
  intro: string
  comparisonData: ComparisonCategory[]
  narrativeHeading: string
  narrativeParagraphs: string[]
  whyChooseCards: WhyChooseCard[]
  whyChooseSummary: string
  ctaDescription: string
}

// Canonical "SGI vs competitor" feature data - the single source of truth for each competitor's
// detailed comparison table (rendered on its own /alternatives/[slug] page) and, for the handful
// of features that overlap across all three, the home page's condensed 4-tool ComparisonSection.
// Previously each alternatives page hand-duplicated its own `comparisonData` array independently -
// this consolidates them so a feature addition/change only needs updating in one place.
export const COMPETITORS: Record<string, Competitor> = {
  'archisteamfarm': {
    slug: 'archisteamfarm',
    name: 'ArchiSteamFarm',
    shortTagline: 'ARCHISTEAMFARM',
    badgeLabel: 'Detailed Comparison',
    accentClassName: 'text-blue-300',
    accentBorderClassName: 'border-blue-500/30',
    accentBgClassName: 'bg-blue-500/10',
    accentTextClassName: 'text-blue-400',
    gradientFrom: '#60a5fa',
    gradientTo: '#a855f7',
    headerGlowGradient: 'linear-gradient(180deg, #1e3a8a 0%, #4c1d95 100%)',
    headerGlowShadow: '0 0 24px 6px rgba(96, 165, 250, 0.25)',
    headerGlowTextColor: '#bfdbfe',
    rowTintGradient: 'linear-gradient(180deg, rgba(96,165,250,0.12), rgba(168,85,247,0.06))',
    intro:
      'Compare core features, usability, and capabilities of Steam Game Idler against ArchiSteamFarm to make an informed choice for your Steam automation needs.',
    comparisonData: [
      {
        category: 'Core Features',
        features: [
          { name: 'No Local Steam Client Required', steamGameIdler: true, alt: true },
          { name: 'Multiple Account Support', steamGameIdler: true, alt: true },
          { name: 'QR Code Sign-In', steamGameIdler: true, alt: false },
          { name: 'Automated Card Farming', steamGameIdler: true, alt: true },
          { name: 'Simultaneous Account Farming', steamGameIdler: true, alt: true },
          { name: 'Custom Queue Order', steamGameIdler: true, alt: false },
          { name: 'Achievement Manager', steamGameIdler: true, alt: 'Plugin required' },
          { name: 'Automated Achievement Unlocker', steamGameIdler: true, alt: false },
          { name: 'Inventory Manager', steamGameIdler: true, alt: false },
          { name: 'Playtime Boosting', steamGameIdler: true, alt: true },
          { name: 'Marketplace Integration', steamGameIdler: true, alt: false },
          { name: 'Automatic Free Game Claiming', steamGameIdler: true, alt: 'Plugin required' },
          { name: 'Favorites / Quick Access List', steamGameIdler: true, alt: false },
          { name: 'Native Notifications', steamGameIdler: true, alt: false },
        ],
      },
      {
        category: 'Technical',
        features: [
          {
            name: 'Graphical User Interface',
            steamGameIdler: 'Native',
            alt: 'Additional Setup Required',
          },
          { name: 'Setup Complexity', steamGameIdler: 'Simple', alt: 'Complex' },
          { name: 'Settings Configuration', steamGameIdler: 'Simple', alt: 'Complex' },
          {
            name: 'Settings Configuration Method',
            steamGameIdler: 'GUI-based',
            alt: 'JSON Files',
          },
          { name: 'Resource Usage', steamGameIdler: 'Moderate', alt: 'Low' },
          {
            name: 'Platform Support',
            steamGameIdler: 'Windows / Linux',
            alt: 'Windows / Linux / MacOS',
          },
          { name: 'Updates', steamGameIdler: 'Automatic', alt: 'Automatic' },
        ],
      },
    ],
    narrativeHeading: 'How does Steam Game Idler compare to ArchiSteamFarm?',
    narrativeParagraphs: [
      "ArchiSteamFarm is a capable tool, but it's designed around a command-line workflow. Setup involves editing JSON configuration files, and running it typically means keeping a terminal open or hosting it on a server. It's well suited to users comfortable with that kind of setup, particularly those managing more than one Steam account.",
      "Steam Game Idler takes a different approach: a native desktop app with a visual interface, no configuration files, and no command line. You sign in with Steam and start farming within minutes. It also covers things ArchiSteamFarm doesn't — achievement management, inventory selling, and playtime boosting — so you don't need separate tools for each task.",
      'If you want something you can open, use, and close without managing config files or a terminal, Steam Game Idler is worth trying.',
    ],
    whyChooseCards: [
      {
        icon: 'TbUsers',
        title: 'User-Friendly',
        description: 'No complex configuration files or command line knowledge required',
      },
      {
        icon: 'TbCards',
        title: 'All-in-One',
        description: 'Card farming, achievements, and playtime boosting in one app',
      },
      {
        icon: 'TbShield',
        title: 'Secure',
        description: 'Public source code with transparent security practices',
      },
    ],
    whyChooseSummary:
      'While ArchiSteamFarm excels for users managing multiple accounts, Steam Game Idler provides a more accessible and feature-rich experience for individual users who want comprehensive Steam automation without the complexity.',
    ctaDescription:
      'Experience the simplicity and power of Steam Game Idler. Download now and start automating your Steam experience.',
  },
  'idle-master': {
    slug: 'idle-master',
    name: 'Idle Master',
    shortTagline: 'IDLE MASTER',
    badgeLabel: 'Detailed Comparison',
    accentClassName: 'text-orange-300',
    accentBorderClassName: 'border-orange-500/30',
    accentBgClassName: 'bg-orange-500/10',
    accentTextClassName: 'text-orange-400',
    gradientFrom: '#fb923c',
    gradientTo: '#f87171',
    headerGlowGradient: 'linear-gradient(180deg, #7c2d12 0%, #7f1d1d 100%)',
    headerGlowShadow: '0 0 24px 6px rgba(251, 146, 60, 0.25)',
    headerGlowTextColor: '#fed7aa',
    rowTintGradient: 'linear-gradient(180deg, rgba(251,146,60,0.12), rgba(248,113,113,0.06))',
    intro:
      'Compare core features, usability, and capabilities of Steam Game Idler against Idle Master to make an informed choice for your Steam automation needs.',
    comparisonData: [
      {
        category: 'Core Features',
        features: [
          { name: 'No Local Steam Client Required', steamGameIdler: true, alt: false },
          { name: 'Multiple Account Support', steamGameIdler: true, alt: false },
          { name: 'Automated Card Farming', steamGameIdler: true, alt: true },
          { name: 'Simultaneous Account Farming', steamGameIdler: true, alt: false },
          { name: 'Custom Queue Order', steamGameIdler: true, alt: false },
          { name: 'Blacklist Games From Farming', steamGameIdler: true, alt: true },
          { name: 'Achievement Manager', steamGameIdler: true, alt: false },
          { name: 'Automated Achievement Unlocker', steamGameIdler: true, alt: false },
          { name: 'Inventory Manager', steamGameIdler: true, alt: false },
          { name: 'Playtime Boosting', steamGameIdler: true, alt: true },
          { name: 'Marketplace Integration', steamGameIdler: true, alt: false },
          { name: 'Automatic Free Game Claiming', steamGameIdler: true, alt: false },
        ],
      },
      {
        category: 'Technical',
        features: [
          { name: 'Graphical User Interface', steamGameIdler: 'Native', alt: 'Native' },
          { name: 'Setup Complexity', steamGameIdler: 'Simple', alt: 'Simple' },
          { name: 'Resource Usage', steamGameIdler: 'Moderate', alt: 'Low' },
          { name: 'Platform Support', steamGameIdler: 'Windows / Linux', alt: 'Windows' },
          { name: 'Updates', steamGameIdler: 'Automatic', alt: 'Manual' },
        ],
      },
    ],
    narrativeHeading: 'How does Steam Game Idler compare to Idle Master?',
    narrativeParagraphs: [
      "Idle Master did one thing well: it ran your games in the background to trigger Steam card drops. For a long time it was the go-to tool for that, and it worked. However, it hasn't seen active development for a number of years, and its feature set was always limited to card farming alone — no achievements, no inventory tools, no playtime management.",
      "Steam Game Idler covers the same card farming ground with an up-to-date codebase, and extends it significantly. Achievement management, automated unlocking, inventory selling, and playtime boosting are all built in, so there's no need to run multiple tools alongside each other.",
      'If card farming was the main thing you used Idle Master for, Steam Game Idler does the same job and gives you a lot more to work with.',
    ],
    whyChooseCards: [
      {
        icon: 'FiRefreshCw',
        title: 'Active Development',
        description: "Regular updates and new features versus Idle Master's abandoned status",
      },
      {
        icon: 'TbEye',
        title: 'Modern Interface',
        description: 'Beautiful, intuitive design with real-time progress tracking',
      },
      {
        icon: 'TbShield',
        title: 'Enhanced Security',
        description: 'Modern safety practices and a publicly auditable codebase',
      },
    ],
    whyChooseSummary:
      'While Idle Master was revolutionary in its time, Steam Game Idler represents the modern evolution of card farming tools with comprehensive features, active development, and enhanced security.',
    ctaDescription:
      'Experience the next generation of Steam card farming. Download Steam Game Idler and discover what modern automation can do.',
  },
  'steam-achievement-manager': {
    slug: 'steam-achievement-manager',
    name: 'Steam Achievement Manager',
    shortTagline: 'STEAM ACHIEVEMENT MANAGER',
    badgeLabel: 'Detailed Comparison',
    accentClassName: 'text-emerald-300',
    accentBorderClassName: 'border-emerald-500/30',
    accentBgClassName: 'bg-emerald-500/10',
    accentTextClassName: 'text-emerald-400',
    gradientFrom: '#34d399',
    gradientTo: '#10b981',
    headerGlowGradient: 'linear-gradient(180deg, #064e3b 0%, #065f46 100%)',
    headerGlowShadow: '0 0 24px 6px rgba(52, 211, 153, 0.25)',
    headerGlowTextColor: '#a7f3d0',
    rowTintGradient: 'linear-gradient(180deg, rgba(52,211,153,0.12), rgba(16,185,129,0.06))',
    intro:
      'Compare core features, usability, and capabilities of Steam Game Idler against Steam Achievement Manager to make an informed choice for your Steam automation needs.',
    comparisonData: [
      {
        category: 'Core Features',
        features: [
          { name: 'No Local Steam Client Required', steamGameIdler: true, alt: false },
          { name: 'Multiple Account Support', steamGameIdler: true, alt: false },
          { name: 'Automated Card Farming', steamGameIdler: true, alt: false },
          { name: 'Simultaneous Account Farming', steamGameIdler: true, alt: false },
          { name: 'Custom Queue Order', steamGameIdler: true, alt: false },
          { name: 'Achievement Manager', steamGameIdler: true, alt: true },
          { name: 'Bulk Unlock/Lock Achievements', steamGameIdler: true, alt: true },
          { name: 'Statistics Editor', steamGameIdler: true, alt: true },
          { name: 'Automated Achievement Unlocker', steamGameIdler: true, alt: false },
          { name: 'Inventory Manager', steamGameIdler: true, alt: false },
          { name: 'Playtime Boosting', steamGameIdler: true, alt: false },
          { name: 'Marketplace Integration', steamGameIdler: true, alt: false },
          { name: 'Automatic Free Game Claiming', steamGameIdler: true, alt: false },
        ],
      },
      {
        category: 'Technical',
        features: [
          { name: 'Graphical User Interface', steamGameIdler: 'Native', alt: 'Native' },
          { name: 'Setup Complexity', steamGameIdler: 'Simple', alt: 'Simple' },
          { name: 'Resource Usage', steamGameIdler: 'Moderate', alt: 'Low' },
          { name: 'Platform Support', steamGameIdler: 'Windows / Linux', alt: 'Windows' },
          { name: 'Updates', steamGameIdler: 'Automatic', alt: 'Manual' },
        ],
      },
    ],
    narrativeHeading: 'How does Steam Game Idler compare to Steam Achievement Manager?',
    narrativeParagraphs: [
      "Steam Achievement Manager lets you manually unlock and lock achievements for any game you own, you select them and apply the change instantly. It's a useful tool for that specific task, but the approach is entirely manual and the scope stops at achievements.",
      "Steam Game Idler includes a manual achievement manager that works the same way, but also adds an automated achievement unlocker, a separate mode that works through your achievement list on its own, unlocking them gradually over time. By default it follows the order of global unlock percentage, so common achievements unlock first and rarer ones come later, the same pattern you'd see from natural play. You can also set a custom unlock order, configure per-achievement delays, and add an initial wait period before the first unlock — giving you full control over how the progression looks.",
      'On top of that, card farming, inventory selling, and playtime boosting are all built in, so Steam Game Idler covers the whole picture rather than just one part of it.',
    ],
    whyChooseCards: [
      {
        icon: 'TbAward',
        title: 'Automated Unlocker',
        description:
          'Automatically unlocks achievements over time with configurable delays — dripping them in the order real players earn them to mimic natural progression',
      },
      {
        icon: 'TbCards',
        title: 'All-in-One',
        description:
          'Card farming, inventory selling, and playtime boosting alongside full achievement management — no need to run separate tools',
      },
      {
        icon: 'TbTrendingUp',
        title: 'Custom Control',
        description:
          'Set a custom unlock order, per-achievement delays, and an initial wait period — or let the default mode handle everything automatically',
      },
    ],
    whyChooseSummary:
      'Steam Achievement Manager handles achievements manually. Steam Game Idler does the same — and automates it, with timing you control and card farming built in.',
    ctaDescription:
      'Experience the next generation of Steam automation. Download Steam Game Idler and discover what modern achievement management can do.',
  },
}
