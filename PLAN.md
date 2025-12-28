# White Rabbit - Project Implementation Plan

## Project Overview

White Rabbit is a static website for the Phoenix, Arizona West Coast Swing (WCS) dance community. The site helps dancers find WCS events, venues, teachers, and community resources across Arizona.

## Core Features & Implementation Plan

### Phase 1: Foundation & Content Structure

- [ ] **Site Structure & Navigation**
  - Create main navigation layout
  - Set up routing for key pages (Home, Events, About, Teachers, Venues)
  - Implement responsive mobile-first design

- [ ] **SEO Foundation**
  - Configure Astro SEO settings
  - Add meta tags component
  - Set up sitemap generation
  - Configure robots.txt
  - Implement structured data (JSON-LD) for events and local business

- [ ] **About Page**
  - What is West Coast Swing
  - White Rabbit community story
  - Contact information
  - FAQ section

### Phase 2: Event Calendar

- [ ] **Event Calendar System**
  - Design event data structure (JSON/YAML)
  - Create event listing component
  - Build calendar view (monthly/list view)
  - Add event detail pages
  - Implement filtering by date, location, event type
  - Add "Add to Calendar" functionality (ICS export)

### Phase 3: Directory & Resources

- [ ] **Venues Directory**
  - Create venues data structure
  - Build venue listing page
  - Add venue detail pages with maps
  - Include address, contact info, schedule

- [ ] **Teachers Directory**
  - Create teacher profiles data structure
  - Build teacher listing page
  - Add teacher detail pages
  - Include bio, contact, specialties, class schedule

### Phase 4: Social Integration

- [ ] **Instagram Integration**
  - Set up Instagram Basic Display API
  - Create Instagram feed component
  - Display recent posts on homepage
  - Add link to full Instagram profile
  - Consider fallback for when API limits are reached

### Phase 5: Light Ecommerce

- [ ] **Ecommerce Setup**
  - Decide on products (merchandise, event tickets, workshops)
  - Choose payment processor (Stripe, Square, etc.)
  - Create product catalog structure
  - Build product listing page
  - Create product detail pages
  - Implement shopping cart functionality
  - Set up checkout flow
  - Add order confirmation

### Phase 6: Polish & Launch

- [ ] **Performance Optimization**
  - Optimize images
  - Review bundle size
  - Test Core Web Vitals
  - Add loading states

- [ ] **Content Management**
  - Document how to add/edit events
  - Document how to update venue/teacher info
  - Create content contribution guidelines

- [ ] **Testing & Deployment**
  - Cross-browser testing
  - Mobile responsiveness testing
  - Set up hosting (Netlify, Vercel, etc.)
  - Configure custom domain
  - Set up analytics

## Technical Decisions to Make

- **Event Data Management**: Hardcoded JSON/YAML files vs. CMS (Decap, Sanity, etc.)
- **Instagram**: API integration vs. embed widget
- **Ecommerce**: Full integration vs. external link to Shopify/Square
- **Styling**: Vanilla CSS, Tailwind, or other framework
- **Forms**: Contact form handling (Formspree, Netlify Forms, etc.)

## Notes

- Prioritize mobile experience (dancers often check events on phones)
- Keep design clean and uncluttered
- Focus on fast load times for good UX and SEO
- Make it easy to update events regularly
