import { C, photo } from './data'
import { t, dirSign, onLang } from './i18n'
import { bestWidth, decodePhoto } from './img'
import { gsap, Flip, reduceMotion, stopScroll, startScroll } from './smooth'

// Full-screen viewer. Gallery thumbnails keep each photo's real aspect ratio,
// so GSAP Flip can carry the thumbnail into the viewer with a uniform scale
// (transform only, no distortion). The big file is decoded before it replaces
// the thumbnail, and the neighbours are decoded in the background.

const groups: Record<string, string[]> = Object.fromEntries(C.chapters.items.map((c) => [c.id, c.photos]))

export function initLightbox() {
  const lb = document.querySelector<HTMLElement>('.lb')!
  const bg = lb.querySelector<HTMLElement>('.lb__bg')!
  const stage = lb.querySelector<HTMLElement>('.lb__stage')!
  const frame = lb.querySelector<HTMLElement>('.lb__frame')!
  const img = lb.querySelector<HTMLImageElement>('.lb__img')!
  const ui = lb.querySelector<HTMLElement>('.lb__ui')!
  const btnClose = lb.querySelector<HTMLButtonElement>('.lb__close')!
  const btnPrev = lb.querySelector<HTMLButtonElement>('.lb__prev')!
  const btnNext = lb.querySelector<HTMLButtonElement>('.lb__next')!
  const $ = (id: string) => document.getElementById(id)!

  let group: string[] = []
  let groupName = ''
  let index = 0
  let opener: HTMLElement | null = null
  let busy = false
  let isOpen = false

  /** Largest box with the photo's aspect that fits the stage. */
  function fit(id: string) {
    const p = photo(id)
    const sr = stage.getBoundingClientRect()
    const scale = Math.min(sr.width / p.w, sr.height / p.h)
    const w = Math.round(p.w * scale)
    const h = Math.round(p.h * scale)
    frame.style.width = `${w}px`
    frame.style.height = `${h}px`
    return w
  }

  function meta(id: string) {
    const p = photo(id)
    $('lb-alt').textContent = t(p.alt)
    $('lb-time').textContent = p.meta.time
    $('lb-place').textContent = t(p.meta.place)
    $('lb-camera').textContent = p.meta.camera
    $('lb-lens').textContent = p.meta.lens
    $('lb-exposure').textContent = p.meta.exposure
    const a = $('lb-credit') as HTMLAnchorElement
    a.textContent = `${p.credit.name} / Pexels`
    a.href = `https://www.pexels.com/photo/${p.credit.id}/`
    $('lb-count').textContent = `${String(index + 1).padStart(2, '0')} / ${String(group.length).padStart(2, '0')}`
    img.alt = t(p.alt)
  }

  /** Swap in the sharp file only once it is decoded. */
  function sharpen(id: string, cssW: number) {
    decodePhoto(id, bestWidth(id, cssW)).then((url) => {
      if (group[index] === id && isOpen) img.src = url
    })
  }

  function preloadNeighbours() {
    for (const d of [1, -1, 2]) {
      const id = group[(index + d + group.length) % group.length]
      decodePhoto(id, bestWidth(id, Math.min(window.innerWidth, 1400)))
    }
  }

  const thumbFor = (i: number) =>
    document.querySelector<HTMLElement>(`[data-group="${groupName}"][data-index="${i}"] picture`)

  function open(name: string, i: number, trigger: HTMLElement) {
    if (busy || isOpen) return
    busy = true
    isOpen = true
    groupName = name
    group = groups[name]
    index = i
    opener = trigger
    const id = group[i]
    const thumb = trigger.querySelector('picture')!
    const thumbImg = thumb.querySelector('img')!

    img.src = thumbImg.currentSrc || thumbImg.src
    lb.hidden = false
    stopScroll()
    document.documentElement.classList.add('lb-open')
    const w = fit(id)
    meta(id)

    // Shared element: Flip from the thumbnail's box into the frame.
    thumb.setAttribute('data-flip-id', 'lb')
    frame.setAttribute('data-flip-id', 'lb')
    const state = Flip.getState(thumb)
    gsap.set(thumb, { opacity: 0 })
    const tl = gsap.timeline({
      onComplete: () => {
        busy = false
        sharpen(id, w)
        preloadNeighbours()
      },
    })
    tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: reduceMotion ? 0.2 : 0.6, ease: 'power2.out' }, 0)
    if (reduceMotion) tl.fromTo(frame, { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0)
    else tl.add(Flip.from(state, { targets: frame, scale: true, duration: 0.95, ease: 'expo.inOut' }), 0)
    tl.fromTo(ui.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.04, ease: 'power3.out' }, reduceMotion ? 0 : 0.55)
    btnClose.focus({ preventScroll: true })
  }

  function close() {
    if (busy || !isOpen) return
    busy = true
    const thumb = thumbFor(index)
    const r = thumb?.getBoundingClientRect()
    const visible = r && r.bottom > 0 && r.top < window.innerHeight
    const done = () => {
      lb.hidden = true
      isOpen = false
      busy = false
      document.querySelectorAll<HTMLElement>('.g-btn picture').forEach((p) => gsap.set(p, { opacity: 1 }))
      gsap.set(frame, { clearProps: 'transform,opacity' })
      document.documentElement.classList.remove('lb-open')
      startScroll()
      const back = thumb?.closest('button') ?? opener
      back?.focus({ preventScroll: true })
    }
    const tl = gsap.timeline({ onComplete: done })
    tl.to(ui.children, { opacity: 0, duration: 0.25, ease: 'power2.in' }, 0)
    if (thumb && visible && !reduceMotion) {
      gsap.set(thumb, { opacity: 0 })
      tl.add(Flip.fit(frame, thumb, { scale: true, duration: 0.8, ease: 'expo.inOut' }) as gsap.core.Tween, 0.05)
    } else {
      tl.to(frame, { opacity: 0, scale: 0.96, duration: 0.4, ease: 'power2.in' }, 0)
    }
    tl.to(bg, { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 0.3)
  }

  /** Step through the group. step = +1 next, -1 previous (in reading order). */
  async function go(step: number, fromDrag = 0) {
    if (busy || !isOpen) return
    busy = true
    // Keep the thumbnail we will return to in sync with the visible photo.
    const prevThumb = thumbFor(index)
    if (prevThumb) gsap.set(prevThumb, { opacity: 1 })
    index = (index + step + group.length) % group.length
    const id = group[index]
    const thumb = thumbFor(index)
    if (thumb) gsap.set(thumb, { opacity: 0 })
    const dx = step * dirSign() * Math.min(window.innerWidth * 0.18, 220)
    const nextW = Math.round(Math.min(stage.clientWidth, (stage.clientHeight * photo(id).w) / photo(id).h))
    const url = decodePhoto(id, bestWidth(id, nextW))
    await gsap.to(frame, { x: fromDrag - dx, opacity: 0, duration: reduceMotion ? 0.15 : 0.35, ease: 'power2.in' })
    const src = await url
    img.src = src
    const w = fit(id)
    meta(id)
    await gsap.fromTo(frame, { x: dx, opacity: 0 }, { x: 0, opacity: 1, duration: reduceMotion ? 0.15 : 0.6, ease: 'expo.out' })
    busy = false
    sharpen(id, w)
    preloadNeighbours()
  }

  // Openers
  document.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-group][data-index]')
    if (!b) return
    open(b.dataset.group!, Number(b.dataset.index), b)
  })
  btnClose.addEventListener('click', close)
  bg.addEventListener('click', close)
  btnNext.addEventListener('click', () => go(1))
  btnPrev.addEventListener('click', () => go(-1))

  // Keyboard: arrows follow the reading direction, Esc closes, Tab stays inside.
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowRight') go(dirSign())
    else if (e.key === 'ArrowLeft') go(-dirSign())
    else if (e.key === 'Tab') {
      const f = Array.from(lb.querySelectorAll<HTMLElement>('button, a[href]'))
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
  })

  // Swipe: the photo follows the finger, then commits or springs back.
  let startX = 0, startY = 0, dragging = false, dx = 0, t0 = 0
  stage.addEventListener('pointerdown', (e) => {
    if (busy) return
    dragging = true
    startX = e.clientX
    startY = e.clientY
    dx = 0
    t0 = performance.now()
    stage.setPointerCapture(e.pointerId)
  })
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return
    dx = e.clientX - startX
    if (Math.abs(e.clientY - startY) > Math.abs(dx) * 1.4) return
    gsap.set(frame, { x: dx * 0.9 })
  })
  const end = (e: PointerEvent) => {
    if (!dragging) return
    dragging = false
    const v = Math.abs(dx) / Math.max(1, performance.now() - t0)
    if (Math.abs(dx) > 70 || (Math.abs(dx) > 25 && v > 0.5)) {
      // Dragging toward the reading direction's end reveals the next photo.
      const step = (dx < 0 ? 1 : -1) * dirSign()
      go(step, dx * 0.9)
    } else if (Math.abs(dx) < 6) {
      // A tap beside the photo closes, like tapping the backdrop.
      const r = frame.getBoundingClientRect()
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      if (!inside && e.type === 'pointerup') close()
    } else {
      gsap.to(frame, { x: 0, duration: 0.5, ease: 'expo.out' })
    }
  }
  stage.addEventListener('pointerup', end)
  stage.addEventListener('pointercancel', end)

  window.addEventListener('resize', () => {
    if (isOpen && !busy) fit(group[index])
  })
  onLang(() => {
    if (isOpen) meta(group[index])
  })
}
