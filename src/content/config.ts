import { defineCollection, z } from "astro:content";

const posts = defineCollection({
  type: "content",
  schema: z.object({
    // Optional: can override date from filename
    date: z.date().optional(),
    // Optional: author name
    author: z.string().default("White Rabbit WCS"),
  }),
});

const instructors = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    photo: z.string().optional(),
    specialties: z.array(z.string()).default([]),
    website: z.string().url().optional(),
    instagram: z.string().optional(),
  }),
});

const venues = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    address: z.string(),
    description: z.string().optional(),
    website: z.string().url().optional(),
    mapUrl: z.string().url().optional(),
  }),
});

const resources = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    category: z.enum(["events", "learning", "music", "gear", "community"]),
    description: z.string(),
    url: z.string().url(),
  }),
});

const djs = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    photo: z.string().optional(),
    style: z.string().optional(),
    mixcloud: z.string().url().optional(),
    soundcloud: z.string().url().optional(),
    instagram: z.string().optional(),
  }),
});

export const collections = { posts, instructors, venues, resources, djs };
