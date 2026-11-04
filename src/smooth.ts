import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Flip } from 'gsap/Flip'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, Flip)

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches

export let lenis: Lenis | null = null

/** One clock for everything: Lenis is advanced by GSAP's ticker, and every Lenis scroll updates ScrollTrigger. */
export function initSmooth() {
  gsap.ticker.lagSmoothing(0)
  if (reduceMotion) return
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, anchors: false })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis!.raf(time * 1000))

  // In-page links glide instead of jumping.
  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]')
    if (!a || a.hasAttribute('data-credits-toggle')) return
    const id = a.getAttribute('href')!
    const el = id === '#top' ? document.body : document.querySelector<HTMLElement>(id)
    if (!el) return
    e.preventDefault()
    lenis!.scrollTo(id === '#top' ? 0 : el, { duration: 1.6, offset: 0 })
    if (id !== '#top') history.replaceState(null, '', id)
  })
}

export const stopScroll = () => (lenis ? lenis.stop() : (document.documentElement.style.overflow = 'hidden'))
export const startScroll = () => (lenis ? lenis.start() : (document.documentElement.style.overflow = ''))

export function scrollToEl(el: HTMLElement | number) {
  if (lenis) lenis.scrollTo(el, { duration: 1.4 })
  else if (typeof el === 'number') window.scrollTo(0, el)
  else el.scrollIntoView()
}

export { gsap, ScrollTrigger, Flip }
