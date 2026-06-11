import type { PortableTextBlock, PortableTextSpan } from './sanity';
import { sanityImageUrl } from './sanity';

/* ------------------------------------------------------------------
   Minimal Portable Text → HTML renderer.
   Covers the standard block editor output: paragraphs, headings,
   blockquotes, bullet/numbered lists, strong/em/underline/code,
   links, and inline images — without pulling in a dependency.
   ------------------------------------------------------------------ */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderSpan(span: PortableTextSpan, block: PortableTextBlock): string {
  let html = escapeHtml(span.text).replace(/\n/g, '<br />');

  for (const mark of span.marks ?? []) {
    const def = block.markDefs?.find((markDef) => markDef._key === mark);
    if (def?._type === 'link' && def.href) {
      const href = escapeHtml(def.href);
      const external = /^https?:\/\//.test(def.href);
      html = `<a href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${html}</a>`;
    } else if (mark === 'strong') {
      html = `<strong>${html}</strong>`;
    } else if (mark === 'em') {
      html = `<em>${html}</em>`;
    } else if (mark === 'underline') {
      html = `<u>${html}</u>`;
    } else if (mark === 'code') {
      html = `<code>${html}</code>`;
    }
  }

  return html;
}

function renderBlock(block: PortableTextBlock): string {
  if (block._type === 'image' && block.asset?._ref) {
    const src = sanityImageUrl(block.asset._ref, 1200);
    if (!src) return '';
    const alt = escapeHtml(block.alt ?? '');
    return `<figure><img src="${src}" alt="${alt}" loading="lazy" /></figure>`;
  }

  if (block._type !== 'block' || !block.children) return '';

  const content = block.children.map((span) => renderSpan(span, block)).join('');

  switch (block.style) {
    case 'h1':
    case 'h2':
      return `<h2>${content}</h2>`;
    case 'h3':
      return `<h3>${content}</h3>`;
    case 'h4':
      return `<h4>${content}</h4>`;
    case 'blockquote':
      return `<blockquote>${content}</blockquote>`;
    default:
      return `<p>${content}</p>`;
  }
}

export function portableTextToHtml(blocks: PortableTextBlock[]): string {
  const html: string[] = [];
  let openList: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (openList) {
      html.push(`</${openList}>`);
      openList = null;
    }
  };

  for (const block of blocks) {
    if (block._type === 'block' && block.listItem) {
      const tag = block.listItem === 'number' ? 'ol' : 'ul';
      if (openList !== tag) {
        closeList();
        html.push(`<${tag}>`);
        openList = tag;
      }
      const content = (block.children ?? []).map((span) => renderSpan(span, block)).join('');
      html.push(`<li>${content}</li>`);
    } else {
      closeList();
      html.push(renderBlock(block));
    }
  }

  closeList();
  return html.join('\n');
}
