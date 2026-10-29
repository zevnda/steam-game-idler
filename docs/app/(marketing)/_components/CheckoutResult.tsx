import type { CheckoutProvider } from '@/app/lib/analytics'
import { FaArrowRight } from 'react-icons/fa6'
import Link from 'next/link'
import CheckoutCompleteTracker from '@/app/(marketing)/_components/CheckoutCompleteTracker'
import LandingFooter from '@/app/(marketing)/(home)/_components/landing/LandingFooter'
import LandingNav from '@/app/(marketing)/(home)/_components/landing/LandingNav'

const CONTACT_EMAIL = 'contact@steamgameidler.com'

interface CheckoutResultProps {
  /** the title's white lead line */
  lead: string
  /** the title's closing phrase, on its own line in the title gradient */
  tail: string
  sub: React.ReactNode
  children: React.ReactNode
}

/**
 * The page a payment provider sends the buyer back to (/stripe/return, /paypal/return,
 * /paypal/cancel): the inner pages' shell - nav, a centred column, footer - with the home hero's
 * split title (a white lead line, the closing phrase in the title gradient). These are noindexed,
 * reached only from checkout.
 */
export default function CheckoutResult({ lead, tail, sub, children }: CheckoutResultProps) {
  return (
    <div className='landing min-h-screen bg-background'>
      <LandingNav />

      <main className='landing-container pt-36 sm:pt-44 pb-28 sm:pb-36'>
        {/* the title gets a wider column than the content, so it breaks into its two lines */}
        <div className='page-enter'>
          <header className='max-w-4xl mx-auto text-center'>
            <h1 className='text-[clamp(2.6rem,5.6vw,4.8rem)] font-semibold leading-[0.98] tracking-[-0.04em] text-balance text-text-primary'>
              {/* the space keeps the text "lead tail" for search and screen readers */}
              {lead} <br />
              <span className='gradient-text'>{tail}</span>
            </h1>
            <p className='mt-6 max-w-2xl mx-auto text-lg leading-relaxed text-text-muted'>{sub}</p>
          </header>

          <div className='max-w-2xl mx-auto'>{children}</div>
        </div>
      </main>

      <LandingFooter />
    </div>
  )
}

/**
 * After a completed purchase (Stripe and PayPal alike): where the license key went, how to
 * activate it, and who to contact.
 *
 * The spam hint is deliberately in the two places everyone reads - the line under the title and
 * the first step - with "spam or junk" in white against the muted text: the key arrives by email,
 * and a large share of buyers never see it because it lands in spam/junk or Gmail's Promotions
 * tab, so they contact support (or give up) believing the purchase failed. (An amber alert box was
 * tried; it was louder but clashed with the page.) The activation steps mirror the PRO docs
 * (docs/_content/pro.mdx) - keep them in sync.
 */
export function CheckoutSuccess({ provider }: { provider: CheckoutProvider }) {
  return (
    <CheckoutResult
      lead='Thanks for supporting'
      tail='Steam Game Idler.'
      sub={
        <>
          Your PRO license key is on its way to your email. Not in your inbox? Check your{' '}
          <strong className='font-semibold text-text-primary'>spam or junk folder</strong>.
        </>
      }
    >
      <CheckoutCompleteTracker provider={provider} />

      {/* The page's one bit of colour: the closing CTA's rainbow rim (.cta-rim), on its one card -
          what to do next is the point of the page */}
      <div className='cta-rim mt-10'>
        <div className='cta-rim__inner p-6 sm:p-8 text-left'>
          <h2 className='text-lg font-semibold text-text-primary'>How to activate PRO</h2>
          {/* each step's text in one <span>: the <li> is a flex row (badge + text), and loose
            text and <strong>s would each become a gap-spaced item of it */}
          <ol className='checkout-steps mt-5'>
            <li>
              <span>
                Find the email with your license key. Not in your inbox? Look in{' '}
                <strong className='text-text-primary'>spam</strong>,{' '}
                <strong className='text-text-primary'>junk</strong> or Gmail&apos;s{' '}
                <strong className='text-text-primary'>Promotions</strong> tab, and mark it &quot;not
                spam&quot; so future emails reach your inbox.
              </span>
            </li>
            <li>
              <span>
                In Steam Game Idler, open{' '}
                <strong className='text-text-primary'>Settings → Subscription</strong>.
              </span>
            </li>
            <li>
              <span>
                Paste the key and click <strong className='text-text-primary'>Activate</strong>.
              </span>
            </li>
          </ol>
        </div>
      </div>

      <div className='mt-10 flex flex-col sm:flex-row gap-3 justify-center'>
        {/* /pro's "Every Feature, Explained" - what they've just unlocked */}
        <Link prefetch={false} href='/pro#feature-details' className='btn-download px-6 py-3'>
          See what you&apos;ve unlocked
          <FaArrowRight className='w-3.5 h-3.5' aria-hidden='true' />
        </Link>
        <Link prefetch={false} href='/' className='btn-ghost rounded-full px-6 py-3'>
          Back to homepage
        </Link>
      </div>

      <p className='mt-10 text-center text-sm text-text-muted'>
        Having trouble? Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className='checkout-link'>
          {CONTACT_EMAIL}
        </a>{' '}
        and we&apos;ll sort it out.
      </p>
    </CheckoutResult>
  )
}
