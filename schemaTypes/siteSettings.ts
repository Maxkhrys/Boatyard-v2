import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'wicklowHours',
      title: 'Wicklow Town — Opening Hours',
      type: 'array',
      description:
        'Add one row per time block shown on the website. Example: "Mon – Fri" / "7:00 — 21:00".',
      of: [
        {
          type: 'object',
          name: 'hoursRow',
          title: 'Hours row',
          fields: [
            defineField({
              name: 'days',
              title: 'Days',
              type: 'string',
              description: 'e.g. Mon – Fri or Sat – Sun',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'times',
              title: 'Times',
              type: 'string',
              description: 'e.g. 7:00 — 21:00 or Closed',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { title: 'days', subtitle: 'times' },
          },
        },
      ],
    }),
    defineField({
      name: 'arklowHours',
      title: 'Arklow — Opening Hours',
      type: 'array',
      description:
        'Add one row per time block shown on the website. Example: "Mon – Fri" / "7:00 — 21:00".',
      of: [
        {
          type: 'object',
          name: 'hoursRow',
          title: 'Hours row',
          fields: [
            defineField({
              name: 'days',
              title: 'Days',
              type: 'string',
              description: 'e.g. Mon – Fri or Sat – Sun',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'times',
              title: 'Times',
              type: 'string',
              description: 'e.g. 7:00 — 21:00 or Closed',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { title: 'days', subtitle: 'times' },
          },
        },
      ],
    }),
    defineField({
      name: 'hoursNote',
      title: 'Hours Note',
      type: 'string',
      description:
        'Optional footnote shown below the hours (e.g. "Subject to tides & weather"). Leave blank to use the default.',
    }),
  ],
  preview: {
    select: {},
    prepare() {
      return { title: 'Site Settings' };
    },
  },
});
