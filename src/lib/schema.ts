import type { CalendarEvent } from "./calendar";
import eventDetailsData from "../data/event-details.json";

const SITE_URL = "https://whiterabbitwcs.com";
const ORG_ID = `${SITE_URL}/#organization`;
const ORG_NAME = "White Rabbit Society";

/**
 * Official White Rabbit Society profiles. Google uses these to tie the
 * accounts to the site as one organization. Only list accounts we run.
 */
export const OFFICIAL_PROFILES = [
  "https://www.instagram.com/whiterabbit.wcs/",
  "https://x.com/WhiteRabbitWCS",
  "https://www.facebook.com/profile.php?id=61585550563461",
  "https://www.facebook.com/groups/183446960374256",
  "https://www.facebook.com/groups/669563174589516/",
  "https://azdancedirectory.com/listings/white-rabbit-wcs-events/",
];

/** A short reference to the organization, for use inside other schemas. */
const ORG_REF = { "@type": "Organization", "@id": ORG_ID, name: ORG_NAME, url: SITE_URL };

/**
 * Generate Organization schema for White Rabbit Society
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: ORG_NAME,
    alternateName: ["White Rabbit WCS", "White Rabbit West Coast Swing"],
    url: SITE_URL,
    logo: `${SITE_URL}/logo.webp`,
    email: "whiterabbitwcs@gmail.com",
    description:
      "Arizona's West Coast Swing dance community. Find WCS events, socials, workshops, and connect with dancers across Arizona.",
    areaServed: {
      "@type": "State",
      name: "Arizona",
      address: {
        "@type": "PostalAddress",
        addressRegion: "AZ",
        addressCountry: "US",
      },
    },
    sameAs: OFFICIAL_PROFILES,
  };
}

interface EventDetails {
  name?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  url?: string;
  image?: string;
  performers?: Array<{ name: string; role?: string; url?: string }>;
}

const eventDetails = eventDetailsData as unknown as Record<string, EventDetails | string>;

/** Hand-written details for an event (see src/data/event-details.json). */
function detailsFor(event: CalendarEvent): EventDetails {
  // Recurring occurrences have ids like "<seriesId>_YYYY-MM-DD"; allow either key.
  const found = eventDetails[event.id] ?? eventDetails[event.id.replace(/_\d{4}-\d{2}-\d{2}$/, "")];
  return typeof found === "object" && found !== null ? found : {};
}

/** True for events White Rabbit Society runs, not other groups' events on our calendar. */
function isWhiteRabbitEvent(event: CalendarEvent) {
  return /white rabbit/i.test(event.title) || /white rabbit society/i.test(event.organizer);
}

/**
 * Split a calendar address like
 * "Creative Dance Collective, 2107 W Guadalupe Rd, Mesa, AZ 85202, USA"
 * into a venue name and a schema.org PostalAddress.
 */
export function parseAddress(raw: string) {
  const parts = (raw || "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/^(usa|us|united states)$/i.test(p));
  const stateIdx = parts.findIndex((p) => /^AZ(\s+\d{5}(-\d{4})?)?$/i.test(p));
  if (stateIdx < 1) return null;
  const postalCode = parts[stateIdx].match(/\d{5}(-\d{4})?/)?.[0];
  const locality = parts[stateIdx - 1];
  const before = parts.slice(0, stateIdx - 1);
  // A leading part with no digits is the venue name ("Creative Dance Collective").
  const name = before.length > 1 && !/\d/.test(before[0]) ? before.shift() : undefined;
  return {
    name,
    address: {
      "@type": "PostalAddress",
      ...(before.length && { streetAddress: before.join(", ") }),
      addressLocality: locality,
      addressRegion: "AZ",
      ...(postalCode && { postalCode }),
      addressCountry: "US",
    },
  };
}

function addDays(date: string, days: number) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Arizona does not observe daylight saving time, so local time is always UTC-07:00.
 * Events with no time (00:00 to 00:00, i.e. all-day calendar entries) get a date only.
 */
function eventDates(date: string, startTime: string, endTime: string) {
  const allDay = startTime === "00:00" && endTime === "00:00";
  if (allDay) return { startDate: date };
  const startDate = `${date}T${startTime}:00-07:00`;
  if (!endTime || endTime === startTime) return { startDate };
  // An end time earlier than the start means the event runs past midnight.
  const endDay = endTime < startTime ? addDays(date, 1) : date;
  return { startDate, endDate: `${endDay}T${endTime}:00-07:00` };
}

function absoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, SITE_URL).toString();
}

