import type { ImageMetadata } from 'astro';
import waterImage from '../assets/images/wicklow-pier-lighthouse-day.jpeg';
import hoursImage from '../assets/images/loyalty-cards.jpeg';
import winterImage from '../assets/images/pier-lighthouse-moonrise.jpeg';
import imgSailboats from '../assets/images/harbour-sailboats-morning.jpg';
import imgCoastGolden from '../assets/images/aerial-coast-golden.jpg';
import imgHarbourVista from '../assets/images/aerial-harbour-vista.jpg';
import imgBaySwimmers from '../assets/images/aerial-bay-swimmers.jpg';
import imgWicklowHarbour from '../assets/images/aerial-wicklow-harbour.jpg';
import imgKayak from '../assets/images/aerial-kayak.jpg';
import imgRowers from '../assets/images/aerial-rowers-emerald.jpg';
import imgFishingBoat from '../assets/images/aerial-fishing-boat.jpg';
import imgMooredFleet from '../assets/images/aerial-moored-fleet.jpg';
import imgHarbourDusk from '../assets/images/harbour-dusk-boats.jpeg';
import imgPierSunrise from '../assets/images/pier-lighthouse-sunrise.jpeg';
import imgSeaSteps from '../assets/images/sea-steps-sunrise.jpeg';
import imgSaunaGate from '../assets/images/sauna-gate-harbour.jpeg';
import imgSaunaHats from '../assets/images/sauna-hats-cedar-door.jpeg';
import imgRitualOils from '../assets/images/ritual-oils-incense.jpeg';

/* ------------------------------------------------------------------
   Sanity content layer — fetched at build time via the public query
   API (no client dependency). Falls back to the placeholder posts
   below when SANITY_PROJECT_ID isn't configured or the fetch fails,
   so the site always builds.
   ------------------------------------------------------------------ */

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID as string | undefined;
const dataset = (import.meta.env.PUBLIC_SANITY_DATASET as string | undefined) ?? 'production';
const apiVersion = 'v2024-01-01';
const useFallbackPosts = import.meta.env.PUBLIC_USE_FALLBACK_POSTS !== 'false';

export interface PortableTextSpan {
  _type: 'span';
  text: string;
  marks?: string[];
}

export interface PortableTextBlock {
  _type: string;
  _key?: string;
  style?: string;
  listItem?: string;
  level?: number;
  children?: PortableTextSpan[];
  markDefs?: { _key: string; _type: string; href?: string }[];
  asset?: { _ref?: string };
  alt?: string;
}

export interface Post {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string; // ISO date
  tag: string;
  image: ImageMetadata | string;
  alt: string;
  body: PortableTextBlock[];
}

export const sanityConfigured = Boolean(projectId);

/* House photo pool — keys mirror the `stockImage` options in
   schemaTypes/post.ts. Posts without an uploaded image use one of
   these; if none is chosen, one is picked deterministically. */
const stockImages: Record<string, { image: ImageMetadata; alt: string }> = {
  'harbour-sailboats': { image: imgSailboats, alt: 'Sailboats moored in the harbour at morning' },
  'coast-golden': { image: imgCoastGolden, alt: 'The Wicklow coast at golden hour from above' },
  'harbour-vista': { image: imgHarbourVista, alt: 'Harbour and town from above on a clear day' },
  'bay-swimmers': { image: imgBaySwimmers, alt: 'Swimmers in the bay beside the pier' },
  'wicklow-harbour': { image: imgWicklowHarbour, alt: 'Wicklow harbour from above' },
  kayak: { image: imgKayak, alt: 'A kayak crossing emerald water' },
  rowers: { image: imgRowers, alt: 'Rowers crossing emerald water' },
  'fishing-boat': { image: imgFishingBoat, alt: 'A fishing boat seen from above' },
  'moored-fleet': { image: imgMooredFleet, alt: 'The moored fleet seen from above' },
  'harbour-dusk': { image: imgHarbourDusk, alt: 'Boats in the harbour at dusk' },
  'pier-day': { image: waterImage, alt: 'The lighthouse pier at Wicklow harbour on a calm day' },
  'pier-moonrise': { image: winterImage, alt: 'A full moon rising behind the pier lighthouse' },
  'pier-sunrise': { image: imgPierSunrise, alt: 'Sunrise behind the pier lighthouse' },
  'sea-steps': { image: imgSeaSteps, alt: 'Steps into the sea at sunrise' },
  'sauna-gate': { image: imgSaunaGate, alt: 'The sauna gate at the harbour' },
  'sauna-hats': { image: imgSaunaHats, alt: 'Sauna hats hanging on the cedar door' },
  'ritual-oils': { image: imgRitualOils, alt: 'Ritual oils and incense on a wooden shelf' },
  'loyalty-cards': { image: hoursImage, alt: 'Loyalty cards displayed on a wooden table' },
};

const stockImageKeys = Object.keys(stockImages);

/** Stable pick from the pool so a post keeps the same photo between builds. */
function pickStockImage(seed: string): { image: ImageMetadata; alt: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const key = stockImageKeys[Math.abs(hash) % stockImageKeys.length];
  return stockImages[key];
}

