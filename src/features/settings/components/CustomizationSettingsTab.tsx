import type { FontPreset } from '@/shared/theme/font'
import type { ThemePreset } from '@/shared/theme/presets'
import type { Settings } from '../types'
import { open } from '@tauri-apps/plugin-dialog'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { customizationErrorMessageKey } from '../utils/errorMessageKey'
import {
  Alert,
  Button,
  cn,
  ListBox,
  Radio,
  RadioGroup,
  Select,
  Separator,
  Skeleton,
  toast,
  Typography,
} from '@heroui/react'
import { AppTooltip } from '@/shared/components/AppTooltip'
import { SettingsRow } from '@/shared/components/SettingsRow'
import { TierBadge } from '@/shared/components/TierBadge'
import { ToggleSwitch } from '@/shared/components/ToggleSwitch'
import { useCarouselSettingsStore } from '@/shared/stores/carouselSettingsStore'
import { useCustomBackgroundStore } from '@/shared/stores/customBackgroundStore'
import { useDisableTooltipsStore } from '@/shared/stores/disableTooltipsStore'
import { useProModalStore } from '@/shared/stores/proModalStore'
import { useSubscriptionStore } from '@/shared/stores/subscriptionStore'
import { applyFont, FONT_STORAGE_KEY } from '@/shared/theme/applyFont'
import { applyTheme, THEME_STORAGE_KEY } from '@/shared/theme/applyTheme'
import { FONT_DISPLAY_NAMES, FONT_KEYS } from '@/shared/theme/font'
import {
  DEFAULT_THEME_PREVIEW_TOKENS,
  isLightThemePreset,
  THEME_PRESETS,
} from '@/shared/theme/presets'
import { invoke } from '@/shared/utils/invoke'
import { hasCasualAccess } from '@/shared/utils/subscriptionAccess'

interface CustomizationSettingsTabProps {
  settings: Settings | null
  isLoading: boolean
  loadErrorCode: string | null
  actionErrorCode: string | null
  onRefresh: () => void
  onSaveTheme: (theme: string) => Promise<boolean>
  onSaveDisableTooltips: (enabled: boolean) => Promise<boolean>
  onSaveShowRecommendedCarousel: (enabled: boolean) => Promise<boolean>
  onSaveShowRecentCarousel: (enabled: boolean) => Promise<boolean>
  onSaveCustomBackground: (path: string) => Promise<boolean>
  onClearCustomBackground: () => Promise<boolean>
  onSaveFont: (font: string) => Promise<boolean>
}

// Theme keys in display order, `default` first - `THEME_PRESETS` itself has no entry for `default`
// (see that file's header comment), so its preview tokens are read from
// `DEFAULT_THEME_PREVIEW_TOKENS` instead of the registry.
const THEME_KEYS: (ThemePreset | 'default')[] = [
  'default',
  'blue',
  'red',
  'purple',
  'pink',
  'orange',
  'black',
  'white',
]

