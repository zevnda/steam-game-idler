import type { LoaderPlugin } from 'fumadocs-core/source'
import type { IconType } from 'react-icons'
import { createElement } from 'react'
import {
  TbAdjustments,
  TbAward,
  TbBook,
  TbBug,
  TbBuildingStore,
  TbCards,
  TbCreditCard,
  TbCrown,
  TbDownload,
  TbGift,
  TbHammer,
  TbHeart,
  TbHelpCircle,
  TbHourglassLow,
  TbKey,
  TbKeyboard,
  TbPalette,
  TbPlayerPlay,
  TbPlus,
  TbSettings,
  TbTool,
  TbTrophy,
  TbUserCheck,
  TbUsers,
} from 'react-icons/tb'

/**
 * The docs sidebar's icons, by the name a page's frontmatter `icon:` (or a folder's meta.json
 * `icon`) gives. Tabler, the desktop app's own icon set, so a feature or settings tab carries the
 * same icon here as in the app's sidebar (src/shared/components/dashboard/Sidebar.tsx) and
 * settings (src/features/settings/components/SettingsModal.tsx) - match those when they change.
 * Pages with no app counterpart use the nearest fitting Tabler icon. Pages inside a feature folder
 * (How It Works, Special Flags...) deliberately have none - only the folder carries one.
 *
 * An explicit list rather than `import * as Tb` (fumadocs' lucide plugin does that with Lucide):
 * the whole Tabler set is thousands of icons, and an unknown name should be caught, not resolved.
 */
const ICONS: Record<string, IconType> = {
  TbAdjustments,
  TbAward,
  TbBook,
  TbBug,
  TbBuildingStore,
  TbCards,
  TbCreditCard,
  TbCrown,
  TbDownload,
  TbGift,
  TbHammer,
  TbHeart,
  TbHelpCircle,
  TbHourglassLow,
  TbKey,
  TbKeyboard,
  TbPalette,
  TbPlayerPlay,
  TbPlus,
  TbSettings,
  TbTool,
  TbTrophy,
  TbUserCheck,
  TbUsers,
}

/**
 * Resolves the page tree's icon names into Tabler icons - the same shape as fumadocs' own
 * lucideIconsPlugin (its generic icon plugin isn't exported), over this file's list.
 */
export function tablerIconsPlugin() {
  const resolve = <T extends { icon?: unknown }>(node: T) => {
    if (typeof node.icon !== 'string') return node
    const Icon = ICONS[node.icon]
    if (!Icon) console.warn(`[docs icons] Unknown icon "${node.icon}" - add it to lib/docsIcons.ts`)
    node.icon = Icon ? createElement(Icon) : undefined
    return node
  }

  return {
    name: 'sgi:tabler-icons',
    transformPageTree: { file: resolve, folder: resolve, separator: resolve },
  } satisfies LoaderPlugin
}
