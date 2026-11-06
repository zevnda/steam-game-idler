import { useTranslation } from 'react-i18next'
import { TbCards, TbPackageExport } from 'react-icons/tb'
import { Button, cn } from '@heroui/react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { PageBanner, PageBannerPreview } from '@/shared/components/dashboard/PageBanner'
import { usePlatformStore } from '@/shared/stores/platformStore'
import { navigateWithPageTransition } from '@/shared/utils/pageTransition'

// Colourful trading cards for the preview, the same for everyone. The foil shows off the holo card
// style. Game and card names are brand names, so aren't translated, and the prices are made up.
const PREVIEW_ITEMS = [
  {
    name: 'General Rodriguez (Foil)',
    appName: 'Tropico 6',
    image:
      'https://steamcommunity-a.akamaihd.net/economy/image/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEfSMJ6dESN8p_2SVTY7V2N0GxnQOmChCIzb02ClKYOtpKsrKizf0pfCEG2HycnHNIiDeGQNpT-dXYTnf-zD2sbmcSmycFe8qRAADfqtR-mNPOsyMORU8hoMO-zW82VRzGVAqfddCdR2Ew3kSNrh4mSBAcc1XmCWkd8bbgwlhaUJiCLi2A-jKboiskypyWhIyG6MfZoLD6TuspsDnLPqEkbmqKMY',
    foil: true,
    price: 0.42,
  },
  {
    name: 'The Gunner',
    appName: 'Borderlands 3',
    image:
      'https://steamcommunity-a.akamaihd.net/economy/image/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEfSMJ6dESN8p_2SVTY7V2NoGw3YImChCIzb02ClZbeAnH97IzgDp5-uAHXPyNWWXfSCJRA0wGLRZNmvb-WGgtL6cETHNSOB4Sg4Ge6FQ-zJIOcvbNxojlNlc7We3hUB4DCkhf8RBdVLrk3VHMr9xmXcQc8kHmyH3dJOMgFxqPRRuDL3uVbXAatTwkyt1DxhhAeBEM53TtSfVUhiHEg',
    foil: false,
    price: 0.11,
  },
  {
    name: 'Forest Army',
    appName: 'Mushroom Wars',
    image:
      'https://steamcommunity-a.akamaihd.net/economy/image/IzMF03bk9WpSBq-S-ekoE33L-iLqGFHVaU25ZzQNQcXdA3g5gMEPvUZZEfSMJ6dESN8p_2SVTY7V2N0MxXEJmChCIzb02ClLavdpK9-N4Rf2uKSEEXXwbWrGLHiOGAZqTrJZYzre-TKk4-6SQT7PFeApRAAGfKoF9G0aNMCKa0c9ysdVrCO6mFZ5GwQXe8hHdwrmnnVBMO4mnSNHfZpWnyX4JcHbgVtlbkM8D-61X72XOofxlX0kXh1hSr5aOtyD_ijumhbE1JM',
    foil: false,
    price: 0.07,
  },
]

// A compact stand-in for InventoryItemCard, which needs far more width than a third of this panel for
// its price input and buttons. Keeps the parts that identify it: the card frame, art and a list button.
const PreviewItem = ({ item }: { item: (typeof PREVIEW_ITEMS)[number] }) => {
  const forceReducedMotion = usePlatformStore(state => state.forceReducedMotion) === true
  return (
    // Same foil glow as InventoryItemCard - a sibling behind the card (globals.css's `.holo-glow`)
    <div className='relative min-w-0'>
      {item.foil && (
        <span
          aria-hidden='true'
          className={cn('holo-glow rounded-xl', forceReducedMotion && 'force-reduced-motion')}
        />
      )}
      <div
        className={cn(
          'relative flex h-full min-w-0 flex-col items-center gap-1.5 rounded-xl bg-surface p-2',
          item.foil ? 'holo-card' : 'border border-border',
          item.foil && forceReducedMotion && 'force-reduced-motion',
        )}
      >
        <Image
          alt=''
          className='h-24 w-full object-contain'
          height={96}
          src={item.image}
          width={96}
        />
        <div className='flex w-full min-w-0 flex-col items-center text-xs'>
          <span className='w-full truncate text-center font-medium'>{item.name}</span>
          <span className='w-full truncate text-center text-muted'>{item.appName}</span>
        </div>
        <div className='flex w-full items-center justify-between gap-1 pl-1'>
          <span className='text-xs font-semibold tabular-nums'>
            {item.price.toLocaleString(undefined, { style: 'currency', currency: 'USD' })}
          </span>
          <Button isIconOnly className='bg-white text-black' size='sm'>
            <TbPackageExport fontSize={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export const InventoryPreview = () => {
  const { t } = useTranslation()

  return (
    <PageBannerPreview
      count={PREVIEW_ITEMS.length}
      title={t('dashboard.sidebar.nav.inventoryManager')}
    >
      {PREVIEW_ITEMS.map(item => (
        <PreviewItem key={item.name} item={item} />
      ))}
    </PageBannerPreview>
  )
}

// The account's inventory really has nothing marketable in it, as opposed to InventoryItemGrid's
// empty state, which is for search and filters hiding everything. Refresh and settings are already
// in the toolbar above, so the one button here points at how a user gets items to sell.
export const InventoryEmptyBanner = () => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <PageBanner
      actions={
        <Button
          className='bg-white text-black hover:bg-white/85'
          onPress={() => navigateWithPageTransition(router, '/dashboard/card-farming')}
        >
          <TbCards fontSize={18} />
          {t('dashboard.sidebar.nav.cardFarming')}
        </Button>
      }
      art={<InventoryPreview />}
      description={t('dashboard.inventoryManager.empty.noItemsDescription')}
      title={t('dashboard.inventoryManager.empty.title')}
    />
  )
}
