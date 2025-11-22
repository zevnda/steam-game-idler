'use client'

import type { ReactElement } from 'react'

import { useState } from 'react'

// FAQ data for SEO targeting
const faqData = [
  {
    section: 'Steam Achievement Manager',
    heading: 'Steam Achievement Manager',
    content: (
      <>
        <p className='mb-4 text-black'>
          The <strong>Steam Achievement Manager</strong> in SGI lets you manage Steam achievements for any game in your
          library. With our Steam achievement manager, you can unlock, lock, and modify achievements and statistics,
          giving you full control over your Steam profile. Many users search for a reliable Steam achievement manager or
          achievement unlocking tool to safely manage and unlock achievements, and SGI is designed to be the safest and
          most user-friendly option available.
        </p>
        <p className='mt-4 text-black'>
          If you want to manage or unlock achievements easily, SGI&apos;s Steam achievement manager and achievement
          unlocking tool are the best choices. Learn more in our documentation.
        </p>
      </>
    ),
  },
  {
    section: 'Steam Achievement Unlocker',
    heading: 'Steam Achievement Unlocker',
    content: (
      <>
        <p className='mb-4 text-black'>
          The <strong>Steam Achievement Unlocker</strong> feature in SGI allows you to automatically unlock Steam
          achievements in a way that looks natural. If you&apos;re searching for a Steam achievement unlocker to auto
          unlock achievements, SGI offers the safest and most advanced solution. Our achievement unlocking tool is
          designed to help you unlock achievements for any game you own, with options for manual and automatic
          unlocking.
        </p>
        <p className='mt-4 text-black'>
          For anyone looking to unlock achievements safely, SGI&apos;s Steam achievement unlocker and achievement
          unlocking tool are the most reliable choices. Read our guides for more details.
        </p>
      </>
    ),
  },
  {
    section: 'Card Farmer & Playtime Booster',
    heading: 'Card Farmer & Playtime Booster',
    content: (
      <>
        <p className='mb-4 text-black'>
          SGI is a powerful <strong>Steam idle</strong> tool and card farmer, letting you idle Steam games to boost
          playtime and automatically farm trading cards. If you&apos;re searching for a Steam idle solution or want to
          idle steam games for playtime, SGI offers advanced automation for maximizing card drops and playtime. Our
          Steam idle tool supports up to 32 games at once, making it the best choice for efficient Steam idling and card
          farming.
        </p>
        <p className='mt-4 text-black'>
          For the best Steam idle experience and card farming, SGI is the most advanced tool for idling steam games.
        </p>
      </>
    ),
  },
]

function AccordionItem({
  question,
  answer,
  open,
  onToggle,
}: {
  question: string
  answer: string
  open: boolean
  onToggle: () => void
}): ReactElement {
  return (
    <div className='border border-black/5 hover:border-black/10 rounded-xl bg-white hover:bg-[#00000003] duration-150'>
      <button
        className='w-full text-left p-4 font-semibold text-gray-800 focus:outline-none flex justify-between items-center cursor-pointer'
        aria-expanded={open}
        aria-controls={question.replace(/\s+/g, '-')}
        onClick={onToggle}
      >
        <h3 className='text-[16px] font-semibold'>{question}</h3>
        <span className='ml-2 text-gray-400 text-2xl'>{open ? '-' : '+'}</span>
      </button>
      <div
        id={question.replace(/\s+/g, '-')}
        className='text-gray-700 overflow-hidden transition-all duration-300 ease-in-out'
        style={{
          maxHeight: open ? '500px' : '0px',
          opacity: open ? 1 : 0,
          paddingTop: open ? '0.5rem' : '0',
          paddingBottom: open ? '1rem' : '0',
          paddingLeft: open ? '1rem' : '0',
          paddingRight: open ? '1rem' : '0',
        }}
        aria-hidden={!open}
      >
        {answer}
      </div>
    </div>
  )
}

