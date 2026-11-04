import { gsap, ScrollTrigger, reduceMotion } from './smooth'

// A starfield drawn once to a canvas, then turned slowly around a pole with a
// CSS transform, so the motion costs the compositor and nothing else.

export function initNight() {
  const sec = document.querySelector<HTMLElement>('.night')!
  const canvas = sec.querySelector<HTMLCanvasElement>('.night__stars')!
  let spin: gsap.core.Tween | null = null

  const draw = () => {
    const w = sec.clientWidth
    const h = sec.clientHeight
    // The pole sits near the top corner; the canvas must cover the section at any angle.
    const size = Math.ceil(Math.hypot(w, h) * 2)
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = canvas.height = Math.round(size * dpr)
    canvas.style.width = canvas.style.height = `${size}px`
    canvas.style.left = `${w * 0.78 - size / 2}px`
    canvas.style.top = `${h * 0.12 - size / 2}px`
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)
    let seed = 7
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const count = Math.round((size * size) / 5200)
    for (let i = 0; i < count; i++) {
      const x = rand() * size
      const y = rand() * size
      const r = rand() ** 3 * 1.9 + 0.45
      const a = 0.35 + rand() * 0.65
      ctx.fillStyle = rand() > 0.9 ? `rgba(255,214,170,${a})` : `rgba(235,240,255,${a})`
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  draw()
  let t = 0
  window.addEventListener('resize', () => {
    clearTimeout(t)
    t = window.setTimeout(draw, 200)
  })

  if (reduceMotion) return
  spin = gsap.to(canvas, { rotation: 360, duration: 360, ease: 'none', repeat: -1, paused: true })
  ScrollTrigger.create({
    trigger: sec,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? spin!.play() : spin!.pause()),
  })
  // Scroll adds a little extra turn, like the sky wheeling overhead.
  gsap.fromTo(sec.querySelector('.night__copy'), { yPercent: 20 }, { yPercent: -20, ease: 'none', scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } })
}
