import { C } from './data'
import { t, onLang } from './i18n'
import { gsap, finePointer, reduceMotion } from './smooth'

// Desktop only: a small dot that eases after the pointer and opens into a
// "View" lens over photos. Buttons marked data-magnetic lean toward it.

export function initCursor() {
  if (!finePointer || reduceMotion) return
  const cur = document.querySelector<HTMLElement>('.cursor')!
  const lbl = cur.querySelector<HTMLElement>('.cursor__lbl')!
  document.documentElement.classList.add('has-cursor')
  const xTo = gsap.quickTo(cur, 'x', { duration: 0.45, ease: 'power3' })
  const yTo = gsap.quickTo(cur, 'y', { duration: 0.45, ease: 'power3' })
  let lens = false
  let shown = false

  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return
    if (!shown) {
      shown = true
      gsap.set(cur, { x: e.clientX, y: e.clientY })
      gsap.to(cur, { opacity: 1, duration: 0.3 })
    }
    xTo(e.clientX)
    yTo(e.clientY)
    const over = (e.target as HTMLElement).closest?.('[data-cursor]')
    if (!!over !== lens) {
      lens = !!over
      cur.classList.toggle('is-lens', lens)
      gsap.to(cur.querySelector('.cursor__ring'), { scale: lens ? 1 : 0.14, duration: 0.55, ease: 'expo.out' })
      gsap.to(lbl, { opacity: lens ? 1 : 0, scale: lens ? 1 : 0.6, duration: 0.4, ease: 'power3.out' })
    }
  })
  document.addEventListener('pointerleave', () => {
    shown = false
    gsap.to(cur, { opacity: 0, duration: 0.3 })
  })
  lbl.textContent = t(C.ui.view)
  onLang(() => (lbl.textContent = t(C.ui.view)))

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const mx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' })
    const my = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' })
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect()
      mx((e.clientX - (r.left + r.width / 2)) * 0.3)
      my((e.clientY - (r.top + r.height / 2)) * 0.4)
    })
    el.addEventListener('pointerleave', () => {
      mx(0)
      my(0)
    })
  })
}
