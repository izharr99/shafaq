import { C, photo, toMinutes, fromMinutes } from './data'
import { t, onLang, isRTL } from './i18n'
import { picture, watchLoads } from './img'
import { themeTo } from './theme'
import { gsap, ScrollTrigger, reduceMotion } from './smooth'

// A 24-hour dial: noon at the top, midnight at the bottom, the horizon across
// the middle. Drag the sun (or use the keyboard) and the photo, page colour and
// readout follow. Below the horizon the sun is drawn as the moon.

const R = 120
const DAY = 1440

export function initSunpath() {
  const sec = document.querySelector<HTMLElement>('.sunpath')!
  const svg = sec.querySelector<SVGSVGElement>('.dial__svg')!
  const knob = sec.querySelector<SVGGElement>('.dial__knob')!
  const hit = sec.querySelector<HTMLElement>('.dial__hit')!
  const stack = sec.querySelector<HTMLElement>('.sunpath__stack')!
  const elTime = document.getElementById('sp-time')!
  const elPhase = document.getElementById('sp-phase')!
  const elAlt = document.getElementById('sp-alt')!
  const elPlace = document.getElementById('sp-place')!
  const sp = C.sunpath
  const stops = sp.stops.map((s) => ({ ...s, m: toMinutes(s.time) }))
  const rise = toMinutes(sp.sunrise)
  const set = toMinutes(sp.sunset)
  const noon = (rise + set) / 2

  // One layer per stop; only opacity changes when the photo switches.
  stack.innerHTML = stops.map((s, i) => `<div class="sunpath__layer" data-i="${i}">${picture(s.photo, { sizes: '(min-width: 900px) 55vw, 100vw' })}</div>`).join('')
  watchLoads(stack)
  const layers = Array.from(stack.querySelectorAll<HTMLElement>('.sunpath__layer'))

  let minutes = toMinutes(sp.start)
  let current = -1
  let inView = false

  /** Dial angle (maths convention, 0 = sunset side, PI/2 = top). Day fills the upper half, night the lower. */
  const angleOf = (m: number) => {
    const day = set - rise
    if (m >= rise && m <= set) return Math.PI - ((m - rise) / day) * Math.PI
    const k = ((m - set + DAY) % DAY) / (DAY - day)
    return -k * Math.PI
  }
  /** Sun altitude follows the dial: 0 on the horizon, max at noon, lowest at midnight. */
  const altitude = (m: number) => sp.maxAltitude * Math.sin(angleOf(m))

  const nearest = (m: number) => {
    let best = 0, bd = Infinity
    stops.forEach((s, i) => {
      const d = Math.min(Math.abs(s.m - m), DAY - Math.abs(s.m - m))
      if (d < bd) { bd = d; best = i }
    })
    return best
  }

  function show(i: number, instant = false) {
    if (i === current) return
    const prev = layers[current]
    current = i
    const next = layers[i]
    next.querySelector('img')!.loading = 'eager'
    layers.forEach((l) => (l.style.zIndex = l === next ? '2' : l === prev ? '1' : '0'))
    if (instant || reduceMotion) {
      layers.forEach((l) => gsap.set(l, { opacity: l === next ? 1 : 0 }))
    } else {
      gsap.fromTo(next, { opacity: 0 }, { opacity: 1, duration: 0.7, ease: 'power2.out', overwrite: true, onComplete: () => layers.forEach((l) => l !== next && gsap.set(l, { opacity: 0 })) })
      gsap.fromTo(next.querySelector('picture'), { scale: 1.06 }, { scale: 1, duration: 1.4, ease: 'expo.out', overwrite: true })
    }
    elPlace.textContent = t(photo(stops[i].photo).meta.place)
    if (inView) themeTo(photo(stops[i].photo).palette, 0.9)
  }

  function render(m: number, instant = false) {
    minutes = ((Math.round(m) % DAY) + DAY) % DAY
    const a = angleOf(minutes)
    const x = Math.cos(a) * R * (isRTL() ? -1 : 1)
    const y = -Math.sin(a) * R
    // Pass 1: position (SVG attribute, tiny repaint). Night draws the moon shadow.
    knob.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`)
    const alt = Math.round(altitude(minutes))
    knob.classList.toggle('is-moon', alt < -3)
    const time = fromMinutes(minutes)
    elTime.textContent = time
    const i = nearest(minutes)
    elPhase.textContent = t(stops[i].phase)
    elAlt.textContent = `${t(C.ui.sun)} ${Math.abs(alt)}° ${t(alt >= 0 ? sp.above : sp.below)}`
    hit.setAttribute('aria-valuenow', String(minutes))
    hit.setAttribute('aria-valuetext', `${time}, ${t(stops[i].phase)}, ${elAlt.textContent}`)
    show(i, instant)
  }

  // Pointer: the angle from the dial centre becomes the closest time on the dial.
  const toMinutesFromPoint = (cx: number, cy: number) => {
    const r = svg.getBoundingClientRect()
    const dx = (cx - (r.left + r.width / 2)) * (isRTL() ? -1 : 1)
    const dy = -(cy - (r.top + r.height / 2))
    const a = Math.atan2(dy, dx)
    let best = minutes, bd = Infinity
    for (let m = 0; m < DAY; m += 2) {
      const diff = angleOf(m) - a
      const d = Math.abs(Math.atan2(Math.sin(diff), Math.cos(diff)))
      if (d < bd) { bd = d; best = m }
    }
    return best
  }

  let dragging = false
  const target = { m: minutes }
  const follow = (m: number) => {
    // Take the short way round the clock so 23:50 -> 00:10 doesn't spin backwards.
    let d = m - target.m
    if (d > DAY / 2) d -= DAY
    if (d < -DAY / 2) d += DAY
    gsap.to(target, { m: target.m + d, duration: reduceMotion ? 0 : 0.35, ease: 'power3.out', overwrite: true, onUpdate: () => render(target.m) })
  }
  const onDown = (e: PointerEvent) => {
    dragging = true
    hit.setPointerCapture(e.pointerId)
    sec.classList.add('is-dragging')
    follow(toMinutesFromPoint(e.clientX, e.clientY))
  }
  hit.addEventListener('pointerdown', onDown)
  hit.addEventListener('pointermove', (e) => dragging && follow(toMinutesFromPoint(e.clientX, e.clientY)))
  const up = () => {
    dragging = false
    sec.classList.remove('is-dragging')
  }
  hit.addEventListener('pointerup', up)
  hit.addEventListener('pointercancel', up)

  hit.addEventListener('keydown', (e) => {
    const step: Record<string, number> = { ArrowRight: 10, ArrowUp: 10, ArrowLeft: -10, ArrowDown: -10, PageUp: 60, PageDown: -60 }
    let d = step[e.key]
    if (isRTL() && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) d = -d
    if (d) {
      e.preventDefault()
      follow(target.m + d)
    } else if (e.key === 'Home') {
      e.preventDefault()
      follow(rise)
    } else if (e.key === 'End') {
      e.preventDefault()
      follow(set)
    }
  })

  // Morning sits on the side the reader starts from.
  const placeHours = () => {
    const sx = isRTL() ? -1 : 1
    svg.querySelector('.h6')!.setAttribute('x', String(-164 * sx))
    svg.querySelector('.h18')!.setAttribute('x', String(164 * sx))
  }
  placeHours()
  render(minutes, true)

  ScrollTrigger.create({
    trigger: sec,
    start: 'top 55%',
    end: 'bottom 55%',
    onToggle: (self) => {
      inView = self.isActive
      if (inView) themeTo(photo(stops[current].photo).palette, 1.1)
    },
  })
  // Warm the stack before it is reached so switching never waits.
  ScrollTrigger.create({
    trigger: sec,
    start: 'top 250%',
    once: true,
    onEnter: () => layers.forEach((l) => {
      const img = l.querySelector('img')!
      img.loading = 'eager'
      img.decode?.().catch(() => {})
    }),
  })
  // A gentle demo: the sun travels from midday to golden hour as you arrive.
  if (!reduceMotion) {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 60%',
      once: true,
      onEnter: () => {
        target.m = noon
        render(noon, true)
        gsap.to(target, { m: toMinutes(sp.start), duration: 2.4, ease: 'power2.inOut', onUpdate: () => render(target.m) })
      },
    })
  }
  onLang(() => {
    placeHours()
    render(minutes, true)
  })
}
