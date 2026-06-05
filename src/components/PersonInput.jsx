import { X } from 'lucide-react'
import LocationAutocomplete from './LocationAutocomplete'

export default function PersonInput({ person, index, onChange, onRemove, onLocationSelect, canRemove, geocodeError }) {
  const inputClass = "rounded-lg px-3 py-3 text-base bg-surface border border-border text-text placeholder-muted focus:outline-none focus:border-accent transition-colors"

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2 items-center">
        <div className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Name"
            value={person.name}
            onChange={e => onChange(index, 'name', e.target.value)}
            className={`w-1/3 ${inputClass}`}
            style={{ fontSize: '16px' }}
          />
          <LocationAutocomplete
            value={person.location}
            placeholder="City or location"
            className={`w-full ${inputClass}`}
            onChange={(val) => onChange(index, 'location', val)}
            onSelect={({ location, lat, lng }) => onLocationSelect(index, { location, lat, lng })}
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
