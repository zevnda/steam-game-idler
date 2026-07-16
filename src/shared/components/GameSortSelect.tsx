import { TbSortDescending2 } from 'react-icons/tb'
import { cn, ListBox, Select } from '@heroui/react'

export interface SortOption<T extends string> {
  id: T
  label: string
}

interface GameSortSelectProps<T extends string> {
  ariaLabel: string
  options: SortOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  isDisabled?: boolean
}

// Shared dropdown sort control (react-aria `Select`, same compound pattern as
// LanguageSwitch/InventorySettingsTab's currency picker - see that pair for why this is no longer
// an "unproven component" per InventoryFilterPanel's older doc comment). Backs every sort control
// in the app (games list, card farming, achievement unlocker, auto-idle, achievement manager,
// inventory manager's left-rail sort) so it always looks and behaves the same way regardless of
// page.
export const GameSortSelect = <T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  className,
  isDisabled,
}: GameSortSelectProps<T>) => (
  <Select.Root
    aria-label={ariaLabel}
    className={cn('shrink-0', className ?? 'w-62')}
    isDisabled={isDisabled}
    selectedKey={value}
    onSelectionChange={key => onChange(key as T)}
  >
    <Select.Trigger className='border-none rounded-full'>
      <TbSortDescending2 className='shrink-0 mr-1 text-muted' fontSize={20} />
      <Select.Value className='truncate' />
      <Select.Indicator />
    </Select.Trigger>
    <Select.Popover>
      <ListBox items={options}>
        {item => (
          <ListBox.Item id={item.id}>
            {item.label}
            <ListBox.ItemIndicator />
          </ListBox.Item>
        )}
      </ListBox>
    </Select.Popover>
  </Select.Root>
)
