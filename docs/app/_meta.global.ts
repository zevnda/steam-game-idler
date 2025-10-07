const GET_STARTED = {
  'install': 'Install',
  'how-to-sign-in': 'Sign In',
  'build-it-yourself': 'Build It Yourself',
}

const FEATURES = {
  'card-farming': 'Card Farming',
  'achievement-unlocker': 'Achievement Unlocker',
  'achievement-manager': 'Achievement Manager',
  'trading-card-manager': 'Trading Card Manager',
  'playtime-booster': 'Playtime Booster',
  'auto-idler': 'Automatic Idler',
  'task-scheduling': 'Task Scheduling',
  'free-games': 'Free Games',
}

const SETTINGS = {
  'general': 'General',
  'card-farming': 'Card Farming',
  'achievement-unlocker': 'Achievement Unlocker',
  'trading-card-manager': 'Trading Card Manager',
  'game-settings': 'Game Settings',
  'debug': 'Debug',
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  'index': {
    type: 'page',
    display: 'hidden',
    theme: {
      navbar: false,
    },
  },
  'alternatives': {
    display: 'hidden',
    items: {
      'archisteamfarm': {
        type: 'page',
        theme: {
          navbar: false,
        },
      },
      'idle-master': {
        type: 'page',
        theme: {
          navbar: false,
        },
      },
      'steam-achievement-manager': {
        type: 'page',
        theme: {
          navbar: false,
        },
      },
    },
  },
  'docs': {
    type: 'page',
    title: 'Documentation',
    theme: {
      navbar: true,
    },
    items: {
      'index': '',
      '_': {
        type: 'separator',
        title: 'Usage',
      },
      'get-started': {
        items: GET_STARTED,
        theme: {
          collapsed: false,
        },
      },
      'features': {
        items: FEATURES,
        theme: {
          collapsed: true,
        },
      },
      'settings': {
        items: SETTINGS,
        theme: {
          collapsed: true,
        },
      },
      'steam-credentials': 'Steam Credentials',
      '___': {
        type: 'separator',
        title: 'Help & Support',
      },
      'troubleshooting': 'Troubleshooting',
      'faq': 'FAQ',
    },
  },
  'privacy': {
    type: 'page',
    title: 'Privacy Policy',
    theme: {
      navbar: true,
    },
  },
  'tos': {
    type: 'page',
    title: 'Terms of Service',
    theme: {
      navbar: true,
    },
  },
  '*': {
    theme: {
      navbar: false,
    },
  },
}
