'use client'

import type { ReactElement } from 'react'

import { useEffect } from 'react'

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

const FloatingAd = () => {
  useEffect(() => {
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  return (
    <div className='fixed bottom-0 right-0 z-50 bg-[#121316] rounded-lg'>
      <ins
        className='block w-[100vw] h-[100vh] sm:w-[218px] sm:h-[145px]'
        data-ad-client='ca-pub-8915288433444527'
        data-ad-slot='9100790437'
      />
    </div>
  )
}

export default function AdPage(): ReactElement {
  useEffect(() => {
    const originalConsoleError = console.error
    console.error = (...args) => {
      const message = args[0]?.toString() || ''

      if (
        message.includes('plugins') ||
        message.includes('Tracking Prevention') ||
        message.includes('adsbygoogle') ||
        message.includes('pagead2.googlesyndication.com') ||
        message.includes('Cannot read properties of undefined') ||
        message.includes('gtrace.mediago.io')
      ) {
        return
      }

      originalConsoleError(...args)
    }

    if (typeof navigator !== 'undefined' && !navigator.plugins) {
      Object.defineProperty(navigator, 'plugins', {
        value: [],
        writable: false,
        enumerable: true,
        configurable: true,
      })
    }

    const script = document.createElement('script')
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8915288433444527'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onerror = () => {
      console.warn('AdSense script failed to load')
    }
    document.head.appendChild(script)

    return () => {
      console.error = originalConsoleError
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return (
    <div className='max-h-[100vh] bg-[#121316] overflow-hidden'>
      <div className='hidden sm:block max-w-4xl mx-auto p-6'>
        <div className='bg-[#121316] rounded-lg shadow-md p-8'>
          <h1 className='text-4xl font-bold text-white mb-6'>
            Steam Game Idler - Complete Guide to Maximizing Your Steam Experience
          </h1>

          <p className='text-lg text-white mb-6 leading-relaxed'>
            Welcome to the ultimate resource for Steam Game Idling! Whether you're looking to collect trading cards,
            farm achievements, or maximize your Steam level, our comprehensive guide will help you understand everything
            you need to know about idle gaming strategies and tools.
          </p>

          <h2 className='text-3xl font-semibold text-white mb-4'>What is Steam Game Idling?</h2>
          <p className='text-white mb-6 leading-relaxed'>
            Steam Game Idling is the practice of running games on Steam without actively playing them to collect trading
            cards, earn achievements, and increase playtime. This method allows players to earn rewards passively while
            focusing on other activities. Many games drop trading cards based on playtime, making idling an effective
            strategy for collectors and traders.
          </p>

          <h2 className='text-3xl font-semibold text-white mb-4'>Benefits of Using a Steam Game Idler</h2>
          <div className='grid md:grid-cols-2 gap-6 mb-8'>
            <div>
              <h3 className='text-xl font-semibold text-white mb-3'>Trading Card Collection</h3>
              <ul className='list-disc list-inside text-white space-y-2'>
                <li>Automatically collect trading cards from eligible games</li>
                <li>Build complete card sets for Steam badges</li>
                <li>Sell cards on the Steam Market for Steam Wallet funds</li>
                <li>Trade cards with other players</li>
              </ul>
            </div>
            <div>
              <h3 className='text-xl font-semibold text-white mb-3'>Achievement Farming</h3>
              <ul className='list-disc list-inside text-white space-y-2'>
                <li>Unlock time-based achievements automatically</li>
                <li>Increase your achievement completion percentage</li>
                <li>Show dedication to your gaming library</li>
                <li>Unlock special profile showcases</li>
              </ul>
            </div>
          </div>

          <h2 className='text-3xl font-semibold text-white mb-4'>How Steam Trading Cards Work</h2>
          <p className='text-white mb-4 leading-relaxed'>
            Steam Trading Cards are virtual cards earned by playing participating games on Steam. Most games drop
            approximately half of their card set during gameplay, with the remaining cards obtained through trading,
            purchasing, or booster packs. Here's what you need to know:
          </p>
          <ul className='list-disc list-inside text-white space-y-2 mb-6 ml-4'>
            <li>
              <strong>Card Drops:</strong> Games typically drop 3-5 cards out of 6-15 total cards in a set
            </li>
            <li>
              <strong>Drop Timing:</strong> Cards drop at random intervals, usually every 15-120 minutes of playtime
            </li>
            <li>
              <strong>Eligibility:</strong> You must own the game and have played it for at least 2 hours (in most
              cases)
            </li>
            <li>
              <strong>Value:</strong> Cards can be sold on the Steam Market, with prices ranging from $0.03 to several
              dollars
            </li>
          </ul>

          <h2 className='text-3xl font-semibold text-white mb-4'>Best Practices for Safe Idling</h2>
          <p className='text-white mb-4 leading-relaxed'>
            While Steam allows idling, it's important to follow best practices to ensure your account remains in good
            standing:
          </p>
          <div className='bg-blue-50 border-l-4 border-blue-400 p-4 mb-6'>
            <ul className='list-disc list-inside text-white space-y-2'>
              <li>Use reputable idling tools that don't modify game files</li>
              <li>Don't idle games you don't own</li>
              <li>Avoid using multiple accounts simultaneously</li>
              <li>Be respectful of game developers and communities</li>
              <li>Don't use idling tools for games with anti-cheat systems</li>
            </ul>
          </div>

          <h2 className='text-3xl font-semibold text-white mb-4'>Popular Games for Idling</h2>
          <p className='text-white mb-4 leading-relaxed'>
            Some games are particularly popular for idling due to their valuable trading cards or easy achievement
            unlocks:
          </p>
          <div className='grid md:grid-cols-3 gap-4 mb-6'>
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h4 className='font-semibold text-white mb-2'>Free-to-Play Games</h4>
              <ul className='text-sm text-white space-y-1'>
                <li>Team Fortress 2</li>
                <li>Dota 2</li>
                <li>Counter-Strike 2</li>
                <li>Warframe</li>
              </ul>
            </div>
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h4 className='font-semibold text-white mb-2'>Indie Games</h4>
              <ul className='text-sm text-white space-y-1'>
                <li>Sakura series games</li>
                <li>Achievement hunting games</li>
                <li>Visual novels</li>
                <li>Puzzle games</li>
              </ul>
            </div>
            <div className='bg-gray-50 p-4 rounded-lg'>
              <h4 className='font-semibold text-white mb-2'>Popular Titles</h4>
              <ul className='text-sm text-white space-y-1'>
                <li>Portal series</li>
                <li>Half-Life series</li>
                <li>Left 4 Dead 2</li>
                <li>Garry's Mod</li>
              </ul>
            </div>
          </div>

          <h2 className='text-3xl font-semibold text-white mb-4'>Understanding Steam Levels and XP</h2>
          <p className='text-white mb-4 leading-relaxed'>
            Crafting badges from trading cards increases your Steam level, which provides various benefits including
            increased friends list capacity, profile showcases, and booster pack eligibility. Each badge crafted gives
            100 XP, and higher-level badges provide even more XP.
          </p>

          <h2 className='text-3xl font-semibold text-white mb-4'>Economic Aspects of Trading Cards</h2>
          <p className='text-white mb-4 leading-relaxed'>
            The Steam trading card economy is a fascinating microcosm of supply and demand. Popular games with large
            player bases tend to have cheaper cards due to high supply, while obscure or removed games can have valuable
            cards. Understanding market trends can help you maximize profits from idling.
          </p>

          <h2 className='text-3xl font-semibold text-white mb-4'>Technical Considerations</h2>
          <p className='text-white mb-4 leading-relaxed'>
            When setting up an idling system, consider your computer's resources. Most idling tools are lightweight and
            won't significantly impact system performance. However, idling multiple games simultaneously may require
            more RAM and CPU resources. It's also important to ensure your computer can run continuously if you plan to
            idle overnight.
          </p>

          <h2 className='text-3xl font-semibold text-white mb-4'>Community and Social Aspects</h2>
          <p className='text-white mb-6 leading-relaxed'>
            The Steam idling community is active and helpful, with forums, Discord servers, and Reddit communities
            dedicated to sharing tips, tools, and market insights. Engaging with these communities can help you stay
            updated on the best practices and new opportunities in the trading card economy.
          </p>

          <div className='bg-green-50 border-l-4 border-green-400 p-6 mb-6'>
            <h3 className='text-xl font-semibold text-green-800 mb-2'>Getting Started</h3>
            <p className='text-green-700'>
              Ready to begin your Steam idling journey? Start by identifying games in your library that drop trading
              cards, research current market values, and choose a reliable idling tool. Remember to idle responsibly and
              respect the Steam community guidelines.
            </p>
          </div>
        </div>
      </div>

      <FloatingAd />

      <footer className='hidden sm:block bg-gray-800 text-white py-8 mt-12'>
        <div className='max-w-6xl mx-auto px-6 text-center'>
          <p>&copy; 2024 Steam Game Idler. All rights reserved.</p>
          <p className='text-sm text-gray-400 mt-2'>This page contains advertisements to support our free services.</p>
        </div>
      </footer>
    </div>
  )
}
