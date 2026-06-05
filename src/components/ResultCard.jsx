import { useState } from 'react'
import { MapPin, Plane, Car, Train, Zap, ChevronDown, ChevronUp } from 'lucide-react'

const MODE_ICON = { flight: Plane, drive: Car, train: Train }

function formatKm(km) {
  return Number(km).toLocaleString() + ' km'
}

function formatMi(km) {
  return Math.round(Number(km) * 0.621371).toLocaleString() + ' mi'
}

function formatHours(h) {
  const hrs = parseFloat(h)
  if (isNaN(hrs)) return h + 'h'
  if (hrs < 1) return Math.round(hrs * 60) + 'min'
  const whole = Math.floor(hrs)
  const mins = Math.round((hrs - whole) * 60)
  return mins > 0 ? `${whole}h ${mins}min` : `${whole}h`
}

export default function ResultCard({ result, index, isHighlighted, onFocus }) {
  const [travelOpen, setTravelOpen] = useState(true)
  const isWild = result.isWildCard

  const borderBase = isWild ? 'border-amber-800/50' : 'border-border'
  const borderHighlight = isWild ? 'border-amber-500/70 shadow-amber-900/20' : 'border-accent shadow-accent/10'
  const borderHover = isWild ? 'hover:border-amber-700/60' : 'hover:border-subtle'

  return (
    <div
      className={`rounded-xl p-5 border transition-all bg-surface ${
        isHighlighted
          ? `${borderHighlight} shadow-lg`
          : `${borderBase} ${borderHover}`
      }`}
    >
      {/* Wild card label */}
      {isWild && (
        <div className="flex items-center gap-1.5 mb-3">
          <Zap size={13} className="text-amber-400" />
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Wild Card</span>
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        {isWild ? (
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Zap size={13} className="text-amber-400" />
          </span>
        ) : (
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-bg text-sm font-bold flex items-center justify-center">
            {index + 1}
          </span>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-text font-semibold text-lg leading-tight">{result.city}</h3>
          <p className="text-muted text-sm">{result.country}</p>
        </div>

        <button
          onClick={() => onFocus(index)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            isWild
              ? 'text-amber-400 border-amber-800/50 hover:bg-amber-900/20'
              : 'text-accent border-accent/30 hover:bg-accent/10'
          }`}
        >
          <MapPin size={14} />
          Map
        </button>
      </div>

      <p className="text-text/80 text-sm leading-relaxed mb-3">{result.rationale}</p>

      {isWild && result.wildCardReason && (
        <p className="text-amber-400/80 text-sm italic mb-3">{result.wildCardReason}</p>
      )}

      {result.travelNotes?.length > 0 && (
        <div className="border-t border-border pt-3">
          {/* Collapsible header */}
          <button
            onClick={() => setTravelOpen(o => !o)}
            className="flex items-center justify-between w-full mb-2 group"
          >
            <div className="flex items-center gap-1.5 text-muted text-xs uppercase tracking-wide">
              <Plane size={12} />
              Getting there
            </div>
            {travelOpen
              ? <ChevronUp size={14} className="text-muted group-hover:text-text transition-colors" />
              : <ChevronDown size={14} className="text-muted group-hover:text-text transition-colors" />
            }
          </button>

          {travelOpen && (
            <div className="space-y-0">
              {result.travelNotes.map((note, i) => {
                const ModeIcon = MODE_ICON[note.mode] || Plane
                return (
                  <div
                    key={i}
                    className={`py-2.5 ${i < result.travelNotes.length - 1 ? 'border-b border-border/50' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-sm font-semibold ${isWild ? 'text-amber-400' : 'text-accent'}`}>
                        {note.person}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <ModeIcon size={13} className={isWild ? 'text-amber-400' : 'text-accent'} />
                        <span className={`font-mono text-sm font-semibold ${isWild ? 'text-amber-300' : 'text-accent'}`}>
                          {formatHours(note.durationHours)}
                        </span>
                        <span className="text-muted text-sm">·</span>
                        <span className={`font-mono text-sm font-semibold ${isWild ? 'text-amber-300' : 'text-accent'}`}>
                          {formatKm(note.distanceKm)}
                        </span>
                        <span className="text-muted text-xs">·</span>
                        <span className="font-mono text-sm text-muted">
                          {formatMi(note.distanceKm)}
                        </span>
                      </div>
                    </div>
                    {note.note && (
                      <p className="text-muted text-xs">{note.note}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
