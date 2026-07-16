import type { InventorySettings, PricePreference } from '../types'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CURRENCY_OPTIONS,
  getCurrencyDecimalPlaces,
  getCurrencyNumberFormatOptions,
  getCurrencyStep,
} from '../utils/currency'
import { errorMessageKey } from '../utils/errorMessageKey'
import { Alert, Button, ListBox, Select, Skeleton, toast, Typography } from '@heroui/react'
import { InputField } from '@/shared/components/InputField'
import { SettingsRow } from '@/shared/components/SettingsRow'

interface InventorySettingsTabProps {
  settings: InventorySettings | null
  isLoading: boolean
  isSaving: boolean
  loadErrorCode: string | null
  actionErrorCode: string | null
  onRefresh: () => void
  onSave: (next: InventorySettings) => Promise<boolean>
}

const PRICE_PREFERENCES: PricePreference[] = ['highestBuyOrder', 'lowestSellOrder']

// The inventory-manager category of the (app-wide) SettingsModal - mirrors
// AchievementUnlockerSettingsTab.tsx's shape (draft-state-plus-auto-save, per-field layout, every
// field committing on change rather than an explicit Save button). `pricePreference` is a
// two-button toggle rather than a `Select` - the same "exactly two real options" reasoning
// achievement-unlocker's `nextTask` toggle already used. `currency` has ~35 real options, so it's
// this rewrite's first real use of `Select`/`ListBox` (react-aria-components' dynamic-collection
// composition: `Select.Popover` wraps a `ListBox` fed `items`, rather than static `Select.Item`
// children) - see `../utils/currency.ts` for the Steam currency-ID list ported from `main`'s now-
// deleted `src/shared/constants.ts`.
export const InventorySettingsTab = ({
  settings,
  isLoading,
  loadErrorCode,
  actionErrorCode,
  onRefresh,
  onSave,
}: InventorySettingsTabProps) => {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<InventorySettings | null>(null)

  useEffect(() => {
    if (!isLoading && settings) {
      setDraft(settings)
    }
  }, [isLoading, settings])

  // Every field change flows through here - see AchievementUnlockerSettingsTab.tsx's identical
  // `commit` for why (optimistic update, persist, revert + toast on failure).
  const commit = async (next: InventorySettings) => {
    setDraft(next)
    const ok = await onSave(next)
    if (!ok) {
      setDraft(settings)
      if (actionErrorCode) {
        toast.danger(t(errorMessageKey(actionErrorCode), { code: actionErrorCode }))
      }
    }
    return ok
  }

  if (loadErrorCode) {
    return (
      <div className='flex flex-col items-center gap-4 p-8 text-center'>
        <Alert className='max-w-md' status='danger'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('dashboard.settings.errors.title')}</Alert.Title>
            <Alert.Description>
              {t(errorMessageKey(loadErrorCode), { code: loadErrorCode })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <Button variant='secondary' onPress={onRefresh}>
          {t('common.actions.tryAgain')}
        </Button>
      </div>
    )
  }

  if (isLoading || !draft) {
    return (
      <div className='flex flex-col gap-4'>
        <Typography type='h3' className='font-bold mb-4'>
          {t('dashboard.sidebar.nav.inventoryManager')}
        </Typography>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className='h-10 w-full rounded-lg' />
        ))}
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      <Typography type='h3' className='font-bold mb-4'>
        {t('dashboard.sidebar.nav.inventoryManager')}
      </Typography>

      <SettingsRow
        description={t('dashboard.inventoryManager.settings.currency.description')}
        title={t('dashboard.inventoryManager.settings.currency.title')}
      >
        <Select.Root
          aria-label={t('dashboard.inventoryManager.settings.currency.title')}
          className='w-32'
          selectedKey={draft.currency}
          onSelectionChange={key => commit({ ...draft, currency: String(key) })}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox items={CURRENCY_OPTIONS}>
              {item => (
                <ListBox.Item id={item.id}>
                  {item.label} <ListBox.ItemIndicator />
                </ListBox.Item>
              )}
            </ListBox>
          </Select.Popover>
        </Select.Root>
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.inventoryManager.settings.pricePreference.description')}
        title={t('dashboard.inventoryManager.settings.pricePreference.title')}
      >
        <div className='flex items-center gap-2'>
          {PRICE_PREFERENCES.map(option => (
            <Button
              key={option}
              size='sm'
              variant={draft.pricePreference === option ? 'primary' : 'secondary'}
              onPress={() => commit({ ...draft, pricePreference: option })}
            >
              {t(`dashboard.inventoryManager.settings.pricePreference.options.${option}`)}
            </Button>
          ))}
        </div>
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.inventoryManager.settings.priceAdjustment.description', {
          value: draft.priceAdjustment.toFixed(getCurrencyDecimalPlaces(draft.currency)),
        })}
        title={t('dashboard.inventoryManager.settings.priceAdjustment.title')}
      >
        <InputField
          ariaLabel='price adjustment'
          className='w-32'
          formatOptions={getCurrencyNumberFormatOptions(draft.currency)}
          step={getCurrencyStep(draft.currency)}
          value={draft.priceAdjustment}
          onCommit={value => commit({ ...draft, priceAdjustment: value })}
        />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.inventoryManager.settings.sellLimit.description', {
          min: draft.sellLimit.min.toFixed(getCurrencyDecimalPlaces(draft.currency)),
          max: draft.sellLimit.max.toFixed(getCurrencyDecimalPlaces(draft.currency)),
        })}
        title={t('dashboard.inventoryManager.settings.sellLimit.title')}
      >
        <div className='flex items-center gap-2'>
          <InputField
            ariaLabel='sell limit minimum'
            className='w-28'
            formatOptions={getCurrencyNumberFormatOptions(draft.currency)}
            minValue={0.01}
            step={getCurrencyStep(draft.currency)}
            value={draft.sellLimit.min}
            onCommit={value =>
              commit({
                ...draft,
                sellLimit: {
                  min: value,
                  max: Math.max(value, draft.sellLimit.max),
                },
              })
            }
          />
          <InputField
            ariaLabel='sell limit maximum'
            className='w-28'
            formatOptions={getCurrencyNumberFormatOptions(draft.currency)}
            minValue={draft.sellLimit.min}
            step={getCurrencyStep(draft.currency)}
            value={draft.sellLimit.max}
            onCommit={value => commit({ ...draft, sellLimit: { ...draft.sellLimit, max: value } })}
          />
        </div>
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.inventoryManager.settings.sellDelay.description', {
          value: draft.sellDelay,
        })}
        showDivider={false}
        title={t('dashboard.inventoryManager.settings.sellDelay.title')}
      >
        <InputField
          ariaLabel='sell delay'
          className='w-28'
          minValue={1}
          value={draft.sellDelay}
          onCommit={value => commit({ ...draft, sellDelay: value })}
        />
      </SettingsRow>
    </div>
  )
}
