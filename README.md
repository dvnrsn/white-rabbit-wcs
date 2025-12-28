# White Rabbit - Phoenix WCS Community

A static website for the West Coast Swing (WCS) dance community in Phoenix, Arizona. This site helps dancers discover WCS events, venues, teachers, and community resources across Arizona.

## Features

- Event calendar for local WCS dances and workshops
- Directory of venues and teachers
- Instagram feed integration
- Light ecommerce for merchandise and event tickets
- SEO-optimized for local dance community discovery

## Project Structure

```text
/
├── public/              # Static assets
├── src/
│   ├── assets/         # Images, icons, etc.
│   ├── components/     # Reusable Astro components
│   ├── layouts/        # Page layouts
│   ├── pages/          # Routes (file-based routing)
│   └── styles/         # Global styles
└── PLAN.md             # Detailed implementation roadmap
```

See [PLAN.md](./PLAN.md) for the full feature roadmap and implementation details.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `pnpm install`         | Installs dependencies                            |
| `pnpm dev`             | Starts local dev server at `localhost:4321`      |
| `pnpm build`           | Build your production site to `./dist/`          |
| `pnpm preview`         | Preview your build locally, before deploying     |
| `pnpm astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `pnpm astro -- --help` | Get help using the Astro CLI                     |

## Tech Stack

- [Astro 5](https://astro.build) - Static site framework
- Built with performance and SEO in mind
- Mobile-first responsive design

## Learn More

- [Astro documentation](https://docs.astro.build)
- [West Coast Swing basics](https://en.wikipedia.org/wiki/West_Coast_Swing)
