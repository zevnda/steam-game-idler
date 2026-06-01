import FooterSection from '@/app/(home)/_components/FooterSection'
import NavBar from '@/app/(home)/_components/NavBar'

export const metadata = {
  title: 'Privacy Policy | Steam Game Idler',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPolicy() {
  return (
    <div className='min-h-screen bg-background'>
      <NavBar />

      <div className='container mx-auto px-4 sm:px-6 md:px-8 max-w-3xl pt-36 pb-24'>
        <h1 className='text-4xl sm:text-5xl font-bold text-text-primary mb-10 text-center tracking-tight'>
          Privacy Policy
        </h1>

        <div className='space-y-10'>
          <section>
            <p className='text-sm text-text-muted mb-6'>
              <span className='text-text-primary font-semibold'>Last Updated:</span> December 16,
              2025
            </p>
            <p className='text-text-muted leading-relaxed'>
              Steam Game Idler (&quot;SGI&quot;, &quot;the Application&quot;, &quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;) respects your privacy and is committed to
              protecting your personal information. This Privacy Policy explains how we collect,
              use, and safeguard your information when you use our desktop application or visit our
              website. Both may display Google AdSense advertisements.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold text-text-primary mb-4'>
              1. Information We Collect
            </h2>
            <p className='text-text-muted leading-relaxed mb-6'>
              Most of the following information is processed and stored locally on your device.
              However, some information may be transmitted to Steam&apos;s servers when interacting
              with the Steam Web API, or to our servers when using PRO subscription features. This
              data transmission is limited to facilitating the app&apos;s functionality.
            </p>

            <h3 className='text-base font-medium text-text-primary mb-3'>
              1.1 Steam Account Information
            </h3>
            <ul className='list-disc pl-6 space-y-2 text-text-muted mb-6'>
              <li>
                <span className='text-text-primary font-medium'>Steam ID:</span> Your unique Steam
                identifier to manage your game library and settings
              </li>
              <li>
                <span className='text-text-primary font-medium'>Steam Username:</span> Your Steam
                persona name for display purposes
              </li>
              <li>
                <span className='text-text-primary font-medium'>Game Library Data:</span>{' '}
                Information about games in your Steam library, including achievements and trading
                card data
              </li>
              <li>
                <span className='text-text-primary font-medium'>Steam Web API Key:</span> If
                provided, used to access enhanced Steam features (optional)
              </li>
            </ul>

            <h3 className='text-base font-medium text-text-primary mb-3'>
              1.2 Authentication Data
            </h3>
            <ul className='list-disc pl-6 space-y-2 text-text-muted mb-6'>
              <li>
                <span className='text-text-primary font-medium'>Steam Session Cookies:</span>{' '}
                Including sessionid, steamLoginSecure, and steamMachineAuth tokens for card farming
                features
              </li>
            </ul>

            <h3 className='text-base font-medium text-text-primary mb-3'>
              1.3 Application Settings
            </h3>
            <ul className='list-disc pl-6 space-y-2 text-text-muted mb-6'>
              <li>
                <span className='text-text-primary font-medium'>User Preferences:</span> Your
                application settings including achievement unlocker configurations, card farming
                preferences, and general settings
              </li>
              <li>
                <span className='text-text-primary font-medium'>Game-Specific Settings:</span>{' '}
                Custom configurations for individual games (idle time limits, achievement unlock
                limits, etc.)
              </li>
              <li>
                <span className='text-text-primary font-medium'>Application State:</span>{' '}
                Information about your current session and application usage
              </li>
            </ul>

            <h3 className='text-base font-medium text-text-primary mb-3'>
              1.4 PRO Subscription Data (Optional)
            </h3>
            <p className='text-text-muted leading-relaxed mb-4'>
              If you subscribe to Steam Game Idler PRO, we collect and store the following
              information in our secure database to manage your subscription:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted mb-4'>
              <li>
                <span className='text-text-primary font-medium'>Steam ID:</span> To link your PRO
                subscription to your Steam account and verify subscription status
              </li>
              <li>
                <span className='text-text-primary font-medium'>Email Address:</span> Required for
                billing communications, receipts, and subscription management notifications
              </li>
              <li>
                <span className='text-text-primary font-medium'>Discord User ID:</span> Optional,
                only stored if you manually claim the Discord donator role through our Discord
                server
              </li>
              <li>
                <span className='text-text-primary font-medium'>Stripe Customer ID:</span> A
                reference identifier linking your subscription to Stripe&apos;s payment system (we
                do not store any credit card or payment details)
              </li>
              <li>
                <span className='text-text-primary font-medium'>Subscription Status:</span>{' '}
                Information about your active subscription tier, renewal date, and status
              </li>
            </ul>
            <p className='text-text-muted leading-relaxed'>
              <span className='text-text-primary font-medium'>Important:</span> We do NOT store any
              credit card numbers, banking information, or payment details. All payment information
              is securely handled and stored by Stripe, our payment processor.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold text-text-primary mb-4'>
              2. How We Use Your Information
            </h2>
            <p className='text-text-muted leading-relaxed mb-4'>
              We use the collected information solely to provide SGI&apos;s functionality:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted mb-4'>
              <li>
                <span className='text-text-primary font-medium'>Game Management:</span> To idle
                games, unlock achievements, and manage trading cards in your Steam library
              </li>
              <li>
                <span className='text-text-primary font-medium'>Session Management:</span> To
                maintain your login state and validate Steam sessions for card farming
              </li>
              <li>
                <span className='text-text-primary font-medium'>Settings Persistence:</span> To save
                and restore your application preferences between sessions
              </li>
              <li>
                <span className='text-text-primary font-medium'>Steam API Integration:</span> To
                retrieve game information, achievement data, and trading card details
              </li>
              <li>
                <span className='text-text-primary font-medium'>PRO Subscription Management:</span>{' '}
                To verify your subscription status, provide PRO features, send billing
                notifications, and manage your subscription lifecycle
              </li>
              <li>
                <span className='text-text-primary font-medium'>Communication:</span> To send you
                important updates about your subscription, billing receipts, and service
                announcements (PRO subscribers only)
              </li>
            </ul>
            <p className='text-text-muted leading-relaxed'>
              We will never sell your personal information or use it for purposes unrelated to
              providing and improving Steam Game Idler.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold text-text-primary mb-4'>
              3. Data Storage and Security
            </h2>

            <h3 className='text-base font-medium text-text-primary mb-3'>3.1 Local Storage</h3>
            <p className='text-text-muted leading-relaxed mb-6'>
              Most of your data is stored locally on your device in the application&apos;s data
              directory. We do not transmit your personal information to external servers except
              when necessary to communicate with Steam&apos;s official APIs or to manage your PRO
              subscription (if applicable).
            </p>

            <h3 className='text-base font-medium text-text-primary mb-3'>
              3.2 Remote Storage (PRO Subscriptions Only)
            </h3>
            <p className='text-text-muted leading-relaxed mb-4'>
              If you subscribe to Steam Game Idler PRO, the following information is stored in our
              secure database:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted mb-6'>
              <li>Steam ID</li>
              <li>Email address</li>
              <li>Discord User ID (if claimed)</li>
              <li>Stripe Customer ID (reference only)</li>
              <li>Subscription status and tier information</li>
            </ul>

            <h3 className='text-base font-medium text-text-primary mb-3'>3.3 Data Retention</h3>
            <p className='text-text-muted leading-relaxed mb-6'>
              <span className='text-text-primary font-medium'>PRO Subscription Data:</span> We
              retain your subscription information for as long as your subscription is active, plus
              an additional period after cancellation as required for billing records, dispute
              resolution, and legal compliance (typically 7 years). You may request deletion of your
              data by contacting us, subject to our legal obligations.
            </p>

            <h3 className='text-base font-medium text-text-primary mb-3'>
              3.4 Local Data Location
            </h3>
            <p className='text-text-muted leading-relaxed mb-4'>
              Your local application data is stored in the following location on your device:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted'>
              <li>
                <span className='text-text-primary font-medium'>Windows:</span>{' '}
                %AppData%\Roaming\com.zevnda.steam-game-idler
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-xl font-semibold text-text-primary mb-4'>
              4. Third-Party Services
            </h2>

            <h3 className='text-base font-medium text-text-primary mb-3'>4.1 Steam Integration</h3>
            <p className='text-text-muted leading-relaxed mb-4'>
              SGI integrates with Steam&apos;s official services and APIs. When using our
              application:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted mb-6'>
              <li>We communicate with Steam Community and Steam Web API endpoints</li>
              <li>
                Your interactions are subject to{' '}
                <a
                  href='https://store.steampowered.com/privacy_agreement/'
                  className='text-accent hover:opacity-80 transition-opacity duration-150 underline underline-offset-2'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Steam&apos;s Privacy Policy
                </a>
              </li>
              <li>
                We only access Steam data that you explicitly authorize through Steam&apos;s
                authentication mechanisms
              </li>
            </ul>

            <h3 className='text-base font-medium text-text-primary mb-3'>
              4.2 Stripe Payment Processing
            </h3>
            <p className='text-text-muted leading-relaxed mb-4'>
              PRO subscriptions are processed through Stripe, a third-party payment processor. When
              you subscribe to PRO:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted mb-4'>
              <li>
                Stripe collects and processes your payment information (credit card, billing
                address, etc.) directly
              </li>
              <li>
                We receive only a Stripe Customer ID reference and subscription status from Stripe
              </li>
              <li>We never have access to your full credit card numbers or banking details</li>
              <li>
                Your payment information is subject to{' '}
                <a
                  href='https://stripe.com/privacy'
                  className='text-accent hover:opacity-80 transition-opacity duration-150 underline underline-offset-2'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Stripe&apos;s Privacy Policy
                </a>
              </li>
              <li>Stripe is PCI-DSS compliant and uses industry-leading security practices</li>
            </ul>
            <p className='text-text-muted leading-relaxed mb-6'>
              For questions about payment processing or to update your payment information, you can
              manage your subscription through the Stripe customer portal accessible from the
              application&apos;s settings.
            </p>

            <h3 className='text-base font-medium text-text-primary mb-3'>
              4.3 No Analytics or Tracking
            </h3>
            <p className='text-text-muted leading-relaxed'>
              <span className='text-text-primary font-medium'>Desktop Application:</span> We do not
              use any third-party analytics or tracking services in the SGI desktop application.
              However, Google AdSense may be used for advertising, as described in section 4.4. SGI
              does not collect telemetry data or usage statistics from your application usage.
              <br />
              <br />
              <span className='text-text-primary font-medium'>Website:</span> Our website uses
              Google AdSense for advertising (see section 4.4) and Next.js Analytics to collect
              aggregated, non-personal usage statistics to help improve site performance and user
              experience. No personally identifiable information is collected by Next.js Analytics.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold text-text-primary mb-4'>
              4.4 Google AdSense and Consent Management
            </h2>
            <p className='text-text-muted leading-relaxed mb-4'>
              Both our website and desktop application may use Google AdSense to display
              advertisements. As part of this, Google and its partners may use cookies and collect
              data to personalize ads and measure ad performance. You may see a consent message when
              using our site or app, allowing you to manage your preferences for personalized ads
              and data collection.
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted'>
              <li>
                <span className='text-text-primary font-medium'>Third-Party Cookies:</span> Google
                and partners may set cookies to deliver and personalize ads
              </li>
              <li>
                <span className='text-text-primary font-medium'>User Consent:</span> You can accept
                or manage your ad and data preferences via the consent message shown in our website
                or app
              </li>
              <li>
                <span className='text-text-primary font-medium'>Scope:</span> This applies to both
                the Steam Game Idler website and desktop application
              </li>
              <li>
                <span className='text-text-primary font-medium'>More Information:</span>{' '}
                <a
                  href='https://policies.google.com/technologies/ads'
                  className='text-accent hover:opacity-80 transition-opacity duration-150 underline underline-offset-2'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Google&apos;s Advertising Privacy &amp; Terms
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-xl font-semibold text-text-primary mb-4'>
              5. Data Sharing and Disclosure
            </h2>
            <p className='text-text-muted leading-relaxed mb-4'>
              We do not sell, trade, or rent your personal information to third parties. We share
              your information only in the following limited circumstances:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted mb-4'>
              <li>
                <span className='text-text-primary font-medium'>Steam API Communication:</span> Only
                the necessary data to communicate with Steam&apos;s official APIs for application
                functionality
              </li>
              <li>
                <span className='text-text-primary font-medium'>Payment Processing:</span> When you
                subscribe to PRO, your payment information is shared with Stripe to process your
                subscription. We receive only subscription status and a customer reference ID from
                Stripe
              </li>
              <li>
                <span className='text-text-primary font-medium'>Legal Requirements:</span> If
                required by law, legal process, or governmental request
              </li>
              <li>
                <span className='text-text-primary font-medium'>Security Purposes:</span> To protect
                the rights, property, or safety of SGI users or the public
              </li>
            </ul>
            <p className='text-text-muted leading-relaxed'>
              All third parties we work with are required to maintain appropriate security measures
              and use your information only for the purposes we specify.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold text-text-primary mb-4'>
              6. Data Export and Deletion
            </h2>

            <h3 className='text-base font-medium text-text-primary mb-3'>6.1 Data Export</h3>
            <p className='text-text-muted leading-relaxed mb-6'>
              SGI includes built-in functionality to export your settings and preferences. You can
              access this feature through the application&apos;s settings panel to create a backup
              of your configuration.
            </p>

            <h3 className='text-base font-medium text-text-primary mb-3'>6.2 Data Deletion</h3>
            <p className='text-text-muted leading-relaxed mb-4'>
              You can delete your local application data at any time by:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted mb-6'>
              <li>Using the &quot;Reset Settings&quot; feature in the application</li>
              <li>Uninstalling the application (which will remove all local data)</li>
              <li>Manually deleting the application data folder from your system</li>
            </ul>

            <h3 className='text-base font-medium text-text-primary mb-3'>
              6.3 PRO Subscription Data Deletion
            </h3>
            <p className='text-text-muted leading-relaxed mb-4'>
              If you wish to delete your PRO subscription data from our servers, you can:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted mb-4'>
              <li>
                Cancel your subscription and request data deletion by contacting us (see section 9)
              </li>
              <li>Submit a data deletion request through the in-app help desk</li>
            </ul>
            <p className='text-text-muted leading-relaxed mb-6'>
              Please note that we may retain certain information as required by law or for
              legitimate business purposes (such as billing records for tax purposes) even after you
              request deletion. We will respond to your deletion request within 30 days.
            </p>

            <h3 className='text-base font-medium text-text-primary mb-3'>6.4 Your Rights</h3>
            <p className='text-text-muted leading-relaxed mb-4'>
              Depending on your location, you may have the following rights regarding your data:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted'>
              <li>
                <span className='text-text-primary font-medium'>Access:</span> Request a copy of the
                personal information we hold about you
              </li>
              <li>
                <span className='text-text-primary font-medium'>Correction:</span> Request
                correction of inaccurate or incomplete information
              </li>
              <li>
                <span className='text-text-primary font-medium'>Deletion:</span> Request deletion of
                your personal information (subject to legal obligations)
              </li>
              <li>
                <span className='text-text-primary font-medium'>Portability:</span> Request your
                data in a structured, commonly used format
              </li>
              <li>
                <span className='text-text-primary font-medium'>Objection:</span> Object to certain
                processing of your personal information
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-xl font-semibold text-text-primary mb-4'>
              7. Open Source Transparency
            </h2>
            <p className='text-text-muted leading-relaxed'>
              Steam Game Idler is fully open source. You can review our code, data handling
              practices, and security measures at our{' '}
              <a
                href='https://github.com/zevnda/steam-game-idler'
                className='text-accent hover:opacity-80 transition-opacity duration-150 underline underline-offset-2'
                target='_blank'
                rel='noopener noreferrer'
              >
                GitHub repository
              </a>
              . This transparency ensures you can verify exactly how your data is being handled.
            </p>
          </section>

          <section>
            <h2 className='text-xl font-semibold text-text-primary mb-4'>
              8. Updates to This Policy
            </h2>
            <p className='text-text-muted leading-relaxed mb-4'>
              We may update this Privacy Policy from time to time to reflect changes in our
              practices or for legal, operational, or regulatory reasons. We will notify users of
              any material changes through:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted'>
              <li>Application updates with changelog notifications</li>
              <li>Updates to this page with a revised &quot;Last Updated&quot; date</li>
              <li>Announcements in our GitHub repository</li>
            </ul>
          </section>

          <section>
            <h2 className='text-xl font-semibold text-text-primary mb-4'>9. Contact Information</h2>
            <p className='text-text-muted leading-relaxed mb-4'>
              If you have any questions, concerns, or requests regarding this Privacy Policy or our
              data practices, please contact us:
            </p>
            <ul className='list-disc pl-6 space-y-2 text-text-muted'>
              <li>
                <span className='text-text-primary font-medium'>GitHub Issues:</span>{' '}
                <a
                  href='https://github.com/zevnda/steam-game-idler/issues'
                  className='text-accent hover:opacity-80 transition-opacity duration-150 underline underline-offset-2'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Report an issue or ask questions
                </a>
              </li>
              <li>
                <span className='text-text-primary font-medium'>GitHub Discussions:</span>{' '}
                <a
                  href='https://github.com/zevnda/steam-game-idler/discussions'
                  className='text-accent hover:opacity-80 transition-opacity duration-150 underline underline-offset-2'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Community discussions and support
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-xl font-semibold text-text-primary mb-4'>10. Consent</h2>
            <p className='text-text-muted leading-relaxed'>
              By using Steam Game Idler or visiting our website, you consent to the collection and
              use of your information as described in this Privacy Policy, including the use of
              Google AdSense and related cookies. If you do not agree with this policy, please do
              not use our application or website.
            </p>
          </section>

          <section className='pt-6' style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className='text-xs text-text-muted text-center'>
              This Privacy Policy is effective as of the date last updated above and applies to all
              users of Steam Game Idler.
            </p>
          </section>
        </div>
      </div>

      <div className='section-divider' />
      <FooterSection />
    </div>
  )
}
