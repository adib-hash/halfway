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
// Skips people that already have lat/lng (pre-resolved via autocomplete).
export async function geocodeAll(people, onProgress) {
  const results = []
  let networkCallIndex = 0

  for (let i = 0; i < people.length; i++) {
    onProgress?.(i, people.length)

    // Skip geocoding if lat/lng already resolved from autocomplete
    if (people[i].lat != null && people[i].lng != null) {
      results.push({ lat: people[i].lat, lng: people[i].lng, error: null })
      continue
    }

    if (networkCallIndex > 0) await delay(1100)
    networkCallIndex++

    try {
      const coords = await geocodeOne(people[i].location)
      results.push({ ...coords, error: null })
    } catch (err) {
      results.push({ lat: null, lng: null, error: err.message })
    }
  }
  return results
}
