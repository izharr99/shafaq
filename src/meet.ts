import { onLang, isRTL } from './i18n'
import { gsap, ScrollTrigger, reduceMotion } from './smooth'

// "Meet the photographer": the portrait rises into view through a circular
// mask like the sun clearing the horizon, the story reveals line by line, a
// signature is uncovered under the pull quote and a milestone line draws
// itself across the years. Transform, opacity and clip-path only.

/** Groups words into the lines the browser actually laid out, then masks each line. */
function splitLines(el: HTMLElement) {
  // Fresh text (first run or after a language switch) vs. an already split paragraph.
  const text = el.querySelector('.ln') ? el.dataset.src ?? '' : el.textContent ?? ''
  el.dataset.src = text
  el.setAttribute('aria-label', text)
  el.innerHTML = text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `<span class="lw">${w}</span>`)
    .join(' ')
  const words = Array.from(el.querySelectorAll<HTMLElement>('.lw'))
  const lines: string[][] = []
  let top = -1
  for (const w of words) {
    if (Math.abs(w.offsetTop - top) > 4) {
      lines.push([])
      top = w.offsetTop
    }
    lines[lines.length - 1].push(w.textContent ?? '')
  }
  el.innerHTML = lines.map((l) => `<span class="ln" aria-hidden="true"><span class="lni">${l.join(' ')}</span></span>`).join('')
  return el.querySelectorAll<HTMLElement>('.lni')
}

function storyLines() {
  const paras = Array.from(document.querySelectorAll<HTMLElement>('[data-lines]'))
  const build = () =>
    paras.forEach((p) => {
      const lines = splitLines(p)
      if (reduceMotion || p.dataset.shown) return
      gsap.set(lines, { yPercent: 105, opacity: 0 })
    })
  build()
  if (!reduceMotion) {
    paras.forEach((p) =>
      ScrollTrigger.create({
        trigger: p,
        start: 'top 86%',
        once: true,
        onEnter: () => {
          p.dataset.shown = '1'
          gsap.to(p.querySelectorAll('.lni'), { yPercent: 0, opacity: 1, duration: 1.1, stagger: 0.09, ease: 'expo.out' })
        },
      }),
    )
  }
  let w = window.innerWidth
  window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - w) < 40) return
    w = window.innerWidth
    build()
  })
  onLang(() => requestAnimationFrame(build))
  // Line breaks depend on the real font, so measure again once it has loaded.
  document.fonts?.ready.then(build)
}

function portrait() {
  if (reduceMotion) return
  const fig = document.querySelector<HTMLElement>('.meet__portrait')!
  const mask = fig.querySelector<HTMLElement>('.meet__mask')!
  const inner = fig.querySelector<HTMLElement>('.meet__inner')!
  // Sunrise mask: a small disc on the bottom edge grows to fill the frame.
  gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 90%', end: 'top 20%', scrub: 0.8 } })
    .fromTo(mask, { clipPath: 'circle(14% at 50% 100%)' }, { clipPath: 'circle(125% at 50% 100%)', ease: 'none' }, 0)
    .fromTo(inner, { scale: 1.32, yPercent: 6 }, { scale: 1.08, yPercent: 0, ease: 'none' }, 0)
    .fromTo('.meet__grade', { opacity: 0.85 }, { opacity: 0.35, ease: 'none' }, 0)
  // Slow drift while the story scrolls past the sticky portrait.
  gsap.to(inner, {
    yPercent: -5,
    ease: 'none',
    scrollTrigger: { trigger: '.meet__grid', start: 'top top', end: 'bottom bottom', scrub: true },
  })
  const inset = document.querySelector<HTMLElement>('.meet__inset-mask')!
  gsap.fromTo(
    inset,
    { clipPath: 'inset(0% 0% 100% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: inset, start: 'top 92%', end: 'top 50%', scrub: 0.6 } },
  )
  gsap.fromTo(inset.querySelector('picture'), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: inset, start: 'top 92%', end: 'bottom 40%', scrub: 0.6 } })
}

function signature() {
  const sig = document.querySelector<HTMLElement>('.meet__sig')!
  if (reduceMotion) return
  // Uncover the pen stroke in writing order (Latin signature, so left to right).
  ScrollTrigger.create({
    trigger: sig,
    start: 'top 85%',
    once: true,
    onEnter: () => gsap.fromTo(sig, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'power2.inOut' }),
  })
  gsap.set(sig, { clipPath: 'inset(0% 100% 0% 0%)' })
}

function timeline() {
  const tl = document.querySelector<HTMLElement>('.tl')!
  const fill = tl.querySelector<HTMLElement>('.tl__fill')!
  const items = Array.from(tl.querySelectorAll<HTMLElement>('.tl__item'))
  if (reduceMotion) {
    items.forEach((i) => i.classList.add('is-on'))
    gsap.set(fill, { scale: 1 })
    return
  }
  const vertical = () => window.innerWidth < 900
  const st = ScrollTrigger.create({
    trigger: tl,
    start: () => (vertical() ? 'top 75%' : 'top 80%'),
    end: () => (vertical() ? 'bottom 55%' : 'top 35%'),
    scrub: 0.6,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const p = self.progress
      fill.style.transform = vertical() ? `scaleY(${p})` : `scaleX(${p})`
      items.forEach((it, i) => it.classList.toggle('is-on', p >= i / (items.length - 1) - 0.02))
    },
  })
  onLang(() => {
    fill.style.transformOrigin = vertical() ? 'top' : isRTL() ? 'right' : 'left'
    st.refresh()
  })
  fill.style.transformOrigin = vertical() ? 'top' : isRTL() ? 'right' : 'left'
  items.forEach((it) => it.classList.remove('is-on'))
}

export function initMeet() {
  storyLines()
  portrait()
  signature()
  timeline()
}
