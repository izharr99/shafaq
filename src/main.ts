import '@fontsource-variable/manrope'
import '@fontsource/ibm-plex-sans-arabic/300.css'
import '@fontsource/ibm-plex-sans-arabic/400.css'
import '@fontsource/ibm-plex-sans-arabic/500.css'
import './style.css'

import { C } from './data'
import { render } from './render'
import { applyText, setLang, lang, onLang, t } from './i18n'
import { watchLoads } from './img'
import { initSmooth, ScrollTrigger, gsap, reduceMotion, lenis } from './smooth'
import { initHero } from './hero'
import { initMeet } from './meet'
import { initReveals } from './reveal'
import { initChapters } from './chapters'
import { initLightbox } from './lightbox'
import { initSunpath } from './sunpath'
import { initCursor } from './cursor'

const app = document.getElementById('app')!
app.innerHTML = render()
applyText()
watchLoads()

initSmooth()
initHero()
initMeet()
initChapters()
initSunpath()
initReveals()
initLightbox()
initCursor()

// Language toggle: text swaps in place, layout mirrors through logical CSS,
// and every ScrollTrigger re-measures. A short fade hides the reflow.
document.querySelector('.lang')!.addEventListener('click', () => {
  const main = [document.getElementById('main')!, document.querySelector('.ftr')!, document.querySelector('.hdr')!]
  const swap = () => {
    setLang(lang === 'en' ? 'ar' : 'en')
    ScrollTrigger.refresh()
  }
  if (reduceMotion) return swap()
  gsap.to(main, {
    opacity: 0,
    duration: 0.25,
    ease: 'power2.in',
    onComplete: () => {
      swap()
      gsap.to(main, { opacity: 1, duration: 0.5, ease: 'power2.out' })
    },
  })
})

// WhatsApp link opens with a friendly first line in the visitor's language.
const wa = document.getElementById('wa-link') as HTMLAnchorElement
const setWa = () => (wa.href = `https://wa.me/${C.brand.whatsapp.number}?text=${encodeURIComponent(t(C.contact.whatsappText))}`)
setWa()
onLang(setWa)

// "Photo credits" in the footer opens the list and scrolls to it.
document.querySelector('[data-credits-toggle]')!.addEventListener('click', (e) => {
  e.preventDefault()
  const d = document.getElementById('credits') as HTMLDetailsElement
  d.open = true
  ScrollTrigger.refresh()
  if (lenis) lenis.scrollTo(d, { duration: 1.2 })
  else d.scrollIntoView()
})

// The header steps aside while reading down and returns on the way up.
const hdr = document.querySelector<HTMLElement>('.hdr')!
const introEl = document.getElementById('about')!
ScrollTrigger.create({
  start: 0,
  end: 'max',
  onUpdate: (self) => {
    const y = self.scroll()
    hdr.classList.toggle('is-hidden', y > introEl.offsetTop - window.innerHeight * 0.4 && self.direction === 1 && !hdr.contains(document.activeElement))
  },
})

document.fonts?.ready.then(() => ScrollTrigger.refresh())
window.addEventListener('load', () => ScrollTrigger.refresh())
