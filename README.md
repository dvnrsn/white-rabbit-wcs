# White Rabbit - Phoenix WCS Community

> Follow the white rabbit into Phoenix's West Coast Swing scene.

A modern website for the West Coast Swing (WCS) dance community in Phoenix, Arizona. Find events, connect with dancers, and discover your flow.

🌐 **Live Site:** [whiterabbitwcs.com](https://whiterabbitwcs.com)

---

## ✨ Features

### 🗓️ Event Calendar
- Google Calendar integration for real-time event updates
- Filter by event type (socials, workshops, competitions)
- Event cards with detailed modals
- Server-rendered for fresh data on every visit

### 📝 Community Posts
- Latest updates and announcements on homepage
- Markdown-powered content
- Easy contribution via GitHub (see [POSTS_GUIDE.md](./POSTS_GUIDE.md))

### 🎨 Matrix-Themed Design
- Custom Matrix-inspired aesthetic
- Multiple theme moodboards
- Theme switcher component
- Fully responsive, mobile-first design

### 🚀 SEO Optimized
- Comprehensive meta tags (Open Graph, Twitter Cards)
- Structured data (JSON-LD) for events and organization
- Automatic sitemap generation
- Local SEO optimization for Phoenix, AZ

### 📱 Modern Stack
- Built with [Astro 5](https://astro.build)
- Deployed on [Cloudflare Workers](https://workers.cloudflare.com)
- Lightning-fast static generation with server-rendered updates

---

## 🏗️ Project Structure

```text
white-rabbit/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   └── moodboards/         # Design inspiration
├── src/
│   ├── components/
│   │   ├── EventCard.astro
│   │   ├── Navigation.astro
│   │   ├── RecentPosts.astro
│   │   ├── SEO.astro
│   │   └── ThemeSwitcher.astro
│   ├── content/
│   │   ├── config.ts       # Content collections config
│   │   └── posts/          # Blog-style posts
│   ├── data/
│   │   └── events.json     # Fallback event data
│   ├── layouts/
│   │   └── Layout.astro
│   ├── lib/
│   │   ├── calendar.ts     # Google Calendar integration
│   │   └── schema.ts       # Structured data helpers
│   ├── pages/
│   │   ├── about.astro
│   │   ├── events.astro
│   │   ├── index.astro
│   │   └── api/
│   │       └── debug-calendar.json.ts
│   ├── styles/
│   │   └── themes.css
│   └── env.d.ts            # TypeScript definitions
├── PLAN.md                 # Project roadmap
├── POSTS_GUIDE.md          # How to add posts
└── CALENDAR_SETUP.md       # Calendar integration guide
```

---

## 🛠️ Development

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/)

### Commands

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `pnpm install`         | Install dependencies                             |
| `pnpm dev`             | Start local dev server at `localhost:4321`       |
| `pnpm build`           | Build production site to `./dist/`               |
| `pnpm preview`         | Preview build locally before deploying           |
| `pnpm astro ...`       | Run Astro CLI commands                           |
| `oxlint`               | Lint code (run before committing)                |
| `oxfmt`                | Format code (run before committing)              |

### Environment Variables

Create a `.dev.vars` file (and set in Cloudflare Workers):

```bash
PUBLIC_GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
```

See [CALENDAR_SETUP.md](./CALENDAR_SETUP.md) for detailed setup instructions.

---

## 📝 Contributing

### Adding Posts

Community members can add announcements and updates by creating markdown files. See [POSTS_GUIDE.md](./POSTS_GUIDE.md) for step-by-step instructions.

**Quick version:**
1. Create a file in `src/content/posts/`
2. Name it: `YYYY-MM-DD-title.md`
3. Add your content in markdown
4. Commit and push (or create PR)

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Run `oxfmt` to format code
4. Commit with descriptive message
5. Push and create a pull request

---

## 🚀 Deployment

The site automatically deploys to Cloudflare Workers when pushing to `main` branch.

**Production:** https://whiterabbitwcs.com

### Environment Setup (Cloudflare Workers)

1. Go to your Cloudflare Workers & Pages project
2. Settings → Variables and Secrets
3. Add `PUBLIC_GOOGLE_CALENDAR_ID` with your calendar ID
4. Trigger a new deployment

---

## 📋 Roadmap

See [PLAN.md](./PLAN.md) for the complete feature roadmap.

### ✅ Completed
- Site structure and navigation
- Event calendar with Google Calendar integration
- Posts/announcements system
- About page
- Comprehensive SEO
- Matrix-themed design system

### 🎯 Next Up
- Venues directory
- Teachers directory
- Event enhancements (Add to Calendar, detail pages)

---

## 🔧 Tech Stack

- **Framework:** [Astro 5](https://astro.build)
- **Hosting:** [Cloudflare Workers](https://workers.cloudflare.com)
- **Calendar:** Google Calendar (public iCal feed)
- **Content:** Astro Content Collections
- **Styling:** Custom CSS with CSS variables
- **SEO:** Built-in with structured data

---

## 📚 Documentation

- [PLAN.md](./PLAN.md) - Project roadmap and feature planning
- [POSTS_GUIDE.md](./POSTS_GUIDE.md) - How to add posts to the site
- [CALENDAR_SETUP.md](./CALENDAR_SETUP.md) - Google Calendar integration setup

---

## 🌐 Learn More

- [Astro Documentation](https://docs.astro.build)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [West Coast Swing](https://en.wikipedia.org/wiki/West_Coast_Swing)

---

## 📄 License

Built for the Phoenix WCS community. Follow the white rabbit. 🐇
