import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    date: z.date().optional(),
    author: z.string().default("White Rabbit WCS"),
  }),
});

const instructors = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    level: z.string().optional(),
    location: z.string().optional(),
    specialties: z.array(z.string()).default([]),
    bio: z.string().optional(),
    photo: z.string().optional(),
    website: z.string().url().optional(),
    instagram: z.string().optional(),
  }),
});

const venues = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    neighborhood: z.string().optional(),
    floor: z.string().optional(),
    notes: z.string().optional(),
    website: z.string().url().optional(),
    mapUrl: z.string().url().optional(),
  }),
});

const resources = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    type: z.string().optional(),
    description: z.string().optional(),
    url: z.string().url().optional(),
  }),
});

const djs = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    handle: z.string().optional(),
    realName: z.string().optional(),
    bio: z.string().optional(),
    style: z.array(z.string()).default([]),
    resident: z.boolean().default(false),
    photo: z.string().optional(),
    mixcloud: z.string().url().optional(),
    soundcloud: z.string().url().optional(),
    instagram: z.string().optional(),
  }),
});

// Singleton page copy — written by Keystatic to src/content/pages/*.yaml
const pages = defineCollection({
  type: "data",
  schema: z.object({
    // Home page
    heroImages: z.array(z.object({ image: z.string(), alt: z.string() })).optional(),
    // Community page
    instructorsIntro: z.string().optional(),
    venuesIntro: z.string().optional(),
    resourcesIntro: z.string().optional(),
    gearIntro: z.string().optional(),
    gearCards: z.array(z.object({ title: z.string(), body: z.string() })).optional(),
    // Music page
    approachText: z.string().optional(),
    philosophyText: z.string().optional(),
    manifestoLine: z.string().optional(),
    manifestoSubline: z.string().optional(),
    playlistsIntro: z.string().optional(),
  }),
});

export const collections = { posts, instructors, venues, resources, djs, pages };
