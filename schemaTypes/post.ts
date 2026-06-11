import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'post',
  title: 'Journal Post',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'meta', title: 'Date & Category' },
    { name: 'image', title: 'Cover Image' },
  ],
  fields: [
    /* ---- Content ---- */
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      description:
        'The headline shown on the card and at the top of the post. The URL is generated automatically from this — keep it short and descriptive.',
      validation: (Rule) => Rule.required().min(4).max(100),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      group: 'content',
      description:
        'One or two sentences shown on the journal card. Written in plain text — no formatting. Aim for under 160 characters.',
      validation: (Rule) => Rule.max(300),
    }),
    defineField({
      name: 'body',
      title: 'Post Body',
      type: 'blockContent',
      group: 'content',
      description:
        'The full post content. Use the toolbar to add headings, bold text, pull quotes, and links. You can also embed images inline.',
    }),

    /* ---- Meta ---- */
    defineField({
      name: 'publishedAt',
      title: 'Publish Date',
      type: 'datetime',
      group: 'meta',
      description:
        'Sets the date shown on the card and sorts the post in the journal. Defaults to right now — change it to schedule or backdate.',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tag',
      title: 'Category',
      type: 'string',
      group: 'meta',
      description:
        'Shown as a label on the card. Pick the one that best fits: Water for sea conditions, News for announcements, Stories for people and experiences.',
      initialValue: 'Journal',
      options: {
        list: [
          { title: 'Journal — general notes', value: 'Journal' },
          { title: 'Water — sea temps & conditions', value: 'Water' },
          { title: 'News — hours, pricing, events', value: 'News' },
          { title: 'Stories — people & experiences', value: 'Stories' },
        ],
        layout: 'radio',
        direction: 'vertical',
      },
    }),

    /* ---- Cover Image ---- */
    defineField({
      name: 'mainImage',
      title: 'Upload Your Own Photo',
      type: 'image',
      group: 'image',
      description:
        'Upload a photo from your camera roll or files. JPG or WebP, minimum 1000px wide. Enable the hotspot to choose which part of the image stays in frame when it is cropped.',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description:
            'Describe the image in plain language for screen readers (e.g. "Waves breaking at Wicklow pier at sunrise").',
        }),
      ],
    }),
    defineField({
      name: 'stockImage',
      title: 'Or Choose a House Photo',
      type: 'string',
      group: 'image',
      description:
        'Pick one of the built-in harbour photos. Used only when no upload is provided. Leave both blank and a photo is picked automatically.',
      options: {
        list: [
          { title: 'Harbour sailboats, morning', value: 'harbour-sailboats' },
          { title: 'Golden coast from above', value: 'coast-golden' },
          { title: 'Harbour vista from above', value: 'harbour-vista' },
          { title: 'Swimmers in the bay', value: 'bay-swimmers' },
          { title: 'Wicklow harbour from above', value: 'wicklow-harbour' },
          { title: 'Kayak on emerald water', value: 'kayak' },
          { title: 'Rowers on emerald water', value: 'rowers' },
          { title: 'Fishing boat from above', value: 'fishing-boat' },
          { title: 'Moored fleet from above', value: 'moored-fleet' },
          { title: 'Harbour boats at dusk', value: 'harbour-dusk' },
          { title: 'Pier lighthouse, daytime', value: 'pier-day' },
          { title: 'Pier lighthouse, moonrise', value: 'pier-moonrise' },
          { title: 'Pier lighthouse, sunrise', value: 'pier-sunrise' },
          { title: 'Sea steps at sunrise', value: 'sea-steps' },
          { title: 'Sauna gate at the harbour', value: 'sauna-gate' },
          { title: 'Sauna hats on the cedar door', value: 'sauna-hats' },
          { title: 'Ritual oils & incense', value: 'ritual-oils' },
          { title: 'Loyalty cards', value: 'loyalty-cards' },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'tag',
      media: 'mainImage',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title ?? 'Untitled post',
        subtitle: subtitle ?? 'Journal',
        media,
      };
    },
  },
});
