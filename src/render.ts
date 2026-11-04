import { C, photo, photos, usd, esc } from './data'
import { picture } from './img'

// Builds the page from content.json. Text nodes carry data-t="path" so the
// language switch can rewrite them in place without rebuilding the DOM.

const T = (path: string, tag = 'span', attrs = '') => `<${tag} data-t="${path}" ${attrs}></${tag}>`
const pad = (n: number) => String(n).padStart(2, '0')

const arrow = `<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>`
const logoMark = `<svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true"><path d="M3 21h26" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M8 21a8 8 0 0 1 16 0" fill="var(--accent)"/></svg>`

function header() {
  const links = ['about:#about', 'work:#chapters', 'sunpath:#sunpath']
  return `
  <a class="skip" href="#chapters" data-t="ui.skip"></a>
  <header class="hdr">
    <a class="logo" href="#top" aria-label="${esc(C.brand.name)}">${logoMark}<span class="logo__en">${esc(C.brand.name)}</span><span class="logo__ar" lang="ar">${C.brand.nameAr}</span></a>
    <nav class="nav" aria-label="Primary">
      ${links.map((l) => { const [k, h] = l.split(':'); return `<a href="${h}" data-t="ui.nav.${k}"></a>` }).join('')}
    </nav>
    <div class="hdr__end">
      <button class="lang" type="button" data-t="ui.langSwitch" data-t-aria="ui.langSwitchLabel"></button>
      <a class="btn btn--sm" href="#contact" data-magnetic>${T('ui.nav.contact')}</a>
    </div>
  </header>`
}

function hero() {
  const stops = C.hero.stops
  return `
  <section class="hero" id="top" aria-labelledby="hero-title">
    <div class="hero__frame">
      ${stops.map((s, i) => `<div class="hero__shot" data-i="${i}">${picture(s.photo, { sizes: '96vw', eager: i < 2, priority: i === 0 })}</div>`).join('')}
      <div class="hero__shade" aria-hidden="true"></div>
      <div class="hero__copy">
        ${T('hero.eyebrow', 'p', 'class="eyebrow"')}
        ${T('hero.title', 'h1', 'class="hero__title display" id="hero-title" data-split')}
        ${T('hero.lede', 'p', 'class="hero__lede"')}
      </div>
    </div>
    <div class="hero__bar" aria-live="off">
      <div class="hero__phase"><strong class="hero__phase-name" id="h-phase"></strong><span class="hero__place" id="h-place"></span></div>
      <bdi class="hero__time num" id="h-time">${stops[0].time}</bdi>
      <div class="hero__alt"><span id="h-body"></span> <bdi class="num" id="h-alt"></bdi></div>
      <div class="hero__track" aria-hidden="true">
        <div class="hero__rail"><i class="hero__fill"></i></div>
        <ol class="hero__ticks">${stops.map((_, i) => `<li data-i="${i}" style="--p:${(i / (stops.length - 1)) * 100}%"><i></i><span data-t="hero.stops.${i}.phase"></span></li>`).join('')}</ol>
      </div>
      <p class="hero__cue">${T('ui.scrollCue')}<span class="hero__cue-line" aria-hidden="true"></span></p>
    </div>
  </section>`
}

