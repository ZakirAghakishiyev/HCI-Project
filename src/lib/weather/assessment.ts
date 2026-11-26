import type {
  HourlyWeatherPoint,
  Session,
  SportId,
  VenueSetting,
  WeatherAssessment,
  WeatherForecast,
  WeatherRisk,
} from '../../types'
import { weekday } from '../format'
import { isHeavyPrecip, isLightPrecip, isModeratePrecip, isThunderstorm, weatherBadgeIcon } from './codes'

export interface AssessInput {
  startsAt: string
  endsAt?: string
  setting: VenueSetting
  sport: SportId
  forecast: WeatherForecast | null
  forecastError?: boolean
}

function nearestHour(forecast: WeatherForecast, startsAt: string): HourlyWeatherPoint | null {
  const target = +new Date(startsAt)
  if (!forecast.hourly.length) return null
  let best: HourlyWeatherPoint | null = null
  let bestDiff = Number.POSITIVE_INFINITY
  for (const point of forecast.hourly) {
    const diff = Math.abs(+new Date(point.time) - target)
    if (diff < bestDiff) {
      best = point
      bestDiff = diff
    }
  }
  // Open-Meteo is reliable ~16 days; treat > 90 minutes off as outside horizon for hourly.
  if (!best || bestDiff > 90 * 60 * 1000) return null
  return best
}

function windSensitive(sport: SportId): boolean {
  return sport === 'tennis' || sport === 'badminton' || sport === 'running'
}

function precipSensitive(sport: SportId): boolean {
  return sport === 'football' || sport === 'tennis' || sport === 'badminton' || sport === 'running'
}

function extremeTemp(temp: number): boolean {
  return temp <= -2 || temp >= 34
}

function uncomfortableTemp(temp: number): boolean {
  return temp <= 3 || temp >= 29
}

function raise(current: WeatherRisk, next: WeatherRisk): WeatherRisk {
  const order: WeatherRisk[] = ['green', 'yellow', 'orange', 'red', 'unknown']
  return order.indexOf(next) > order.indexOf(current) ? next : current
}

function outdoorRisk(point: HourlyWeatherPoint, sport: SportId): {
  risk: WeatherRisk
  title: string
  message: string
  action: string
  badgeLabel: string
} {
  const day = weekday(new Date(point.time))
  let risk: WeatherRisk = 'green'
  const reasons: string[] = []

  if (isThunderstorm(point.weatherCode)) {
    risk = 'red'
    reasons.push('Thunderstorms are expected')
  }
  if (point.windSpeedKmh >= 55 || extremeTemp(point.temperatureC)) {
    risk = raise(risk, 'red')
    if (point.windSpeedKmh >= 55) reasons.push('Dangerous wind conditions')
    if (extremeTemp(point.temperatureC)) reasons.push('Extreme temperatures')
  }

  const heavyRain =
    isHeavyPrecip(point.weatherCode) ||
    point.precipitationMm >= 4 ||
    (point.precipitationProbability >= 75 && point.precipitationMm >= 1.5)
  const persistentRain =
    isModeratePrecip(point.weatherCode) ||
    point.precipitationMm >= 2 ||
    (point.precipitationProbability >= 70 && precipSensitive(sport))
  const strongWind = point.windSpeedKmh >= (windSensitive(sport) ? 28 : 38)
  const veryHotOrCold = point.temperatureC >= 31 || point.temperatureC <= 1

  if (risk !== 'red') {
    if (heavyRain || (strongWind && windSensitive(sport) && point.windSpeedKmh >= 40) || veryHotOrCold) {
      risk = raise(risk, 'orange')
      if (heavyRain) reasons.push('Heavy rain is expected')
      if (strongWind) reasons.push('Strong winds are expected')
      if (veryHotOrCold) reasons.push('Temperatures may make outdoor play uncomfortable')
    } else if (persistentRain || strongWind) {
      risk = raise(risk, 'orange')
      if (persistentRain) reasons.push('Persistent rain is expected')
      if (strongWind) reasons.push('Strong winds are expected')
    }
  }

  const lightRain =
    isLightPrecip(point.weatherCode) ||
    (point.precipitationProbability >= 40 && point.precipitationMm >= 0.2) ||
    (point.precipitationProbability >= 55 && precipSensitive(sport))
  const moderateWind = point.windSpeedKmh >= (windSensitive(sport) ? 18 : 25)

  if (risk === 'green') {
    if (lightRain || moderateWind || uncomfortableTemp(point.temperatureC)) {
      risk = 'yellow'
      if (lightRain) reasons.push('Light rain is expected')
      if (moderateWind) reasons.push('Moderate wind is expected')
      if (uncomfortableTemp(point.temperatureC)) reasons.push('Temperatures may feel uncomfortable')
    }
  }

  if (risk === 'green') {
    return {
      risk: 'green',
      title: 'Weather suitable',
      message: `Looking good — ${point.description.toLowerCase()} around session time.`,
      action: 'Conditions look suitable for this outdoor session.',
      badgeLabel: 'Weather suitable',
    }
  }

  if (risk === 'yellow') {
    const detail = reasons[0] ?? point.description
    return {
      risk: 'yellow',
      title: 'Weather caution',
      message: `Weather may affect this session. ${detail} on ${day}.`,
      action: 'Outdoor conditions may affect your experience. Check back closer to the time.',
      badgeLabel: lightRain ? 'Rain expected' : moderateWind ? 'Wind expected' : 'Weather caution',
    }
  }

  if (risk === 'orange') {
    const detail = reasons[0] ?? 'Poor outdoor conditions are expected'
    return {
      risk: 'orange',
      title: 'Weather warning',
      message: `Weather warning: ${detail} during this session. Consider choosing an indoor alternative.`,
      action: 'Outdoor conditions may affect your experience. We recommend checking for alternative indoor sessions.',
      badgeLabel: heavyRain || persistentRain ? 'Rain expected' : strongWind ? 'Strong wind expected' : 'Unsuitable weather',
    }
  }

  const detail = reasons[0] ?? 'Severe weather is expected'
  return {
    risk: 'red',
    title: 'Severe weather warning',
    message: `Severe weather warning: ${detail} during this session. We strongly recommend choosing an indoor alternative.`,
    action: 'Please review the conditions before travelling and consider an indoor alternative.',
    badgeLabel: 'Severe weather warning',
  }
}

