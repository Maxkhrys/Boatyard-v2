import type { ImageMetadata } from 'astro';
import { toHTML } from '@portabletext/to-html';
import wicklowDay from '../assets/images/aerial-wicklow-harbour.jpg';
import fleetImage from '../assets/images/aerial-moored-fleet.jpg';
import boatImage from '../assets/images/aerial-fishing-boat.jpg';

export interface JournalPost {
  title: string;
  slug: string;
  excerpt: string;
  date: string; // formatted for display
  isoDate: string;
  tag: string;
  /** Local asset metadata (fallback posts) or a remote URL (Sanity). */
  coverImage: ImageMetadata | string;
  coverAlt: string;
  bodyHtml: string;
}

const SANITY_PROJECT_ID = import.meta.env.SANITY_PROJECT_ID;
const SANITY_DATASET = import.meta.env.SANITY_DATASET ?? 'production';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' });

const paragraphs = (...texts: string[]) => texts.map((t) => `<p>${t}</p>`).join('\n');

/* Placeholder posts shown until a Sanity project is connected.
   Mirrors the Sanity post shape so swapping sources is invisible to pages. */
const fallbackPosts: JournalPost[] = [
  {
    title: 'Sea temperature: 11.4° and climbing',
    slug: 'sea-temperature-climbing',
    excerpt:
      'The spring warm-up is underway. What the next few weeks mean for plunge times, and why April cold is the best cold.',
    isoDate: '2026-06-04',
    date: formatDate('2026-06-04'),
    tag: 'Water',
    coverImage: wicklowDay,
    coverAlt: 'Aerial view of Wicklow harbour in golden evening light',
    bodyHtml: paragraphs(
      'The buoy off the East Pier read 11.4° this morning — up almost a full degree on last week. The spring warm-up has properly begun.',
      'For plungers, this is the sweet spot: cold enough to count, kind enough to stay in past the first gasp. If you have been waiting all winter for your first dip, the next few weeks are your window.',
      'We log the water temperature every morning before the first session. Ask at the door, or sign up to the harbour line below and we will send it to you weekly.',
    ),
  },
  {
    title: 'Summer hours & loyalty cards',
    slug: 'summer-hours-loyalty-cards',
    excerpt:
      'We are open earlier and later from this month — and the new loyalty cards are in. Ten sessions, one on the house.',
    isoDate: '2026-05-22',
    date: formatDate('2026-05-22'),
    tag: 'News',
    coverImage: fleetImage,
    coverAlt: 'Sailboats moored across the teal water of the harbour, seen from above',
    bodyHtml: paragraphs(
      'Longer evenings, longer hours. From this month we open earlier and close later at both harbours — first sessions from sunrise, last steam at dusk.',
      'The new loyalty cards have also landed: ten sessions stamped, the eleventh on the house. Pick one up at either location.',
      'As always, hours flex with the tides and the weather. Check the locations section for the current schedule.',
    ),
  },
  {
    title: 'Swimming through winter',
    slug: 'swimming-through-winter',
    excerpt:
      'Notes from the regulars who never missed a morning — on dark-water nerves, moonrise dips, and what keeps them coming back.',
    isoDate: '2026-03-09',
    date: formatDate('2026-03-09'),
    tag: 'Stories',
    coverImage: boatImage,
    coverAlt: 'A small fishing boat alone on dark emerald water, seen from above',
    bodyHtml: paragraphs(
      'There is a small crew who swam every single morning this winter. Sleet, dark, the works. We asked them why.',
      '“The first thirty seconds are the same in June as in January,” one of them told us. “After that, winter water is honest. It does not pretend to be anything else.”',
      'Most of them finish in the sauna, watching the weather they just swam through roll across the harbour. That contrast — proper cold into proper heat — is the whole point of this place.',
    ),
  },
];

interface SanityPost {
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt: string;
  tag?: string;
  coverImage?: string;
  coverAlt?: string;
  body?: unknown[];
}

async function fetchSanityPosts(): Promise<JournalPost[] | null> {
  if (!SANITY_PROJECT_ID) return null;

  const { createClient } = await import('@sanity/client');
  const client = createClient({
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
    apiVersion: '2024-01-01',
    useCdn: true,
  });

  const query = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    "tag": coalesce(category, "Notes"),
    "coverImage": mainImage.asset->url,
    "coverAlt": coalesce(mainImage.alt, title),
    body
  }`;

  try {
    const posts = await client.fetch<SanityPost[]>(query);
    if (!posts?.length) return null;
    return posts.map((post) => ({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      isoDate: post.publishedAt,
      date: formatDate(post.publishedAt),
      tag: post.tag ?? 'Notes',
      coverImage: post.coverImage ? `${post.coverImage}?w=1600&fm=webp&q=70` : fleetImage,
      coverAlt: post.coverAlt ?? post.title,
      bodyHtml: post.body ? toHTML(post.body as Parameters<typeof toHTML>[0]) : '',
    }));
  } catch (error) {
    console.warn('[journal] Sanity fetch failed, using fallback posts:', error);
    return null;
  }
}

let cache: JournalPost[] | null = null;

export async function getAllPosts(): Promise<JournalPost[]> {
  if (!cache) cache = (await fetchSanityPosts()) ?? fallbackPosts;
  return cache;
}

export async function getRecentPosts(count = 3): Promise<JournalPost[]> {
  return (await getAllPosts()).slice(0, count);
}
