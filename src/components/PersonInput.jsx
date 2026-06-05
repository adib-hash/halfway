import { X } from 'lucide-react'

export default function PersonInput({ person, index, onChange, onRemove, canRemove, geocodeError }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2 items-center">
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Name"
            value={person.name}
            onChange={e => onChange(index, 'name', e.target.value)}
            className="w-1/3 rounded-lg px-3 py-3 text-base bg-surface border border-border text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"
            style={{ fontSize: '16px' }}
          />
          <input
            type="text"
            placeholder="City, State or City, Country"
            value={person.location}
            onChange={e => onChange(index, 'location', e.target.value)}
            className="flex-1 rounded-lg px-3 py-3 text-base bg-surface border border-border text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"
            style={{ fontSize: '16px' }}
          />
        </div>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="p-2 rounded-lg text-muted hover:text-text hover:bg-surface transition-colors flex-shrink-0"
            aria-label="Remove person"
          >
            <X size={18} />
          </button>
        )}
      </div>
      {geocodeError && (
        <p className="text-red-400 text-sm pl-1">{geocodeError}</p>
      )}
    </div>
  )
}
