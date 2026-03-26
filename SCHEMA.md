# WCS CMS Schema

```mermaid
erDiagram
    organizers {
        text id PK
        text name
        text slug
        text bio
        text instagram
        text website
        text email
    }

    organizations {
        text id PK
        text name
        text slug
        text bio
        text website
        text instagram
        text email
    }

    venues {
        text id PK
        text name
        text slug
        text address
        text city
        text state
        text maps_url
    }

    events {
        text id PK
        text title
        text description
        text organizer_id FK
        text venue_id FK
        text date
        text start_time
        text end_time
        text price
        text level
        text type
        text rrule
        int is_recurring
    }

    djs {
        text id PK
        text name
        text slug
        text bio
        text instagram
        text website
        text email
    }

    teachers {
        text id PK
        text name
        text slug
        text bio
        text instagram
        text website
        text email
    }

    artists {
        text id PK
        text name
        text slug
        text bio
        text instagram
        text website
        text email
        int points
    }

    event_djs {
        text event_id FK
        text dj_id FK
    }

    event_teachers {
        text event_id FK
        text teacher_id FK
    }

    artist_organizations {
        text artist_id FK
        text organization_id FK
        text role
        int points
    }

    organizers ||--o{ events : "hosts"
    venues ||--o{ events : "holds"
    events ||--o{ event_djs : ""
    djs ||--o{ event_djs : "plays at"
    events ||--o{ event_teachers : ""
    teachers ||--o{ event_teachers : "teaches at"
    artists ||--o{ artist_organizations : ""
    organizations ||--o{ artist_organizations : "has members"
```

## Notes

- **organizers** — the people/groups that run local events (e.g. White Rabbit WCS, Prescott BeatMob)
- **organizations** — governing bodies or regional orgs (e.g. WSDC, regional chapters)
- **djs** — DJs who play at events, linked via `event_djs`
- **teachers** — instructors who teach at events or privately, linked via `event_teachers`
- **artists** — competing dancers; `points` is a running total; `artist_organizations` tracks role + points per org
- **events** — one-time or recurring (RRULE string); linked to one organizer and one venue
