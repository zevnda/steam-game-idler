import { notFound } from 'next/navigation'
import AdScripts from '@/app/(marketing)/(home)/_components/AdScripts'
import CTASection from '@/app/(marketing)/(home)/_components/CTASection'
import FooterSection from '@/app/(marketing)/(home)/_components/FooterSection'
import NavBar from '@/app/(marketing)/(home)/_components/NavBar'
import FloatingAd from '@/app/(marketing)/supported-games/_components/FloatingAd'
import GameFaqSection from '@/app/(marketing)/supported-games/_components/GameFaqSection'
import GameGettingStarted from '@/app/(marketing)/supported-games/_components/GameGettingStarted'
import GameHero from '@/app/(marketing)/supported-games/_components/GameHero'
import GameHighlights from '@/app/(marketing)/supported-games/_components/GameHighlights'
import GameRelatedGames from '@/app/(marketing)/supported-games/_components/GameRelatedGames'
import GameSupportTable from '@/app/(marketing)/supported-games/_components/GameSupportTable'
import { GAMES, getGameData } from '@/app/(marketing)/supported-games/_data/games'

interface PageProps {
  params: {
    appName: string
  }
}

export async function generateStaticParams() {
  return GAMES.map(game => ({ appName: game.slug }))
}

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const game = getGameData(params.appName)
  if (!game) return {}

  const title = `Idle ${game.name} on Steam | Steam Game Idler`
  const description = `Learn how to idle ${game.name} for trading cards, achievements, and playtime with Steam Game Idler - a free, open-source Steam automation tool.`

  return {
    title,
    description,
    openGraph: {
      url: `https://steamgameidler.com/supported-games/${game.slug}`,
      title,
      description,
      images: 'https://steamgameidler.com/og-image.png',
      type: 'article',
    },
    twitter: {
      title,
      description,
      image: 'https://steamgameidler.com/og-image.png',
    },
    alternates: {
      canonical: `/supported-games/${game.slug}`,
    },
  }
}

export default async function SupportedGamePage(props: PageProps) {
  const params = await props.params
  const game = getGameData(params.appName)
  if (!game) notFound()

  return (
    <div className='min-h-screen bg-background'>
      <AdScripts />
      <NavBar />
      <div className='relative'>
        <GameHero game={game} />
        <div className='section-divider' />
        <GameHighlights game={game} />
        <div className='section-divider' />
        <GameSupportTable game={game} />
        <div className='section-divider' />
        <GameGettingStarted game={game} />
        <div className='section-divider' />
        <GameFaqSection game={game} />
        <div className='section-divider' />
        <GameRelatedGames game={game} />
        <div className='section-divider' />
        <CTASection />
        <div className='section-divider' />
        <FooterSection />
      </div>
      <FloatingAd />
    </div>
  )
}
