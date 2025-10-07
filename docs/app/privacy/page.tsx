'use client'

import type { ReactElement } from 'react'

export default function PrivacyPolicy(): ReactElement {
  return (
    <div className='min-h-screen overflow-hidden py-12'>
      <div className='container mx-auto px-6 py-8 max-w-4xl'>
        <h1 className='text-4xl font-bold mb-8 text-center'>Privacy Policy</h1>

        <div className='space-y-8'>
          <section>
            <p className='text-sm mb-6'>
              <strong>Last Updated:</strong> September 7, 2025
            </p>

            <p className='mb-6'>
              Steam Game Idler ("SGI", "the Application", "we", "us", or "our") respects your privacy and is committed
              to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard
              your information when you use our desktop application or visit our website. Both may display Google
              AdSense advertisements.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>1. Information We Collect</h2>

            <p className='mb-4'>
              All of the following information is processed and stored locally on your device. However, some information
              may be transmitted to Steam’s servers when interacting with the Steam Web API. This data transmission is
              limited to facilitating the app’s functionality and is handled directly between your device and Steam’s
              servers.
            </p>

            <h3 className='text-xl font-medium mb-3'>1.1 Steam Account Information</h3>

            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>
                <strong>Steam ID:</strong> Your unique Steam identifier to manage your game library and settings
              </li>
              <li>
                <strong>Steam Username:</strong> Your Steam persona name for display purposes
              </li>
              <li>
                <strong>Game Library Data:</strong> Information about games in your Steam library, including
                achievements and trading card data
              </li>
              <li>
                <strong>Steam Web API Key:</strong> If provided, used to access enhanced Steam features (optional)
              </li>
            </ul>

            <h3 className='text-xl font-medium mb-3'>1.2 Authentication Data</h3>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>
                <strong>Steam Session Cookies:</strong> Including sessionid, steamLoginSecure, and steamMachineAuth
                tokens for card farming features
              </li>
            </ul>
            <h3 className='text-xl font-medium mb-3'>1.3 Application Settings</h3>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>
                <strong>User Preferences:</strong> Your application settings including achievement unlocker
                configurations, card farming preferences, and general settings
              </li>
              <li>
                <strong>Game-Specific Settings:</strong> Custom configurations for individual games (idle time limits,
                achievement unlock limits, etc.)
              </li>
              <li>
                <strong>Application State:</strong> Information about your current session and application usage
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>2. How We Use Your Information</h2>
            <p className='mb-4'>We use the collected information solely to provide SGI's functionality:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>
                <strong>Game Management:</strong> To idle games, unlock achievements, and manage trading cards in your
                Steam library
              </li>
              <li>
                <strong>Session Management:</strong> To maintain your login state and validate Steam sessions for card
                farming
              </li>
              <li>
                <strong>Settings Persistence:</strong> To save and restore your application preferences between sessions
              </li>
              <li>
                <strong>Steam API Integration:</strong> To retrieve game information, achievement data, and trading card
                details
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>3. Data Storage and Security</h2>

            <h3 className='text-xl font-medium mb-3'>3.1 Local Storage</h3>
            <p className='mb-4'>
              All your data is stored locally on your device in the application's data directory. We do not transmit
              your personal information to external servers except when necessary to communicate with Steam's official
              APIs.
            </p>

            <h3 className='text-xl font-medium mb-3'>3.2 Data Location</h3>
            <p className='mb-4'>Your data is stored in the following locations on your device:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>
                <strong>Windows:</strong> %AppData%\Roaming\com.zevnda.steam-game-idler
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>4. Third-Party Services</h2>

            <h3 className='text-xl font-medium mb-3'>4.1 Steam Integration</h3>
            <p className='mb-4'>SGI integrates with Steam's official services and APIs. When using our application:</p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>We communicate with Steam Community and Steam Web API endpoints</li>
              <li>
                Your interactions are subject to{' '}
                <a
                  href='https://store.steampowered.com/privacy_agreement/'
                  className='text-blue-400 hover:text-blue-300 underline'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Steam's Privacy Policy
                </a>
              </li>
              <li>We only access Steam data that you explicitly authorize through Steam's authentication mechanisms</li>
            </ul>

            <h3 className='text-xl font-medium mb-3'>4.2 No Analytics or Tracking</h3>
            <p className='mb-4'>
              <strong>Desktop Application:</strong> We do not use any third-party analytics or tracking services in the
              SGI desktop application. However, Google AdSense may be used for advertising, as described in section 4.3.
              SGI does not collect telemetry data or usage statistics from your application usage.
              <br />
              <strong>Website:</strong> Our website uses Google AdSense for advertising (see section 4.3) and Next.js
              Analytics to collect aggregated, non-personal usage statistics to help improve site performance and user
              experience. No personally identifiable information is collected by Next.js Analytics. We do not use
              additional analytics tracking services beyond what is required for ad delivery, consent management, and
              basic site analytics.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>4.3 Google AdSense and Consent Management</h2>
            <p className='mb-4'>
              Both our website and desktop application may use Google AdSense to display advertisements. As part of
              this, Google and its partners may use cookies and collect data to personalize ads and measure ad
              performance. You may see a consent message (Consent Management Platform, CMP) when using our site or app,
              allowing you to manage your preferences for personalized ads and data collection.
            </p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>
                <strong>Third-Party Cookies:</strong> Google and partners may set cookies to deliver and personalize
                ads.
              </li>
              <li>
                <strong>User Consent:</strong> You can accept or manage your ad and data preferences via the CMP message
                shown in our website or app.
              </li>
              <li>
                <strong>Scope:</strong> This applies to both the Steam Game Idler website and desktop application.
              </li>
              <li>
                <strong>More Information:</strong> See{' '}
                <a
                  href='https://policies.google.com/technologies/ads'
                  className='text-blue-400 hover:text-blue-300 underline'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Google’s Advertising Privacy & Terms
                </a>
                .
              </li>
            </ul>
          </section>
          {/* End AdSense section */}

          <section>
            <h2 className='text-2xl font-semibold mb-4'>5. Data Sharing and Disclosure</h2>
            <p className='mb-4'>
              We do not sell, trade, or share your personal information with third parties, except in the following
              circumstances:
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>
                <strong>Steam API Communication:</strong> Only the necessary data to communicate with Steam's official
                APIs for application functionality
              </li>
              <li>
                <strong>Legal Requirements:</strong> If required by law or legal process
              </li>
              <li>
                <strong>Security Purposes:</strong> To protect the rights, property, or safety of SGI users or the
                public
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>6. Data Export and Deletion</h2>

            <h3 className='text-xl font-medium mb-3'>6.1 Data Export</h3>
            <p className='mb-4'>
              SGI includes built-in functionality to export your settings and preferences. You can access this feature
              through the application's settings panel to create a backup of your configuration.
            </p>

            <h3 className='text-xl font-medium mb-3'>6.2 Data Deletion</h3>
            <p className='mb-4'>You can delete your data at any time by:</p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Using the "Reset Settings" feature in the application</li>
              <li>Uninstalling the application (which will remove all local data)</li>
              <li>Manually deleting the application data folder from your system</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>7. Open Source Transparency</h2>
            <p className='mb-4'>
              Steam Game Idler is fully open source. You can review our code, data handling practices, and security
              measures at our
              <a
                href='https://github.com/zevnda/steam-game-idler'
                className='text-blue-400 hover:text-blue-300 underline'
                target='_blank'
                rel='noopener noreferrer'
              >
                {' '}
                GitHub repository
              </a>
              . This transparency ensures you can verify exactly how your data is being handled.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>8. Updates to This Policy</h2>
            <p className='mb-4'>
              We may update this Privacy Policy from time to time to reflect changes in our practices or for legal,
              operational, or regulatory reasons. We will notify users of any material changes through:
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>Application updates with changelog notifications</li>
              <li>Updates to this page with a revised "Last Updated" date</li>
              <li>Announcements in our GitHub repository</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>9. Contact Information</h2>
            <p className='mb-4'>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
              please contact us:
            </p>
            <ul className='list-disc pl-6 space-y-2'>
              <li>
                <strong>GitHub Issues:</strong>{' '}
                <a
                  href='https://github.com/zevnda/steam-game-idler/issues'
                  className='text-blue-400 hover:text-blue-300 underline'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Report an issue or ask questions
                </a>
              </li>
              <li>
                <strong>GitHub Discussions:</strong>{' '}
                <a
                  href='https://github.com/zevnda/steam-game-idler/discussions'
                  className='text-blue-400 hover:text-blue-300 underline'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Community discussions and support
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>10. Consent</h2>
            <p className='mb-4'>
              By using Steam Game Idler or visiting our website, you consent to the collection and use of your
              information as described in this Privacy Policy, including the use of Google AdSense and related cookies.
              If you do not agree with this policy, please do not use our application or website.
            </p>
          </section>

          <section className='border-t border-gray-700 pt-6'>
            <p className='text-xs text-center'>
              This Privacy Policy is effective as of the date last updated above and applies to all users of Steam Game
              Idler.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
