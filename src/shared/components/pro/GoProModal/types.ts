export interface PriceData {
  tierOne: { url: string; price: string }
  tierTwo: { url: string; price: string }
}

export interface CardDef {
  title: string
  description: string
  colSpan: 1 | 2
  imgBg: string
  darkText?: boolean
  learnMoreUrl: string
}

export interface ComparisonRowDef {
  label: string
  icon: React.ElementType
  tier: 'casual' | 'gamer'
  // Overrides the tick/cross in each tier column with a literal value (e.g. an account count) -
  // for a row where both tiers get the feature but at a different quantity.
  casualValue?: string
  gamerValue?: string
  // Free tier's own cap for a quantity row (e.g. "1" concurrent account) - free is never a plain
  // check/cross here since it's a real, lower cap rather than "no access". Omitted for boolean
  // rows, which free genuinely doesn't have at all (shown as a cross).
  freeValue?: string
}

export interface FaqItemDef {
  q: string
  a: string
}
