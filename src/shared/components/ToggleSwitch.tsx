import { Switch } from '@heroui/react'

interface ToggleSwitchProps {
  isSelected: boolean
  isDisabled?: boolean
  onChange: (value: boolean) => void
}

// Promoted from AchievementUnlockerSettingsTab.tsx/CardFarmingSettingsTab.tsx's identical local
// definitions once a third settings category (General's antiAway toggle) needed the same
// isSelected/onChange shell - both of those files' own comments already flagged this as the
// promotion trigger. Pair with `SettingsRow` for one label+description-left / switch-right row.
export const ToggleSwitch = ({ isSelected, isDisabled, onChange }: ToggleSwitchProps) => (
  <Switch isDisabled={isDisabled} isSelected={isSelected} onChange={onChange}>
    <Switch.Content>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
    </Switch.Content>
  </Switch>
)
