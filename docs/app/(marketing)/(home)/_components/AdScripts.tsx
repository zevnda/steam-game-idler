import Script from 'next/script'

export default function AdScripts() {
  return (
    <Script
      async
      src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8915288433444527'
      crossOrigin='anonymous'
      strategy='lazyOnload'
    />
  )
}
