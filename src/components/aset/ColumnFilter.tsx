'use client'

import { useEffect, useRef, useState } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
  align?: 'left' | 'right'
  searchable?: boolean
}

export default function ColumnFilter({ options, selected, onChange, align = 'left', searchable }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const allRef = useRef<HTMLInputElement>(null)

  const showSearch = searchable ?? options.length > 8
  const visibleOptions = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  const isActive = selected.length > 0
  const allSelected = selected.length === options.length
  const someSelected = selected.length > 0 && selected.length < options.length

  // Reset search when closing
  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  // Indeterminate state for "Select All"
  useEffect(() => {
    if (allRef.current) {
      allRef.current.indeterminate = someSelected
    }
  }, [someSelected])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  function toggleValue(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value]
    onChange(next)
  }

  function toggleAll() {
    if (allSelected) {
      onChange([])
    } else {
      onChange(options.map((o) => o.value))
    }
  }

  return (
    <div ref={containerRef} className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
      {/* Filter icon button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-0.5 rounded hover:bg-gray-100 focus:outline-none transition-colors"
        title="Filter kolom"
      >
        <svg
          width="11"
          height="11"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ color: isActive ? 'var(--pkp-teal)' : '#d1d5db' }}
        >
          <path
            d="M1 2h10l-4 5v3l-2-1V7L1 2z"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />
        </svg>
        {/* Active dot indicator */}
        {isActive && (
          <span
            className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--pkp-gold)' }}
          />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48 max-w-72"
          style={{ [align === 'right' ? 'right' : 'left']: 0 }}
        >
          {/* Search box for long lists */}
          {showSearch && (
            <div className="px-2 py-1.5 border-b border-gray-100">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari..."
                className="w-full text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1"
                style={{ '--tw-ring-color': 'var(--pkp-teal)' } as React.CSSProperties}
                autoFocus
              />
            </div>
          )}

          {/* Select All */}
          <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 text-xs font-medium text-gray-700">
            <input
              ref={allRef}
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="rounded"
              style={{ accentColor: 'var(--pkp-teal)' }}
            />
            Pilih Semua
          </label>

          {/* Options list */}
          <div className="max-h-52 overflow-y-auto">
            {visibleOptions.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400 italic">Tidak ditemukan</p>
            )}
            {visibleOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-xs text-gray-600 min-w-0"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => toggleValue(opt.value)}
                  className="rounded shrink-0"
                  style={{ accentColor: 'var(--pkp-teal)' }}
                />
                <span className="truncate">{opt.label}</span>
              </label>
            ))}
          </div>

          {/* Clear button */}
          {isActive && (
            <div className="border-t border-gray-100">
              <button
                type="button"
                onClick={() => { onChange([]); setOpen(false) }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-500"
              >
                Hapus Filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