// The last of 11 settings categories - built once its underlying features (multi-theme system,
// custom background, dashboard carousels, global `disableTooltips`) existed in full.
// Theme/background are Casual-tier gated; the two carousel visibility toggles and the tooltip
// toggle are free for everyone - gating only applies to *which* theme/background can be picked, not
// whether
// this tab's controls are usable at all.
export const CustomizationSettingsTab = ({
  settings,
  isLoading,
  loadErrorCode,
  actionErrorCode,
  onRefresh,
  onSaveTheme,
  onSaveDisableTooltips,
  onSaveShowRecommendedCarousel,
  onSaveShowRecentCarousel,
  onSaveCustomBackground,
  onClearCustomBackground,
  onSaveFont,
}: CustomizationSettingsTabProps) => {
  const { t } = useTranslation()
  const subscriptionTier = useSubscriptionStore(state => state.subscriptionTier)
  const canUseCasualFeatures = hasCasualAccess(subscriptionTier)
  const openProModalWithTier = useProModalStore(state => state.openWithTier)

  const disableTooltips = useDisableTooltipsStore(state => state.disabled)
  const setDisableTooltips = useDisableTooltipsStore(state => state.setDisabled)
  const showRecommended = useCarouselSettingsStore(state => state.showRecommended)
  const setShowRecommended = useCarouselSettingsStore(state => state.setShowRecommended)
  const showRecent = useCarouselSettingsStore(state => state.showRecent)
  const setShowRecent = useCarouselSettingsStore(state => state.setShowRecent)
  const backgroundDataUrl = useCustomBackgroundStore(state => state.dataUrl)
  const setBackgroundDataUrl = useCustomBackgroundStore(state => state.setDataUrl)
  const [isChoosingBackground, setIsChoosingBackground] = useState(false)
  const [isClearingBackground, setIsClearingBackground] = useState(false)

  const reportError = (code: string | null) => {
    if (code) {
      toast.danger(t(customizationErrorMessageKey(code), { code }))
    }
  }

  const handleToggleTooltips = async (next: boolean) => {
    const ok = await onSaveDisableTooltips(next)
    if (ok) {
      setDisableTooltips(next)
    } else {
      reportError(actionErrorCode)
    }
  }

  const handleToggleRecommended = async (next: boolean) => {
    const ok = await onSaveShowRecommendedCarousel(next)
    if (ok) {
      setShowRecommended(next)
    } else {
      reportError(actionErrorCode)
    }
  }

  const handleToggleRecent = async (next: boolean) => {
    const ok = await onSaveShowRecentCarousel(next)
    if (ok) {
      setShowRecent(next)
    } else {
      reportError(actionErrorCode)
    }
  }

  const handleChooseBackground = async () => {
    const path = await open({
      multiple: false,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif'] }],
    })
    if (!path) return

    setIsChoosingBackground(true)
    try {
      const ok = await onSaveCustomBackground(path)
      if (ok) {
        try {
          setBackgroundDataUrl(await invoke<string | null>('get_custom_background_data_url'))
          toast.success(t('dashboard.settings.customization.background.saved'))
        } catch (error) {
          console.error('Error in (get_custom_background_data_url):', error)
        }
      } else {
        reportError(actionErrorCode)
      }
    } finally {
      setIsChoosingBackground(false)
    }
  }

  const handleClearBackground = async () => {
    setIsClearingBackground(true)
    try {
      const ok = await onClearCustomBackground()
      if (ok) {
        setBackgroundDataUrl(null)
        toast.success(t('dashboard.settings.customization.background.cleared'))
      } else {
        reportError(actionErrorCode)
      }
    } finally {
      setIsClearingBackground(false)
    }
  }

  // Applies immediately for a live preview (not just after the next reload), then persists -
  // mirrors `useTheme.ts`'s own resolution logic (`default` clears any inline override). A locked
  // (non-default, non-casual-tier) selection opens the upsell instead of saving - the swatch itself
  // is deliberately not `isDisabled` (see the swatch render below for why), so this guard is what
  // actually prevents a gated theme from ever being applied for a non-eligible account; because
  // `RadioGroup`'s `value` stays bound to `settings.theme`, skipping the save also means the radio
  // never visually moves off the current selection.
  const handleSelectTheme = async (theme: string) => {
    if (theme !== 'default' && !canUseCasualFeatures) {
      openProModalWithTier('casual')
      return
    }

    const ok = await onSaveTheme(theme)
    if (ok) {
      applyTheme(
        theme === 'default' ? null : THEME_PRESETS[theme as ThemePreset],
        isLightThemePreset(theme) ? 'light' : 'dark',
      )
      localStorage.setItem(THEME_STORAGE_KEY, theme)
      toast.success(t('dashboard.settings.customization.theme.saved'))
    } else {
      reportError(actionErrorCode)
    }
  }

  // Mirrors `handleSelectTheme` exactly, applied to the font choice instead of theme tokens - a
  // locked (non-`inter`, non-casual-tier) selection opens the upsell instead of saving, and
  // `Select.Root`'s `selectedKey` stays bound to `settings.font` so a skipped save never visually
  // moves the dropdown off the current selection.
  const handleSelectFont = async (font: string) => {
    if (font !== 'inter' && !canUseCasualFeatures) {
      openProModalWithTier('casual')
      return
    }

    const ok = await onSaveFont(font)
    if (ok) {
      applyFont(font === 'inter' ? null : (font as FontPreset))
      localStorage.setItem(FONT_STORAGE_KEY, font)
      toast.success(t('dashboard.settings.customization.font.saved'))
    } else {
      reportError(actionErrorCode)
    }
  }

  if (loadErrorCode) {
    return (
      <div className='flex flex-col items-center gap-4 p-8 text-center'>
        <Alert className='max-w-md' status='danger'>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{t('dashboard.settings.errors.title')}</Alert.Title>
            <Alert.Description>
              {t(customizationErrorMessageKey(loadErrorCode), { code: loadErrorCode })}
            </Alert.Description>
          </Alert.Content>
        </Alert>
        <Button variant='secondary' onPress={onRefresh}>
          {t('common.actions.tryAgain')}
        </Button>
      </div>
    )
  }

  if (isLoading || !settings) {
    return (
      <div className='flex flex-col gap-4'>
        <Typography type='h3' className='font-bold mb-4'>
          {t('dashboard.settings.customization.title')}
        </Typography>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className='h-10 w-full rounded-lg' />
        ))}
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-4'>
      <Typography type='h3' className='font-bold mb-4'>
        {t('dashboard.settings.customization.title')}
      </Typography>

      <SettingsRow
        description={t('dashboard.settings.customization.tooltips.description')}
        title={t('dashboard.settings.customization.tooltips.label')}
      >
        <ToggleSwitch isSelected={disableTooltips} onChange={handleToggleTooltips} />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.settings.customization.carousels.recommended.description')}
        title={t('dashboard.settings.customization.carousels.recommended.label')}
      >
        <ToggleSwitch isSelected={showRecommended} onChange={handleToggleRecommended} />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.settings.customization.carousels.recent.description')}
        title={t('dashboard.settings.customization.carousels.recent.label')}
      >
        <ToggleSwitch isSelected={showRecent} onChange={handleToggleRecent} />
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.settings.customization.font.description')}
        showDivider={true}
        title={
          <span className='flex items-center gap-2'>
            {t('dashboard.settings.customization.font.label')}
            {!canUseCasualFeatures && <TierBadge tier='casual' />}
          </span>
        }
      >
        {/* Not a fully locked control like GeneralSettingsTab's persona-state Select - `inter`
            stays free for everyone, matching the theme swatches' "default always available"
            pattern. Every font key stays selectable; `handleSelectFont` (not this component) is
            what actually stops a gated font from being applied, mirroring `handleSelectTheme`. */}
        <Select.Root
          aria-label={t('dashboard.settings.customization.font.label')}
          className='w-48'
          selectedKey={settings.font}
          onSelectionChange={key => handleSelectFont(key as string)}
        >
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            {/* No per-item lock badge - the row-level TierBadge above already signals the gate for
                the whole control; `handleSelectFont` (not this component) is what actually stops a
                gated font from being applied. */}
            <ListBox items={FONT_KEYS.map(key => ({ id: key }))}>
              {item => (
                <ListBox.Item id={item.id} textValue={FONT_DISPLAY_NAMES[item.id]}>
                  {FONT_DISPLAY_NAMES[item.id]}
                </ListBox.Item>
              )}
            </ListBox>
          </Select.Popover>
        </Select.Root>
      </SettingsRow>

      <SettingsRow
        description={t('dashboard.settings.customization.background.description')}
        showDivider={false}
        title={
          <span className='flex items-center gap-2'>
            {t('dashboard.settings.customization.background.label')}
            {!canUseCasualFeatures && <TierBadge tier='casual' />}
          </span>
        }
      >
        <div className='flex items-center gap-2'>
          {canUseCasualFeatures ? (
            <Button
              isDisabled={isClearingBackground}
              isPending={isChoosingBackground}
              size='sm'
              variant='secondary'
              onPress={handleChooseBackground}
            >
              {t('dashboard.settings.customization.background.choose')}
            </Button>
          ) : (
            <AppTooltip.Root>
              <AppTooltip.Trigger>
                {/* Not `isDisabled` - HeroUI's Button maps that to a real native `disabled`
                    attribute, which suppresses real trusted click events entirely (confirmed live
                    via CDP), not just bubbling. Styled to look disabled instead, with a real
                    `onPress` that opens the upsell - the same reason InventoryPageHeader/
                    AchievementOrderOverlay's gated buttons below do the same. */}
                <Button
                  className='opacity-50'
                  size='sm'
                  variant='secondary'
                  onPress={() => openProModalWithTier('casual')}
                >
                  {t('dashboard.settings.customization.background.choose')}
                </Button>
              </AppTooltip.Trigger>
              <AppTooltip.Content>{t('common.proTier.casualRequired')}</AppTooltip.Content>
            </AppTooltip.Root>
          )}
          {/* Not gated behind `canUseCasualFeatures` unlike "Choose" above - a background set while
              subscribed must stay clearable after a downgrade (it already stops rendering per
              CustomBackground.tsx's own tier check regardless), or the file would be stuck on disk
              with no UI path to remove it short of "Reset all settings". */}
          <Button
            isDisabled={isChoosingBackground || !backgroundDataUrl}
            isPending={isClearingBackground}
            size='sm'
            variant='secondary'
            onPress={handleClearBackground}
          >
            {t('common.actions.clear')}
          </Button>
        </div>
      </SettingsRow>
      <Separator className='border-t border-border my-2' />

      <div className='flex flex-col gap-2'>
        <span className='flex items-center gap-2'>
          <Typography type='body-sm' weight='semibold'>
            {t('dashboard.settings.customization.theme.label')}
          </Typography>
          {!canUseCasualFeatures && <TierBadge tier='casual' />}
        </span>
        <Typography color='muted' type='body-xs'>
          {t('dashboard.settings.customization.theme.description')}
        </Typography>

        <RadioGroup
          aria-label={t('dashboard.settings.customization.theme.label')}
          className='flex flex-row flex-wrap gap-3 pt-1'
          value={settings.theme}
          onChange={handleSelectTheme}
        >
          {THEME_KEYS.map(key => {
            const tokens = key === 'default' ? DEFAULT_THEME_PREVIEW_TOKENS : THEME_PRESETS[key]
            const isLocked = key !== 'default' && !canUseCasualFeatures
            const swatch = (
              // Not `isDisabled` - same reason as the background "Choose image" button above:
              // HeroUI's `Radio` mirrors Button's native-disabled semantics, which would silently
              // swallow the real click a locked swatch needs to open the upsell. Styled locked via
              // a plain conditional className instead of `data-disabled`, and `handleSelectTheme`
              // (not this component) is what actually stops a gated theme from being applied.
              <Radio value={key}>
                <Radio.Content
                  className={cn(
                    'flex w-16 flex-col items-center gap-1 rounded-lg p-2 outline-none data-focus-visible:ring-2 data-focus-visible:ring-focus data-selected:ring-2 data-selected:ring-accent',
                    isLocked ? 'opacity-50' : 'cursor-pointer',
                  )}
                >
                  <span
                    className='h-8 w-8 rounded-full border border-border'
                    style={{ background: tokens.background }}
                  />
                  <span className='w-full truncate text-center text-xs'>
                    {t(`dashboard.settings.customization.theme.names.${key}`)}
                  </span>
                </Radio.Content>
              </Radio>
            )

            if (!isLocked) return <div key={key}>{swatch}</div>

            return (
              <AppTooltip.Root key={key}>
                <AppTooltip.Trigger>{swatch}</AppTooltip.Trigger>
                <AppTooltip.Content>{t('common.proTier.casualRequired')}</AppTooltip.Content>
              </AppTooltip.Root>
            )
          })}
        </RadioGroup>
      </div>
    </div>
  )
}