function chapters() {
  const items = C.chapters.items
  const index = items
    .map((c, i) => `
      <li><a href="#ch-${c.id}" class="cindex__row" data-preview="${c.cover}">
        <span class="cindex__n num">${pad(i + 1)}</span>
        <span class="cindex__name" data-t="chapters.items.${i}.title"></span>
        <span class="cindex__count"><bdi class="num">${c.photos.length}</bdi> ${T('ui.photos')}</span>
        ${arrow}
      </a></li>`)
    .join('')

  const sections = items
    .map((c, i) => {
      const id = c.id
      const gallery = c.photos
        .map((p, j) => `
          <figure class="g-item" data-col="${j}">
            <button class="g-btn" type="button" data-group="${id}" data-index="${j}" data-photo-label="${p}" data-cursor="view">
              ${picture(p, { sizes: '(min-width: 900px) 30vw, 48vw', cls: 'g-ph' })}
            </button>
            <figcaption><bdi class="num">${photo(p).meta.time}</bdi><span data-t="photos.${p}.meta.place"></span></figcaption>
          </figure>`)
        .join('')
      return `
      <section class="chapter" id="ch-${id}" data-theme-photo="${c.cover}" ${'effect' in c ? `data-effect="${c.effect}"` : ''} aria-labelledby="ch-${id}-t">
        <div class="chapter__cover">
          <div class="chapter__media">${picture(c.cover, { sizes: '100vw', decorative: true })}</div>
          <div class="chapter__head">
            <p class="chapter__n"><span data-t="ui.chapter"></span> <bdi class="num">${pad(i + 1)}</bdi></p>
            <h3 class="chapter__title display" id="ch-${id}-t" data-t="chapters.items.${i}.title" data-split></h3>
            <p class="chapter__alt" aria-hidden="true">${esc(c.title.en)} · <span lang="ar">${c.title.ar}</span></p>
          </div>
        </div>
        <div class="chapter__body">
          <p class="chapter__blurb" data-t="chapters.items.${i}.blurb" data-fade></p>
          <div class="gallery" data-gallery="${id}">${gallery}</div>
        </div>
      </section>`
    })
    .join('')

  return `
  <section class="chapters" id="chapters" aria-labelledby="chapters-t" data-theme="neutral">
    <div class="chapters__intro">
      ${T('chapters.kicker', 'p', 'class="kicker"')}
      ${T('chapters.title', 'h2', 'class="h2 display" id="chapters-t" data-split')}
      <ol class="cindex">${index}</ol>
      <div class="cindex__preview" aria-hidden="true">${items.map((c) => `<div class="cindex__pv" data-pv="${c.cover}">${picture(c.cover, { sizes: '320px', decorative: true })}</div>`).join('')}</div>
    </div>
    ${sections}
  </section>
  <div class="flash" aria-hidden="true"></div>`
}

function sunpath() {
  const ticks = Array.from({ length: 24 }, (_, h) => {
    const a = (h / 24) * Math.PI * 2
    const r1 = h % 6 === 0 ? 132 : 138
    return `<line x1="${(-Math.sin(a) * r1).toFixed(1)}" y1="${(Math.cos(a) * r1).toFixed(1)}" x2="${(-Math.sin(a) * 146).toFixed(1)}" y2="${(Math.cos(a) * 146).toFixed(1)}" class="${h % 6 === 0 ? 'major' : ''}"/>`
  }).join('')
  return `
  <section class="sunpath" id="sunpath" aria-labelledby="sunpath-t">
    <div class="sunpath__photo" aria-live="polite">
      <div class="sunpath__stack"></div>
      <p class="sunpath__caption"><span id="sp-place"></span></p>
    </div>
    <div class="sunpath__panel">
      ${T('sunpath.kicker', 'p', 'class="kicker"')}
      ${T('sunpath.title', 'h2', 'class="h2 display" id="sunpath-t" data-split')}
      ${T('sunpath.body', 'p', 'class="sunpath__body"')}
      <div class="dial">
        <svg class="dial__svg" viewBox="-170 -170 340 340" aria-hidden="true">
          <circle r="120" class="dial__ring"/>
          <path class="dial__day" d="M -120 0 A 120 120 0 0 1 120 0"/>
          <path class="dial__night" d="M 120 0 A 120 120 0 0 1 -120 0"/>
          <g class="dial__ticks">${ticks}</g>
          <line x1="-162" y1="0" x2="162" y2="0" class="dial__horizon"/>
          <text class="dial__lbl dial__lbl--h" x="0" y="-4" text-anchor="middle" data-t="sunpath.horizon"></text>
          <g class="dial__hours">
            <text x="0" y="-152" text-anchor="middle">12</text>
            <text x="0" y="162" text-anchor="middle">00</text>
            <text class="h6" x="-164" y="-8" text-anchor="middle">06</text>
            <text class="h18" x="164" y="-8" text-anchor="middle">18</text>
          </g>
          <g class="dial__knob">
            <circle r="22" class="dial__halo"/>
            <circle r="11" class="dial__sun"/>
            <circle r="11" class="dial__moon-shadow" cx="5" cy="-3"/>
          </g>
        </svg>
        <div class="dial__hit" role="slider" tabindex="0" aria-valuemin="0" aria-valuemax="1439" data-t-aria="sunpath.dialLabel"></div>
        <div class="dial__read">
          <bdi class="dial__time num" id="sp-time"></bdi>
          <span class="dial__phase" id="sp-phase"></span>
          <span class="dial__alt" id="sp-alt"></span>
        </div>
      </div>
    </div>
  </section>`
}

