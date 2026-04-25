import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { RRule } from "rrule";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  address: string;
  price: string;
  level: string;
  type: string;
  organizer: string;
  url?: string;
  instagram?: string;
  website?: string;
  isRecurring?: boolean;
}

interface RecurringRecord extends Omit<CalendarEvent, "date" | "isRecurring"> {
  dtstart: string;
  rrule: string;
  exdates?: string[];
}

interface EventsData {
  recurring: RecurringRecord[];
  single: CalendarEvent[];
}

function expandRecurring(record: RecurringRecord, windowStart: Date, windowEnd: Date): CalendarEvent[] {
  const [y, m, d] = record.dtstart.split("-").map(Number);
  const rule = new RRule({
    ...RRule.parseString(record.rrule),
    dtstart: new Date(Date.UTC(y, m - 1, d)),
  });

  const exdates = new Set(record.exdates ?? []);

  return rule
    .between(windowStart, windowEnd, true)
    .map((dt) => dt.toISOString().slice(0, 10))
    .filter((date) => !exdates.has(date))
    .map((date) => ({ ...record, id: `${record.id}_${date}`, date, isRecurring: true as const }));
}

export async function fetchGoogleCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const jsonPath = join(process.cwd(), "src/data/events.json");
    if (!existsSync(jsonPath)) {
      console.warn("[Calendar] No events.json found. Run 'node scripts/fetch-calendar.js' to populate it.");
      return [];
    }

    const raw = JSON.parse(readFileSync(jsonPath, "utf-8"));

    // Support old flat-array format during transition
    if (Array.isArray(raw)) return raw as CalendarEvent[];

    const { recurring = [], single = [] } = raw as EventsData;

    const now = new Date();
    const windowStart = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 1));
    const windowEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 49)); // 7 weeks out

    const expanded = recurring.flatMap((r) => expandRecurring(r, windowStart, windowEnd));
    const all = [...expanded, ...single].sort((a, b) =>
      a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
    );

    console.log(`[Calendar] ${expanded.length} recurring occurrences + ${single.length} single = ${all.length} total`);
    return all;
  } catch (error) {
    console.error("Error loading calendar events:", error);
    return [];
  }
}
