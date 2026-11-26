/** WMO weather interpretation codes used by Open-Meteo. */

export function weatherDescription(code: number): string {
  if (code === 0) return 'Clear skies'
  if (code === 1) return 'Mainly clear'
  if (code === 2) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if (code === 45 || code === 48) return 'Foggy'
  if (code === 51 || code === 53 || code === 55) return 'Drizzle'
  if (code === 56 || code === 57) return 'Freezing drizzle'
  if (code === 61) return 'Light rain'
  if (code === 63) return 'Moderate rain'
  if (code === 65) return 'Heavy rain'
  if (code === 66 || code === 67) return 'Freezing rain'
  if (code === 71 || code === 73 || code === 75 || code === 77) return 'Snow'
  if (code === 80) return 'Light rain showers'
  if (code === 81) return 'Rain showers'
  if (code === 82) return 'Heavy rain showers'
  if (code === 85 || code === 86) return 'Snow showers'
  if (code === 95) return 'Thunderstorms'
  if (code === 96 || code === 99) return 'Thunderstorms with hail'
  return 'Mixed conditions'
}

export function isThunderstorm(code: number): boolean {
  return code >= 95
}

export function isHeavyPrecip(code: number): boolean {
  return [65, 67, 75, 82, 86].includes(code) || isThunderstorm(code)
}

export function isLightPrecip(code: number): boolean {
  return [51, 53, 55, 56, 57, 61, 66, 71, 80, 85].includes(code)
}

export function isModeratePrecip(code: number): boolean {
  return [63, 73, 81].includes(code)
}

export function weatherBadgeIcon(code: number | undefined, risk: string): string {
  if (risk === 'unknown') return '☁️'
  if (code == null) return '☁️'
  if (isThunderstorm(code)) return '⛈️'
  if (isHeavyPrecip(code) || isModeratePrecip(code)) return '🌧️'
  if (isLightPrecip(code)) return '🌦️'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 71 && code <= 77) return '🌨️'
  if (code === 0 || code === 1) return '☀️'
  if (code === 2) return '⛅'
  return '☁️'
}
