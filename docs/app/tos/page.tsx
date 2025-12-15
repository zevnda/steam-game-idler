'use client'

import type { ReactElement } from 'react'

import Link from 'next/link'

export default function TermsOfService(): ReactElement {
  return (
    <div className='min-h-screen overflow-hidden py-12'>
      {/* Home button */}
      <div className='absolute top-6 left-6'>
        <Link href='/' className='text-[#979797] hover:opacity-80 duration-150'>
          &larr; Home
        </Link>
      </div>

      <div className='container mx-auto px-6 py-8 max-w-4xl'>
        <h1 className='text-4xl font-bold mb-8 text-center'>Terms of Service</h1>

        <div className='space-y-8'>
          <section>
            <p className='text-sm mb-6'>
              <strong>Last Updated:</strong> December 16, 2025
            </p>

            <p className='mb-6'>
              These Terms of Service (&quot;Terms&quot;) govern your use of Steam Game Idler (&quot;SGI&quot;, &quot;the
              Application&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), a desktop application designed to
              help you manage your Steam gaming activities. By downloading, installing, or using SGI, you agree to be
              bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>1. Acceptance of Terms</h2>
            <p className='mb-4'>
              By accessing or using Steam Game Idler, you acknowledge that you have read, understood, and agree to be
              bound by these Terms of Service and our Privacy Policy. If you do not agree to these Terms, you must not
              use the Application.
            </p>
            <p className='mb-4'>
              You must be at least 13 years old to use SGI. If you are under 18, you must have your parent or
              guardian&apos;s permission to use the Application.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>2. Description of Service</h2>
            <p className='mb-4'>
              Steam Game Idler is a desktop application that provides the following functionality for your Steam
              account:
            </p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>
                <strong>Game Idling:</strong> Simulate gameplay to increase playtime hours for games in your Steam
                library
              </li>
              <li>
                <strong>Trading Card Farming:</strong> Automatically idle games to earn Steam trading cards and manage
                marketplace listings
              </li>
              <li>
                <strong>Achievement Management:</strong> Unlock, lock, or toggle achievements for games you own
              </li>
              <li>
                <strong>Achievement Automation:</strong> Automatically unlock achievements with human-like behavior
                patterns
              </li>
              <li>
                <strong>Auto-Idling:</strong> Automatically start idling selected games when the application launches
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>3. Steam Account Requirements</h2>
            <p className='mb-4'>To use SGI, you must:</p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>Own a legitimate Steam account in good standing</li>
              <li>Have the Steam client installed and running on your device</li>
              <li>Own the games you wish to idle or manage achievements for</li>
              <li>
                Comply with all applicable{' '}
                <a
                  href='https://store.steampowered.com/subscriber_agreement/'
                  className='text-blue-400 hover:text-blue-300 underline'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Steam Subscriber Agreement
                </a>{' '}
                terms
              </li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>4. Acceptable Use Policy</h2>

            <h3 className='text-xl font-medium mb-3'>4.1 Permitted Uses</h3>
            <p className='mb-4'>You may use SGI to:</p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>Idle games you legitimately own to increase playtime or farm trading cards</li>
              <li>Manage achievements for games in your personal Steam library</li>
              <li>Automate repetitive tasks related to your own gaming activities</li>
              <li>Export and backup your application settings</li>
            </ul>

            <h3 className='text-xl font-medium mb-3'>4.2 Prohibited Uses</h3>
            <p className='mb-4'>You may NOT use SGI to:</p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>Access, modify, or manipulate Steam accounts that do not belong to you</li>
              <li>Circumvent Steam&apos;s security measures or anti-cheat systems</li>
              <li>Engage in any activity that violates Steam&apos;s Terms of Service</li>
              <li>
                Use the Application for commercial purposes or financial gain beyond legitimate trading card sales
              </li>
              <li>Share your Steam account credentials with others for use with SGI</li>
              <li>Attempt to reverse engineer, decompile, or modify the Application&apos;s core functionality</li>
              <li>Use SGI in a manner that could damage, disable, or impair Steam&apos;s services</li>
              <li>Engage in behavior that could be considered cheating in multiplayer or competitive games</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>5. Third-Party Services and APIs</h2>

            <h3 className='text-xl font-medium mb-3'>5.1 Steam Integration</h3>
            <p className='mb-4'>
              SGI integrates with Steam&apos;s official APIs and services. Your use of these features is subject to
              Steam&apos;s Terms of Service and Privacy Policy. We are not responsible for any changes to Steam&apos;s
              APIs or services that may affect SGI&apos;s functionality.
            </p>

            <h3 className='text-xl font-medium mb-3'>5.2 Steam Web API</h3>
            <p className='mb-4'>
              Some features allow users to provide their own Steam Web API key. You are responsible for obtaining and
              managing your API key in accordance with{' '}
              <a
                href='https://steamcommunity.com/dev/apiterms'
                className='text-blue-400 hover:text-blue-300 underline'
                target='_blank'
                rel='noopener noreferrer'
              >
                Steam&apos;s API Terms of Use
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>6. Steam Game Idler PRO Subscriptions</h2>

            <h3 className='text-xl font-medium mb-3'>6.1 PRO Subscription Overview</h3>
            <p className='mb-4'>
              Steam Game Idler PRO is an optional subscription service that provides additional features and benefits
              while supporting the continued development of SGI. All core features of SGI remain free to use.
            </p>

            <h3 className='text-xl font-medium mb-3'>6.2 Subscription Tiers and Pricing</h3>
            <p className='mb-4'>PRO is available in three subscription tiers, all offering the same benefits:</p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>
                <strong>Casual:</strong> $2 USD per month
              </li>
              <li>
                <strong>Gamer:</strong> $4 USD per month
              </li>
              <li>
                <strong>Legendary:</strong> $9 USD per month
              </li>
            </ul>
            <p className='mb-4'>
              All prices are in USD and exclude applicable taxes. Prices are subject to change with reasonable notice to
              existing subscribers.
            </p>

            <h3 className='text-xl font-medium mb-3'>6.3 Billing and Payment</h3>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>
                <strong>Payment Processing:</strong> All payments are processed securely through Stripe, our third-party
                payment processor
              </li>
              <li>
                <strong>Recurring Billing:</strong> PRO subscriptions are billed on a monthly recurring basis unless
                canceled
              </li>
              <li>
                <strong>Auto-Renewal:</strong> Your subscription will automatically renew each month unless you cancel
                before the renewal date
              </li>
              <li>
                <strong>Payment Methods:</strong> We accept payment methods supported by Stripe (credit cards, debit
                cards, and other methods as available)
              </li>
              <li>
                <strong>Failed Payments:</strong> If a payment fails, we will attempt to process it again. Continued
                payment failures may result in suspension of PRO benefits
              </li>
              <li>
                <strong>Receipts:</strong> You will receive email receipts for all successful payments
              </li>
            </ul>

            <h3 className='text-xl font-medium mb-3'>6.4 Subscription Data Collection</h3>
            <p className='mb-4'>When you subscribe to PRO, we collect and store:</p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>Your Steam ID</li>
              <li>Your email address</li>
              <li>Your Discord User ID (only if you claim the donator role)</li>
              <li>Subscription status and tier information</li>
            </ul>
            <p className='mb-4'>
              We do NOT store your payment information. All payment details are securely handled by Stripe. See our
              Privacy Policy for more information.
            </p>

            <h3 className='text-xl font-medium mb-3'>6.5 Cancellation</h3>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>You may cancel your PRO subscription at any time through the application settings</li>
              <li>
                Upon cancellation, you will retain access to PRO benefits until the end of your current billing period
              </li>
              <li>No refunds will be issued for partial billing periods after cancellation</li>
              <li>You can resubscribe at any time after canceling</li>
            </ul>

            <h3 className='text-xl font-medium mb-3'>6.6 Switching Tiers</h3>
            <p className='mb-4'>
              To switch between PRO tiers, you must cancel your current subscription and subscribe to your desired tier.
              Changes will take effect at the start of the next billing period.
            </p>

            <h3 className='text-xl font-medium mb-3'>6.7 Refund Policy</h3>
            <p className='mb-4'>
              PRO subscriptions are considered donations to support SGI development and are generally non-refundable.
              However, refunds may be considered on a case-by-case basis for:
            </p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>Billing errors or duplicate charges</li>
              <li>Technical issues preventing access to PRO features</li>
              <li>Other exceptional circumstances</li>
            </ul>
            <p className='mb-4'>
              To request a refund, contact us through the in-app help desk or email contact@steamgameidler.com within 14
              days of the charge.
            </p>

            <h3 className='text-xl font-medium mb-3'>6.8 Chargebacks</h3>
            <p className='mb-4'>
              <strong>Important:</strong> If you dispute a charge with your bank or credit card company (chargeback)
              without first contacting us, your access to Steam Game Idler and all of its features may be permanently
              revoked. Fraudulent chargebacks cause significant harm to our small independent project.
            </p>
            <p className='mb-4'>
              If you believe a charge was made in error, please contact us first at contact@steamgameidler.com or
              through the in-app help desk so we can resolve the issue.
            </p>

            <h3 className='text-xl font-medium mb-3'>6.9 Modification of PRO Features</h3>
            <p className='mb-4'>
              We reserve the right to add, modify, or remove PRO features at any time. We will make reasonable efforts
              to notify subscribers of significant changes. If changes substantially diminish the value of your
              subscription, you may cancel and request a prorated refund for the remaining period.
            </p>

            <h3 className='text-xl font-medium mb-3'>6.10 Termination of PRO Access</h3>
            <p className='mb-4'>We may suspend or terminate your PRO subscription if:</p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>You violate these Terms of Service</li>
              <li>You engage in fraudulent chargebacks</li>
              <li>You abuse PRO features or attempt to share access with others</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>7. Account Security and Responsibility</h2>
            <p className='mb-4'>You are solely responsible for:</p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>Maintaining the security of your Steam account credentials</li>
              <li>All activities that occur under your Steam account while using SGI</li>
              <li>Ensuring your Steam account remains in good standing</li>
              <li>Complying with Steam&apos;s security requirements and policies</li>
              <li>Any consequences resulting from your use of SGI with your Steam account</li>
            </ul>
            <p className='mb-4'>
              We strongly recommend enabling Steam Guard and following Steam&apos;s security best practices.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>8. Risks and Disclaimers</h2>

            <h3 className='text-xl font-medium mb-3'>7.1 Steam Account Risks</h3>
            <p className='mb-4'>
              <strong>USE AT YOUR OWN RISK:</strong> While SGI is designed to work within Steam&apos;s guidelines, the
              use of any third-party automation tool carries inherent risks, including but not limited to:
            </p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>Potential Steam account restrictions or bans</li>
              <li>Loss of trading privileges</li>
              <li>Achievement or game progress issues</li>
              <li>Temporary or permanent limitations on Steam features</li>
            </ul>

            <h3 className='text-xl font-medium mb-3'>7.2 No Guarantees</h3>
            <p className='mb-4'>We do not guarantee that:</p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>SGI will always be compatible with Steam&apos;s current or future systems</li>
              <li>Your Steam account will remain unaffected by using SGI</li>
              <li>All features will work as expected in all circumstances</li>
              <li>Trading card drops or achievement unlocks will occur as anticipated</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>9. Intellectual Property</h2>
            <p className='mb-4'>
              SGI is open-source software released under the terms specified in our GitHub repository. You may view,
              modify, and distribute the software in accordance with the applicable open-source license.
            </p>
            <p className='mb-4'>
              Steam, the Steam logo, and related marks are trademarks of Valve Corporation. We are not affiliated with
              or endorsed by Valve Corporation.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>10. Limitation of Liability</h2>
            <p className='mb-4'>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
              CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>Loss of Steam account access or restrictions</li>
              <li>Loss of game progress, achievements, or trading cards</li>
              <li>Financial losses related to Steam marketplace activities</li>
              <li>Data loss or corruption</li>
              <li>Any damages arising from your use of SGI</li>
            </ul>
            <p className='mb-4'>
              Our total liability shall not exceed the amount you paid for SGI (which is $0, as SGI is free software).
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>11. Indemnification</h2>
            <p className='mb-4'>
              You agree to indemnify and hold harmless SGI, its developers, and contributors from any claims, damages,
              or expenses arising from:
            </p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>Your use of SGI</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of Steam&apos;s Terms of Service</li>
              <li>Any actions taken with your Steam account while using SGI</li>
            </ul>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>12. Termination</h2>
            <p className='mb-4'>
              You may stop using SGI at any time by uninstalling the Application. These Terms remain in effect until
              terminated.
            </p>
            <p className='mb-4'>
              We may discontinue SGI or modify its features at any time without notice. We reserve the right to refuse
              service to anyone for any reason at any time.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>13. Updates and Modifications</h2>
            <p className='mb-4'>
              We may update SGI from time to time to add features, fix bugs, or improve compatibility. You are
              encouraged to keep SGI updated to the latest version.
            </p>
            <p className='mb-4'>
              We reserve the right to modify these Terms at any time. Material changes will be communicated through:
            </p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>Updates to this page with a revised &quot;Last Updated&quot; date</li>
              <li>Application notifications</li>
              <li>Announcements in our GitHub repository</li>
            </ul>
            <p className='mb-4'>
              Your continued use of SGI after any modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>14. Open Source and Community</h2>
            <p className='mb-4'>
              SGI is developed as an open-source project. You can contribute to its development, report issues, or
              suggest improvements through our{' '}
              <a
                href='https://github.com/zevnda/steam-game-idler'
                className='text-blue-400 hover:text-blue-300 underline'
                target='_blank'
                rel='noopener noreferrer'
              >
                GitHub repository
              </a>
              .
            </p>
            <p className='mb-4'>
              Community contributions are welcome and appreciated, but all contributors must agree to follow our code of
              conduct and contribution guidelines.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>15. Governing Law and Dispute Resolution</h2>
            <p className='mb-4'>
              These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising
              from these Terms or your use of SGI should first be addressed through our GitHub issues system.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>16. Contact Information</h2>
            <p className='mb-4'>If you have questions about these Terms of Service, please contact us through:</p>
            <ul className='list-disc pl-6 space-y-2 mb-4'>
              <li>
                <strong>Email:</strong> contact@steamgameidler.com (for billing and subscription inquiries)
              </li>
              <li>
                <strong>In-App Help Desk:</strong> Available in the applications title bar menu under &quot;Help
                Desk&quot;
              </li>
              <li>
                <strong>GitHub Issues:</strong>{' '}
                <a
                  href='https://github.com/zevnda/steam-game-idler/issues'
                  className='text-blue-400 hover:text-blue-300 underline'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Report issues or ask questions
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
            <h2 className='text-2xl font-semibold mb-4'>17. Severability</h2>
            <p className='mb-4'>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall
              remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className='text-2xl font-semibold mb-4'>18. Entire Agreement</h2>
            <p className='mb-4'>
              These Terms of Service, together with our Privacy Policy, constitute the entire agreement between you and
              SGI regarding the use of the Application.
            </p>
          </section>

          <section className='border-t border-gray-700 pt-6'>
            <p className='text-xs text-center'>
              By using Steam Game Idler, you acknowledge that you have read and understood these Terms of Service and
              agree to be bound by them.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
