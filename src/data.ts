import raw from './content.json'

export type Lang = 'en' | 'ar'
export type L = { en: string; ar: string }

export interface Palette {
  bg: string
  ink: string
  accent: string
  swatches: string[]
}

export interface Photo {
  file: string
  alt: L
  credit: { name: string; id: number }
  meta: { camera: string | null; lens: string | null; exposure: string | null; time: string; place: L }
  w: number
  h: number
  sizes: number[]
  palette: Palette
  blur: string
}

export const C = raw
export const photos = raw.photos as unknown as Record<string, Photo>

export function photo(id: string): Photo {
  const p = photos[id]
  if (!p) throw new Error(`content.json: unknown photo "${id}"`)
  return p
}

/** "17:40" -> 1060 */
export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** 1060 -> "17:40" */
export const fromMinutes = (min: number) => {
  const m = ((Math.round(min) % 1440) + 1440) % 1440
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export const usd = (n: number) => '$' + n.toLocaleString('en-US')

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
