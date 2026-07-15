import { AchievementUnlockerPage } from '@/features/achievement-unlocker/components/AchievementUnlockerPage'

// Both the browse/queue config UI and the running automation's live-progress view render from this
// one route - AchievementUnlockerPage swaps between them based on `achievementUnlockerStore`'s
// `isRunning` state.
const DashboardAchievementUnlockerPage = () => <AchievementUnlockerPage />

export default DashboardAchievementUnlockerPage
