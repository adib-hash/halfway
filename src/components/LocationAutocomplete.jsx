import { useState, useEffect, useRef, useCallback } from 'react'

const PHOTON = 'https://photon.komoot.io/api/'

function formatLabel(props) {
  // Build a readable label: prefer city name, fall back to name
  const primary = props.city || props.name || ''
  const secondary = [props.state, props.country].filter(Boolean).join(', ')
  return { primary, secondary }
}

function debounce(fn, ms) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export default function LocationAutocomplete({ value, onChange, onSelect, placeholder, className }) {
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (query.length < 2) {
        setSuggestions([])
        setIsOpen(false)
        return
      }
      setIsLoading(true)
      try {
        const res = await fetch(
          `${PHOTON}?q=${encodeURIComponent(query)}&limit=5&lang=en`,
          { headers: { 'Accept': 'application/json' } }
        )
        if (!res.ok) return
        const data = await res.json()
        const items = (data.features || []).filter(f => {
          const t = f.properties?.type
          // Keep cities, towns, villages, districts — exclude POIs, streets
          return ['city', 'town', 'village', 'hamlet', 'suburb', 'district', 'county', 'state', 'region'].includes(t) ||
            (f.properties?.city && f.properties?.country)
        })
        setSuggestions(items.slice(0, 5))
        setIsOpen(items.length > 0)
        setActiveIndex(-1)
      } catch (_) {
        // Silently fail — user can still type manually
      } finally {
        setIsLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    fetchSuggestions(value)
  }, [value, fetchSuggestions])

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (feature) => {
    const props = feature.properties
    const [lng, lat] = feature.geometry.coordinates
    const { primary, secondary } = formatLabel(props)
    const label = secondary ? `${primary}, ${secondary}` : primary
    onSelect({ location: label, lat, lng })
    setIsOpen(false)
    setSuggestions([])
  }

  const handleKeyDown = (e) => {
    if (!isOpen) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => {
          onChange(e.target.value)
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        className={className}
        style={{ fontSize: '16px' }}
        autoComplete="off"
        autoCorrect="off"
        spellCheck="false"
      />

      {isOpen && suggestions.length > 0 && (
        <ul
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl overflow-hidden shadow-xl shadow-black/40"
          role="listbox"
        >
          {suggestions.map((feature, i) => {
            const { primary, secondary } = formatLabel(feature.properties)
            return (
              <li
                key={i}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  e.preventDefault()
                  handleSelect(feature)
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`px-3 py-3 cursor-pointer transition-colors min-h-[44px] flex flex-col justify-center ${
                  i === activeIndex ? 'bg-accent/10' : 'hover:bg-surface'
                } ${i > 0 ? 'border-t border-border/60' : ''}`}
              >
                <span className="text-text text-sm font-medium leading-tight">{primary}</span>
                {secondary && (
                  <span className="text-muted text-xs mt-0.5">{secondary}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
