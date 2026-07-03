import StoreLoader from '@/app/(marketing)/(home)/_components/StoreLoader'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div>
      {children}
      <StoreLoader />
    </div>
  )
}
