export interface WeatherLocation {
  label: string
  latitude: number
  longitude: number
}

/** Campus / area labels mapped to Open-Meteo coordinates (UK university campus defaults). */
const AREA_COORDS: Array<{ match: RegExp; location: WeatherLocation }> = [
  { match: /central\s*campus|campus/i, location: { label: 'Central Campus', latitude: 51.7548, longitude: -1.2544 } },
  { match: /north/i, location: { label: 'North Campus', latitude: 51.768, longitude: -1.26 } },
  { match: /south/i, location: { label: 'South Campus', latitude: 51.742, longitude: -1.25 } },
  { match: /east/i, location: { label: 'East Campus', latitude: 51.755, longitude: -1.23 } },
  { match: /west/i, location: { label: 'West Campus', latitude: 51.755, longitude: -1.28 } },
  { match: /london/i, location: { label: 'London', latitude: 51.5074, longitude: -0.1278 } },
  { match: /manchester/i, location: { label: 'Manchester', latitude: 53.4808, longitude: -2.2426 } },
  { match: /birmingham/i, location: { label: 'Birmingham', latitude: 52.4862, longitude: -1.8904 } },
  { match: /edinburgh/i, location: { label: 'Edinburgh', latitude: 55.9533, longitude: -3.1883 } },
]

const DEFAULT_LOCATION: WeatherLocation = {
  label: 'Central Campus',
  latitude: 51.7548,
  longitude: -1.2544,
}

export function resolveWeatherLocation(area?: string | null): WeatherLocation {
  const text = (area ?? '').trim()
  if (!text) return DEFAULT_LOCATION
  for (const entry of AREA_COORDS) {
    if (entry.match.test(text)) return { ...entry.location, label: text }
  }
  return { ...DEFAULT_LOCATION, label: text }
}
