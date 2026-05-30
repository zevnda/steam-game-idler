'use client'

import { useRef } from 'react'
import { MdOutlineContentCopy } from 'react-icons/md'
import { faqData } from '../../../content/docs/faqData'
import { Accordion } from 'fumadocs-ui/components/accordion'

interface Props {
  id: string
  question: string
  children: React.ReactNode
  value?: string
}

export default function CopyableFAQ({ id, question, children, value }: Props) {
  const answerRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  function handleCopy() {
    // Find the entry by question string
    const entry = faqData.find(
      (e): e is { question: string; markdown: string } =>
        'question' in e && e.question === question,
    )
    const makeAbsolute = (markdown: string) =>
      markdown.replace(
        /(\]\()\/([^)\s]+)\)/g,
        (_match, prefix, path) => `${prefix}https://steamgameidler.com/${path})`,
      )

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
      className='hover:bg-fd-accent/50'
      title={
        <>
          <div className='flex items-center gap-2 w-full cursor-pointer rounded duration-100 px-2 py-1'>
            <h3 className='flex-1'>{question}</h3>
          </div>
          <div
            className='p-1.5 rounded-md cursor-pointer duration-100 h-7.5 w-7.5 text-fd-muted-foreground hover:text-fd-accent-foreground hover:bg-fd-accent'
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              handleCopy()
            }}
          >
            <MdOutlineContentCopy />
          </div>
        </>
      }
      id={id}
      value={value}
    >
      <div ref={answerRef} className='markdown-body px-2 pb-2'>
        {children}
      </div>
    </Accordion>
  )
}
