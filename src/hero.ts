import { C, photo, toMinutes, fromMinutes } from './data'
import { t, onLang } from './i18n'
import { mixTheme } from './theme'
import { gsap, ScrollTrigger, reduceMotion } from './smooth'

// The hero is one day in one scroll. Each step reveals the next sky from the
// bottom of the frame while the page colour, clock, sun altitude and place
// follow the photo on screen.

const STEP = 1.35 // timeline units per stop (1 = transition, 0.35 = hold)
const ease = gsap.parseEase('power1.inOut')

export function initHero() {
  const hero = document.querySelector<HTMLElement>('.hero')!
  const shots = gsap.utils.toArray<HTMLElement>('.hero__shot', hero)
  const imgs = shots.map((s) => s.querySelector('img')!)
  const stops = C.hero.stops
  const pal = stops.map((s) => photo(s.photo).palette)
  const mins = stops.map((s) => toMinutes(s.time))
  const n = stops.length

  const $ = (id: string) => document.getElementById(id)!
  const elPhase = $('h-phase'), elPlace = $('h-place'), elTime = $('h-time'), elBody = $('h-body'), elAlt = $('h-alt')
  const fill = hero.querySelector<HTMLElement>('.hero__fill')!
  const ticks = gsap.utils.toArray<HTMLElement>('.hero__ticks li', hero)

  let shown = -1
  let lastTime = ''
  let lastAlt = ''
  let pos = 0
  let active = true

  const label = (i: number) => {
    shown = i
    elPhase.textContent = t(stops[i].phase)
    elPlace.textContent = t(photo(stops[i].photo).meta.place)
    elBody.textContent = t(stops[i].body === 'moon' ? C.ui.moon : C.ui.sun)
    ticks.forEach((li, k) => li.classList.toggle('is-on', k <= i))
  }

  function update(p: number) {
    pos = p
    const i = Math.min(n - 2, Math.floor(p))
    const f = p - i
    // Only own the page colour while pinned; a scrub still catching up after a
    // jump past the hero must not override the section now on screen.
    if (active) mixTheme(pal[i], pal[i + 1], f)
    const near = Math.round(p)
    if (near !== shown) label(near)
    const time = fromMinutes(mins[i] + (mins[i + 1] - mins[i]) * f)
    if (time !== lastTime) elTime.textContent = lastTime = time
    const a = Math.round(stops[i].altitude + (stops[i + 1].altitude - stops[i].altitude) * f)
    const alt = `${a > 0 ? '+' : a < 0 ? '−' : ''}${Math.abs(a)}°`
    if (alt !== lastAlt) elAlt.textContent = lastAlt = alt
    fill.style.transform = `scaleX(${p / (n - 1)})`
  }

  gsap.set(shots.slice(1), { clipPath: 'inset(100% 0% 0% 0%)' })
  gsap.set(imgs, { scale: 1.06, transformOrigin: '50% 60%' })

  const tl = gsap.timeline({ defaults: { ease: 'none' }, paused: true })
  for (let i = 1; i < n; i++) {
    const at = (i - 1) * STEP
    tl.to(shots[i], { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power1.inOut' }, at)
    if (!reduceMotion) {
      tl.fromTo(imgs[i], { scale: 1.22, yPercent: 7 }, { scale: 1.06, yPercent: 0, duration: 1, ease: 'power1.inOut' }, at)
      tl.to(imgs[i - 1], { yPercent: -9, scale: 1.02, duration: 1, ease: 'power1.inOut' }, at)
    }
  }
  tl.set({}, {}, (n - 1) * STEP)

  // Map timeline time to a float stop index that matches the clip easing.
  const stopAt = (time: number) => {
    const i = Math.min(n - 2, Math.floor(time / STEP))
    const f = Math.min(1, Math.max(0, (time - i * STEP) / 1))
    return i + ease(f)
  }

  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: () => `+=${window.innerHeight * 0.85 * (n - 1)}`,
    pin: true,
    scrub: reduceMotion ? true : 0.7,
    animation: tl,
    onToggle: (self) => {
      active = self.isActive
      if (active) update(stopAt(tl.time()))
    },
  })
  // Follow the scrubbed timeline itself (not raw scroll) so labels and colour
  // stay locked to the picture while the scrub eases in.
  tl.eventCallback('onUpdate', () => update(stopAt(tl.time())))

  // Decode the full sequence early so no step waits on an image.
  const decodeAll = () => imgs.forEach((img) => {
    img.loading = 'eager'
    img.decode?.().catch(() => {})
  })
  if ('requestIdleCallback' in window) requestIdleCallback(decodeAll, { timeout: 1500 })
  else setTimeout(decodeAll, 600)

  update(0)
  onLang(() => {
    shown = -1
    update(pos)
  })

  // Entrance: the frame opens like an eyelid on the horizon, then the copy rises.
  if (!reduceMotion) {
    const intro = gsap.timeline({ delay: 0.15 })
    intro
      .from('.hero__frame', { clipPath: 'inset(48% 0% 48% 0%)', duration: 1.6, ease: 'expo.inOut' })
      .from(shots[0].querySelector('picture'), { scale: 1.25, duration: 2.2, ease: 'expo.out' }, 0.4)
      .from('.hero__bar > *', { y: 24, opacity: 0, duration: 1, stagger: 0.07, ease: 'power3.out' }, 1.0)
      .from('.hero__copy .eyebrow, .hero__lede', { y: 18, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out' }, 1.2)
      .from('.hdr > *', { y: -16, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out' }, 1.1)
  }
}
