import { SignInPage } from '@/features/auth/ui'
import { useIndex } from '../features/auth/hooks'

export const Index = () => {
  useIndex()

  return <SignInPage />
}

export default Index
