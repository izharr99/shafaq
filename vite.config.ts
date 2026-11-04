import { defineConfig } from 'vite'
import content from './src/content.json' with { type: 'json' }

// Writes brand copy from content.json into index.html so the title, meta
// description and theme colour are right before any JavaScript runs.
export default defineConfig({
  plugins: [
    {
      name: 'content-meta',
      transformIndexHtml(html) {
        const first = content.photos[content.hero.stops[0].photo as keyof typeof content.photos] as { palette?: { bg: string } }
        return html
          .replaceAll('%BRAND%', content.brand.name)
          .replaceAll('%PHOTOGRAPHER%', content.brand.photographer.en)
          .replaceAll('%TAGLINE%', content.brand.tagline.en)
          .replaceAll('%DESCRIPTION%', content.brand.description.en)
          .replaceAll('%THEME%', first.palette?.bg ?? '#0b0b0d')
      },
    },
  ],
})
