const NOMINATIM = 'https://nominatim.openstreetmap.org/search'

async function geocodeOne(location) {
  const url = `${NOMINATIM}?q=${encodeURIComponent(location)}&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'Halfway/1.0 (halfway.ihsan.build)' },
  })
  if (!res.ok) throw new Error('Geocoding service unavailable')
  const data = await res.json()
  if (!data.length) throw new Error(`Could not find "${location}"`)
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// Geocodes all people sequentially with 1s gap (Nominatim rate limit).
// Returns array parallel to `people` with { lat, lng } or { error } for each.
export async function geocodeAll(people, onProgress) {
  const results = []
  for (let i = 0; i < people.length; i++) {
    if (i > 0) await delay(1100)
    onProgress?.(i, people.length)
    try {
      const coords = await geocodeOne(people[i].location)
      results.push({ ...coords, error: null })
    } catch (err) {
      results.push({ lat: null, lng: null, error: err.message })
    }
  }
  return results
}
