// Geographic midpoint using 3D Cartesian approach for accuracy across poles/antimeridian
export function computeCentroid(points) {
  if (points.length === 1) return { lat: points[0].lat, lng: points[0].lng }

  let x = 0, y = 0, z = 0

  for (const { lat, lng } of points) {
    const latR = (lat * Math.PI) / 180
    const lngR = (lng * Math.PI) / 180
    x += Math.cos(latR) * Math.cos(lngR)
    y += Math.cos(latR) * Math.sin(lngR)
    z += Math.sin(latR)
  }

  const n = points.length
  x /= n; y /= n; z /= n

  const lngR = Math.atan2(y, x)
  const hyp = Math.sqrt(x * x + y * y)
  const latR = Math.atan2(z, hyp)

  return {
    lat: (latR * 180) / Math.PI,
    lng: (lngR * 180) / Math.PI,
  }
}
