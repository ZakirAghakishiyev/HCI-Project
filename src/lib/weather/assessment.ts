import type {
  HourlyWeatherPoint,
  Session,
  SportId,
  VenueSetting,
  WeatherAssessment,
  WeatherForecast,
  WeatherRisk,
} from '../../types'
import { clock, weekday } from '../format'
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

function impactReasons(sport: SportId, point: HourlyWeatherPoint, risk: WeatherRisk): string[] {
  const items: string[] = []
  const rainy = point.precipitationProbability >= 40 || point.precipitationMm >= 0.2 || isLightPrecip(point.weatherCode) || isModeratePrecip(point.weatherCode) || isHeavyPrecip(point.weatherCode)
  const windy = point.windSpeedKmh >= (windSensitive(sport) ? 18 : 25)

  if (isThunderstorm(point.weatherCode) || risk === 'red') {
    items.push('Lightning risk makes outdoor play unsafe')
    items.push('Heavy rain and sudden gusts can arrive quickly')
    return items.slice(0, 2)
  }
  if (rainy) {
    if (sport === 'football') items.push('Wet outdoor pitch surfaces can become slippery')
    else if (sport === 'running') items.push('Paths can get slick and cold in the rain')
    else items.push('Wet outdoor court surfaces can become slippery')
  }
  if (windy && windSensitive(sport)) {
    if (sport === 'badminton') items.push(`${Math.round(point.windSpeedKmh)} km/h gusts can make shuttlecock flight unpredictable`)
    else if (sport === 'tennis') items.push(`${Math.round(point.windSpeedKmh)} km/h wind can push light balls off course`)
    else items.push(`${Math.round(point.windSpeedKmh)} km/h wind may make conditions harder outdoors`)
  } else if (windy) {
    items.push(`Wind around ${Math.round(point.windSpeedKmh)} km/h may affect outdoor play`)
  }
  if (!items.length && uncomfortableTemp(point.temperatureC)) {
    items.push('Temperatures may make the outdoor session less comfortable')
  }
  if (!items.length) items.push('Outdoor conditions may affect the playing experience')
  return items.slice(0, 2)
}

function windowNote(startsAt: string, endsAt: string | undefined, description: string): string {
  const start = new Date(startsAt)
  const end = endsAt ? new Date(endsAt) : new Date(start.getTime() + 60 * 60000)
  const pad = new Date(start.getTime() - 30 * 60000)
  const tail = new Date(end.getTime() + 30 * 60000)
  return `${description} between ${clock(pad)} and ${clock(tail)}.`
}

function outdoorRisk(point: HourlyWeatherPoint, sport: SportId, startsAt: string, endsAt?: string): {
  risk: WeatherRisk
  title: string
  message: string
  action: string
  badgeLabel: string
  summaryLine: string
  suitabilityLabel: string
  impactReasons: string[]
  windowNote: string
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

  const impacts = impactReasons(sport, point, risk)
  const window = windowNote(startsAt, endsAt, point.description)

  if (risk === 'green') {
    return {
      risk: 'green',
      title: 'Weather suitable',
      message: `Looking good — ${point.description.toLowerCase()} around session time.`,
      action: 'Conditions look suitable for this outdoor session.',
      badgeLabel: 'Weather suitable',
      summaryLine: `${Math.round(point.temperatureC)}°C · ${point.description}`,
      suitabilityLabel: 'Suitable',
      impactReasons: [],
      windowNote: window,
    }
  }

  if (risk === 'yellow') {
    const detail = reasons[0] ?? point.description
    return {
      risk: 'yellow',
      title: 'Weather caution',
      message: `Weather may affect this session. ${detail} on ${day}.`,
      action: 'Outdoor conditions may affect your experience. We recommend checking for alternative indoor sessions.',
      badgeLabel: lightRain ? 'Rain expected' : moderateWind ? 'Wind expected' : 'Weather caution',
      summaryLine: `${Math.round(point.temperatureC)}°C · ${lightRain ? 'Rain expected' : point.description}`,
      suitabilityLabel: 'Caution',
      impactReasons: impacts,
      windowNote: window,
    }
  }

  if (risk === 'orange') {
    const detail = reasons[0] ?? 'Poor outdoor conditions are expected'
    return {
      risk: 'orange',
      title: 'Weather warning',
      message: `${detail} during your session.`,
      action: 'Outdoor conditions may affect your experience. We recommend checking for alternative indoor sessions.',
      badgeLabel: heavyRain || persistentRain ? 'Rain expected' : strongWind ? 'Strong wind expected' : 'Weather warning',
      summaryLine: `${Math.round(point.temperatureC)}°C · ${heavyRain || persistentRain || lightRain ? 'Rain expected' : point.description}`,
      suitabilityLabel: 'Unsuitable',
      impactReasons: impacts,
      windowNote: window,
    }
  }

  return {
    risk: 'red',
    title: 'Severe weather warning',
    message: reasons[0]
      ? `${reasons[0]} during this session. We strongly recommend avoiding the outdoor activity.`
      : 'Thunderstorms are forecast during your outdoor session. We strongly recommend avoiding the activity.',
    action: 'Please review the conditions before travelling and choose an indoor alternative.',
    badgeLabel: 'Severe weather warning',
    summaryLine: `${Math.round(point.temperatureC)}°C · Severe weather expected`,
    suitabilityLabel: 'Unsafe',
    impactReasons: impacts.length ? impacts : ['Lightning risk', `${Math.round(point.precipitationProbability)}% heavy rain`],
    windowNote: window,
  }
}

