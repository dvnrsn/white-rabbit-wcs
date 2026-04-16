import { config, collection, fields, singleton } from "@keystatic/core";

export default config({
  storage:
    import.meta.env.PROD ||
    import.meta.env.PUBLIC_KEYSTATIC_STORAGE_KIND === "github"
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
    siteSettings: singleton({
      label: "Site settings",
      path: "src/content/pages/site-settings",
      format: { data: "yaml" },
      schema: {
        discordUrl: fields.url({ label: "Discord invite URL", validation: { isRequired: false } }),
        instagramUrl: fields.url({ label: "Instagram URL", validation: { isRequired: false } }),
        facebookUrl: fields.url({ label: "Facebook URL", validation: { isRequired: false } }),
      },
    }),

    homePage: singleton({
      label: "Home page",
      path: "src/content/pages/home",
      format: { data: "yaml" },
      schema: {
        heroImages: fields.array(
          fields.object({
            image: fields.image({
              label: "Image",
              directory: "public/images/hero",
              publicPath: "/images/hero/",
            }),
            alt: fields.text({ label: "Alt text" }),
          }),
          { label: "Hero images", itemLabel: (props) => props.fields.alt.value ?? "Image" }
        ),
      },
    }),

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
          { label: "Gear cards", itemLabel: (props) => props.fields.title.value ?? "" }
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
        level: fields.text({ label: "Level", description: 'e.g. "Advanced / Pro"' }),
        location: fields.text({ label: "Location", description: 'e.g. "Phoenix"' }),
        specialties: fields.array(fields.text({ label: "Specialty" }), {
          label: "Specialties",
          itemLabel: (props) => props.value ?? "",
        }),
        bio: fields.text({ label: "Bio", multiline: true, validation: { isRequired: false } }),
        photo: fields.image({
          label: "Photo",
          directory: "public/images/instructors",
          publicPath: "/images/instructors/",
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
        neighborhood: fields.text({ label: "Neighborhood", description: 'e.g. "Central Phoenix"' }),
        floor: fields.text({ label: "Floor type", description: 'e.g. "Hardwood"' }),
        notes: fields.text({ label: "Notes", multiline: true }),
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
        type: fields.text({ label: "Type", description: 'e.g. "Regional Event", "Monthly Social"' }),
        description: fields.text({ label: "Description", multiline: true }),
        url: fields.url({ label: "URL" }),
      },
    }),

    playlists: collection({
      label: "Playlists",
      slugField: "title",
      path: "src/content/playlists/*",
      format: { data: "yaml" },
      schema: {
        title: fields.slug({ name: { label: "Title" } }),
        description: fields.text({ label: "Description", multiline: true, validation: { isRequired: false } }),
        spotifyUrl: fields.url({ label: "Spotify URL" }),
        mood: fields.text({ label: "Mood / vibe", description: 'e.g. "Social / Late Night"', validation: { isRequired: false } }),
      },
    }),

    djs: collection({
      label: "DJs",
      slugField: "name",
      path: "src/content/djs/*",
      format: { data: "yaml" },
      schema: {
        name: fields.slug({ name: { label: "Name / slug" } }),
        handle: fields.text({ label: "DJ handle", description: 'e.g. "DJ Nyx"' }),
        realName: fields.text({ label: "Real name", description: 'e.g. "Nicole Y."' }),
        bio: fields.text({ label: "Bio", multiline: true }),
        style: fields.array(fields.text({ label: "Style tag" }), {
          label: "Style tags",
          itemLabel: (props) => props.value ?? "",
        }),
        resident: fields.checkbox({ label: "Resident DJ", defaultValue: false }),
        photo: fields.image({
          label: "Photo",
          directory: "public/images/djs",
          publicPath: "/images/djs/",
        }),
        spotify: fields.url({ label: "Spotify", validation: { isRequired: false } }),
        mixcloud: fields.url({ label: "Mixcloud", validation: { isRequired: false } }),
        soundcloud: fields.url({ label: "SoundCloud", validation: { isRequired: false } }),
        instagram: fields.text({ label: "Instagram handle", validation: { isRequired: false } }),
      },
    }),
  },
});
