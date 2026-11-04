import { photo } from './data'
import { onLang } from './i18n'
import { themeTo, NEUTRAL } from './theme'
import { gsap, ScrollTrigger, reduceMotion } from './smooth'

// Word-mask headline reveals, fades, clip-path photo reveals, counters,
// parallax and the colour zones that hand the page theme from section to section.

/** Wraps each word in a mask. Words, never letters, so Arabic letters stay joined. */
function split(el: HTMLElement) {
  const text = el.textContent ?? ''
  el.setAttribute('aria-label', text.replace(/\n/g, ' '))
  el.innerHTML = text
    .split('\n')
    .map((line) =>
      line
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `<span class="w" aria-hidden="true"><span class="wi">${w}</span></span>`)
        .join(' '),
    )
    .join('<br>')
  return el.querySelectorAll<HTMLElement>('.wi')
}

function headlines() {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    const words = split(el)
    if (reduceMotion) return
    gsap.set(words, { yPercent: 110 })
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        el.dataset.shown = '1'
        gsap.to(el.querySelectorAll('.wi'), { yPercent: 0, duration: 1.15, stagger: 0.06, ease: 'expo.out' })
      },
    })
  })
  // Re-split after a language change; keep already revealed lines visible.
  onLang(() => {
    document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      const words = split(el)
      if (!reduceMotion && !el.dataset.shown) gsap.set(words, { yPercent: 110 })
    })
  })
}

function fades() {
  if (reduceMotion) return
  ScrollTrigger.batch('[data-fade]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) => gsap.fromTo(els, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.08, ease: 'power3.out', overwrite: true }),
  })
  gsap.set('[data-fade]', { opacity: 0 })
}

function clips() {
  if (reduceMotion) return
  document.querySelectorAll<HTMLElement>('.clip').forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: 'inset(22% 8% 22% 8%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: 0.6 } },
    )
  })
}

function parallax() {
  if (reduceMotion) return
  document.querySelectorAll<HTMLElement>('[data-speed]').forEach((el) => {
    const s = Number(el.dataset.speed)
    gsap.fromTo(el, { yPercent: -s }, { yPercent: s, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } })
  })
}

function counters() {
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count)
    const fmt = (v: number) => Math.round(v).toLocaleString('en-US')
    if (reduceMotion) {
      el.textContent = fmt(target)
      return
    }
    const o = { v: 0 }
    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => gsap.to(o, { v: target, duration: 2.2, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v)) }),
    })
  })
}

/** Scroll-linked word brightening for the practice statement. */
function intro() {
  const el = document.querySelector<HTMLElement>('[data-words]')!
  let st: ScrollTrigger | undefined
  const build = () => {
    st?.kill()
    const text = el.textContent ?? ''
    el.setAttribute('aria-label', text)
    el.innerHTML = text
      .split(/\s+/)
      .map((w) => `<span class="iw" aria-hidden="true">${w}</span>`)
      .join(' ')
    if (reduceMotion) return
    const words = el.querySelectorAll('.iw')
    const tw = gsap.fromTo(words, { opacity: 0.16 }, { opacity: 1, stagger: 0.1, ease: 'none', duration: 0.6 })
    st = ScrollTrigger.create({ trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.5, animation: tw })
  }
  build()
  onLang(() => {
    build()
  })
}

/** Each section with data-theme-photo (or data-theme="neutral") takes over the page colour while it holds the middle of the screen. */
function zones() {
  document.querySelectorAll<HTMLElement>('[data-theme-photo], [data-theme]').forEach((el) => {
    const id = el.dataset.themePhoto
    const pal = id ? photo(id).palette : NEUTRAL
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => {
        if (self.isActive) themeTo(pal, reduceMotion ? 0.01 : 1.1)
      },
    })
  })
}

export function initReveals() {
  headlines()
  fades()
  clips()
  parallax()
  counters()
  intro()
  zones()
}
