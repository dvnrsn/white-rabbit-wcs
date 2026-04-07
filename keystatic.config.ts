import { config, collection, fields, singleton } from "@keystatic/core";

export default config({
  storage:
    process.env.NODE_ENV === "production"
      ? {
          kind: "github",
          repo: "dvnrsn/white-rabbit-wcs",
          branchPrefix: "keystatic/",
        }
      : { kind: "local" },

  ui: {
    brand: { name: "White Rabbit Society" },
  },

  singletons: {
    communityPage: singleton({
      label: "Community page",
      path: "src/content/pages/community",
      format: { data: "yaml" },
      schema: {
        instructorsIntro: fields.text({ label: "Instructors intro", multiline: true }),
        venuesIntro: fields.text({ label: "Venues intro", multiline: true }),
        resourcesIntro: fields.text({ label: "Resources intro", multiline: true }),
        gearIntro: fields.text({ label: "Gear section intro", multiline: true }),
        gearCards: fields.array(
          fields.object({
            title: fields.text({ label: "Title" }),
            body: fields.text({ label: "Body", multiline: true }),
          }),
          { label: "Gear cards", itemLabel: (props) => props.fields.title.value }
        ),
      },
    }),

    musicPage: singleton({
      label: "Music page",
      path: "src/content/pages/music",
      format: { data: "yaml" },
      schema: {
        approachText: fields.text({ label: "Our approach (paragraphs)", multiline: true }),
        philosophyText: fields.text({ label: "The philosophy (paragraphs)", multiline: true }),
        manifestoLine: fields.text({ label: "Manifesto — main line" }),
        manifestoSubline: fields.text({ label: "Manifesto — subline" }),
        playlistsIntro: fields.text({ label: "Playlists section intro", multiline: true }),
      },
    }),
  },

  collections: {
    instructors: collection({
      label: "Instructors",
      slugField: "name",
      path: "src/content/instructors/*",
      format: { data: "yaml" },
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        bio: fields.text({ label: "Bio", multiline: true }),
        photo: fields.image({
          label: "Photo",
          directory: "public/images/instructors",
          publicPath: "/images/instructors/",
        }),
        specialties: fields.array(fields.text({ label: "Specialty" }), {
          label: "Specialties",
          itemLabel: (props) => props.fields.value.value,
        }),
        website: fields.url({ label: "Website", validation: { isRequired: false } }),
        instagram: fields.text({ label: "Instagram handle", validation: { isRequired: false } }),
      },
    }),

    venues: collection({
      label: "Venues",
      slugField: "name",
      path: "src/content/venues/*",
      format: { data: "yaml" },
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        address: fields.text({ label: "Address" }),
        description: fields.text({ label: "Description", multiline: true, validation: { isRequired: false } }),
        website: fields.url({ label: "Website", validation: { isRequired: false } }),
        mapUrl: fields.url({ label: "Map URL", validation: { isRequired: false } }),
      },
    }),

    resources: collection({
      label: "Resources",
      slugField: "name",
      path: "src/content/resources/*",
      format: { data: "yaml" },
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        category: fields.select({
          label: "Category",
          options: [
            { label: "Events", value: "events" },
            { label: "Learning", value: "learning" },
            { label: "Music", value: "music" },
            { label: "Gear", value: "gear" },
            { label: "Community", value: "community" },
          ],
          defaultValue: "community",
        }),
        description: fields.text({ label: "Description", multiline: true }),
        url: fields.url({ label: "URL" }),
      },
    }),

    djs: collection({
      label: "DJs",
      slugField: "name",
      path: "src/content/djs/*",
      format: { data: "yaml" },
      schema: {
        name: fields.slug({ name: { label: "Name" } }),
        bio: fields.text({ label: "Bio", multiline: true }),
        photo: fields.image({
          label: "Photo",
          directory: "public/images/djs",
          publicPath: "/images/djs/",
        }),
        style: fields.text({ label: "Style / vibe", multiline: true, validation: { isRequired: false } }),
        mixcloud: fields.url({ label: "Mixcloud", validation: { isRequired: false } }),
        soundcloud: fields.url({ label: "SoundCloud", validation: { isRequired: false } }),
        instagram: fields.text({ label: "Instagram handle", validation: { isRequired: false } }),
      },
    }),
  },
});
