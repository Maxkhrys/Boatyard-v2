import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'The post URL is generated automatically from this title.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short summary shown on the journal page.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tag',
      title: 'Tag',
      type: 'string',
      initialValue: 'Journal',
      options: {
        list: [
          { title: 'Journal', value: 'Journal' },
          { title: 'Water', value: 'Water' },
          { title: 'News', value: 'News' },
          { title: 'Stories', value: 'Stories' },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
    }),
    defineField({
      name: 'mainImage',
      title: 'Your Own Image',
      type: 'image',
      description: 'Optional — upload your own photo for this post.',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
    defineField({
      name: 'stockImage',
      title: 'Or Pick a House Photo',
      type: 'string',
      description:
        'Used when you don’t upload your own image. Leave both empty and one is picked for you.',
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
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockContent',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'tag',
      media: 'mainImage',
    },
  },
});
