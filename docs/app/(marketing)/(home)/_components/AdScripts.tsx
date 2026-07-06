import Script from 'next/script'

export default function AdScripts() {
  return (
    <>
      <Script
        async
        src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8915288433444527'
        crossOrigin='anonymous'
        strategy='lazyOnload'
      />
      <Script
        data-cfasync='false'
        src='https://cmp.gatekeeperconsent.com/min.js'
        strategy='lazyOnload'
      />
      <Script
        data-cfasync='false'
        src='https://the.gatekeeperconsent.com/cmp.min.js'
        strategy='lazyOnload'
      />
      <Script async src='//www.ezojs.com/ezoic/sa.min.js' strategy='lazyOnload' />
      <Script id='ezstandalone-init' strategy='lazyOnload'>
        {`
          window.ezstandalone = window.ezstandalone || {};
          ezstandalone.cmd = ezstandalone.cmd || [];
        `}
      </Script>
      <Script src='//ezoicanalytics.com/analytics.js' strategy='lazyOnload' />
    </>
  )
}
