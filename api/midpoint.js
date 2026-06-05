export const config = { runtime: 'edge' }

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { people, centroid } = await req.json()

    if (!people || people.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 people required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Anthropic API error: ${err}`)
    }

    const data = await response.json()
    const text = data.content[0]?.text || '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    const recommendations = JSON.parse(clean)

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  } catch (err) {
    console.error('Midpoint error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }
}
