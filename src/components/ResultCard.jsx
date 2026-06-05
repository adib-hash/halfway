import { MapPin, Plane, Star } from 'lucide-react'

export default function ResultCard({ result, index, isHighlighted, onFocus }) {
  return (
    <div
      className={`rounded-xl p-5 border transition-all ${
        isHighlighted
          ? 'border-accent bg-surface shadow-lg shadow-accent/10'
          : 'border-border bg-surface hover:border-subtle'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-bg text-sm font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-text font-semibold text-lg leading-tight">{result.city}</h3>
          <p className="text-muted text-sm">{result.country}</p>
        </div>
        <button
          onClick={() => onFocus(index)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-accent border border-accent/30 hover:bg-accent/10 transition-colors"
        >
          <MapPin size={14} />
          Map
        </button>
      </div>

      <p className="text-text/80 text-sm leading-relaxed mb-4">{result.rationale}</p>

      {result.travelNotes?.length > 0 && (
        <div className="border-t border-border pt-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-muted text-xs uppercase tracking-wide mb-2">
            <Plane size={12} />
            Getting there
          </div>
          {result.travelNotes.map((note, i) => (
            <div key={i} className="flex gap-2 text-sm">
              <span className="text-accent font-medium flex-shrink-0">{note.person}</span>
              <span className="text-muted">{note.note}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
