CREATE TABLE organizers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  instagram TEXT,
  website TEXT,
  email TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE venues (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  maps_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE teachers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  instagram TEXT,
  website TEXT,
  email TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE artists (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  instagram TEXT,
  website TEXT,
  email TEXT,
  points INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  title TEXT NOT NULL,
  description TEXT,
  organizer_id TEXT REFERENCES organizers(id),
  venue_id TEXT REFERENCES venues(id),
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  price TEXT,
  level TEXT,
  type TEXT DEFAULT 'social',
  rrule TEXT,
  is_recurring INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_organizer ON events(organizer_id);
