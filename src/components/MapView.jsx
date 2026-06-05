import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

function makeDivIcon(content, bg, border) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg};
      border:2.5px solid ${border};
      color:white;
      width:32px;height:32px;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:13px;font-weight:700;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      font-family:-apple-system,system-ui,sans-serif;
    ">${content}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

function makeResultIcon(num, highlighted) {
  const bg = highlighted ? '#2dd4bf' : '#0d9488'
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${bg};
      color:#0d1117;
      width:36px;height:36px;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:15px;font-weight:800;
      box-shadow:0 2px 12px rgba(45,212,191,0.4);
      font-family:-apple-system,system-ui,sans-serif;
      border:2.5px solid #99f6e4;
    ">${num}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  })
}

function MapController({ people, results, highlightedResult }) {
  const map = useMap()
  const markersRef = useRef([])

  useEffect(() => {
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    const bounds = []

    people.forEach(p => {
      if (p.lat == null) return
      const initial = (p.name || '?')[0].toUpperCase()
      const marker = L.marker([p.lat, p.lng], {
        icon: makeDivIcon(initial, '#1e3a5f', '#60a5fa'),
      })
        .addTo(map)
        .bindTooltip(p.name || 'Person', { permanent: false, direction: 'top', offset: [0, -14] })
      markersRef.current.push(marker)
      bounds.push([p.lat, p.lng])
    })

    results.forEach((r, i) => {
      const marker = L.marker([r.lat, r.lng], {
        icon: makeResultIcon(i + 1, i === highlightedResult),
        zIndexOffset: 100,
      })
        .addTo(map)
        .bindTooltip(r.city, { permanent: false, direction: 'top', offset: [0, -16] })
      markersRef.current.push(marker)
      bounds.push([r.lat, r.lng])
    })

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8, animate: true })
    }

    return () => {
      markersRef.current.forEach(m => m.remove())
    }
  }, [people, results, highlightedResult, map])

  return null
}

export default function MapView({ people, results, highlightedResult }) {
  const geocodedPeople = people.filter(p => p.lat != null)
  const center = geocodedPeople.length > 0
    ? [geocodedPeople[0].lat, geocodedPeople[0].lng]
    : [20, 0]

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border" style={{ height: '320px' }}>
      <MapContainer
        center={center}
        zoom={3}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapController people={geocodedPeople} results={results} highlightedResult={highlightedResult} />
      </MapContainer>
    </div>
  )
}