const signature = `<svg class="sig" viewBox="0 0 220 80" aria-hidden="true"><path d="M14 58c10-6 16-30 18-44M24 40c6 0 10 2 10 8 0 8-8 12-8 6 0-10 14-22 22-22-4 10-6 24-2 26 4 2 10-8 14-16-2 8-2 14 2 14s10-10 12-16c0 6 2 10 6 10 6 0 10-12 14-16-2 4-2 8 2 8 2 0 6-2 8-6 2 6 4 8 8 6m-46-26v2m60 10c6 2 10 6 10 12 0 10-14 14-22 8 8 2 30 0 60-14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

function meet() {
  const a = C.about
  return `
  <section class="meet" id="about" data-theme-photo="${a.portrait}" aria-labelledby="about-t">
    <div class="meet__head">
      ${T('about.kicker', 'p', 'class="kicker"')}
      ${T('about.title', 'h2', 'class="h2 display meet__title" id="about-t" data-split')}
      <p class="meet__name"><span data-t="brand.photographer"></span> · <span data-t="brand.role"></span> · <span data-t="brand.city"></span></p>
    </div>
    <div class="meet__grid">
      <figure class="meet__portrait">
        <div class="meet__mask">
          <div class="meet__inner">${picture(a.portrait, { sizes: '(min-width: 900px) 40vw, 92vw' })}</div>
          <div class="meet__grade" aria-hidden="true"></div>
        </div>
        <figcaption class="meet__cap"><span class="meet__dot" aria-hidden="true"></span><span data-t="about.portraitCaption"></span></figcaption>
      </figure>
      <div class="meet__story">
        ${a.story.map((_, i) => `${T(`about.story.${i}`, 'p', 'class="meet__p" data-lines')}${i === 0 ? `
        <figure class="meet__inset">
          <div class="meet__inset-mask">${picture(a.inset, { sizes: '(min-width: 900px) 22vw, 60vw' })}</div>
          <figcaption data-t="about.insetCaption"></figcaption>
        </figure>` : ''}`).join('')}
      </div>
    </div>
    <blockquote class="meet__quote">
      <p class="meet__quote-text" data-t="about.quote" data-words></p>
      <footer class="meet__sign"><span class="meet__sig">${signature}</span><cite data-t="brand.photographer"></cite></footer>
    </blockquote>
    <div class="meet__tl">
      ${T('about.milestonesTitle', 'h3', 'class="kicker"')}
      <ol class="tl">
        <li class="tl__line" aria-hidden="true"><i class="tl__fill"></i></li>
        ${a.milestones.map((m, i) => `<li class="tl__item"><i class="tl__dot" aria-hidden="true"></i><bdi class="tl__year num">${m.year}</bdi><span class="tl__text" data-t="about.milestones.${i}.text"></span></li>`).join('')}
      </ol>
    </div>
    <dl class="stats">
      ${a.stats.map((s, i) => `<div class="stat" data-fade><dt data-t="about.stats.${i}.label"></dt><dd class="num"><bdi><span data-count="${s.value}">0</span>${s.suffix}</bdi></dd></div>`).join('')}
    </dl>
  </section>`
}

function contact() {
  const b = C.brand
  return `
  <section class="contact" id="contact" data-theme-photo="sunset-boat" aria-labelledby="contact-t">
    ${T('contact.kicker', 'p', 'class="kicker"')}
    ${T('contact.title', 'h2', 'class="contact__title display" id="contact-t" data-split')}
    ${T('contact.body', 'p', 'class="contact__body"')}
    <div class="contact__actions">
      <a class="btn btn--lg" id="wa-link" href="https://wa.me/${b.whatsapp.number}" target="_blank" rel="noopener" data-magnetic>
        <svg viewBox="0 0 24 24" aria-hidden="true" class="wa"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z"/></svg>
        <span data-t="contact.whatsapp"></span>
      </a>
      <p class="contact__alt"><span data-t="contact.email"></span> <a class="link" href="mailto:${b.email}"><bdi>${b.email}</bdi></a></p>
      <p class="contact__alt"><bdi class="num">${b.whatsapp.display}</bdi></p>
    </div>
    <div class="offer">
      ${T('services.title', 'h3', 'class="offer__title"')}
      <ul class="svc">
        ${C.services.items.map((it, i) => `
          <li class="svc__row" data-fade>
            <h4 class="svc__name" data-t="services.items.${i}.name"></h4>
            <p class="svc__body" data-t="services.items.${i}.body"></p>
            <p class="svc__price">${'prefix' in it ? `<span class="svc__pre" data-t="services.items.${i}.prefix"></span>` : ''}<bdi class="num">${usd(it.price)}</bdi><span class="svc__unit" data-t="services.items.${i}.unit"></span></p>
          </li>`).join('')}
      </ul>
      ${T('services.note', 'p', 'class="note"')}
    </div>
  </section>`
}

function footer() {
  const c = C.credits
  const list = Object.entries(photos)
    .map(([id, p]) => `<li><a href="https://www.pexels.com/photo/${p.credit.id}/" target="_blank" rel="noopener"><span data-t="photos.${id}.alt"></span></a> <span class="credits__by">· ${esc(p.credit.name)}</span></li>`)
    .join('')
  return `
  <footer class="ftr" data-theme="neutral">
    <div class="ftr__top">
      <a class="logo logo--lg" href="#top">${logoMark}<span class="logo__en">${esc(C.brand.name)}</span><span class="logo__ar" lang="ar">${C.brand.nameAr}</span></a>
      <p class="ftr__tag" data-t="brand.tagline"></p>
    </div>
    <div class="ftr__row">
      <p><span data-t="credits.designedBy"></span> <a href="${c.authorUrl}" target="_blank" rel="noopener" class="link"><span class="author-en">${c.author}</span><span class="author-ar" lang="ar">${c.authorAr}</span></a></p>
      <p><a href="${c.repoUrl}" target="_blank" rel="noopener" class="link" data-t="credits.getTemplate"></a></p>
      <p><a href="${c.repoUrl}/blob/main/LICENSE" target="_blank" rel="noopener" class="link" data-t="credits.license"></a></p>
      <p><a href="#credits" class="link" data-credits-toggle data-t="credits.photoCredits"></a></p>
    </div>
    <details class="credits" id="credits">
      <summary data-t="credits.photoCredits"></summary>
      <p data-t="credits.photoCreditsIntro"></p>
      <ul>${list}</ul>
    </details>
    <p class="ftr__fine" data-t="credits.rights"></p>
  </footer>`
}

function lightbox() {
  return `
  <div class="lb" role="dialog" aria-modal="true" data-t-aria="ui.lightbox.label" hidden>
    <div class="lb__bg"></div>
    <div class="lb__stage"><div class="lb__frame"><img class="lb__img" alt="" draggable="false"></div></div>
    <div class="lb__ui">
      <div class="lb__meta">
        <p class="lb__alt" id="lb-alt"></p>
        <dl class="lb__exif">
          <div><dt data-t="ui.lightbox.time"></dt><dd><bdi class="num" id="lb-time"></bdi></dd></div>
          <div><dt data-t="ui.lightbox.place"></dt><dd id="lb-place"></dd></div>
          <div><dt data-t="ui.lightbox.camera"></dt><dd id="lb-camera"></dd></div>
          <div><dt data-t="ui.lightbox.lens"></dt><dd><bdi id="lb-lens"></bdi></dd></div>
          <div><dt data-t="ui.lightbox.exposure"></dt><dd><bdi id="lb-exposure"></bdi></dd></div>
          <div><dt data-t="ui.lightbox.credit"></dt><dd><a id="lb-credit" target="_blank" rel="noopener"></a></dd></div>
        </dl>
      </div>
      <p class="lb__count num"><bdi id="lb-count"></bdi></p>
      <p class="lb__hint" data-t="ui.lightbox.swipe"></p>
      <button class="lb__btn lb__close" type="button" data-t-aria="ui.lightbox.close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="1.4"/></svg></button>
      <button class="lb__btn lb__prev" type="button" data-t-aria="ui.lightbox.prev">${arrow}</button>
      <button class="lb__btn lb__next" type="button" data-t-aria="ui.lightbox.next">${arrow}</button>
    </div>
  </div>`
}

export function render(): string {
  return `
  ${header()}
  <main id="main">
    ${hero()}
    ${meet()}
    ${chapters()}
    ${sunpath()}
    ${contact()}
  </main>
  ${footer()}
  ${lightbox()}
  <div class="cursor" aria-hidden="true"><span class="cursor__ring"></span><span class="cursor__lbl"></span></div>`
}
