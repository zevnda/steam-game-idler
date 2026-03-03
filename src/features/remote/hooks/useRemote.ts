import { useCallback, useEffect, useRef, useState } from 'react'

export function useRemote() {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const openDropdown = useCallback(() => {
    if (!showDropdown) {
    }
    setShowDropdown(true)
  }, [showDropdown])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  return { showDropdown, setShowDropdown, openDropdown, dropdownRef }
}
