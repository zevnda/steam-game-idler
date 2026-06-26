export interface PriceData {
  tierOne: { url: string; price: string }
  tierTwo: { url: string; price: string }
}

export interface CardDef {
  title: string
  description: string
  tier: 'casual' | 'gamer'
  colSpan: 1 | 2
  bg: string
  imgBg?: string
  learnMoreUrl?: string
  darkText?: boolean
}

export interface ComparisonRowDef {
  label: string
  icon: React.ElementType
  tier: 'casual' | 'gamer'
}
