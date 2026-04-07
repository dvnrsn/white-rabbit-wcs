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
    level: z.string(),
    location: z.string(),
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
    neighborhood: z.string(),
    floor: z.string(),
    notes: z.string(),
    website: z.string().url().optional(),
    mapUrl: z.string().url().optional(),
  }),
});

const resources = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    type: z.string(),
    description: z.string(),
    url: z.string().url(),
  }),
});

const djs = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    handle: z.string(),
    realName: z.string(),
    bio: z.string(),
    style: z.array(z.string()).default([]),
    resident: z.boolean().default(false),
    photo: z.string().optional(),
    mixcloud: z.string().url().optional(),
    soundcloud: z.string().url().optional(),
    instagram: z.string().optional(),
  }),
});

export const collections = { posts, instructors, venues, resources, djs };
