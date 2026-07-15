import type { ReactElement, ReactNode } from 'react'
import { Children, isValidElement } from 'react'
import { Tooltip } from '@heroui/react'
import { useDisableTooltipsStore } from '@/shared/stores/disableTooltipsStore'

type TooltipRootProps = React.ComponentProps<typeof Tooltip.Root>

interface AppTooltipRootProps extends TooltipRootProps {
  // Escape hatch for a tooltip that should still show even with the global setting on (mirrors
  // `main`'s identical `CustomTooltip` prop) - nothing currently uses this, but every call site
  // below could opt in without any other change.
  important?: boolean
}

// The one shared wrapper every tooltip in the app should go through, so `Settings.disableTooltips`
// has exactly one place to check rather than being threaded into 22 individual call sites -
// mirrors `main`'s `CustomTooltip`
// (confirmed via grep to be the *only* file there importing the raw HeroUI `Tooltip`). Re-exports
// the same `Root`/`Trigger`/`Content` compound shape HeroUI's own `Tooltip` uses, so converting an
// existing call site is a pure rename (`Tooltip.Root` -> `AppTooltip.Root`, etc.), never a
// restructure.
//
// When disabled (and not `important`), `Root` renders only the `Trigger`'s own children, completely
// unwrapped - not `TooltipTrigger`/`TooltipContent` themselves, which are react-aria-components
// bound to `TooltipRoot`'s context and would misbehave (or throw) rendered outside it.
const Root = ({ children, important, ...props }: AppTooltipRootProps) => {
  const disableTooltips = useDisableTooltipsStore(state => state.disabled)

  if (disableTooltips && !important) {
    const trigger = Children.toArray(children).find(
      (child): child is ReactElement<{ children?: ReactNode }> =>
        isValidElement(child) && child.type === Trigger,
    )
    return trigger?.props.children ?? null
  }

  return (
    <Tooltip.Root {...props} closeDelay={0}>
      {children}
    </Tooltip.Root>
  )
}

const Trigger = Tooltip.Trigger
const Content = Tooltip.Content
const Arrow = Tooltip.Arrow

export const AppTooltip = { Root, Trigger, Content, Arrow }
