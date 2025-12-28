# How to Add Posts to the Website

This guide shows how to add short updates/announcements that appear on the homepage.

## Creating a New Post (Easy Way - GitHub Web Interface)

1. **Go to GitHub**
   - Navigate to: https://github.com/dvnrsn/white-rabbit-wcs
   - Make sure you're logged in

2. **Navigate to Posts Folder**
   - Click on `src` folder
   - Click on `content` folder
   - Click on `posts` folder

3. **Create New Post**
   - Click **Add file** button (top right)
   - Select **Create new file**

4. **Name Your File**
   - Use this format: `YYYY-MM-DD-short-title.md`
   - Examples:
     - `2025-01-20-big-event.md`
     - `2025-02-14-valentines-social.md`
     - `2025-03-01-new-workshop.md`
   - The date determines the order (newest shows first)

5. **Write Your Post**
   ```markdown
   ---
   # Leave this part as-is (optional metadata)
   ---

   Your post content goes here!

   You can use **bold text** for emphasis.

   Add [links like this](https://example.com).

   - Make bullet lists
   - Like this
   - Super easy

   Keep it short and sweet (like a tweet)!
   ```

6. **Preview** (Optional)
   - Click the **Preview** tab to see how it looks

7. **Save Your Post**
   - Scroll down to "Commit changes"
   - Add a description like "Add announcement about Friday social"
   - Click **Commit changes** button

8. **Done!**
   - Your post will appear on the homepage in a few minutes
   - Newest posts show at the top

## Formatting Tips

**Bold Text:**
```markdown
This is **bold** and this is *italic*
```

**Links:**
```markdown
Check out [our Instagram](https://instagram.com/whiterabbit.wcs)
```

**Lists:**
```markdown
What to bring:
- Dance shoes
- Water bottle
- Good vibes
```

**Emojis:**
```markdown
Big event tonight! 🎉💃🕺
```

## Post Ideas

Good things to post:
- Event announcements
- Last-minute updates
- Shoutouts to the community
- Upcoming workshop info
- "Save the date" reminders
- Dance tips or quotes
- Photos from recent events (use markdown image syntax)

## Examples

**Event Announcement:**
```markdown
---
---

**Friday Night Social** is this week! 🐇

Join us at The Imperial Ballroom for our biggest dance yet.

📅 Friday, Jan 24th
⏰ 8pm - midnight
💵 $15 at the door

[Get tickets](https://example.com)
```

**Quick Update:**
```markdown
---
---

Venue change! Tonight's social moved to Phoenix Dance Studio due to AC issues.

Same time, just a different spot. See you there! 💃
```

**Community Shoutout:**
```markdown
---
---

Huge thanks to everyone who came out last Friday!

**200+ dancers** made it our biggest social ever. You all are amazing! 🙌
```

## Editing or Deleting Posts

**To Edit:**
1. Navigate to the post file on GitHub
2. Click the pencil icon (top right)
3. Make your changes
4. Commit changes

**To Delete:**
1. Navigate to the post file on GitHub
2. Click the trash icon (top right)
3. Commit the deletion

## Tips

- **Keep posts short** - Think Twitter length (1-3 short paragraphs)
- **Date in filename matters** - This determines the order
- **Latest 5 posts show** - Older posts automatically hide
- **Markdown is forgiving** - Don't worry about perfect formatting
- **Preview before committing** - Use GitHub's preview tab

## Troubleshooting

**Post not showing up?**
- Check the filename format is correct: `YYYY-MM-DD-something.md`
- Make sure the file is in `src/content/posts/` folder
- Wait a few minutes for the site to rebuild

**Formatting looks weird?**
- Check your markdown syntax
- Make sure you have the `---` lines at the top
- Use the Preview tab on GitHub to check before committing

**Need help?**
- Ask someone technical to check the file
- You can always delete and recreate the post
- Markdown mistakes won't break the site!
