# Google Calendar Setup Guide

Follow these steps to connect your Google Calendar to the White Rabbit WCS site.

## Step 1: Create a Google Calendar

1. Go to [Google Calendar](https://calendar.google.com)
2. Click the **+** next to "Other calendars"
3. Select **Create new calendar**
4. Name it "White Rabbit WCS Events"
5. Click **Create calendar**

## Step 2: Make Calendar Public

1. Find your calendar in the left sidebar
2. Click the **⋮** (three dots) next to it
3. Select **Settings and sharing**
4. Scroll to **Access permissions**
5. Check **"Make available to public"**
6. ⚠️ Important: Only check "See all event details" (NOT "Make changes to events")

## Step 3: Get Your Calendar ID

1. Still in Settings, scroll down to **Integrate calendar**
2. Copy the **Calendar ID** (looks like: `abc123@group.calendar.google.com`)

## Step 4: Add Calendar ID to Your Site

### For Local Development:
1. Create a `.env` file in the project root (if it doesn't exist)
2. Add this line:
   ```
   PUBLIC_GOOGLE_CALENDAR_ID=your-calendar-id@group.calendar.google.com
   ```
3. Replace with your actual calendar ID

### For Cloudflare Pages:
1. Go to your Cloudflare Pages dashboard
2. Select your project
3. Go to **Settings** → **Environment variables**
4. Add variable:
   - **Name:** `PUBLIC_GOOGLE_CALENDAR_ID`
   - **Value:** Your calendar ID
   - **Environment:** Production (and Preview if desired)
5. Save and redeploy

## Step 5: Share Edit Access

To let others add/edit events:

1. In Calendar Settings → **Share with specific people**
2. Click **Add people**
3. Enter their email addresses
4. Set permission to **"Make changes to events"**
5. Click **Send**

They can now edit the calendar, but the public can only view!

## Step 6: Adding Events

When creating events in Google Calendar, you can add custom fields in the description:

```
Your event description here.

Venue: Phoenix Dance Studio
Price: $15
Level: All Levels
Type: social
Organizer: White Rabbit WCS
URL: https://example.com/event
```

### Field Options:

- **Venue:** Location name
- **Price:** Event cost (e.g., "$15", "Free", "$80 (4 weeks)")
- **Level:** Beginner, Intermediate, Advanced, All Levels
- **Type:** social, workshop, competition
- **Organizer:** Who's hosting
- **URL:** Link for more info or registration

The site will automatically parse these fields and display them nicely!

## Troubleshooting

**Events not showing up?**
- Make sure calendar is set to public
- Check that Calendar ID is correct in environment variables
- Redeploy your site after adding the environment variable
- Wait ~5 minutes for cache to clear

**Missing custom fields?**
- Make sure you're using the exact field names (Venue:, Price:, etc.)
- Each field should be on its own line
- Use the format: `Field: Value`
