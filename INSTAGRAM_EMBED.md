# Instagram Static Embed Guide

This is a simple way to show Instagram posts on your site without needing API access.

## How to Add Posts

1. **Get Post URLs** from Instagram:
   - Go to Instagram on a web browser (not the app)
   - Navigate to the post you want to embed
   - Copy the URL from the address bar
   - It will look like: `https://www.instagram.com/p/ABC123xyz/`

2. **Update the Component**:
   - Open `src/components/InstagramFeed.astro`
   - Find the `instagramPosts` array (around line 4)
   - Add your post URLs:
   ```javascript
   const instagramPosts = [
     'https://www.instagram.com/p/POST_ID_1/',
     'https://www.instagram.com/p/POST_ID_2/',
     'https://www.instagram.com/p/POST_ID_3/',
     'https://www.instagram.com/p/POST_ID_4/',
     'https://www.instagram.com/p/POST_ID_5/',
     'https://www.instagram.com/p/POST_ID_6/',
   ];
   ```

3. **Commit and Deploy**:
   ```bash
   git add src/components/InstagramFeed.astro
   git commit -m "Update Instagram feed posts"
   git push
   ```

## Tips

- **Recommended:** 6 posts for a nice grid on desktop
- **Update regularly:** Change posts monthly or when you have new highlights
- Posts are embedded directly from Instagram, so they'll always show current data (likes, comments, etc.)
- If you delete a post on Instagram, it will break on your site - just remove that URL
- Posts load from Instagram's servers, so they require an internet connection

## Layout

- **Desktop:** 3 columns
- **Mobile:** 1 column (stacked)

The embeds use Instagram's official embed script, so they look and behave like real Instagram posts with captions, likes, comments, etc.

## Example Post Selection

Good posts to feature:
- Event photos with dancers
- Community highlights
- Announcements
- Action shots from socials
- Testimonials or quotes
- "Save the date" graphics

## No API Setup Required!

Unlike the API approach, this method:
- ✅ No Facebook Developer account needed
- ✅ No access tokens to manage
- ✅ No rate limits to worry about
- ✅ Shows full Instagram post experience
- ❌ Requires manual updates
- ❌ Fixed number of posts (not automatic latest)

Perfect for keeping your homepage fresh without API complexity!
