'use client'

import type { ReactElement, ReactNode } from 'react'

import { useEffect, useRef, useState } from 'react'
import { faqData } from '../docs/faq/faqData'
import { MdOutlineContentCopy } from 'react-icons/md'
import { PiCaretRightBold } from 'react-icons/pi'

interface Props {
  id: string
  question: string
  children: ReactNode
}

export default function CopyableFAQ({ id, question, children }: Props): ReactElement {
  const answerRef = useRef<HTMLDivElement>(null)
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [open, setOpen] = useState(false)
  const [maxHeight, setMaxHeight] = useState('0px')
  const [visible, setVisible] = useState(false)
  const transitionMs = 300

  useEffect(() => {
    const details = detailsRef.current
    if (!details) return
    setOpen(details.open)
    setVisible(details.open)
    const onToggle = (): void => {
      setOpen(details.open)
      if (details.open) {
        setVisible(true)
      } else {
        setTimeout(() => setVisible(false), transitionMs)
      }
    }
    details.addEventListener('toggle', onToggle)
    return () => details.removeEventListener('toggle', onToggle)
  }, [])

  useEffect(() => {
    if (open && answerRef.current) {
      setMaxHeight(answerRef.current.scrollHeight + 'px')
    } else {
      setMaxHeight('0px')
    }
  }, [open, children])

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
    const details = detailsRef.current
    const wasOpen = details?.open
    if (details && !details.open) {
      details.open = true
    }
    if (answerRef.current) {
      answer = answerRef.current.innerText
        .split('\n')
        .map(line => line.replace(/\s+$/, ''))
        .map(line => (line.startsWith('>') ? line : line ? '> ' + line : '>'))
        .join('\n')
    }
    if (details && !wasOpen) {
      details.open = false
    }
    const text = `**${question}**\n${answer}`
    copyToClipboard(makeAbsolute(text))
  }

  return (
    <details
      ref={detailsRef}
      id={id}
      className='bg-icon-light dark:bg-icon-dark/20 text-icon-light dark:text-icon-dark border border-border-light dark:border-border-dark rounded-md my-4 group'
    >
      <summary className='cursor-pointer flex items-center px-3 py-2.5 gap-2 hover:bg-icon-dark/5 dark:hover:bg-icon-light/5 transition-colors'>
        {/* Rotate when expanded */}
        <PiCaretRightBold
          className={open ? 'rotate-90 transition-transform duration-200' : 'transition-transform duration-200'}
        />

        <h3>{question}</h3>

        <div
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            handleCopy()
          }}
          className='ml-auto cursor-pointer p-1.5 rounded hover:bg-icon-dark/10 dark:hover:bg-icon-light/10 transition-colors active:scale-95'
        >
          <MdOutlineContentCopy />
        </div>
      </summary>

      <div
        className='markdown-body px-2 pb-2 overflow-hidden transition-all duration-300 ease-in-out'
        ref={answerRef}
        style={{
          maxHeight,
          opacity: open ? 1 : 0,
          transition: `max-height ${transitionMs}ms ease, opacity ${transitionMs}ms ease`,
          position: visible ? 'static' : 'absolute',
          pointerEvents: visible ? 'auto' : 'none',
          width: '100%',
        }}
        aria-hidden={!visible}
      >
        {children}
      </div>
    </details>
  )
}
