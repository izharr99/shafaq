import { dirSign, onLang } from './i18n'
import { gsap, ScrollTrigger, reduceMotion } from './smooth'

// The Instagram strip drifts slowly in the reading direction and pauses on hover.

export function initFeed() {
  if (reduceMotion) return
  const track = document.querySelector<HTMLElement>('.feed__track')!
  let tw: gsap.core.Tween
  const build = () => {
    tw?.kill()
    gsap.set(track, { xPercent: 0 })
    tw = gsap.to(track, { xPercent: -50 * dirSign(), duration: 70, ease: 'none', repeat: -1, paused: true })
  }
  build()
  ScrollTrigger.create({ trigger: track, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? tw.play() : tw.pause()) })
  track.addEventListener('pointerenter', () => gsap.to(tw, { timeScale: 0.15, duration: 0.6 }))
  track.addEventListener('pointerleave', () => gsap.to(tw, { timeScale: 1, duration: 0.6 }))
  onLang(() => {
    const playing = !tw.paused()
    build()
    if (playing) tw.play()
  })
}
