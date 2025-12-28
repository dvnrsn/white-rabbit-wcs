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

export const collections = { posts };