/** URL-safe slug derived from the post title — the only source of slugs. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function sanityQuery<T>(query: string): Promise<T | null> {
  if (!projectId) return null;
  const url = `https://${projectId}.apicdn.sanity.io/${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const payload = (await response.json()) as { result: T };
    return payload.result;
  } catch {
    return null;
  }
}

/** Builds a CDN URL from an image asset _ref like `image-<id>-1200x800-jpg`. */
export function sanityImageUrl(ref: string, width = 1600): string | null {
  if (!projectId) return null;
  const match = ref.match(/^image-([a-zA-Z0-9]+)-(\d+x\d+)-(\w+)$/);
  if (!match) return null;
  const [, id, dimensions, format] = match;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${format}?w=${width}&auto=format`;
}

// Tolerant of the two most common cover-image field names (coverImage / mainImage).
const POST_PROJECTION = `{
  title,
  "excerpt": coalesce(excerpt, ""),
  "publishedAt": coalesce(publishedAt, _createdAt),
  "tag": coalesce(category->title, tag, "Journal"),
  "imageUrl": coalesce(coverImage.asset->url, mainImage.asset->url),
  "alt": coalesce(coverImage.alt, mainImage.alt, title),
  stockImage,
  body
}`;

interface SanityPost {
  title: string;
  excerpt: string;
  publishedAt: string;
  tag: string;
  imageUrl?: string;
  alt: string;
  stockImage?: string;
  body?: PortableTextBlock[];
}

function toPost(raw: SanityPost): Post {
  // Uploaded image wins; otherwise the chosen house photo; otherwise a
  // stable pick from the pool so every post always has a photo.
  let image: ImageMetadata | string;
  let alt = raw.alt;
  if (raw.imageUrl) {
    image = `${raw.imageUrl}?w=1600&auto=format`;
  } else {
    const stock = (raw.stockImage && stockImages[raw.stockImage]) || pickStockImage(raw.title);
    image = stock.image;
    alt = stock.alt;
  }
  return {
    title: raw.title,
    slug: slugify(raw.title),
    excerpt: raw.excerpt,
    publishedAt: raw.publishedAt,
    tag: raw.tag,
    image,
    alt,
    body: raw.body ?? [],
  };
}

export async function getAllPosts(): Promise<Post[]> {
  const result = await sanityQuery<SanityPost[]>(
    `*[_type == "post" && defined(title)] | order(publishedAt desc) ${POST_PROJECTION}`,
  );
  if (result && result.length > 0) return result.map(toPost);
  return useFallbackPosts ? fallbackPosts : [];
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------
   Fallback posts — shown until Sanity is wired up.
   ------------------------------------------------------------------ */

function paragraphs(...texts: string[]): PortableTextBlock[] {
  return texts.map((text, index) => ({
    _type: 'block',
    _key: `p${index}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', text, marks: [] }],
  }));
}

const fallbackPosts: Post[] = [
  {
    title: 'Sea temperature: 11.4° and climbing',
    slug: 'sea-temperature-climbing',
    excerpt:
      'The spring warm-up is underway. What the next few weeks mean for plunge times, and why April cold is the best cold.',
    publishedAt: '2026-06-04',
    tag: 'Water',
    image: waterImage,
    alt: 'The lighthouse pier at Wicklow harbour on a calm day',
    body: paragraphs(
      'The buoy off the East Pier read 11.4° this morning — up almost a full degree on last week. The spring warm-up is properly underway, and you can feel it in the water: the first ten seconds still bite, but the bite lets go sooner.',
      'What does that mean in practice? Plunge times stretch. Swimmers who were managing thirty seconds in March are doing two and three minutes now, and the walk back up the steps feels like a stroll rather than an escape.',
      'Our advice: don’t wait for “warm”. The water between now and midsummer is the sweet spot — cold enough to do its work, kind enough to let you stay in it. April cold is the best cold; June cold is a close second.',
    ),
  },
  {
    title: 'Summer hours & loyalty cards',
    slug: 'summer-hours-loyalty-cards',
    excerpt:
      'We are open earlier and later from this month — and the new loyalty cards are in. Ten sessions, one on the house.',
    publishedAt: '2026-05-22',
    tag: 'News',
    image: hoursImage,
    alt: 'The Boat Yard Sauna loyalty cards displayed on a wooden table',
    body: paragraphs(
      'Two pieces of news from the yard. First: summer hours. From this month we light the stove earlier and keep it going later — first sessions from 7:00 on weekdays, and evening slots running until the light goes.',
      'Second: the loyalty cards are in, and they came out lovely. Ten sessions stamped, one on the house. Pick one up at either harbour next time you’re down — no app, no account, just card and stamp the way it should be.',
      'Both locations, Wicklow Town and Arklow, run the same hours and honour the same cards. See you on the water.',
    ),
  },
  {
    title: 'Swimming through winter',
    slug: 'swimming-through-winter',
    excerpt:
      'Notes from the regulars who never missed a morning — on dark-water nerves, moonrise dips, and what keeps them coming back.',
    publishedAt: '2026-03-09',
    tag: 'Stories',
    image: winterImage,
    alt: 'A full moon rising behind the pier lighthouse at night',
    body: paragraphs(
      'There is a small group who never missed a morning this winter. Not one. Storm warnings, sleet sideways off the sea, the kind of darkness at 7am that makes the harbour lights feel like the only thing awake — they came anyway.',
      'We asked a few of them what keeps them coming back. The answers were all different and somehow all the same: the nerves before the dark water never fully go away, and that’s the point. You do the hard thing, then you sit in the heat and watch the day arrive.',
      'One swimmer told us about a January morning when the moon set behind the lighthouse just as the sun came up across the water — both at once, gold one side, silver the other. You don’t get that from bed.',
    ),
  },
];
