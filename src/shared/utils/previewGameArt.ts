const ART_BASE = 'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps'

const entry = (appId: number, name: string, artPath: string) => ({
  appId,
  name,
  knownArtSrc: `${ART_BASE}/${appId}/${artPath}`,
})

// Bright, popular games for the previews on empty-page banners, spread onto a `GamePosterCard`. Fixed
// rather than taken from the user's library, which would have to wait on the games list and the art
// lookup before a preview could show anything, and would look different for everyone. They only
// illustrate what a page looks like in use. Game names are brand names, so aren't translated.
//
// These hashed paths can change if a developer swaps their art. That's safe, since `GamePosterArt`
// falls back to looking the game up, and any entry can be replaced with another popular game.
export const PREVIEW_GAMES = {
  palworld: entry(
    1623730,
    'Palworld',
    'f85c38b444047c686d44eea5f649c9ae761fd06a/library_capsule.jpg',
  ),
  peak: entry(3527290, 'PEAK', '480bd879ac737921bfa2529a6fea15961267ad21/library_600x900.jpg'),
  silksong: entry(
    1030300,
    'Hollow Knight: Silksong',
    '93637c34351160eaa7d7ff0cce69cb4312abb819/library_capsule.jpg',
  ),
  marvelRivals: entry(
    2767030,
    'Marvel Rivals',
    '846b1e4bc5e334b691bbe0b19fbbb6b074d5d89f/library_capsule.jpg',
  ),
  hades2: entry(
    1145350,
    'Hades II',
    '2ba105370a00877459144db0dd68af5f2d338429/library_capsule.jpg',
  ),
  balatro: entry(2379780, 'Balatro', 'library_600x900.jpg'),
  vampireSurvivors: entry(
    1794680,
    'Vampire Survivors',
    '96947acc36ca29e24084ffb5858062d478c2ce6b/library_capsule.jpg',
  ),
  dispatch: entry(
    2592160,
    'Dispatch',
    '6754ae9d2f555ee1cf37f9d44021d34554d9991d/library_600x900.jpg',
  ),
  portal2: entry(620, 'Portal 2', 'library_600x900.jpg'),
  schedule1: entry(
    3164500,
    'Schedule I',
    '83b75c1bc8ea91b7503d8816832188635ba75a72/library_600x900.jpg',
  ),
  repo: entry(3241660, 'R.E.P.O.', '46b4813ef1cd20664299c9e5de847f3579b44f2e/library_600x900.jpg'),
  expedition33: entry(
    1903340,
    'Clair Obscur: Expedition 33',
    '8b21381a43ac5a535a838f723815f8fe14ceaf7c/library_600x900.jpg',
  ),
  monsterHunterWilds: entry(
    2246340,
    'Monster Hunter Wilds',
    'e3fc16c6bc498891e952500eda05fe6462ceb9f0/library_600x900.jpg',
  ),
  helldivers2: entry(
    553850,
    'Helldivers 2',
    'a79b4d13ce2b1e1379116085b4f97b45c14548ab/library_capsule.jpg',
  ),
  hollowKnight: entry(
    367520,
    'Hollow Knight',
    '1eebc7e077ee345f126df35cd99c124273c4e4e3/library_capsule.jpg',
  ),
  baldursGate3: entry(1086940, "Baldur's Gate 3", 'library_600x900.jpg'),
  eldenRing: entry(1245620, 'Elden Ring', 'library_600x900.jpg'),
  wukong: entry(2358720, 'Black Myth: Wukong', 'library_600x900.jpg'),
}
