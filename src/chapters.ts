import { photo } from './data'
import { dirSign } from './i18n'
import { gsap, ScrollTrigger, reduceMotion, finePointer } from './smooth'

// Chapters: an index whose rows float a cover preview under the cursor, then
// one section per collection with a scroll-scrubbed cover reveal and a
// masonry gallery whose columns drift at different speeds.

function layoutGalleries() {
  const galleries = document.querySelectorAll<HTMLElement>('[data-gallery]')
  let cols = 0
  const build = () => {
    const next = window.innerWidth >= 900 ? 3 : 2
    if (next === cols) return
    cols = next
    galleries.forEach((g) => {
      const items = Array.from(g.querySelectorAll<HTMLElement>('.g-item')).sort((a, b) => Number(a.dataset.col) - Number(b.dataset.col))
      g.innerHTML = ''
      const columns = Array.from({ length: cols }, (_, i) => {
        const c = document.createElement('div')
        c.className = 'g-col'
        c.dataset.c = String(i)
        g.appendChild(c)
        return { el: c, h: 0 }
      })
      items.forEach((it) => {
        const id = it.querySelector<HTMLElement>('[data-photo-label]')!.dataset.photoLabel!
        const p = photo(id)
        const target = columns.reduce((a, b) => (b.h < a.h - 0.05 ? b : a))
        target.el.appendChild(it)
        target.h += p.h / p.w + 0.12
      })
    })
    ScrollTrigger.refresh()
  }
  build()
  let raf = 0
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(build)
  })
}

function galleryMotion() {
  if (reduceMotion) return
  document.querySelectorAll<HTMLElement>('[data-gallery]').forEach((g) => {
    // Middle column drifts against the others for a slow, weightless depth.
    gsap.fromTo(
      g,
      { '--drift': 1 },
      {
        '--drift': -1,
        ease: 'none',
        scrollTrigger: { trigger: g, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    )
    ScrollTrigger.batch(g.querySelectorAll('.g-item'), {
      start: 'top 92%',
      once: true,
      onEnter: (els) =>
        gsap.fromTo(
          els,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, stagger: 0.12, ease: 'expo.out' },
        ),
    })
    gsap.set(g.querySelectorAll('.g-item'), { clipPath: 'inset(100% 0% 0% 0%)' })
  })
}

function covers() {
  if (reduceMotion) return
  document.querySelectorAll<HTMLElement>('.chapter').forEach((ch) => {
    const media = ch.querySelector<HTMLElement>('.chapter__media')!
    const pic = media.querySelector('picture')!
    gsap.timeline({ scrollTrigger: { trigger: ch.querySelector('.chapter__cover'), start: 'top 85%', end: 'top 10%', scrub: 0.8 } })
      .fromTo(media, { clipPath: 'inset(16% 14% 16% 14%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, 0)
      .fromTo(pic, { scale: 1.3 }, { scale: 1.05, ease: 'none' }, 0)
    gsap.to(pic, {
      yPercent: 8,
      ease: 'none',
      scrollTrigger: { trigger: ch.querySelector('.chapter__cover'), start: 'top top', end: 'bottom top', scrub: true },
    })
  })
}

/** Storms: one soft double flicker on entry. Kept faint and brief on purpose. */
function lightning() {
  if (reduceMotion) return
  const flash = document.querySelector<HTMLElement>('.flash')!
  document.querySelectorAll<HTMLElement>('[data-effect="lightning"]').forEach((ch) => {
    const title = ch.querySelector('.chapter__title')
    const strike = () =>
      gsap.timeline()
        .set(flash, { opacity: 0 })
        .to(flash, { opacity: 0.32, duration: 0.05, ease: 'none' })
        .to(flash, { opacity: 0, duration: 0.18, ease: 'power2.out' })
        .to(flash, { opacity: 0.18, duration: 0.04, ease: 'none' }, '+=0.12')
        .to(flash, { opacity: 0, duration: 0.6, ease: 'power2.out' })
        .fromTo(title, { opacity: 0.4 }, { opacity: 1, duration: 0.45, ease: 'steps(5)' }, 0)
    ScrollTrigger.create({ trigger: ch.querySelector('.chapter__cover'), start: 'top 40%', onEnter: strike })
  })
}

/** Index rows: a cover preview follows the pointer and changes with the row. */
function indexPreview() {
  if (!finePointer || reduceMotion) return
  const box = document.querySelector<HTMLElement>('.cindex__preview')!
  const pvs = new Map(Array.from(box.querySelectorAll<HTMLElement>('[data-pv]')).map((el) => [el.dataset.pv!, el]))
  const list = document.querySelector<HTMLElement>('.cindex')!
  const xTo = gsap.quickTo(box, 'x', { duration: 0.6, ease: 'power3' })
  const yTo = gsap.quickTo(box, 'y', { duration: 0.6, ease: 'power3' })
  let active: HTMLElement | null = null
  list.addEventListener('pointermove', (e) => {
    const r = (box.offsetParent as HTMLElement).getBoundingClientRect()
    xTo(e.clientX - r.left - box.offsetWidth / 2 + 90 * dirSign())
    yTo(e.clientY - r.top - box.offsetHeight / 2)
  })
  list.addEventListener('pointerenter', () => gsap.to(box, { opacity: 1, scale: 1, duration: 0.5, ease: 'power3.out' }))
  list.addEventListener('pointerleave', () => gsap.to(box, { opacity: 0, scale: 0.85, duration: 0.4, ease: 'power3.out' }))
  list.querySelectorAll<HTMLElement>('[data-preview]').forEach((row) => {
    row.addEventListener('pointerenter', () => {
      const pv = pvs.get(row.dataset.preview!)!
      if (pv === active) return
      if (active) gsap.to(active, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.5, ease: 'expo.out' })
      gsap.fromTo(pv, { clipPath: 'inset(100% 0% 0% 0%)', zIndex: 2 }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'expo.out' })
      gsap.fromTo(pv.querySelector('picture'), { scale: 1.3 }, { scale: 1, duration: 0.9, ease: 'expo.out' })
      if (active) gsap.set(active, { zIndex: 1 })
      active = pv
    })
  })
  gsap.set(box, { opacity: 0, scale: 0.85 })
  gsap.set(Array.from(pvs.values()), { clipPath: 'inset(100% 0% 0% 0%)' })
}

export function initChapters() {
  layoutGalleries()
  galleryMotion()
  covers()
  lightning()
  indexPreview()
}