export function assessWeather(input: AssessInput): WeatherAssessment {
  const { setting, sport, forecast, forecastError } = input

  if (!forecast) {
    return {
      risk: 'unknown',
      suitable: setting === 'indoor',
      badgeLabel: forecastError ? 'Forecast unavailable' : 'Forecast unavailable',
      badgeIcon: '☁️',
      title: 'Forecast unavailable',
      message: forecastError
        ? 'Weather information cannot currently be retrieved. Check conditions before travelling.'
        : 'Weather information cannot currently be retrieved.',
      action: setting === 'indoor' ? 'Indoor session — unaffected by outdoor rain.' : 'We could not load a forecast for this session time.',
      setting,
      forecastAvailable: false,
      dayLabel: weekday(new Date(input.startsAt)),
    }
  }

  const point = nearestHour(forecast, input.startsAt)
  if (!point) {
    return {
      risk: 'unknown',
      suitable: setting === 'indoor',
      badgeLabel: 'Forecast not yet available',
      badgeIcon: '☁️',
      title: 'Forecast not yet available',
      message: 'This session is outside the reliable forecast horizon. Check again closer to the date.',
      action: setting === 'indoor' ? 'Indoor session — unaffected by outdoor rain.' : 'Forecast not yet available for this session time.',
      setting,
      forecastAvailable: false,
      dayLabel: weekday(new Date(input.startsAt)),
    }
  }

  if (setting === 'indoor') {
    return {
      risk: 'green',
      suitable: true,
      badgeLabel: 'Indoor session',
      badgeIcon: '🏠',
      title: 'Indoor session',
      message: 'Indoor session — unaffected by outdoor rain.',
      action: 'Indoor session — unaffected by outdoor rain.',
      setting,
      forecastAvailable: true,
      temperatureC: point.temperatureC,
      description: point.description,
      rainProbability: point.precipitationProbability,
      windSpeedKmh: point.windSpeedKmh,
      precipitationMm: point.precipitationMm,
      weatherCode: point.weatherCode,
      dayLabel: weekday(new Date(input.startsAt)),
    }
  }

  const outdoor = outdoorRisk(point, sport)
  // Mixed / weather-dependent venues: soften red→orange and orange→yellow one step when not thunder.
  let risk = outdoor.risk
  let title = outdoor.title
  let message = outdoor.message
  let action = outdoor.action
  let badgeLabel = outdoor.badgeLabel
  if (setting === 'mixed' && risk === 'red' && !isThunderstorm(point.weatherCode)) {
    risk = 'orange'
    title = 'Weather warning'
    message = `Weather warning: conditions may make this weather-dependent session difficult. Consider an indoor alternative.`
    action = 'This venue can be weather-dependent. Consider an indoor alternative if conditions worsen.'
    badgeLabel = 'Weather warning'
  } else if (setting === 'mixed' && risk === 'orange') {
    risk = 'yellow'
    title = 'Weather caution'
    message = `Weather may affect this weather-dependent session. ${point.description} expected.`
    action = 'Cover or indoor options may be available on site — check with the host if unsure.'
    badgeLabel = 'Weather caution'
  }

  return {
    risk,
    suitable: risk === 'green',
    badgeLabel,
    badgeIcon: weatherBadgeIcon(point.weatherCode, risk),
    title,
    message,
    action,
    setting,
    forecastAvailable: true,
    temperatureC: Math.round(point.temperatureC),
    description: point.description,
    rainProbability: Math.round(point.precipitationProbability),
    windSpeedKmh: Math.round(point.windSpeedKmh),
    precipitationMm: point.precipitationMm,
    weatherCode: point.weatherCode,
    dayLabel: weekday(new Date(input.startsAt)),
  }
}

export function assessSessionWeather(session: Pick<Session, 'startsAt' | 'endsAt' | 'setting' | 'sport'>, forecast: WeatherForecast | null, forecastError = false): WeatherAssessment {
  return assessWeather({
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    setting: session.setting,
    sport: session.sport,
    forecast,
    forecastError,
  })
}
