import type { ReactElement } from 'react'

import AdComponent from './AdComponent'
import AdComponentTwo from '@docs/supported-games/[appName]/AdComponentTwo'

interface PageProps {
  params: {
    appName: string
  }
}

export async function generateStaticParams(): Promise<{ appName: string }[]> {
  return [
    { appName: 'scum' },
    { appName: 'dayz' },
    { appName: 'arma-3' },
    { appName: 'miscreated' },
    { appName: 'rust' },
    { appName: 'counter-strike-2' },
    { appName: 'dota-2' },
    { appName: 'team-fortress-2' },
    { appName: 'grand-theft-auto-v' },
    { appName: 'apex-legends' },
    { appName: 'destiny-2' },
    { appName: 'warframe' },
    { appName: 'dead-by-daylight' },
    { appName: 'rainbow-six-siege' },
    { appName: 'garry-mod' },
    { appName: 'left-4-dead-2' },
    { appName: 'portal-2' },
    { appName: 'half-life-2' },
    { appName: 'cyberpunk-2077' },
    { appName: 'the-witcher-3' },
    { appName: 'skyrim' },
    { appName: 'fallout-4' },
    { appName: 'terraria' },
    { appName: 'stardew-valley' },
    { appName: 'among-us' },
    { appName: 'valheim' },
    { appName: 'sea-of-thieves' },
    { appName: 'rocket-league' },
    { appName: 'payday-2' },
    { appName: 'pubg' },
    { appName: 'subnautica' },
    { appName: 'no-mans-sky' },
    { appName: 'borderlands-3' },
    { appName: 'the-forest' },
    { appName: 'phasmophobia' },
    { appName: 'satisfactory' },
    { appName: 'factorio' },
    { appName: 'rimworld' },
    { appName: 'hades' },
    { appName: 'slay-the-spire' },
    { appName: 'celeste' },
    { appName: 'hollow-knight' },
    { appName: 'dark-souls-3' },
    { appName: 'elden-ring' },
    { appName: 'monster-hunter-world' },
    { appName: 'deep-rock-galactic' },
    { appName: 'payday-3' },
    { appName: 'forza-horizon-5' },
    { appName: 'fifa-23' },
    { appName: 'nba-2k23' },
    { appName: 'madden-nfl-23' },
    { appName: 'football-manager-2024' },
    { appName: 'civilization-vi' },
    { appName: 'total-war-warhammer-3' },
    { appName: 'crusader-kings-3' },
    { appName: 'euro-truck-simulator-2' },
    { appName: 'american-truck-simulator' },
    { appName: 'flight-simulator' },
    { appName: 'planet-coaster' },
    { appName: 'cities-skylines' },
    { appName: 'planet-zoo' },
    { appName: 'the-sims-4' },
    { appName: 'simcity' },
    { appName: 'lego-star-wars' },
    { appName: 'star-wars-jedi-survivor' },
    { appName: 'lego-harry-potter' },
    { appName: 'hogwarts-legacy' },
    { appName: 'marvels-spider-man' },
    { appName: 'batman-arkham-knight' },
    { appName: 'red-dead-redemption-2' },
    { appName: 'far-cry-6' },
    { appName: 'assassins-creed-valhalla' },
    { appName: 'watch-dogs-legion' },
    { appName: 'ghostrunner' },
    { appName: 'doom-eternal' },
    { appName: 'quake-champions' },
    { appName: 'overwatch-2' },
    { appName: 'paladins' },
    { appName: 'smite' },
    { appName: 'league-of-legends' },
    { appName: 'valorant' },
  ]
}

