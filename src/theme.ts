import gsap from 'gsap'
import type { Palette } from './data'

// The page's colour comes from the photo on screen. Three custom properties on
// <html> (--bg, --ink, --accent) are mixed in RGB, either directly from scroll
// progress (hero) or with a short tween when a new section takes over.

type RGB = [number, number, number]
interface Mix {
  bg: RGB
  ink: RGB
  accent: RGB
}

const hex = (h: string): RGB => {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const css = (c: RGB) => `rgb(${c[0] | 0} ${c[1] | 0} ${c[2] | 0})`
const lerp = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const toMix = (p: Palette): Mix => ({ bg: hex(p.bg), ink: hex(p.ink), accent: hex(p.accent) })

const root = document.documentElement.style
const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
let current: Mix = { bg: [11, 11, 13], ink: [239, 233, 225], accent: [231, 163, 91] }
let tween: gsap.core.Tween | null = null
let last = ''

function write(m: Mix) {
  current = m
  const bg = css(m.bg)
  const key = bg + m.ink.join() + m.accent.join()
  if (key === last) return
  last = key
  root.setProperty('--bg', bg)
  root.setProperty('--ink', css(m.ink))
  root.setProperty('--accent', css(m.accent))
  if (meta) meta.content = bg
}

/** Sets the colour between two palettes, t in 0..1 (driven by scroll). */
export function mixTheme(a: Palette, b: Palette, t: number) {
  tween?.kill()
  tween = null
  const A = toMix(a)
  const B = toMix(b)
  write({ bg: lerp(A.bg, B.bg, t), ink: lerp(A.ink, B.ink, t), accent: lerp(A.accent, B.accent, t) })
}

/** Eases from the current colour to a palette. */
export function themeTo(p: Palette, duration = 1.1) {
  const from = current
  const to = toMix(p)
  const o = { t: 0 }
  tween?.kill()
  tween = gsap.to(o, {
    t: 1,
    duration,
    ease: 'power2.inOut',
    onUpdate: () => write({ bg: lerp(from.bg, to.bg, o.t), ink: lerp(from.ink, to.ink, o.t), accent: lerp(from.accent, to.accent, o.t) }),
  })
}

export const NEUTRAL: Palette = { bg: '#0d0c0e', ink: '#efe9e1', accent: '#e7a35b', swatches: [] }