/**
 * Generate Event schema for a calendar event
 */
export function generateEventSchema(event: CalendarEvent) {
  const extra = detailsFor(event);
  const ours = isWhiteRabbitEvent(event);
  const calendarDescription = /^details tba!?$/i.test(event.description.trim()) ? "" : event.description;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "DanceEvent",
    name: extra.name || event.title.trim(),
    description: extra.description || calendarDescription || event.title.trim(),
    ...eventDates(event.date, extra.startTime || event.startTime, extra.endTime || event.endTime),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  };

  // Organizer: White Rabbit Society only for our own events. Other groups'
  // events keep their own organizer name (the calendar's default is ours, so skip it).
  if (ours) {
    schema.organizer = ORG_REF;
  } else if (event.organizer && event.organizer !== "White Rabbit WCS") {
    schema.organizer = { "@type": "Organization", name: event.organizer };
  }

  // Location
  const parsed = parseAddress(event.address || event.venue);
  if (parsed) {
    schema.location = {
      "@type": "Place",
      name: parsed.name || (event.venue && event.venue !== event.address ? event.venue : undefined) || parsed.address.addressLocality,
      address: parsed.address,
    };
  } else if (event.venue && event.venue !== "TBA") {
    schema.location = {
      "@type": "Place",
      name: event.venue,
      address: { "@type": "PostalAddress", addressRegion: "AZ", addressCountry: "US" },
    };
  }

  const url = extra.url || event.url || (ours ? `${SITE_URL}/events` : undefined);
  if (url) schema.url = url;

  // Offers: only when the calendar lists a dollar price.
  const priceMatch = event.price?.match(/\$\s?(\d+(?:\.\d{1,2})?)/);
  if (priceMatch) {
    schema.offers = {
      "@type": "Offer",
      price: priceMatch[1],
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: url || `${SITE_URL}/events`,
    };
  }

  if (extra.performers?.length) {
    schema.performer = extra.performers.map((p) => ({
      "@type": "Person",
      name: p.name,
      ...(p.url && { sameAs: p.url }),
    }));
  }

  const image = extra.image || (ours ? "/logo.webp" : undefined);
  if (image) schema.image = [absoluteUrl(image)];

  return schema;
}

/**
 * Generate one Event schema per upcoming event (max 25). Each Event is its own
 * top-level JSON-LD block, which is the shape Google reads for event results.
 * Events with no known location are skipped, since Google requires one.
 */
export function generateEventListSchema(events: CalendarEvent[]) {
  return events
    .map((event) => generateEventSchema(event))
    .filter((schema) => schema.location)
    .slice(0, 25);
}

/** Event schemas for upcoming White Rabbit Society events only (used on the home page). */
export function generateWhiteRabbitEventSchemas(events: CalendarEvent[], today: string) {
  return events
    .filter((e) => e.date >= today && isWhiteRabbitEvent(e))
    .slice(0, 5)
    .map((event) => generateEventSchema(event));
}

/**
 * Generate LocalBusiness schema for a venue
 */
export function generateVenueSchema(venue: {
  name: string;
  address?: string;
  phone?: string;
  website?: string;
}) {
  // Extract city from address if available
  const cityMatch = venue.address?.match(/,\s*([^,]+),\s*AZ/);
  const city = cityMatch ? cityMatch[1].trim() : "Phoenix";

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: venue.name,
    address: venue.address
      ? {
          "@type": "PostalAddress",
          streetAddress: venue.address,
          addressLocality: city,
          addressRegion: "AZ",
          addressCountry: "US",
        }
      : undefined,
    telephone: venue.phone,
    url: venue.website,
  };
}

/**
 * Generate Product schema for a shop item
 */
export function generateProductSchema(product: {
  id: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  variants: Array<{ price: string; inStock: boolean; name: string }>;
}) {
  const prices = product.variants.map(v => parseFloat(v.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const anyInStock = product.variants.some(v => v.inStock);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.thumbnailUrl,
    url: `https://whiterabbitwcs.com/shop`,
    brand: {
      "@type": "Brand",
      name: ORG_NAME,
    },
    offers: {
      "@type": "AggregateOffer",
      lowPrice: minPrice.toFixed(2),
      highPrice: maxPrice.toFixed(2),
      priceCurrency: "USD",
      availability: anyInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      offerCount: product.variants.length,
      seller: ORG_REF,
    },
  };
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
