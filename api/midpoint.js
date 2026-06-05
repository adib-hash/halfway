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

Recommend up to 3 real cities that would be ideal meeting points for this group.

Optimize for:
1. Fair travel burden — roughly equal travel time/effort for all members
2. Good flight connectivity — major airports with direct or easy connections
3. Great things to do — food scene, walkability, attractions worth visiting

Return ONLY valid JSON — a JSON array of up to 3 objects, no markdown, no explanation:
[
  {
    "city": "Chicago",
    "country": "United States",
    "lat": 41.8781,
    "lng": -87.6298,
    "rationale": "2-3 sentences explaining why this city works well for this specific group's geography and interests.",
    "travelNotes": [
      { "person": "Name", "note": "Approximate travel: ~Xh flight / Xh drive, major airline options" }
    ]
  }
]`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
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