function formatGameName(appName: string): string {
  return appName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getRandomContent(): {
  introText: string
  whyUseText: string
  cardFeature: { title: string; items: string[] }
  achievementFeature: { title: string; items: string[] }
  howItWorksText: string
  cardValueText: string
} {
  const introTexts = [
    'Looking to maximize your {gameName} experience on Steam? Our Steam Game Idler is the perfect solution for collecting trading cards, farming achievements, and increasing your playtime in {gameName} without the grind. Start earning rewards from {gameName} today!',
    'Transform your {gameName} gaming experience with our advanced Steam Game Idler! Effortlessly collect trading cards, unlock achievements, and boost your Steam profile while {gameName} runs in the background. Get started with {gameName} idling now!',
    'Unlock the full potential of {gameName} on Steam with our professional idling solution. Automatically gather trading cards, farm time-based achievements, and maximize your Steam level progress. Make {gameName} work for you 24/7!',
    'Supercharge your {gameName} Steam experience! Our intelligent game idler handles all the tedious grinding, collecting valuable trading cards and unlocking achievements while you focus on what matters. Join the {gameName} idling revolution!',
  ]

  const whyUseTexts = [
    `Steam Game Idler allows you to run {gameName} in the background, automatically collecting trading cards and unlocking time-based achievements. Whether you're building your Steam level or looking to complete your {gameName} badge collection, our idler makes the process effortless and efficient.",
    "Our advanced idling technology transforms how you experience {gameName} on Steam. By running {gameName} intelligently in the background, you'll accumulate trading cards, unlock achievements, and build your Steam reputation without any manual effort.`,
    'Experience the power of automated {gameName} progression with Steam Game Idler. Our sophisticated system handles all the repetitive tasks, from card collection to achievement farming, while you enjoy other activities or games.',
    "Revolutionize your {gameName} Steam journey with our cutting-edge idling solution. Seamlessly collect all available rewards, build impressive achievement showcases, and maximize your Steam profile's potential.",
  ]

  const features = [
    {
      title: 'Automated Card Collection',
      items: [
        'Automatically idle {gameName} to collect all available trading cards',
        'No manual intervention required - set it and forget it',
        'Optimized timing to maximize card drops from {gameName}',
        "Safe and undetectable by Steam's systems",
      ],
    },
    {
      title: 'Smart Card Farming',
      items: [
        'Intelligent {gameName} card drop detection and collection',
        'Zero-effort setup with automatic configuration',
        'Advanced algorithms ensure maximum {gameName} card yield',
        'Completely safe and Steam-compliant operation',
      ],
    },
    {
      title: 'Premium Card Collection',
      items: [
        'Professional-grade {gameName} trading card acquisition',
        'Hands-free operation with smart automation',
        'Maximized efficiency for {gameName} card drop rates',
        'Undetectable and secure Steam integration',
      ],
    },
  ]

  const achievementFeatures = [
    {
      title: 'Achievement Farming',
      items: [
        'Unlock time-based achievements in {gameName} automatically',
        'Increase your {gameName} completion percentage',
        'Build impressive achievement showcases',
        'Works 24/7 while you sleep or work',
      ],
    },
    {
      title: 'Smart Achievement Unlocking',
      items: [
        'Automatically progress through {gameName} time-based achievements',
        'Boost your {gameName} profile completion stats',
        'Create stunning achievement galleries',
        'Continuous operation for maximum efficiency',
      ],
    },
    {
      title: 'Advanced Achievement System',
      items: [
        'Effortlessly unlock {gameName} milestone achievements',
        'Enhance your {gameName} gaming credentials',
        'Develop impressive achievement collections',
        'Round-the-clock achievement farming capability',
      ],
    },
  ]

  const howItWorksTexts = [
    "Our Steam Game Idler launches {gameName} in a minimal resource mode, simulating active gameplay to trigger Steam's card drop system. The idler runs {gameName} efficiently in the background, ensuring you receive all eligible trading cards without impacting your computer's performance.",
    'Steam Game Idler utilizes advanced technology to run {gameName} with minimal system impact while maximizing reward collection. Our intelligent engine simulates genuine gameplay patterns, ensuring optimal card drops and achievement progress.',
    "Experience seamless {gameName} idling with our optimized background processing system. The idler intelligently manages {gameName} execution, triggering Steam's reward mechanisms while maintaining peak system performance.",
    'Our innovative idling engine runs {gameName} using sophisticated background processes that mimic authentic gameplay. This ensures maximum trading card collection and achievement unlocking with zero performance impact.',
  ]

  const cardValueTexts = [
    '{gameName} trading cards can be valuable additions to your Steam inventory. Our Steam Game Idler helps you collect these cards efficiently, allowing you to complete badge sets, sell on the Steam Market, or trade with other players for profit.',
    "Maximize the value of your {gameName} trading card collection with our professional idling solution. Whether you're building complete badge sets, generating Steam Wallet funds, or trading for rare cards, our idler delivers results.",
    'Transform your {gameName} cards into valuable Steam assets. Our idler ensures you collect every available card, opening opportunities for profitable trading, badge completion, and Steam Market sales.',
    'Unlock the earning potential of {gameName} trading cards with our efficient collection system. Build valuable card portfolios, complete prestigious badge sets, and generate consistent Steam Market revenue.',
  ]

  return {
    introText: introTexts[Math.floor(Math.random() * introTexts.length)],
    whyUseText: whyUseTexts[Math.floor(Math.random() * whyUseTexts.length)],
    cardFeature: features[Math.floor(Math.random() * features.length)],
    achievementFeature: achievementFeatures[Math.floor(Math.random() * achievementFeatures.length)],
    howItWorksText: howItWorksTexts[Math.floor(Math.random() * howItWorksTexts.length)],
    cardValueText: cardValueTexts[Math.floor(Math.random() * cardValueTexts.length)],
  }
}

export default async function AdPage({ params }: PageProps): Promise<ReactElement> {
  const { appName } = await params
  const gameName = formatGameName(appName)
  const randomContent = getRandomContent()

  return (
    <div className='max-h-screen bg-[#121316] overflow-hidden relative'>
      {/* Animated gradient background */}
      <div
        className='absolute inset-0 z-0 pointer-events-none'
        style={{
          background: 'linear-gradient(120deg, #1a2332 0%, #232b3e 50%, #1e293b 100%)',
          opacity: 0.7,
          animation: 'gradientMove 8s ease-in-out infinite alternate',
        }}
      />
      <style>
        {`
          @keyframes gradientMove {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
          }
        `}
      </style>
      <div className='max-w-5xl mx-auto max-h-screen p-6 overflow-auto relative z-10'>
        <div className='bg-[#181a20] rounded-2xl shadow-2xl p-10 border border-gray-800'>
          <h1 className='text-5xl font-extrabold text-white mb-8 tracking-tight drop-shadow-lg'>
            Steam Game Idler for <span className='text-blue-400'>{gameName}</span>
          </h1>
          <p className='text-lg text-gray-200 mb-8 leading-relaxed'>
            {randomContent.introText.replace(/{gameName}/g, gameName)}
          </p>
          <hr className='my-8 border-gray-700' />

          <h2 className='text-3xl font-bold text-blue-300 mb-4'>Why Use Steam Game Idler for {gameName}?</h2>
          <p className='text-gray-200 mb-8 leading-relaxed'>
            {randomContent.whyUseText.replace(/{gameName}/g, gameName)}
          </p>
          <hr className='my-8 border-gray-700' />

          <h2 className='text-3xl font-bold text-blue-300 mb-4'>Steam Game Idler Features for {gameName}</h2>
          <div className='grid md:grid-cols-2 gap-8 mb-10'>
            <div className='bg-gray-900 rounded-xl shadow-lg p-6 hover:shadow-blue-900 transition-shadow'>
              <h3 className='text-xl font-bold text-blue-200 mb-3'>{randomContent.cardFeature.title}</h3>
              <ul className='list-disc list-inside text-gray-100 space-y-2'>
                {randomContent.cardFeature.items.map(item => (
                  <li key={item}>{item.replace(/{gameName}/g, gameName)}</li>
                ))}
              </ul>
            </div>
            <div className='bg-gray-900 rounded-xl shadow-lg p-6 hover:shadow-blue-900 transition-shadow'>
              <h3 className='text-xl font-bold text-blue-200 mb-3'>{randomContent.achievementFeature.title}</h3>
              <ul className='list-disc list-inside text-gray-100 space-y-2'>
                {randomContent.achievementFeature.items.map(item => (
                  <li key={item}>{item.replace(/{gameName}/g, gameName)}</li>
                ))}
              </ul>
            </div>
          </div>
          <hr className='my-8 border-gray-700' />

          <h2 className='text-3xl font-bold text-blue-300 mb-4'>How Steam Game Idler Works with {gameName}</h2>
          <p className='text-gray-200 mb-4 leading-relaxed'>
            {randomContent.howItWorksText.replace(/{gameName}/g, gameName)}
          </p>
          <ul className='list-disc list-inside text-gray-100 space-y-2 mb-8 ml-4'>
            <li>
              <strong className='text-blue-200'>Smart Timing:</strong> Automatically calculates optimal idle time for{' '}
              {gameName} card drops
            </li>
            <li>
              <strong className='text-blue-200'>Resource Efficient:</strong> Runs {gameName} with minimal CPU and memory
              usage
            </li>
            <li>
              <strong className='text-blue-200'>Steam Integration:</strong> Seamlessly works with Steam&apos;s systems
              for {gameName}
            </li>
            <li>
              <strong className='text-blue-200'>Progress Tracking:</strong> Monitor your {gameName} card collection
              progress in real-time
            </li>
          </ul>
          <hr className='my-8 border-gray-700' />

          <h2 className='text-3xl font-bold text-blue-300 mb-4'>Getting Started with {gameName} Idling</h2>
          <p className='text-gray-200 mb-4 leading-relaxed'>
            Setting up Steam Game Idler for {gameName} is simple and takes less than 5 minutes. Our user-friendly
            interface makes it easy to start collecting {gameName} trading cards immediately.
          </p>
          <div className='bg-blue-900 border-l-4 border-blue-400 p-6 mb-8 rounded-xl shadow'>
            <ul className='list-disc list-inside text-white space-y-2'>
              <li>Download and install Steam Game Idler</li>
              <li>Select {gameName} from your Steam library</li>
              <li>Configure idle settings for optimal {gameName} performance</li>
              <li>Start idling and watch your {gameName} cards accumulate</li>
              <li>Monitor progress through our intuitive dashboard</li>
            </ul>
          </div>
          <hr className='my-8 border-gray-700' />

          <h2 className='text-3xl font-bold text-blue-300 mb-4'>{gameName} Trading Card Value</h2>
          <p className='text-gray-200 mb-4 leading-relaxed'>
            {randomContent.cardValueText.replace(/{gameName}/g, gameName)}
          </p>
          <div className='grid md:grid-cols-3 gap-6 mb-8'>
            <div className='bg-gray-800 p-6 rounded-xl shadow hover:shadow-blue-900 transition-shadow'>
              <h4 className='font-semibold text-blue-200 mb-2'>Card Collection</h4>
              <ul className='text-sm text-gray-100 space-y-1'>
                <li>Collect all {gameName} cards</li>
                <li>Complete badge sets</li>
                <li>Increase Steam level</li>
                <li>Unlock booster packs</li>
              </ul>
            </div>
            <div className='bg-gray-800 p-6 rounded-xl shadow hover:shadow-blue-900 transition-shadow'>
              <h4 className='font-semibold text-blue-200 mb-2'>Market Trading</h4>
              <ul className='text-sm text-gray-100 space-y-1'>
                <li>Sell {gameName} cards</li>
                <li>Generate Steam Wallet funds</li>
                <li>Track market prices</li>
                <li>Maximize profits</li>
              </ul>
            </div>
            <div className='bg-gray-800 p-6 rounded-xl shadow hover:shadow-blue-900 transition-shadow'>
              <h4 className='font-semibold text-blue-200 mb-2'>Achievement Progress</h4>
              <ul className='text-sm text-gray-100 space-y-1'>
                <li>Time-based achievements</li>
                <li>Playtime milestones</li>
                <li>Profile showcases</li>
                <li>Completion percentage</li>
              </ul>
            </div>
          </div>
          <hr className='my-8 border-gray-700' />

          <h2 className='text-3xl font-bold text-blue-300 mb-4'>Why Choose Our Steam Game Idler?</h2>
          <p className='text-gray-200 mb-4 leading-relaxed'>
            Our Steam Game Idler is the most reliable and efficient tool for maximizing your {gameName} experience. With
            advanced features, safety protocols, and 24/7 operation, it&apos;s the perfect solution for serious Steam
            collectors and casual gamers alike.
          </p>
          <hr className='my-8 border-gray-700' />

          <h2 className='text-3xl font-bold text-blue-300 mb-4'>Safety and Security</h2>
          <p className='text-gray-200 mb-4 leading-relaxed'>
            Steam Game Idler is designed to work safely with {gameName} and Steam&apos;s terms of service. Our tool
            doesn&apos;t modify game files or use cheats - it simply runs the game legitimately to trigger natural card
            drops and achievements.
          </p>
          <hr className='my-8 border-gray-700' />

          <h2 className='text-3xl font-bold text-blue-300 mb-4'>Advanced Features for {gameName}</h2>
          <p className='text-gray-200 mb-8 leading-relaxed'>
            Take your {gameName} idling to the next level with our advanced features including queue management,
            automatic switching between games, detailed analytics, and cloud synchronization across multiple devices.
          </p>

          <div className='bg-green-900 border-l-4 border-green-400 p-8 mb-8 rounded-xl shadow'>
            <h3 className='text-2xl font-bold text-green-200 mb-2'>Start Idling {gameName} Today</h3>
            <p className='text-green-100'>
              Ready to maximize your {gameName} experience? Download Steam Game Idler now and start collecting trading
              cards, unlocking achievements, and building your Steam level automatically. Join thousands of satisfied
              users who trust our idler for their Steam gaming needs.
            </p>
          </div>
        </div>

        <footer className='bg-gray-900 text-white py-10 mt-16 rounded-xl shadow-lg'>
          <div className='max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between'>
            <div className='flex items-center mb-4 md:mb-0'>
              {/* Logo placeholder */}
              <div className='w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center mr-3'>
                <span className='text-xl font-bold text-white'>SGI</span>
              </div>
              <span className='font-semibold text-lg'>Steam Game Idler</span>
            </div>
            <div className='flex space-x-4'>
              {/* Social icon placeholders */}
              <a href='#' className='text-gray-400 hover:text-blue-400' aria-label='Twitter'>
                <svg width='24' height='24' fill='currentColor'>
                  <circle cx='12' cy='12' r='10' />
                </svg>
              </a>
              <a href='#' className='text-gray-400 hover:text-blue-400' aria-label='Discord'>
                <svg width='24' height='24' fill='currentColor'>
                  <rect x='4' y='4' width='16' height='16' rx='8' />
                </svg>
              </a>
              <a href='#' className='text-gray-400 hover:text-blue-400' aria-label='GitHub'>
                <svg width='24' height='24' fill='currentColor'>
                  <path d='M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.66-.22.66-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.1-1.46-1.1-1.46-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0112 6.8c.85.004 1.71.12 2.51.35 1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.16.58.67.48A10.01 10.01 0 0022 12c0-5.52-4.48-10-10-10z' />
                </svg>
              </a>
            </div>
          </div>
          <div className='text-center mt-6'>
            <p className='text-sm text-gray-400'>
              &copy; 2024 Steam Game Idler. All rights reserved. &mdash; Maximize your {gameName} experience with our
              trusted idling solution.
            </p>
          </div>
        </footer>
      </div>

      {/* Google ads */}
      <AdComponent />
      <AdComponentTwo />
    </div>
  )
}
