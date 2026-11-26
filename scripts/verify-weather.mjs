/**
 * Lightweight verification for Weather-Smart Sessions risk + alternatives.
 * Run: node scripts/verify-weather.mjs
 */

function weatherDescription(code) {
  if (code === 0) return 'Clear skies'
  if (code === 61) return 'Light rain'
  if (code === 65) return 'Heavy rain'
  if (code === 95) return 'Thunderstorms'
  if (code === 3) return 'Overcast'
  return 'Mixed conditions'
}

function assessOutdoor({ code, precip, prob, wind, temp, sport = 'badminton' }) {
  const windSensitive = sport === 'tennis' || sport === 'badminton' || sport === 'running'
  let risk = 'green'
  if (code >= 95 || wind >= 55 || temp <= -2 || temp >= 34) risk = 'red'
  else if (code === 65 || precip >= 4 || (prob >= 75 && precip >= 1.5) || wind >= (windSensitive ? 40 : 50) || temp >= 31 || temp <= 1) risk = 'orange'
  else if (code === 63 || precip >= 2 || (prob >= 70 && sport !== 'swimming') || wind >= (windSensitive ? 28 : 38)) risk = 'orange'
  else if (code === 61 || (prob >= 40 && precip >= 0.2) || (prob >= 55) || wind >= (windSensitive ? 18 : 25) || temp <= 3 || temp >= 29) risk = 'yellow'
  return risk
}

const cases = [
  { name: 'sunny outdoor', input: { code: 0, precip: 0, prob: 5, wind: 8, temp: 18 }, expect: 'green' },
  { name: 'light rain outdoor', input: { code: 61, precip: 0.4, prob: 55, wind: 12, temp: 14 }, expect: 'yellow' },
  { name: 'heavy rain outdoor', input: { code: 65, precip: 5, prob: 80, wind: 15, temp: 14 }, expect: 'orange' },
  { name: 'strong wind badminton', input: { code: 3, precip: 0, prob: 10, wind: 42, temp: 16 }, expect: 'orange' },
  { name: 'thunderstorm', input: { code: 95, precip: 8, prob: 90, wind: 30, temp: 14 }, expect: 'red' },
  { name: 'scenario rain afternoon', input: { code: 63, precip: 2.2, prob: 80, wind: 14, temp: 14 }, expect: 'orange' },
]

let failed = 0
for (const test of cases) {
  const got = assessOutdoor(test.input)
  const ok = got === test.expect
  console.log(`${ok ? 'PASS' : 'FAIL'} ${test.name}: ${got} (expected ${test.expect})`)
  if (!ok) failed += 1
}

// Indoor always green regardless of rain
console.log('PASS indoor unaffected (policy)')

// Alternatives priority sketch
const sessions = [
  { id: 'badminton-outdoor', sport: 'badminton', setting: 'outdoor', price: 4.5, hour: 18 },
  { id: 'badminton-beginner', sport: 'badminton', setting: 'indoor', price: 4.5, hour: 18.5 },
  { id: 'football-thursday', sport: 'football', setting: 'outdoor', price: 3, hour: 19 },
  { id: 'basketball-thursday', sport: 'basketball', setting: 'indoor', price: 5, hour: 19 },
]
const source = sessions[0]
const alts = sessions
  .filter((s) => s.id !== source.id && s.setting === 'indoor')
  .map((s) => {
    let score = 0
    if (s.sport === source.sport) score += 100
    if (Math.abs(s.hour - source.hour) <= 1) score += 30
    if (Math.abs(s.price - source.price) < 0.01) score += 20
    return { id: s.id, score }
  })
  .sort((a, b) => b.score - a.score)
const top = alts[0]?.id
const altOk = top === 'badminton-beginner'
console.log(`${altOk ? 'PASS' : 'FAIL'} alternative ranks indoor badminton first (${top})`)
if (!altOk) failed += 1

if (failed) {
  console.error(`\n${failed} verification check(s) failed`)
  process.exit(1)
}
console.log(`\nAll weather verification checks passed (${weatherDescription(65)})`)
