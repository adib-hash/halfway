import { useState, useEffect, useCallback } from 'react'
import { Plus, MapPin, Loader2, Clock, ChevronRight, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PersonInput from './components/PersonInput'
import MapView from './components/MapView'
import ResultCard from './components/ResultCard'
import { geocodeAll } from './hooks/useGeocoding'
import { computeCentroid } from './utils/centroid'
import { saveSearch, loadSearches, formatSearchLabel } from './utils/storage'

let nextId = 3

function blankPerson(id) {
  return { id, name: '', location: '', lat: null, lng: null, geocodeError: null }
}

export default function App() {
  const [people, setPeople] = useState([blankPerson(1), blankPerson(2)])
  const [results, setResults] = useState([])
  const [geocodedPeople, setGeocodedPeople] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [error, setError] = useState(null)
  const [recentSearches, setRecentSearches] = useState([])
  const [highlightedResult, setHighlightedResult] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    setRecentSearches(loadSearches())
  }, [])

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const canFind = people.length >= 2 &&
    people.every(p => p.name.trim() && p.location.trim()) &&
    !isLoading

  const handleChange = useCallback((index, field, value) => {
    setPeople(prev => prev.map((p, i) =>
      i === index
        ? { ...p, [field]: value, geocodeError: null, ...(field === 'location' ? { lat: null, lng: null } : {}) }
        : p
    ))
  }, [])

  // Called when user selects from autocomplete dropdown — pre-resolves lat/lng
  const handleLocationSelect = useCallback((index, { location, lat, lng }) => {
    setPeople(prev => prev.map((p, i) =>
      i === index ? { ...p, location, lat, lng, geocodeError: null } : p
    ))
  }, [])

  const handleAdd = () => {
    setPeople(prev => [...prev, blankPerson(nextId++)])
  }

  const handleRemove = useCallback((index) => {
    setPeople(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleFind = async () => {
    setError(null)
    setResults([])
    setGeocodedPeople([])
    setHighlightedResult(null)
    setIsLoading(true)

    try {
      // Step 1: Geocode any locations not already resolved via autocomplete
      setLoadingStep('geocoding')
      const geoResults = await geocodeAll(people, (done, total) => {
        setLoadingProgress(Math.round((done / total) * 50))
      })

      let hasErrors = false
      setPeople(prev => prev.map((p, i) => {
        if (geoResults[i].error) {
          hasErrors = true
          return { ...p, geocodeError: geoResults[i].error }
        }
        return { ...p, lat: geoResults[i].lat, lng: geoResults[i].lng, geocodeError: null }
      }))

      if (hasErrors) {
        setError("Some locations couldn't be found. Please check the highlighted fields.")
        setIsLoading(false)
        return
      }

      const geocoded = people.map((p, i) => ({
        ...p,
        lat: geoResults[i].lat,
        lng: geoResults[i].lng,
      }))
      setGeocodedPeople(geocoded)

      // Step 2: Compute centroid
      const centroid = computeCentroid(geoResults.map(g => ({ lat: g.lat, lng: g.lng })))

      // Step 3: Ask Claude
      setLoadingStep('thinking')
      setLoadingProgress(60)

      const res = await fetch('/api/midpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: geocoded, centroid }),
      })

      setLoadingProgress(90)

      let data
      try {
        data = await res.json()
      } catch (_) {
        throw new Error(res.status === 504 ? 'Request timed out — please try again' : 'Unexpected server error')
      }
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Something went wrong')
      }

      const recs = data.recommendations
      setResults(recs)
      setLoadingProgress(100)

      const updated = saveSearch(geocoded, recs)
      setRecentSearches(updated)

    } catch (err) {
      showToast(err.message)
      setError(err.message)
    } finally {
      setIsLoading(false)
      setLoadingStep('')
      setLoadingProgress(0)
    }
  }

  const handleRestoreSearch = (search) => {
    setPeople(search.people.map(p => ({ ...p, geocodeError: null })))
    setResults(search.results)
    setGeocodedPeople(search.people)
    setHighlightedResult(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const topResults = results.filter(r => !r.isWildCard)
  const wildCard = results.find(r => r.isWildCard)
  const hasResults = results.length > 0

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="px-4 pt-10 pb-6 max-w-lg mx-auto">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
            <MapPin size={16} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-text">halfway</h1>
        </div>
        <p className="text-muted text-sm pl-[42px]">Find the perfect city to meet up</p>
      </header>

      <main className="px-4 pb-16 max-w-lg mx-auto space-y-4">
        {/* People inputs */}
        <div className="bg-surface rounded-xl border border-border p-4 space-y-3">
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider">Who's meeting up?</h2>
          {people.map((person, index) => (
            <PersonInput
              key={person.id}
              person={person}
              index={index}
              onChange={handleChange}
              onLocationSelect={handleLocationSelect}
              onRemove={handleRemove}
              canRemove={people.length > 2}
              geocodeError={person.geocodeError}
            />
          ))}
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors py-1"
          >
            <Plus size={15} />
            Add another person
          </button>
        </div>

        {/* Loading bar */}
        {isLoading && (
          <div className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 size={16} className="text-accent animate-spin" />
              <span className="text-sm text-text">
                {loadingStep === 'geocoding'
                  ? 'Finding locations on the map…'
                  : 'Asking Claude to pick the best meetup spots…'}
              </span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Find button */}
        <button
          onClick={handleFind}
          disabled={!canFind}
          className="w-full py-4 rounded-xl font-semibold text-base transition-all
            bg-accent text-bg hover:bg-accent-dim
            disabled:opacity-40 disabled:cursor-not-allowed
            active:scale-[0.98]"
        >
          {isLoading ? 'Finding…' : 'Find Meeting Point'}
        </button>

        {/* Map + Results */}
        <AnimatePresence>
          {hasResults && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <MapView
                people={geocodedPeople}
                results={results}
                highlightedResult={highlightedResult}
              />

              {topResults.length > 0 && (
                <>
                  <h2 className="text-xs font-semibold text-muted uppercase tracking-wider pt-1">
                    Top meeting spots
                  </h2>
                  {topResults.map((result, i) => (
                    <ResultCard
                      key={i}
                      result={result}
                      index={i}
                      isHighlighted={highlightedResult === i}
                      onFocus={idx => {
                        setHighlightedResult(idx === highlightedResult ? null : idx)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    />
                  ))}
                </>
              )}

              {wildCard && (
                <>
                  <div className="flex items-center gap-2 pt-1">
                    <Zap size={13} className="text-amber-400" />
                    <h2 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Wild Card Pick
                    </h2>
                  </div>
                  <ResultCard
                    result={wildCard}
                    index={topResults.length}
                    isHighlighted={highlightedResult === topResults.length}
                    onFocus={idx => {
                      setHighlightedResult(idx === highlightedResult ? null : idx)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent searches */}
        {recentSearches.length > 0 && !hasResults && !isLoading && (
          <div className="pt-2">
            <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock size={11} />
              Recent searches
            </h2>
            <div className="space-y-2">
              {recentSearches.map(search => (
                <button
                  key={search.id}
                  onClick={() => handleRestoreSearch(search)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface border border-border hover:border-subtle transition-colors text-left"
                >
                  <div>
                    <p className="text-text text-sm font-medium">{formatSearchLabel(search.people)}</p>
                    {search.results[0] && (
                      <p className="text-muted text-xs mt-0.5">Top pick: {search.results[0].city}</p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-muted flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-muted text-xs pt-4">halfway v1.1.0</p>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-xl bg-red-950 border border-red-800 text-red-300 text-sm max-w-xs text-center shadow-xl z-50"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