function baseUnknown(input: AssessInput, title: string, message: string, badgeLabel: string): WeatherAssessment {
  return {
    risk: 'unknown',
    suitable: input.setting === 'indoor',
    badgeLabel,
    badgeIcon: '☁️',
    title,
    message,
    action: input.setting === 'indoor' ? 'Indoor session — unaffected by outdoor weather.' : message,
    setting: input.setting,
    forecastAvailable: false,
    dayLabel: weekday(new Date(input.startsAt)),
    summaryLine: badgeLabel,
    suitabilityLabel: 'Unknown',
    impactReasons: [],
  }
}

export function assessWeather(input: AssessInput): WeatherAssessment {
  const { setting, sport, forecast, forecastError } = input

  if (!forecast) {
    return baseUnknown(
      input,
      'Forecast unavailable',
      forecastError
        ? 'Weather information cannot currently be retrieved. Check conditions before travelling.'
        : 'Weather information cannot currently be retrieved.',
      'Forecast unavailable',
    )
  }

  const point = nearestHour(forecast, input.startsAt)
  if (!point) {
    return baseUnknown(input, 'Forecast not yet available', 'This session is outside the reliable forecast horizon. Check again closer to the date.', 'Forecast not yet available')
  }

  if (setting === 'indoor') {
    return {
      risk: 'green',
      suitable: true,
      badgeLabel: 'Weather unaffected',
      badgeIcon: '✓',
      title: 'Indoor session',
      message: 'Indoor session — unaffected by outdoor weather.',
      action: 'Indoor session — unaffected by outdoor weather.',
      setting,
      forecastAvailable: true,
      temperatureC: Math.round(point.temperatureC),
      description: point.description,
      rainProbability: Math.round(point.precipitationProbability),
      windSpeedKmh: Math.round(point.windSpeedKmh),
      precipitationMm: point.precipitationMm,
      weatherCode: point.weatherCode,
      dayLabel: weekday(new Date(input.startsAt)),
      summaryLine: `${Math.round(point.temperatureC)}°C · Indoor`,
      suitabilityLabel: 'Unaffected',
      impactReasons: [],
      windowNote: `Outside around session time: ${point.description.toLowerCase()}.`,
    }
  }

  const outdoor = outdoorRisk(point, sport, input.startsAt, input.endsAt)
  let risk = outdoor.risk
  let title = outdoor.title
  let message = outdoor.message
  let action = outdoor.action
  let badgeLabel = outdoor.badgeLabel
  let suitabilityLabel = outdoor.suitabilityLabel
  if (setting === 'mixed' && risk === 'red' && !isThunderstorm(point.weatherCode)) {
    risk = 'orange'
    title = 'Weather warning'
    message = 'Conditions may make this weather-dependent session difficult.'
    action = 'This venue can be weather-dependent. Consider an indoor alternative if conditions worsen.'
    badgeLabel = 'Weather warning'
    suitabilityLabel = 'Caution'
  } else if (setting === 'mixed' && risk === 'orange') {
    risk = 'yellow'
    title = 'Weather caution'
    message = `Weather may affect this weather-dependent session. ${point.description} expected.`
    action = 'Cover or indoor options may be available on site — check with the host if unsure.'
    badgeLabel = 'Weather caution'
    suitabilityLabel = 'Caution'
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
    summaryLine: outdoor.summaryLine,
    suitabilityLabel,
    impactReasons: outdoor.impactReasons,
    windowNote: outdoor.windowNote,
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

export function needsAlternative(assessment: WeatherAssessment): boolean {
  return assessment.setting !== 'indoor' && (assessment.risk === 'yellow' || assessment.risk === 'orange' || assessment.risk === 'red')
}
