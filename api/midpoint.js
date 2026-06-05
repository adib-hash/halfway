export const maxDuration = 60

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })

  try {
    const { people, centroid } = req.body

    if (!people || people.length < 2) {
      return res.status(400).json({ error: 'At least 2 people required' })
    }

    const peopleList = people
      .map(p => `- ${p.name} (${p.location}) at coordinates ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`)
      .join('\n')

    const prompt = `You are a travel advisor helping a group of friends find the best city to meet up.

Group members and their home locations:
${peopleList}

Geographic center of the group: ${centroid.lat.toFixed(4)}, ${centroid.lng.toFixed(4)}

Return exactly 4 recommendations as a JSON array.

RECOMMENDATIONS 1-3: Conventional picks — real cities near the geographic center that work well for this group.
Optimize for: (1) fair travel burden — roughly equal travel time for all members, (2) good flight connectivity with major airports, (3) great things to do — food, walkability, attractions.

RECOMMENDATION 4 (WILD CARD): Ignore conventional wisdom entirely. Pick a city that is unexpected, surprising, or non-obvious for this group — somewhere they would never think to suggest themselves but that actually works geographically and offers a truly memorable experience. Be bold. Avoid NYC, London, Paris, Dubai, Tokyo — those are never the wild card.

For ALL 4 recommendations, estimate each person's travel details based on their coordinates and the destination coordinates.

Return ONLY valid JSON — a JSON array of exactly 4 objects, no markdown, no explanation:
[
  {
    "city": "Chicago",
    "country": "United States",
    "lat": 41.8781,
    "lng": -87.6298,
    "rationale": "2-3 sentences explaining why this city works well for this specific group.",
    "isWildCard": false,
    "wildCardReason": null,
    "travelNotes": [
      {
        "person": "Name",
        "distanceKm": 2900,
        "durationHours": 4.5,
        "mode": "flight",
        "note": "Brief detail: airline options, route, or driving notes"
      }
    ]
  },
  {
    "city": "Tbilisi",
    "country": "Georgia",
    "lat": 41.6938,
    "lng": 44.8015,
    "rationale": "...",
    "isWildCard": true,
    "wildCardReason": "One sentence on why this is the unexpected, bold pick for this group.",
    "travelNotes": [...]
  }
]

For travelNotes:
- distanceKm: approximate great-circle distance in kilometers (integer)
- durationHours: realistic door-to-door travel time including airport time (one decimal place)
- mode: "flight", "drive", or "train" — whichever is most realistic for that distance
- note: short, specific detail (airline, route frequency, scenic drive, etc.)`

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!upstream.ok) {
      const err = await upstream.text()
      throw new Error(`Anthropic API error: ${err}`)
    }

    const data = await upstream.json()
    const text = data.content[0]?.text || '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    const recommendations = JSON.parse(clean)

    return res.status(200).json({ recommendations })
  } catch (err) {
    console.error('Midpoint error:', err)
    return res.status(500).json({ error: err.message })
  }
}
