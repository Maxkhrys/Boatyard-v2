# Performance / Core Web Vitals notes

Quick CWV audit performed alongside the SEO pass. The site was already in
good shape — the items below record what was checked, what's already fine,
and the one change that needs a bigger decision.

## Already good (no change needed)

- **LCP** — the hero image (`wicklow-aerial-dusk.jpg`) loads with
  `loading="eager"` + `fetchpriority="high"` and a responsive `srcset`.
- **CLS** — every `astro:assets` `<Image>` emits explicit `width`/`height`,
  and layout containers use CSS `aspect-ratio`. The only dimensionless
  `<img>` is the hidden lightbox overlay, which can't shift layout.
- **Fonts** — all faces ship `font-display: swap` (self-hosted via
  Fontsource, same-origin, so no preconnect needed). No FOIT.
- **Scripts** — no render-blocking scripts. `main.ts` loads as a deferred
  ES module at end of `<body>`; the only `<head>` script is a tiny inline
  FOUC-prevention flag plus the JSON-LD block.
- **Images** — all local images go through Astro's image service (WebP,
  responsive `srcset`, lazy-loading below the fold).

## Flagged — bigger change, left for review

- **Remote (Sanity-hosted) journal images aren't optimised.** When a post
  uses an uploaded Sanity image, `JournalCard.astro` and
  `journal/[slug].astro` render a raw `<img>` because Astro's `<Image>`
  needs intrinsic dimensions for an external URL. To optimise these:
  1. Add `cdn.sanity.io` to `image.remotePatterns` in `astro.config.mjs`.
  2. Switch the remote branch to `<Image src={image} inferSize ... />`
     (or pass explicit `width`/`height` from the Sanity asset metadata).

  `inferSize` fetches each remote image at build to read its dimensions,
  which lengthens builds and needs network access at build time, so it's
  flagged rather than applied blind. It only affects production builds
  where Sanity is configured (the fallback posts use local assets and are
  already fully optimised). Low runtime risk today; worth doing before the
  client starts uploading their own post photos.

## Reminder

`site` in `astro.config.mjs` is a placeholder (`https://theboatyardsauna.ie`).
Replace it with the real production domain before launch — it drives
canonical URLs, the sitemap, robots.txt, and Open Graph/Twitter image URLs.
