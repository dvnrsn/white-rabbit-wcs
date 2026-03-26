import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const organizers = sqliteTable("organizers", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  bio: text("bio"),
  instagram: text("instagram"),
  website: text("website"),
  email: text("email"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const venues = sqliteTable("venues", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  mapsUrl: text("maps_url"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const teachers = sqliteTable("teachers", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  bio: text("bio"),
  instagram: text("instagram"),
  website: text("website"),
  email: text("email"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const artists = sqliteTable("artists", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  bio: text("bio"),
  instagram: text("instagram"),
  website: text("website"),
  email: text("email"),
  points: integer("points").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey().default(sql`(lower(hex(randomblob(16))))`),
  title: text("title").notNull(),
  description: text("description"),
  organizerId: text("organizer_id").references(() => organizers.id),
  venueId: text("venue_id").references(() => venues.id),
  date: text("date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  price: text("price"),
  level: text("level"),
  type: text("type").default("social"),
  rrule: text("rrule"),
  isRecurring: integer("is_recurring").default(0),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export type Organizer = typeof organizers.$inferSelect;
export type NewOrganizer = typeof organizers.$inferInsert;
export type Venue = typeof venues.$inferSelect;
export type NewVenue = typeof venues.$inferInsert;
export type Teacher = typeof teachers.$inferSelect;
export type Artist = typeof artists.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
