import { useRouter } from 'next/router'

// Single source of truth for "is this nav item the current page" - computed once here instead of
// re-derived independently per component, unlike `main`'s duplicated `effectivePage` computation.
export const useIsActiveRoute = (href: string) => {
  const router = useRouter()
  return router.pathname === href
}
