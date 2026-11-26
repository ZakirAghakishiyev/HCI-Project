import { useEffect, useState } from 'react'
import type { WeatherForecast } from '../types'
import { getWeatherForecast } from '../lib/weather/service'

interface WeatherState {
  forecast: WeatherForecast | null
  loading: boolean
  error: boolean
  refreshedAt: string | null
}

export function useWeather(area?: string | null): WeatherState {
  const [forecast, setForecast] = useState<WeatherForecast | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(false)

    const load = (force = false) => {
      getWeatherForecast(area, { force })
        .then((next) => {
          if (cancelled) return
          setForecast(next)
          setError(false)
          setRefreshedAt(next.fetchedAt)
          setLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setError(true)
          setLoading(false)
        })
    }

    load(false)
    const timer = window.setInterval(() => load(true), 30 * 60 * 1000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [area])

  return { forecast, loading, error, refreshedAt }
}
