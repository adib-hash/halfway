const KEY = 'halfway_recent'
const MAX = 5

export function saveSearch(people, results) {
  const entry = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    people,
    results,
  }
  const existing = loadSearches()
  const updated = [entry, ...existing].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch (_) {}
  return updated
}

export function loadSearches() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch (_) {
    return []
  }
}

export function formatSearchLabel(people) {
  return people
    .filter(p => p.name)
    .map(p => p.name)
    .join(' + ')
}
