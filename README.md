# Shafaq · sky photographer portfolio template

Shafaq (شفق, the glow left in the sky after sunset) is a static, bilingual (English and Arabic) portfolio template for a sky photographer: sunrises, sunsets, moonrises, storms, city lights and patterns. The photos are the hero; the interface stays out of the way and takes its colour from whatever photo is on screen.

Everything on the page (name, city, story, collections, photos and their metadata, prices, contact details and both languages) comes from `src/content.json`, so it can be rebranded without touching code. The photographer, brand, prices and contacts are fictional placeholders.

Built with Vite + TypeScript (no framework), GSAP (ScrollTrigger, Flip) and Lenis. No backend, no API keys.

## Features

- **One day in one scroll.** The hero is pinned while seven skies (blue hour, sunrise, golden hour, sunset, dusk, moonrise, night) rise into the frame one after another. The page background, text colour, accent, clock, sun altitude and place all morph with scroll progress, using palettes extracted from each photo at build time.
- **Meet the photographer.** A first-person story section: the portrait rises through a circular "sunrise" mask and is tinted with the live palette, paragraphs reveal line by line (real line breaks, measured after fonts load, in both languages), a pull quote brightens word by word above a signature, a milestone line draws across the years and counters run up.
- **Six chapters** (Sunrise, Sunset, Moon, Storms, City Lights, Patterns), each with a scroll-scrubbed cover reveal and a masonry gallery whose columns drift at different speeds. The chapter index floats a cover preview under the cursor. Storms opens with one faint lightning flicker.
- **Adaptive colour.** Each section hands the page theme to its photo's palette as it reaches the middle of the screen.
- **Lightbox.** GSAP Flip carries the thumbnail into a full-screen viewer (thumbnails keep each photo's true aspect, so the scale stays uniform), with camera, lens, exposure, time, place and credit; keyboard (arrows follow the reading direction, Esc, focus trap and focus return), swipe on touch, the sharp file swapped in only after `decode()`, and neighbours decoded ahead.
- **Sun path dial.** A 24-hour dial with noon at the top and midnight at the bottom. Drag the sun (or focus it and use arrow keys, Page Up/Down, Home/End) and the photo, readout and page colour follow; below the horizon it turns into the moon.
- **Night section** with a starfield drawn once to a canvas and rotated by a CSS transform.
- About-adjacent extras: brand collaborations, services and pricing in USD, a limited-edition print shop teaser with WhatsApp reservation links, a drifting Instagram strip and a WhatsApp/email booking section.
- **English and Arabic.** Toggle in the header, saved in `localStorage`; `lang` and `dir` update, layout mirrors through logical CSS properties, horizontal motion and arrows flip, the dial puts morning on the reader's starting side. Arabic uses IBM Plex Sans Arabic, Latin uses Manrope. Times, prices and numbers stay in Western digits and are isolated with `<bdi>`.
- Desktop cursor that eases after the pointer and opens into a "View" lens over photos; magnetic buttons.
- Accessibility: semantic sections and headings, alt text in both languages, skip link, keyboard dial and lightbox, `prefers-reduced-motion` turns off smooth scrolling, parallax, flicker and reveals.

## Performance

Lenis drives ScrollTrigger from GSAP's ticker with `lagSmoothing(0)`. Motion uses only transform, opacity and clip-path (no animated filters, backdrop-filter or blend modes). Photos ship as AVIF and WebP at three widths with explicit dimensions, blur-up placeholders and lazy loading; hero frames are decoded ahead of time.

Measured with a scripted wheel scroll through the whole page in headless Chrome (production build, images warmed):

| Viewport | CPU | Frames | Average | p95 | p99 | Frames > 33 ms |
| --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | 1× | 1556 | 8.37 ms | 8.8 ms | 10.2 ms | 1 |
| 390×844 | 1× | 4204 | 8.46 ms | 9.1 ms | 10.1 ms | 5 |
| 1440×900 | 4× throttled | 1224 | 12.88 ms | 25.3 ms | 26.8 ms | 5 |

## Run it

```bash
pnpm install
pnpm dev                 # http://localhost:5173
pnpm build && pnpm preview
```

## Customise

Edit `src/content.json`:

- `brand`: name, Arabic name, photographer, city, tagline, Instagram link and handle, email, WhatsApp number (`number` is digits only for wa.me links).
- `hero.stops`: the photo sequence for the hero, each with a phase name, time and sun (or moon) altitude.
- `about`: the photographer's story, portrait, quote, milestones and counters.
- `chapters.items`: collections with a cover and an ordered list of photo ids. Add `"effect": "lightning"` to any chapter for the flicker.
- `sunpath`: sunrise and sunset times, maximum sun altitude, start time and the photos the dial picks between.
- `services`, `prints`, `collabs`, `feed`, `contact`, `credits`: the rest of the page.
- Every piece of copy is an `{ "en": "...", "ar": "..." }` pair.

### Adding photos

1. Put the original JPG in `photos-src/` (git-ignored).
2. Add an entry under `photos` in `content.json` with `file`, `alt` (both languages), `credit` and `meta` (camera, lens, exposure, time, place). Leave camera fields as `null` if unknown.
3. Run `pnpm photos`. It writes `public/photos/<id>-<width>.avif|webp` (800/1600/2400 wide for landscape, 600/1200/1800 for portrait), then fills in `w`, `h`, `sizes`, the colour `palette` (k-means over a thumbnail: background, ink with at least 7:1 contrast, accent) and the base64 `blur` placeholder. Use `pnpm photos --force` to re-encode everything.
4. Reference the id from a chapter, the hero, the dial, prints or the feed.

## Credits

All photographs come from [Pexels](https://www.pexels.com) under the [Pexels License](https://www.pexels.com/license/) (free for commercial use, no attribution required). Each was checked on its Pexels page. They are credited here anyway, with thanks. Captions, places and times on the site are illustrative; camera data comes from each photo's original upload where it was recorded.

- `blue-hour-skyline`: [Alfred GF](https://www.pexels.com/photo/11545441/)
- `dawn-boat`: [Nuno Obey](https://www.pexels.com/photo/128302/)
- `golden-coast`: [Abet Llacer](https://www.pexels.com/photo/4383348/)
- `sunset-boat`: [Nivek Kram Aibab](https://www.pexels.com/photo/7864468/)
- `dusk-city`: [Suki Lee](https://www.pexels.com/photo/18694287/)
- `moonrise-sea`: [Александр Максин](https://www.pexels.com/photo/25819968/)
- `milky-way-sea`: [Maksud](https://www.pexels.com/photo/4090111/)
- `sunrise-haze`: [The Shejz](https://www.pexels.com/photo/35030749/)
- `sunrise-shore`: [Pok Rie](https://www.pexels.com/photo/408914/)
- `sunrise-sail`: [Stefan Grage](https://www.pexels.com/photo/4282521/)
- `sunrise-rooftops`: [Amanda Leoni](https://www.pexels.com/photo/8529226/)
- `clouds-ember`: [David Kanigan](https://www.pexels.com/photo/12988245/)
- `sunset-city-sun`: [Quang Nguyen Vinh](https://www.pexels.com/photo/6710686/)
- `sunset-silhouette`: [Italo Melo](https://www.pexels.com/photo/2356139/)
- `sunset-storm-sea`: [Willian Justen de Vasconcellos](https://www.pexels.com/photo/16116629/)
- `clouds-pastel`: [eberhard grossgasteiger](https://www.pexels.com/photo/19779597/)
- `moon-towers`: [Jesus Toledo](https://www.pexels.com/photo/30199537/)
- `moon-path`: [Adelin M](https://www.pexels.com/photo/5052131/)
- `moon-dusk-sea`: [Alina Rossoshanska](https://www.pexels.com/photo/17241532/)
- `crescent-clouds`: [Pramod Tiwari](https://www.pexels.com/photo/13581999/)
- `crescent-detail`: [Tom Fisk](https://www.pexels.com/photo/12705640/)
- `moon-building`: [Magali Guimarães](https://www.pexels.com/photo/5206826/)
- `lightning-sea`: [Philippe Donn](https://www.pexels.com/photo/1114690/)
- `lightning-pillars`: [Pixabay](https://www.pexels.com/photo/248775/)
- `lightning-lake`: [Raychel Sanner](https://www.pexels.com/photo/4870641/)
- `shelf-cloud`: [Dijanynni Kiratza](https://www.pexels.com/photo/15470681/)
- `storm-sea`: [Josh Sorenson](https://www.pexels.com/photo/9712998/)
- `lightning-city`: [emre varışlı](https://www.pexels.com/photo/28823583/)
- `harbour-night`: [Maximilian Ruther](https://www.pexels.com/photo/11557796/)
- `skyline-night`: [Pixabay](https://www.pexels.com/photo/258173/)
- `light-trails`: [Renan Rezende](https://www.pexels.com/photo/12110342/)
- `city-dusk-above`: [Kendrick Chen](https://www.pexels.com/photo/20498898/)
- `city-golden-aerial`: [Lio Photography](https://www.pexels.com/photo/1598338/)
- `mashrabiya`: [Sami Raad](https://www.pexels.com/photo/30615454/)
- `lattice-light`: [Elkhan Ganiyev](https://www.pexels.com/photo/18453549/)
- `star-pattern`: [Arif YILMAZ](https://www.pexels.com/photo/34680960/)
- `jali-window`: [Jose Aragones](https://www.pexels.com/photo/3254036/)
- `wood-geometry`: [Mohammed Alim](https://www.pexels.com/photo/32820923/)
- `minarets-sunset`: [Kaan ALTUN](https://www.pexels.com/photo/16737017/)
- `milky-way-coast`: [Zetong Li](https://www.pexels.com/photo/18780417/)
- `about-portrait`: [Devyn Breslin](https://www.pexels.com/photo/18130039/)
- `coastal-golden`: [Matthias Groeneveld](https://www.pexels.com/photo/2808320/)
- `cumulus`: [Tim Mossholder](https://www.pexels.com/photo/1605148/)
- `photographer`: [Yunus Tuğ](https://www.pexels.com/photo/13070128/)
- `rooftop-start`: [Miguel González](https://www.pexels.com/photo/16418579/)

Fonts: [Manrope](https://fonts.google.com/specimen/Manrope) and [IBM Plex Sans Arabic](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic) (SIL Open Font License) via [Fontsource](https://fontsource.org). Motion: [GSAP](https://gsap.com) and [Lenis](https://lenis.darkroom.engineering) (MIT).

## Author

Designed and built by [Muhammad Izhar](https://izhar.dev). Change `credits` in `content.json` to put your own name in the footer.

## License

Code: MIT, see [LICENSE](LICENSE). Photographs stay under the Pexels License.
