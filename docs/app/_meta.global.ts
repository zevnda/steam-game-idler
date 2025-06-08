const GET_STARTED = {
  'build-it-yourself': 'Build It Yourself',
  'how-to-sign-in': 'How to Sign In',
  'install': 'Install',
}

const FEATURES = {
  'achievement-manager': 'Achievement Manager',
  'achievement-unlocker': 'Achievement Unlocker',
  'auto-idler': 'Automatic Idler',
  'card-farming': 'Card Farming',
  'playtime-booster': 'Playtime Booster',
  'trading-card-manager': 'Trading Card Manager',
}

const SETTINGS = {
  'achievement-unlocker': 'Achievement Unlocker',
  'card-farming': 'Card Farming',
  'game-settings': 'Game Settings',
  'general': 'General',
  'logs': 'Logs',
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  index: {
    type: 'page',
    display: 'hidden',
  },
  docs: {
    type: 'page',
    title: 'Documentation',
    items: {
      'index': '',
      'get-started': { items: GET_STARTED },
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
      'faq': 'FAQ',
      'references': 'References',
      'steam-credentials': 'Steam Credentials',
    },
  },
}
