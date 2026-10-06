interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * Structured data as a plain, server-rendered `<script type="application/ld+json">`.
 *
 * Deliberately not `next/script`: that injects the tag client-side after hydration, so the static
 * export's HTML carried no JSON-LD at all - crawlers that don't run JS never saw it, and Google only
 * would after rendering. A plain `<script>` ships in the HTML itself.
 *
 * `<` is escaped so a string value can never close the tag early.
 */
export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
