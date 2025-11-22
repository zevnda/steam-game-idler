'use client'

import type { ReactElement, ReactNode } from 'react'

import { useRef } from 'react'
import { faqData } from '../../../content/docs/faqData'
import { Accordion } from 'fumadocs-ui/components/accordion'
import { MdOutlineContentCopy } from 'react-icons/md'

interface Props {
  id: string
  question: string
  children: ReactNode
  value?: string
}

export default function CopyableFAQ({ id, question, children, value }: Props): ReactElement {
  const answerRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text)
  }

  function handleCopy(): void {
    // Find the entry by question string
    const entry = faqData.find(
      (e): e is { question: string; markdown: string } => 'question' in e && e.question === question,
    )
    const makeAbsolute = (markdown: string): string =>
      markdown.replace(/(\]\()\/([^)\s]+)\)/g, (_match, prefix, path) => `${prefix}https://steamgameidler.com/${path})`)

    if (entry && entry.markdown) {
      copyToClipboard(makeAbsolute(entry.markdown))
      return
    }
    // fallback: copy as before
    let answer = ''
    if (answerRef.current) {
      answer = answerRef.current.innerText
        .split('\n')
        .map(line => line.replace(/\s+$/, ''))
        .map(line => (line.startsWith('>') ? line : line ? '> ' + line : '>'))
        .join('\n')
    }
    const text = `**${question}**\n${answer}`
    copyToClipboard(makeAbsolute(text))
  }

  return (
    <Accordion
      title={
        <div className='flex items-center gap-2 w-full'>
          <h3 className='flex-1'>{question}</h3>
          <div
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              handleCopy()
            }}
            className='p-1.5 rounded hover:bg-icon-dark/10 dark:hover:bg-icon-light/10 transition-colors active:scale-95 text-icon-light/50 dark:text-icon-dark/50 hover:text-icon-light/70 dark:hover:text-icon-dark/70'
            title='Copy answer'
          >
            <MdOutlineContentCopy className='' />
          </div>
        </div>
      }
      className='my-4'
      id={id}
      value={value}
    >
      <div ref={answerRef} className='markdown-body px-2 pb-2'>
        {children}
      </div>
    </Accordion>
  )
}
