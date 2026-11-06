// Injected into every frame of the main webview (see `lib.rs`'s `build_main_window`), but it
// only does anything inside the Chatway help-desk iframe.
//
// Plain `<a target="_blank">` clicks inside that cross-origin iframe never reach WebView2's
// NewWindowRequested event, so `build_main_window`'s browser hand-off never sees them and the
// click silently does nothing. This affects links in chat messages and the "Powered by" link.
// `window.open` called from the same iframe *does* raise that event (it's how Chatway's own
// channel buttons and link-preview cards open, and both work), so this rewrites those anchor clicks
// into `window.open` calls. A capture-phase listener on `window` runs before any of Chatway's own
// handlers, and Chatway's handlers still run afterwards (only the default navigation is stopped).
;(() => {
  if (window.top === window || window.location.hostname !== 'widget.chatway.app') return

  window.addEventListener(
    'click',
    event => {
      if (!event.isTrusted || event.defaultPrevented || event.button !== 0) return

      const anchor = event.composedPath().find(node => node instanceof HTMLAnchorElement)
      // `download` anchors are Chatway's own programmatic file downloads, not navigations - leave
      // them on their normal path.
      if (!anchor || anchor.target !== '_blank' || anchor.hasAttribute('download')) return

      let url
      try {
        url = new URL(anchor.href)
      } catch {
        return
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return

      event.preventDefault()
      window.open(url.href, '_blank')
    },
    true,
  )
})()
