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
}

const SETTINGS = {
  'general': 'General',
  'card-farming': 'Card Farming',
  'achievement-unlocker': 'Achievement Unlocker',
  'game-settings': 'Game Settings',
  'logs': 'Logs',
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  index: {
    type: 'page',
    display: 'hidden',
    theme: {
      navbar: false,
    },
  },
  docs: {
    type: 'page',
    title: 'Documentation',
    items: {
      'index': '',
      '_': {
        type: 'separator',
        title: 'Usage',
      },
      'get-started': {
        items: GET_STARTED,
        theme: {
          collapsed: true,
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
      '__': {
        type: 'separator',
        title: 'More',
      },
      'steam-credentials': 'Steam Credentials',
      'references': 'References',
      'faq': 'FAQ',
    },
  },
}
