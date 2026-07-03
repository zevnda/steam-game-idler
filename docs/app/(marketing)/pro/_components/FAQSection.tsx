'use client'

import { useState } from 'react'
import FAQItem from '@/app/(marketing)/pro/_components/FAQItem'
import SectionHeading from '@/app/(marketing)/pro/_components/SectionHeading'
import { FadeIn, StaggerGroup, StaggerItem } from '@/app/lib/animations'

const faqItems = [
  {
    q: 'I purchased PRO but my subscription is not activated?',
    a: 'After checking out, you will receive an email containing your license key. Open the app, go to Settings → Subscription, paste your license key into the input field, and click Activate. If you are still experiencing issues, contact us via the help desk at the top-right of the app or at contact@steamgameidler.com.',
  },
  {
    q: 'How do I transfer my license key to a new device?',
    a: 'Your license key is tied to one device at a time. To transfer it, open the app on your new device, go to Settings → Subscription, enter your license key, and click Activate. A prompt will ask you to confirm the transfer. Once confirmed, your new device is active and the previous device loses access on its next launch. If you reinstalled the app on the same machine, no transfer is needed — your device is recognised by its hardware ID.',
  },
  {
    q: 'How do I cancel my subscription?',
    a: 'Go to Settings → Subscription → Manage Subscription, and follow the cancellation prompts. After cancellation, you will retain access to PRO benefits until the end of your current billing period.',
  },
  {
    q: 'Can I switch between tiers?',
    a: 'Yes. Cancel your current subscription then re-subscribe to your desired tier following the standard subscription process.',
  },
  {
    q: 'Where can I find invoices and receipts?',
    a: "You'll receive an email receipt after subscribing. For full billing history, go to Settings → Subscription → Manage Subscription.",
  },
  {
    q: 'What is the refund policy?',
    a: 'PRO subscriptions are treated as donations and are generally non-refundable. Refunds are considered on a case-by-case basis. Contact us via the help desk at the top-right of the app or at contact@steamgameidler.com.',
  },
  {
    q: 'What happens if I file a chargeback?',
    a: 'Fraudulent chargebacks significantly impact this small independent project. Filing one without prior communication may result in your access to this app being permanently revoked. If there was a billing error, we are always happy to work with you to get it sorted as fast as possible, so please contact us via the help desk at the top-right of the app or at contact@steamgameidler.com.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className='py-12 sm:py-16 relative'>
      <div className='container mx-auto px-4 sm:px-6 md:px-8'>
        <div className='max-w-3xl mx-auto'>
          <FadeIn>
            <SectionHeading label='FAQ' />
          </FadeIn>

          <StaggerGroup className='space-y-3'>
            {faqItems.map((item, i) => (
              <StaggerItem key={item.q}>
                <FAQItem
                  q={item.q}
                  a={item.a}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </div>
    </section>
  )
}
