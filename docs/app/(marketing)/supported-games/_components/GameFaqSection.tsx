import type { GameData } from '../_data/games'
import Script from 'next/script'

export default function GameFaqSection({ game }: { game: GameData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': game.faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer },
    })),
  }

  return (
    <section className='py-16 sm:py-20 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-3xl'>
        <Script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />

        <h2 className='text-3xl sm:text-4xl text-text-primary mb-10 text-center tracking-tight'>
          Frequently asked <span className='gradient-text'>questions</span>
        </h2>

        <div className='flex flex-col gap-3'>
          {game.faqs.map(faq => (
            <div key={faq.question} className='p-5 rounded-lg border border-border bg-white/3'>
              <h3 className='text-sm font-semibold text-text-primary mb-2'>{faq.question}</h3>
              <p className='text-sm text-text-muted leading-relaxed'>{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
