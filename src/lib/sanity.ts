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
import imgWicklowDusk from '../assets/images/wicklow-aerial-dusk.jpg';
import imgArklowQuay from '../assets/images/arklow-aerial-quay.jpg';
import imgCourtyardNight from '../assets/images/sauna-courtyard-night.jpg';
import imgBeachSunset from '../assets/images/beach-sunset.jpg';
import imgCourtyardPlunge from '../assets/images/courtyard-dusk-plunge.jpg';
import imgIceBaths from '../assets/images/ice-baths.jpg';
import imgBoatYardGate from '../assets/images/boat-yard-gate.jpg';
import imgLogoSign from '../assets/images/logo-sign.jpg';
import imgSaunaRest from '../assets/images/sauna-interior-rest.jpg';
import imgSaunaHat from '../assets/images/sauna-hat-profile.jpg';
import imgColdTap from '../assets/images/cold-tap.jpg';
import imgDaraBoat from '../assets/images/dara-boat-planter.jpg';

/* ------------------------------------------------------------------
   Sanity content layer — fetched at build time via the public query
   API (no client dependency). Falls back to the placeholder posts
   below when SANITY_PROJECT_ID isn\'t configured or the fetch fails,
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
  'wicklow-dusk': { image: imgWicklowDusk, alt: 'The Boat Yard Sauna at dusk in Wicklow, festoon lights glowing beside the sea' },
  'arklow-quay': { image: imgArklowQuay, alt: 'Arklow North Quay from above, the river and quayside road' },
  'courtyard-night': { image: imgCourtyardNight, alt: 'The sauna courtyard at night, lit cabin and hot tubs from above' },
  'beach-sunset': { image: imgBeachSunset, alt: 'Sunset over the cobble beach with the sauna building on the shore' },
  'courtyard-plunge': { image: imgCourtyardPlunge, alt: 'The sauna courtyard at dusk, festoon lights over the cold plunge' },
  'ice-baths': { image: imgIceBaths, alt: 'A row of galvanised cold-plunge ice baths under festoon lights' },
  'boat-yard-gate': { image: imgBoatYardGate, alt: 'The Boat Yard Sauna entrance gate and barrel sauna' },
  'logo-sign': { image: imgLogoSign, alt: 'The Boat Yard Sauna sign lit by festoon lights' },
  'sauna-rest': { image: imgSaunaRest, alt: 'A man resting on the cedar bench inside the barrel sauna' },
  'sauna-hat': { image: imgSaunaHat, alt: 'A bather in a wool sauna hat inside the barrel sauna' },
  'cold-tap': { image: imgColdTap, alt: 'Cold water running from a brass tap beside the ivy' },
  'dara-boat': { image: imgDaraBoat, alt: 'A vintage blue boat named Dara, planted with flowers against a dark wall' },
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

export interface HoursRow {
  days: string;
  times: string;
}

export interface SiteSettings {
  wicklowHours?: HoursRow[];
  arklowHours?: HoursRow[];
  hoursNote?: string;
}

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return sanityQuery<SiteSettings>(
    `*[_type == "siteSettings"][0]{ wicklowHours, arklowHours, hoursNote }`,
  );
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
    title: 'How The Boat Yard started',
    slug: 'how-the-boat-yard-started',
    excerpt:
      `A simple idea: a space by the coast where people could slow down, warm up, recover, and leave feeling better than they arrived.`,
    publishedAt: '2026-06-12',
    tag: 'Story',
    image: imgBeachSunset,
    alt: 'Sunset over the cobble beach with the sauna building on the shore',
    body: paragraphs(
      `The Boat Yard Sauna started from a simple idea: create a space by the coast where people could slow down, warm up, recover, and feel better leaving than they did arriving.`,
      `The experience is built around the contrast of heat and cold — a hot sauna, cold water, fresh air, and a calm, welcoming atmosphere. But what really makes The Boatyard special is the feeling around it: the people, the setting, the ritual, and the small details that make every session feel looked after.`,
      `From the beginning, the aim has been to make sauna culture feel social, accessible, premium, and rooted in the local coast. Some people come for recovery after training. Some come for a sea dip and a reset. Some come with friends. Some come for quiet time. Everyone is welcome.`,
    ),
  },
  {
    title: 'More than heat',
    slug: 'more-than-heat',
    excerpt:
      `The sauna is the start of it. What keeps people coming back is the routine, the community, and the feeling of being looked after.`,
    publishedAt: '2026-06-11',
    tag: 'Story',
    image: imgCourtyardPlunge,
    alt: 'The sauna courtyard at dusk, festoon lights glowing over the cold plunge',
    body: paragraphs(
      `The Boat Yard is about more than heat. It is about routine, community, recovery, and creating a place people are proud to be part of.`,
      `We are not just a place to book a sauna. We are building a coastal wellness community — a place for rituals, resets, recovery, connection, and good people.`,
      `Some come for recovery after training. Some come for a sea dip and a reset. Some come with friends, some come for quiet time. Whatever brings you down to the water, the welcome is the same: clean spaces, a hot sauna, fresh ice baths, calm music, and friendly faces.`,
    ),
  },
  {
    title: 'Two harbours, one standard',
    slug: 'two-harbours-one-standard',
    excerpt:
      `Wicklow and Arklow, the same focus: clean spaces, hot saunas, fresh ice baths, and a high standard every single session.`,
    publishedAt: '2026-06-10',
    tag: 'Story',
    image: imgIceBaths,
    alt: 'A row of galvanised cold-plunge ice baths under festoon lights',
    body: paragraphs(
      `Our Wicklow sauna is the original benchmark for The Boatyard experience — calm, coastal, clean, and designed for proper reset time. It is built around atmosphere and consistency: a hot sauna, cold plunge options, tidy changing areas, warm lighting, and a peaceful coastal feel.`,
      `Our Arklow location brings the same experience to a growing local community, with the same focus on heat, cold, atmosphere, and friendly service. It is a great spot for local groups, sports teams, wellness clubs, sea swimmers, friends, and first-time sauna users.`,
      `Across both harbours our focus is simple: clean spaces, hot saunas, fresh ice baths, calm music, friendly staff, and a high standard every session. Come for a morning reset, a post-training recovery session, a Sunday wind-down, or a social sauna with friends.`,
    ),
  },
  {
    title: 'Morning at the gate',
    slug: 'morning-at-the-gate',
    excerpt:
      'First light over the harbour, steam already rising. What the early sessions feel like before the rest of the town wakes up.',
    publishedAt: '2026-06-09',
    tag: 'Journal',
    image: imgSaunaGate,
    alt: 'The sauna gate at the harbour framing moored boats at early morning',
    body: paragraphs(
      'We light the stove at 6:15. By the time the first session starts at 7:00, the cedar is warm to the touch and the air inside is already different from the air outside — denser, sweeter, carrying the scent of birch and sea salt through the slats.',
      'There is something about that hour. The harbour is quiet. A few fishing boats have already gone out and the water is flat between the moorings. You walk down the pier in the half-light, see the steam curling up over the roof of the sauna, and everything else falls away.',
      'If you have never done an early session, this is our honest pitch: the cold water hits differently at 7am. The contrast is sharper. The warmth you build afterward stays with you longer. And you are done — truly done, with the whole thing behind you — before most people have had their first coffee.',
    ),
  },
  {
    title: 'The cedar ritual',
    slug: 'the-cedar-ritual',
    excerpt:
      'On sauna hats, the oils we use, and the small ceremonies that make a session more than just heat.',
    publishedAt: '2026-04-15',
    tag: 'Stories',
    image: imgSaunaHats,
    alt: 'Wool sauna hats hanging on the cedar door',
    body: paragraphs(
      'The hats are Finnish wool, the oils are eucalyptus and pine resin, and the ritual is older than any of us. Every regular who comes through the gate eventually develops their own version of it — a particular order of doing things, a number of rounds they always complete, a way of sitting that no one taught them.',
      'We get asked about the oils often. The eucalyptus goes on the ladle before it hits the stones. The steam that comes back carries it up and into the room in a way that is hard to describe — medicinal and wild at the same time, like the inside of a forest after rain. A small amount goes a long way.',
      'The hats are not vanity. They slow the heat reaching your head, which lets you stay in longer without discomfort. Once you have used one, going without feels like leaving something behind. They live on the cedar door between sessions. Pick one up when you arrive.',
    ),
  },
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
      'Our advice: don\'t wait for "warm". The water between now and midsummer is the sweet spot — cold enough to do its work, kind enough to let you stay in it. April cold is the best cold; June cold is a close second.',
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
      'Second: the loyalty cards are in, and they came out lovely. Ten sessions stamped, one on the house. Pick one up at either harbour next time you\'re down — no app, no account, just card and stamp the way it should be.',
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
      'We asked a few of them what keeps them coming back. The answers were all different and somehow all the same: the nerves before the dark water never fully go away, and that\'s the point. You do the hard thing, then you sit in the heat and watch the day arrive.',
      'One swimmer told us about a January morning when the moon set behind the lighthouse just as the sun came up across the water — both at once, gold one side, silver the other. You don\'t get that from bed.',
    ),
  },
  {
    title: 'Forty swimmers and counting',
    slug: 'forty-swimmers-and-counting',
    excerpt:
      'We took stock of our regulars this spring. What the numbers say about who uses the sauna, and what keeps them coming back to the bay.',
    publishedAt: '2026-02-18',
    tag: 'Stories',
    image: imgBaySwimmers,
    alt: 'Swimmers in the bay beside the pier seen from above',
    body: paragraphs(
      'We have been watching the numbers quietly. Over the winter, forty different people used the sauna at least once a week, every week. Ages ranged from nineteen to seventy-three. Some came alone, some in pairs, a handful in groups that had clearly been swimming together for years before we built the thing.',
      'What unites them is harder to pin down than a demographic. They are not especially competitive. They are not chasing fitness metrics. What they share is a tolerance for discomfort that spills over into a general ease with being cold, wet, and outside when no reasonable person would be.',
      'We asked a few of them why the bay instead of a pool, a gym, a sensible indoor activity. The answers were variations on the same thing: the bay does not care what you look like or how fast you swim. It just asks you to show up.',
    ),
  },
];
