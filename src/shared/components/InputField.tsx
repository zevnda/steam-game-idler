import { useEffect, useRef, useState } from 'react'
import { TbChevronDown, TbChevronUp } from 'react-icons/tb'
import { NumberField } from '@heroui/react'

interface InputFieldProps {
  ariaLabel: string
  value: number
  minValue?: number
  maxValue?: number
  className?: string
  formatOptions?: Intl.NumberFormatOptions
  step?: number
  isDisabled?: boolean
  // Propagates every keystroke/stepper click instead of only on blur - needed for the per-item
  // price field, whose checkbox/list button must react as the value changes (matches `main`'s
  // ItemsList.tsx price input, which committed via NumberInput's onValueChange). Left off by
  // default for settings fields, which write to disk per commit and shouldn't do so on every
  // keystroke.
  commitOnChange?: boolean
  onCommit: (value: number) => void | Promise<boolean>
}

// The one numeric-field look for every settings/inline number input in the app. Commits on blur by
// default (or in real time when `commitOnChange` is set) - local draft mirrors `value` until the
// commit point, and falls back to `minValue` (or 0) for an empty/invalid field at blur instead of
// letting a NaN through (react-aria's NumberField reports an empty field as `NaN`, which
// `?? fallback` doesn't catch since NaN isn't nullish). If `onCommit` returns `false` (an async save
// failed), the draft reverts to the last known-good `value`.
// Always renders both spin buttons - the underlying `.number-field__group` is a fixed 3-column grid
// (40px spin-button columns on both sides regardless of whether the buttons are rendered), so
// omitting them leaves the visible input squeezed into a fraction of its own width.
export const InputField = ({
  ariaLabel,
  value,
  minValue,
  maxValue,
  className,
  formatOptions,
  step,
  isDisabled,
  commitOnChange,
  onCommit,
}: InputFieldProps) => {
  const [draft, setDraft] = useState(value)
  // Mirrors `draft` synchronously. react-aria's NumberField commits a typed edit on blur by
  // parsing the raw text and firing `onChange` (-> handleChange) *before* our own `onBlur={commit}`
  // runs (both are merged into one blur handler, react-aria's own commit-then-announce logic goes
  // first) - so `commit`'s closure over `draft` is stale-by-one-render at that point and would undo
  // handleChange's update, resetting the field, unless it reads a ref that's already been mutated
  // synchronously instead of a `draft` snapshot from the last completed render. (Pressing Enter
  // before clicking out avoids this because it's a separate, earlier event that lets the re-render
  // land first.)
  const draftRef = useRef(value)

  useEffect(() => {
    setDraft(value)
    draftRef.current = value
  }, [value])

  const commit = () => {
    const finalValue = Number.isFinite(draftRef.current) ? draftRef.current : (minValue ?? 0)
    draftRef.current = finalValue
    setDraft(finalValue)
    if (finalValue === value) return
    const result = onCommit(finalValue)
    if (result instanceof Promise) {
      result.then(ok => {
        if (ok === false) {
          draftRef.current = value
          setDraft(value)
        }
      })
    }
  }

  const handleChange = (next: number) => {
    draftRef.current = next
    setDraft(next)
    // Skip a transient NaN while the field is momentarily empty mid-edit (react-aria reports an
    // empty NumberField as NaN) - onBlur's fallback still catches that case if the user stops
    // there instead of typing a new digit.
    if (commitOnChange && Number.isFinite(next) && next !== value) onCommit(next)
  }

  return (
    <NumberField
      aria-label={ariaLabel}
      className={className ?? 'w-24'}
      formatOptions={formatOptions}
      isDisabled={isDisabled}
      maxValue={maxValue}
      minValue={minValue}
      step={step}
      value={draft}
      onBlur={commit}
      onChange={handleChange}
    >
      <NumberField.Group className='flex bg-surface-hover'>
        <NumberField.Input className='flex-1' />
        <div className='flex h-full flex-col border-l border-field-placeholder/15'>
          <NumberField.IncrementButton className='flex h-1/2 w-6 items-center justify-center rounded-none border-0 pt-0.5 text-sm'>
            <TbChevronUp aria-hidden fontSize={12} />
          </NumberField.IncrementButton>
          <NumberField.DecrementButton className='flex h-1/2 w-6 items-center justify-center rounded-none border-0 pb-0.5 text-sm'>
            <TbChevronDown aria-hidden fontSize={12} />
          </NumberField.DecrementButton>
        </div>
      </NumberField.Group>
    </NumberField>
  )
}
