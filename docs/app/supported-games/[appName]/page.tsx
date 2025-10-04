import type { ReactElement } from 'react'

import AdComponents from './AdComponents'

interface PageProps {
  params: {
    appName: string
  }
}

export async function generateStaticParams() {
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
  ]
}

function formatGameName(appName: string): string {
  return appName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function getRandomContent() {
  const introTexts = [
    'Looking to maximize your {gameName} experience on Steam? Our Steam Game Idler is the perfect solution for collecting trading cards, farming achievements, and increasing your playtime in {gameName} without the grind. Start earning rewards from {gameName} today!',
    'Transform your {gameName} gaming experience with our advanced Steam Game Idler! Effortlessly collect trading cards, unlock achievements, and boost your Steam profile while {gameName} runs in the background. Get started with {gameName} idling now!',
    'Unlock the full potential of {gameName} on Steam with our professional idling solution. Automatically gather trading cards, farm time-based achievements, and maximize your Steam level progress. Make {gameName} work for you 24/7!',
    'Supercharge your {gameName} Steam experience! Our intelligent game idler handles all the tedious grinding, collecting valuable trading cards and unlocking achievements while you focus on what matters. Join the {gameName} idling revolution!',
  ]

  const whyUseTexts = [
    "Steam Game Idler allows you to run {gameName} in the background, automatically collecting trading cards and unlocking time-based achievements. Whether you're building your Steam level or looking to complete your {gameName} badge collection, our idler makes the process effortless and efficient.",
    "Our advanced idling technology transforms how you experience {gameName} on Steam. By running {gameName} intelligently in the background, you'll accumulate trading cards, unlock achievements, and build your Steam reputation without any manual effort.",
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
    <div className='max-h-[100vh] bg-[#121316] overflow-hidden'>
      <div className='max-w-4xl mx-auto p-6'>
        <div className='bg-[#121316] rounded-lg shadow-md p-8'>
          <h1 className='text-4xl font-bold text-white mb-6'>
            Steam Game Idler for {gameName} - Maximize Your Gaming Experience
          </h1>

          <p className='text-lg text-white mb-6 leading-relaxed'>
            {randomContent.introText.replace(/{gameName}/g, gameName)}
          </p>

          <h2 className='text-3xl font-semibold text-white mb-4'>Why Use Steam Game Idler for {gameName}?</h2>
          <p className='text-white mb-6 leading-relaxed'>{randomContent.whyUseText.replace(/{gameName}/g, gameName)}</p>

          <h2 className='text-3xl font-semibold text-white mb-4'>Steam Game Idler Features for {gameName}</h2>
          <div className='grid md:grid-cols-2 gap-6 mb-8'>
            <div>
              <h3 className='text-xl font-semibold text-white mb-3'>{randomContent.cardFeature.title}</h3>
              <ul className='list-disc list-inside text-white space-y-2'>
                {randomContent.cardFeature.items.map((item, index) => (
                  <li key={index}>{item.replace(/{gameName}/g, gameName)}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className='text-xl font-semibold text-white mb-3'>{randomContent.achievementFeature.title}</h3>
              <ul className='list-disc list-inside text-white space-y-2'>
                {randomContent.achievementFeature.items.map((item, index) => (
                  <li key={index}>{item.replace(/{gameName}/g, gameName)}</li>
                ))}
              </ul>
            </div>
          </div>

          <h2 className='text-3xl font-semibold text-white mb-4'>How Steam Game Idler Works with {gameName}</h2>
          <p className='text-white mb-4 leading-relaxed'>
            {randomContent.howItWorksText.replace(/{gameName}/g, gameName)}
          </p>
          <ul className='list-disc list-inside text-white space-y-2 mb-6 ml-4'>
            <li>
              <strong>Smart Timing:</strong> Automatically calculates optimal idle time for {gameName} card drops
            </li>
            <li>
              <strong>Resource Efficient:</strong> Runs {gameName} with minimal CPU and memory usage
            </li>
            <li>
              <strong>Steam Integration:</strong> Seamlessly works with Steam's systems for {gameName}
            </li>
            <li>
              <strong>Progress Tracking:</strong> Monitor your {gameName} card collection progress in real-time
            </li>
          </ul>

          <h2 className='text-3xl font-semibold text-white mb-4'>Getting Started with {gameName} Idling</h2>
          <p className='text-white mb-4 leading-relaxed'>
            Setting up Steam Game Idler for {gameName} is simple and takes less than 5 minutes. Our user-friendly
            interface makes it easy to start collecting {gameName} trading cards immediately.
          </p>
          <div className='bg-blue-900 border-l-4 border-blue-400 p-4 mb-6'>
            <ul className='list-disc list-inside text-white space-y-2'>
              <li>Download and install Steam Game Idler</li>
              <li>Select {gameName} from your Steam library</li>
              <li>Configure idle settings for optimal {gameName} performance</li>
              <li>Start idling and watch your {gameName} cards accumulate</li>
              <li>Monitor progress through our intuitive dashboard</li>
            </ul>
          </div>

          <h2 className='text-3xl font-semibold text-white mb-4'>{gameName} Trading Card Value</h2>
          <p className='text-white mb-4 leading-relaxed'>
            {randomContent.cardValueText.replace(/{gameName}/g, gameName)}
          </p>
          <div className='grid md:grid-cols-3 gap-4 mb-6'>
            <div className='bg-gray-800 p-4 rounded-lg'>
              <h4 className='font-semibold text-white mb-2'>Card Collection</h4>
              <ul className='text-sm text-white space-y-1'>
                <li>Collect all {gameName} cards</li>
                <li>Complete badge sets</li>
                <li>Increase Steam level</li>
                <li>Unlock booster packs</li>
              </ul>
            </div>
            <div className='bg-gray-800 p-4 rounded-lg'>
              <h4 className='font-semibold text-white mb-2'>Market Trading</h4>
              <ul className='text-sm text-white space-y-1'>
                <li>Sell {gameName} cards</li>
                <li>Generate Steam Wallet funds</li>
                <li>Track market prices</li>
                <li>Maximize profits</li>
              </ul>
            </div>
            <div className='bg-gray-800 p-4 rounded-lg'>
              <h4 className='font-semibold text-white mb-2'>Achievement Progress</h4>
              <ul className='text-sm text-white space-y-1'>
                <li>Time-based achievements</li>
                <li>Playtime milestones</li>
                <li>Profile showcases</li>
                <li>Completion percentage</li>
              </ul>
            </div>
          </div>

          <h2 className='text-3xl font-semibold text-white mb-4'>Why Choose Our Steam Game Idler?</h2>
          <p className='text-white mb-4 leading-relaxed'>
            Our Steam Game Idler is the most reliable and efficient tool for maximizing your {gameName} experience. With
            advanced features, safety protocols, and 24/7 operation, it's the perfect solution for serious Steam
            collectors and casual gamers alike.
          </p>

          <h2 className='text-3xl font-semibold text-white mb-4'>Safety and Security</h2>
          <p className='text-white mb-4 leading-relaxed'>
            Steam Game Idler is designed to work safely with {gameName} and Steam's terms of service. Our tool doesn't
            modify game files or use cheats - it simply runs the game legitimately to trigger natural card drops and
            achievements.
          </p>

          <h2 className='text-3xl font-semibold text-white mb-4'>Advanced Features for {gameName}</h2>
          <p className='text-white mb-6 leading-relaxed'>
            Take your {gameName} idling to the next level with our advanced features including queue management,
            automatic switching between games, detailed analytics, and cloud synchronization across multiple devices.
          </p>

          <div className='bg-green-900 border-l-4 border-green-400 p-6 mb-6'>
            <h3 className='text-xl font-semibold text-green-200 mb-2'>Start Idling {gameName} Today</h3>
            <p className='text-green-100'>
              Ready to maximize your {gameName} experience? Download Steam Game Idler now and start collecting trading
              cards, unlocking achievements, and building your Steam level automatically. Join thousands of satisfied
              users who trust our idler for their Steam gaming needs.
            </p>
          </div>
        </div>
      </div>

      <AdComponents />

      <footer className='bg-gray-800 text-white py-8 mt-12'>
        <div className='max-w-6xl mx-auto px-6 text-center'>
          <p>&copy; 2024 Steam Game Idler. All rights reserved.</p>
          <p className='text-sm text-gray-400 mt-2'>
            Maximize your {gameName} experience with our trusted idling solution.
          </p>
        </div>
      </footer>
    </div>
  )
}
