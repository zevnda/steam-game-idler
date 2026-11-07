// Injected into every frame of the main webview (see `lib.rs`'s `build_main_window`), but it only
// does anything inside the two cross-origin iframes the app embeds: the Chatway help-desk widget
// (`HelpDesk.tsx`) and the per-release changelog page (`ChangelogModal.tsx`, served from
// steamgameidler.com's `docs/app/(embed)/changelog/[slug]`).
//
// Plain `<a target="_blank">` clicks inside a cross-origin iframe never reach WebView2's
// NewWindowRequested event, so `build_main_window`'s browser hand-off never sees them and the
// click silently does nothing. In Chatway this hit links in chat messages and the "Powered by"
// link; in the changelog, every external link (Fumadocs renders those as `target="_blank"`).
// `window.open` called from the same iframe *does* raise that event (it's how Chatway's own
// channel buttons and link-preview cards open, and both work), so this rewrites those anchor
// clicks into `window.open` calls. A capture-phase listener on `window` runs before any of the
// page's own handlers, and those handlers still run afterwards (only the default navigation is
// stopped).
;(() => {
  if (window.top === window) return

  const { hostname, pathname } = window.location
  const isChatway = hostname === 'widget.chatway.app'
  const isChangelog =
    (hostname === 'steamgameidler.com' || hostname === 'www.steamgameidler.com') &&
    pathname.startsWith('/changelog/')
  if (!isChatway && !isChangelog) return

  window.addEventListener(
    'click',
    event => {
      if (!event.isTrusted || event.defaultPrevented || event.button !== 0) return

      const anchor = event.composedPath().find(node => node instanceof HTMLAnchorElement)
      // `download` anchors are Chatway's own programmatic file downloads, not navigations - leave
      // them on their normal path.
      if (!anchor || anchor.hasAttribute('download')) return

      let url
      try {
        url = new URL(anchor.href)
      } catch {
        return
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return

      if (isChatway) {
        // Chatway's own same-frame anchors (if any) keep working in-widget; only new-window links
        // are dead.
        if (anchor.target !== '_blank') return
      } else {
        // The changelog page is a fixed embed, so every link leaves it - including internal ones
        // (`/docs/...`, rendered as same-tab Next links), which would otherwise load the whole
        // docs site inside the modal's iframe. Same-page fragment links (heading anchors) are
        // the one exception and stay in place.
        const isSamePageFragment =
          url.hash !== '' &&
          url.origin === window.location.origin &&
          url.pathname === pathname &&
          url.search === window.location.search
        if (isSamePageFragment) return
      }

      event.preventDefault()
      window.open(url.href, '_blank')
    },
    true,
  )
})()
