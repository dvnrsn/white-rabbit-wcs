import type { CalendarEvent } from "./calendar";

/**
 * Generate Organization schema for White Rabbit WCS
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "White Rabbit WCS",
    alternateName: "White Rabbit West Coast Swing",
    url: "https://whiterabbitwcs.com",
    logo: "https://whiterabbitwcs.com/logo.png",
    description:
      "Phoenix, Arizona's West Coast Swing dance community. Find WCS events, socials, workshops, and connect with dancers across Arizona.",
    areaServed: {
      "@type": "City",
      name: "Phoenix",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Phoenix",
        addressRegion: "AZ",
        addressCountry: "US",
      },
    },
    sameAs: [
      "https://www.instagram.com/whiterabbit.wcs/",
      // Add other social media URLs here
    ],
  };
}

/**
 * Generate Event schema for a calendar event
 */
export function generateEventSchema(event: CalendarEvent) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "DanceEvent",
    name: event.title,
    description: event.description || event.title,
    startDate: event.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    organizer: {
      "@type": "Organization",
      name: event.organizer || "White Rabbit WCS",
      url: "https://whiterabbitwcs.com",
    },
  };

  // Add end date if available
  if (event.endDate) {
    schema.endDate = event.endDate;
  }

  // Add location if venue is available
  if (event.venue) {
    schema.location = {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Phoenix",
        addressRegion: "AZ",
        addressCountry: "US",
      },
    };
  }

  // Add offers if price is available
  if (event.price) {
    // Extract numeric price if it exists
    const priceMatch = event.price.match(/\$?(\d+)/);
    if (priceMatch) {
      schema.offers = {
        "@type": "Offer",
        price: priceMatch[1],
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: event.url || "https://whiterabbitwcs.com/events",
      };
    }
  }

  // Add URL if available
  if (event.url) {
    schema.url = event.url;
  }

  return schema;
}

/**
 * Generate ItemList schema for events page
 */
export function generateEventListSchema(events: CalendarEvent[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: events.slice(0, 10).map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: generateEventSchema(event),
    })),
  };
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
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: venue.name,
    address: venue.address
      ? {
          "@type": "PostalAddress",
          streetAddress: venue.address,
          addressLocality: "Phoenix",
          addressRegion: "AZ",
          addressCountry: "US",
        }
      : undefined,
    telephone: venue.phone,
    url: venue.website,
  };
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
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