export default function FAQSection(): ReactElement {
  // State: { [section]: openQuestion }
  const [openItems, setOpenItems] = useState<{ [section: string]: string | null }>({})

  // Helper to render accordions for a section
  function renderAccordionItems(section: string, items: { question: string; answer: string }[]): ReactElement[] {
    return items.map(({ question, answer }) => (
      <AccordionItem
        key={question}
        question={question}
        answer={answer}
        open={openItems[section] === question}
        onToggle={() =>
          setOpenItems(prev => ({
            ...prev,
            [section]: prev[section] === question ? null : question,
          }))
        }
      />
    ))
  }

  // Prepare FAQ data for rendering
  const preparedFaqData = faqData.map(section => {
    // Extract AccordionItems from section.content
    // We'll need to replace the static <AccordionItem ... />s with data objects
    // For brevity, let's define the questions/answers here:
    let items: { question: string; answer: string }[] = []
    if (section.section === 'Steam Achievement Manager') {
      items = [
        {
          question: 'What is a Steam achievement manager?',
          answer:
            "A Steam achievement manager is a tool that allows you to unlock, lock, and manage achievements for Steam games. SGI's Steam achievement manager provides a safe, intuitive interface for achievement management and achievement unlocking.",
        },
        {
          question: 'Can I use SGI to lock and unlock achievements?',
          answer:
            "Yes, SGI's Steam achievement manager lets you lock and unlock achievements for any game you own, as well as modify achievement statistics. You can unlock achievements manually or in bulk.",
        },
        {
          question: 'Is it safe to use a Steam achievement manager?',
          answer:
            'SGI is designed with safety in mind, using human-like behavior and official Steamworks SDK methods to minimize risk.',
        },
        {
          question: 'Will using a Steam achievement manager affect my profile?',
          answer:
            "Unlocking achievements with SGI's Steam achievement manager will update your Steam profile and completion percentage on tracking sites.",
        },
      ]
    } else if (section.section === 'Steam Achievement Unlocker') {
      items = [
        {
          question: 'What is a Steam achievement unlocker?',
          answer:
            "A Steam achievement unlocker is a tool that lets you automatically unlock achievements for your games. SGI's Steam achievement unlocker uses human-like timing and methods for safety.",
        },
        {
          question: 'Can I auto unlock achievements for multiple games?',
          answer:
            "Yes, SGI's Steam achievement unlocker allows you to add multiple games to your unlocker list and unlock achievements one game at a time for legitimacy. You can also unlock achievements manually.",
        },
        {
          question: 'Is it safe to use a Steam achievement unlocker?',
          answer:
            "SGI's achievement unlocking tool is designed to minimize risk by mimicking natural achievement earning behavior.",
        },
        {
          question: "Can I unlock achievements for games I don't own?",
          answer: 'No, you can only unlock achievements for games you own or have access to via family sharing.',
        },
      ]
    } else if (section.section === 'Card Farmer & Playtime Booster') {
      items = [
        {
          question: 'What is a Steam idle tool?',
          answer:
            "A Steam idle tool lets you simulate playing games to boost playtime and earn trading cards. SGI's Steam idle feature is fast, safe, and easy to use. You can idle steam games in the background for hours.",
        },
        {
          question: 'How many games can I idle at once?',
          answer:
            'SGI supports idling up to 32 games simultaneously, which is the maximum allowed by the Steam client. You can idle steam games for card drops and playtime.',
        },
        {
          question: 'Can I get banned for using a Steam idle tool?',
          answer: 'SGI uses official Steamworks SDK methods and mimics normal gaming activity, minimizing risk.',
        },
        {
          question: 'Why am I not getting card drops while idling?',
          answer:
            'You may have reached the card drop limit for a game, or your account may be too new. See our documentation for troubleshooting tips.',
        },
      ]
    }
    return {
      ...section,
      accordionItems: items,
    }
  })

  return (
    <section className='py-12 sm:py-16 md:py-20 lg:py-24 relative' aria-labelledby='faq-heading'>
      {/* Top transition border */}
      <div className='absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-purple-300 to-transparent' />

      {/* Bottom transition overlay */}
      <div className='absolute bottom-0 left-0 right-0 h-32 bg-linear-to-b from-transparent to-emerald-50/50' />

      <div className='container relative z-10 px-4 sm:px-6 md:px-8'>
        {/* Header */}
        <header className='max-w-3xl mx-auto text-center mb-12 sm:mb-16 lg:mb-20'>
          <h2
            className='text-3xl sm:text-4xl md:text-5xl font-black text-gray-800 mb-6 sm:mb-8 leading-tight'
            id='faq-heading'
          >
            FREQUENTLY ASKED{' '}
            <span className='block text-transparent bg-clip-text bg-linear-to-r from-[#ff0606] to-[#ffbd06]'>
              QUESTIONS
            </span>
          </h2>
          <p className='text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed'>
            Find answers to common questions about our Steam achievement manager, Steam achievement unlocker, and Steam
            idle features. SGI is designed to be the safest and most advanced Steam automation tool for achievement
            management, unlocking, and card farming.
          </p>
        </header>

        {/* FAQ grid */}
        <div className='flex flex-wrap gap-8 max-w-6xl mx-auto'>
          {preparedFaqData.map((section, idx) => (
            <article
              key={section.section}
              className='group block relative overflow-hidden bg-white border-2 border-gray-200 hover:border-gray-300 rounded-3xl p-8 hover:shadow-lg transition-all duration-200 transform'
            >
              {/* Background gradient */}
              <div className='absolute inset-0 bg-linear-to-br from-gray-50 to-gray-70 opacity-0 group-hover:opacity-50 transition-opacity duration-200' />

              {/* Content */}
              <div className='relative z-10'>
                <h2 className='text-2xl font-bold text-gray-900 mb-4' id={section.heading.replace(/\s+/g, '-')}>
                  {section.heading}
                </h2>
                {/* Section description */}
                {section.content.props.children[0]}
                {/* Accordions */}
                <div className='space-y-2'>{renderAccordionItems(section.section, section.accordionItems)}</div>
                {/* Section footer */}
                {section.content.props.children[2]}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
