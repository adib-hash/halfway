# Changelog

## v1.1.0 — 2026-06-05

- **Wild card recommendation:** 4th result is now a bold, unexpected city pick with amber visual treatment and a "Wild Card" label
- **Location autocomplete:** Typing in the location field now shows city suggestions powered by Photon/OpenStreetMap — global coverage, no API key, pre-resolves coordinates to eliminate geocoding delay
- **Structured travel data:** Each recommendation now shows estimated travel time (hours) and distance (km) per person in a monospace teal stat row, alongside a short travel note
- **Latency improvement:** Selecting from autocomplete skips the Nominatim geocoding step entirely — searches with pre-selected locations start the Claude call immediately

## v1.0.0 — 2026-06-04

Initial release of Halfway.

- Enter any number of people and their home cities
- Geocodes each location via Nominatim (OpenStreetMap)
- Computes geographic centroid, sends to Claude Sonnet 4.6
- Claude recommends up to 3 ideal meetup cities with rationale and per-person travel notes
- Interactive Leaflet map with person pins and result markers
- Recent searches stored in localStorage (last 5)
- Dark theme with teal accent
