import type { Competitor } from '@/app/(marketing)/alternatives/_data/competitors'
import Image from 'next/image'
import CompareCell from '@/app/(marketing)/(home)/_components/landing/CompareCell'
import { StaggerGroup, StaggerItem } from '@/app/lib/animations'

interface AlternativeComparisonTableProps {
  competitor: Competitor
}

/**
 * The full SGI-vs-one-tool comparison, one block per category, drawn with the home page's
 * Compare table (`.cmp`) in its two-tool form (`.cmp__row--duo`). It sits directly under the page's
 * h1 with no section heading, so each category name is an h2.
 */
export default function AlternativeComparisonTable({
  competitor,
}: AlternativeComparisonTableProps) {
  return (
    <StaggerGroup className='space-y-5'>
      {competitor.comparisonData.map(section => (
        <StaggerItem key={section.category}>
          <div className='cmp' role='table' aria-label={`${section.category} comparison`}>
            <div className='cmp__row cmp__row--duo cmp__row--head' role='row'>
              <h2 className='cmp__category' role='columnheader'>
                {section.category}
              </h2>
              <div className='cmp__sgi-head' role='columnheader'>
                <Image src='/logo.png' alt='' width={20} height={20} />
                <span>Steam Game Idler</span>
              </div>
              <div className='cmp__tool-head' role='columnheader'>
                <span>{competitor.name}</span>
              </div>
            </div>
            {section.features.map(feature => (
              <div key={feature.name} className='cmp__row cmp__row--duo' role='row'>
                <div className='cmp__feature' role='rowheader'>
                  {feature.name}
                </div>
                <div className='cmp__sgi' role='cell'>
                  <CompareCell value={feature.steamGameIdler} sgi />
                </div>
                <div className='cmp__cell' role='cell'>
                  <CompareCell value={feature.alt} />
                </div>
              </div>
            ))}
          </div>
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}
