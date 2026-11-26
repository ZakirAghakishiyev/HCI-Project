import type { DailyWeatherPoint, HourlyWeatherPoint, WeatherForecast } from '../../types'
import { weatherDescription } from './codes'
import { resolveWeatherLocation, type WeatherLocation } from './locations'

const CACHE_TTL_MS = 30 * 60 * 1000
const REFRESH_HINT_MS = 15 * 60 * 1000

interface CacheEntry {
  forecast: WeatherForecast
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<WeatherForecast>>()

function cacheKey(location: WeatherLocation): string {
  return `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`
}

interface OpenMeteoResponse {
  hourly?: {
    time: string[]
    temperature_2m: Array<number | null>
    precipitation_probability: Array<number | null>
    precipitation: Array<number | null>
    weathercode: Array<number | null>
    windspeed_10m: Array<number | null>
  }
  daily?: {
    time: string[]
    weathercode: Array<number | null>
    temperature_2m_max: Array<number | null>
    precipitation_sum: Array<number | null>
    precipitation_probability_max: Array<number | null>
    windspeed_10m_max: Array<number | null>
  }
}

function mapHourly(payload: OpenMeteoResponse): HourlyWeatherPoint[] {
  const hourly = payload.hourly
  if (!hourly?.time?.length) return []
  return hourly.time.map((time, index) => {
    const code = hourly.weathercode?.[index] ?? 0
    return {
      time,
      temperatureC: hourly.temperature_2m?.[index] ?? 0,
      precipitationMm: hourly.precipitation?.[index] ?? 0,
      precipitationProbability: hourly.precipitation_probability?.[index] ?? 0,
      weatherCode: code,
      windSpeedKmh: hourly.windspeed_10m?.[index] ?? 0,
      description: weatherDescription(code),
    }
  })
}

function mapDaily(payload: OpenMeteoResponse): DailyWeatherPoint[] {
  const daily = payload.daily
  if (!daily?.time?.length) return []
  return daily.time.map((date, index) => {
    const code = daily.weathercode?.[index] ?? 0
    return {
      date,
      weatherCode: code,
      description: weatherDescription(code),
      temperatureMaxC: daily.temperature_2m_max?.[index] ?? 0,
      precipitationSumMm: daily.precipitation_sum?.[index] ?? 0,
      precipitationProbabilityMax: daily.precipitation_probability_max?.[index] ?? 0,
      windSpeedMaxKmh: daily.windspeed_10m_max?.[index] ?? 0,
    }
  })
}

async function fetchForecast(location: WeatherLocation): Promise<WeatherForecast> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    timezone: 'auto',
    forecast_days: '14',
    hourly: 'temperature_2m,precipitation_probability,precipitation,weathercode,windspeed_10m',
    daily: 'weathercode,temperature_2m_max,precipitation_sum,precipitation_probability_max,windspeed_10m_max',
  })
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
  if (!response.ok) throw new Error(`Weather API responded with ${response.status}`)
  const payload = (await response.json()) as OpenMeteoResponse
  return {
    locationLabel: location.label,
    latitude: location.latitude,
    longitude: location.longitude,
    fetchedAt: new Date().toISOString(),
    hourly: mapHourly(payload),
    daily: mapDaily(payload),
    source: 'open-meteo',
  }
}

export async function getWeatherForecast(area?: string | null, options?: { force?: boolean }): Promise<WeatherForecast> {
  const location = resolveWeatherLocation(area)
  const key = cacheKey(location)
  const cached = memoryCache.get(key)
  const now = Date.now()
  if (!options?.force && cached && cached.expiresAt > now) return cached.forecast

  const existing = inflight.get(key)
  if (existing && !options?.force) return existing

  const request = fetchForecast(location)
    .then((forecast) => {
      memoryCache.set(key, { forecast, expiresAt: now + CACHE_TTL_MS })
      inflight.delete(key)
      return forecast
    })
    .catch((error) => {
      inflight.delete(key)
      if (cached) return cached.forecast
      throw error
    })

  inflight.set(key, request)
  return request
}

export function peekWeatherForecast(area?: string | null): WeatherForecast | null {
  const location = resolveWeatherLocation(area)
  const cached = memoryCache.get(cacheKey(location))
  if (!cached) return null
  if (cached.expiresAt + REFRESH_HINT_MS < Date.now()) return cached.forecast
  return cached.forecast
}

export function clearWeatherCache() {
  memoryCache.clear()
  inflight.clear()
}

export { resolveWeatherLocation }
