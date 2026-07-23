import type { GameData } from '../_data/games'
import { TbCheck, TbMinus, TbX } from 'react-icons/tb'
import { getFeatureDocsLink } from '../_data/featureLinks'
import Link from 'next/link'
import CardBorder from '@/app/(marketing)/(home)/_components/CardBorder'

interface SupportRow {
  feature: string
  status: 'yes' | 'no' | 'varies'
  note: string
}

function buildRows(game: GameData) {
  const hasAchievements = game.hasAchievements !== false

  const rows: SupportRow[] = [
    {
      feature: 'Card Farming',
      status: game.hasCards === false ? 'no' : game.hasCards === true ? 'yes' : 'varies',
      note:
        game.hasCards === false
          ? `${game.name} doesn't have a Steam trading card badge`
          : game.hasCards === true
            ? 'Idle for trading card drops in the background'
            : 'Card availability has shifted for this title - check your account',
    },
    {
      feature: 'Achievement Manager',
      status: hasAchievements ? 'yes' : 'no',
      note: hasAchievements
        ? 'View and manage every achievement from one screen'
        : `${game.name} doesn't expose a Steam achievement list`,
    },
    {
      feature: 'Achievement Unlocker',
      status: hasAchievements ? 'yes' : 'no',
      note: hasAchievements
        ? 'Automatically unlock eligible achievements with human-like timing'
        : 'Not applicable - no achievement list to unlock',
    },
    {
      feature: 'Idling & Playtime',
      status: 'yes',
      note: 'Build playtime and card-drop eligibility in the background',
    },
    {
      feature: 'Auto-Idle Scheduling',
      status: 'yes',
      note: 'Queue recurring idling sessions without starting them manually',
    },
    {
      feature: 'Multi-Account Idling',
      status: game.gcTitle ? 'no' : 'yes',
      note: game.gcTitle
        ? "Not available - Agent Mode can't reach this Game Coordinator title"
        : 'Idle across multiple Agent Mode accounts at once, tier limits permitting',
    },
    {
      feature: 'Sign-in Method',
      status: game.gcTitle ? 'varies' : 'yes',
      note: game.gcTitle
        ? 'Legacy Sign-in (CLI) only, with a real local Steam client'
        : 'Works with either Agent Mode or Legacy Sign-in',
    },
  ]

  return rows
}

function StatusIcon({ status }: { status: SupportRow['status'] }) {
  if (status === 'yes') return <TbCheck className='w-4 h-4 text-emerald-400' />
  if (status === 'no') return <TbX className='w-4 h-4 text-text-muted' />
  return <TbMinus className='w-4 h-4 text-amber-400' />
}

export default function GameSupportTable({ game }: { game: GameData }) {
  const rows = buildRows(game)

  return (
    <section className='py-16 sm:py-20 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-4xl'>
        <h2 className='text-3xl sm:text-4xl text-text-primary mb-4 text-center tracking-tight'>
          What&apos;s <span className='gradient-text'>supported</span> for {game.name}
        </h2>
        <p className='text-text-muted text-center max-w-2xl mx-auto mb-10 leading-relaxed'>
          Not every Steam Game Idler feature applies the same way to every game - here&apos;s
          exactly what works for {game.name}.
        </p>

        <div
          className='relative overflow-hidden'
          style={{ backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-card)' }}
        >
          <CardBorder />
          <div className='overflow-x-auto'>
            <table className='w-full text-left border-collapse'>
              <thead>
                <tr className='border-b border-border'>
                  <th className='px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider'>
                    Feature
                  </th>
                  <th className='px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden sm:table-cell'>
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const docsHref = getFeatureDocsLink(row.feature)

                  return (
                    <tr
                      key={row.feature}
                      className={i === rows.length - 1 ? '' : 'border-b border-border'}
                    >
                      <td className='px-5 py-3.5 text-sm font-medium whitespace-nowrap'>
                        {docsHref ? (
                          <Link
                            prefetch={false}
                            href={docsHref}
                            className='text-text-primary hover:text-accent transition-colors duration-150 underline decoration-border underline-offset-4 hover:decoration-accent'
                          >
                            {row.feature}
                          </Link>
                        ) : (
                          <span className='text-text-primary'>{row.feature}</span>
                        )}
                      </td>
                      <td className='px-5 py-3.5'>
                        <StatusIcon status={row.status} />
                      </td>
                      <td className='px-5 py-3.5 text-sm text-text-muted leading-relaxed hidden sm:table-cell'>
                        {row.note}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
