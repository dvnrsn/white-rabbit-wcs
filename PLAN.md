# White Rabbit - Project Implementation Plan

## Project Overview

White Rabbit is a website for the Phoenix, Arizona West Coast Swing (WCS) dance community. The site helps dancers find WCS events, venues, teachers, and community resources across Arizona.

**Live Site:** https://whiterabbitwcs.com
**Stack:** Astro 5 + Cloudflare Workers

---

## ✅ Completed Features

### Phase 1: Foundation & Content Structure ✅

- **Site Structure & Navigation** ✅
  - Main navigation with responsive mobile design
  - Routing: Home, Events, About, Moodboards
  - Matrix-themed design system with theme switcher

- **SEO Foundation** ✅
  - Comprehensive SEO component with meta tags
  - Open Graph and Twitter Card support
  - Sitemap generation (`@astrojs/sitemap`)
  - robots.txt configured
  - Structured data (JSON-LD) for Organization and Events
  - Local SEO geo tags for Phoenix, AZ

- **About Page** ✅
  - Community story and history
  - What makes White Rabbit different
  - Philosophy and values

### Phase 2: Event Calendar ✅

- **Event Calendar System** ✅
  - Google Calendar integration (iCal feed)
  - Event cards with modal details
  - Filtering by event type (social, workshop, competition)
  - Fallback to JSON data
  - Server-rendered for fresh data
  - Cloudflare runtime env var support

### Additional Features ✅

- **Posts System** ✅
  - Astro Content Collections for markdown posts
  - Filename-based dating (`YYYY-MM-DD-slug.md`)
  - Homepage display of latest 5 posts
  - Non-technical user guide (`POSTS_GUIDE.md`)

- **Design System** ✅
  - Matrix-themed CSS variables
  - Multiple theme moodboards
  - Theme switcher component
  - Responsive, mobile-first design

---

## 🚧 In Progress

### Instagram Integration (on branch)

- Branch exists: `instagram-feed`
- Two approaches documented:
  - Instagram Graph API
  - Static embed widget
- **Decision needed:** Which approach to use or if needed at all

---

## 📋 Roadmap - Prioritized Next Steps

### High Priority

#### 1. **Venues Directory** 🎯
*Community members frequently ask "where can I dance?"*

- Create venues data structure (JSON or Astro Content Collections)
- Build venue listing page (`/venues`)
- Venue cards with:
  - Name, address, phone
  - Map integration (Google Maps embed or similar)
  - Regular schedule (if applicable)
  - Photos (optional)
- Filter by area (Phoenix, Scottsdale, Tempe, etc.)

**Estimated effort:** Medium
**Value:** High - Helps new dancers find places to dance

---

#### 2. **Teachers Directory** 🎯
*Help dancers find instruction*

- Create teacher profiles data structure
- Build teacher listing page (`/teachers`)
- Teacher cards with:
  - Name, photo
  - Bio/experience
  - Specialties (beginner, advanced, styling, etc.)
  - Contact info
  - Class schedule or link
- Optional: Integration with events (show their upcoming workshops)

**Estimated effort:** Medium
**Value:** High - Connects community with instruction

---

#### 3. **Event Enhancements** 🔧
*Improve existing calendar*

- Add "Add to Calendar" button (ICS export)
- Event detail pages (`/events/[slug]`)
- Calendar month view (currently list only)
- Past events archive
- Event search/filtering by date range

**Estimated effort:** Small-Medium
**Value:** Medium - Nice-to-have improvements

---

### Medium Priority

#### 4. **Performance & Polish** ⚡

- Image optimization (add actual images, optimize with Astro)
- Review bundle size
- Core Web Vitals testing
- Add loading states for calendar fetch
- Error boundaries

**Estimated effort:** Small
**Value:** Medium - Professional polish

---

#### 5. **Analytics** 📊

- Set up analytics (Cloudflare Analytics, Plausible, or similar)
- Track popular pages
- Monitor event page visits
- Privacy-friendly approach

**Estimated effort:** Small
**Value:** Medium - Understand user behavior

---

#### 6. **Content Management Docs** 📝

- Document how to update venues/teachers
- Create admin guide
- Contribution guidelines for community

**Estimated effort:** Small
**Value:** Medium - Empowers community

---

### Lower Priority

#### 7. **Instagram Integration** 📱
*Decision needed on approach*

- Merge existing branch OR
- Use simple link to Instagram instead
- Feed may not be necessary if posts system exists

**Estimated effort:** Small (if using existing work)
**Value:** Low-Medium - Posts system may be sufficient

---

#### 8. **Light Ecommerce** 💳
*Future consideration*

- Evaluate need for selling:
  - Event tickets
  - Merchandise
  - Workshop registrations
- Options:
  - External link (Eventbrite, Square, Shopify)
  - Embedded checkout (Stripe Checkout)
  - Full integration

**Estimated effort:** Large
**Value:** TBD - Depends on business needs

---

## Technical Decisions Made

✅ **Event Data:** Google Calendar (public iCal feed) + JSON fallback
✅ **Styling:** Custom CSS with CSS variables (Matrix theme)
✅ **Hosting:** Cloudflare Workers
✅ **CMS:** Astro Content Collections (for posts)
✅ **SEO:** Comprehensive built-in setup

## Technical Decisions Pending

❓ **Instagram:** API vs embed widget vs just link
❓ **Venues/Teachers Data:** JSON files vs Content Collections vs external CMS
❓ **Forms:** Contact form solution (if needed)
❓ **Ecommerce:** Build vs buy vs external link

---

## Next Session Recommendations

**Recommended next task:** Start with **Venues Directory** - high community value, relatively straightforward implementation.

Alternative: If you want something smaller, tackle **Event Enhancements** (Add to Calendar button, detail pages).

---

## Notes

- Mobile-first design is working well
- SEO foundation is solid
- Events system successfully integrated with Google Calendar
- Community can add posts via GitHub
- Site is live and functional
