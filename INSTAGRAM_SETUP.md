# Instagram Feed Setup Guide (2025)

This guide uses the **new Instagram API with Instagram Login** (launched July 2024) - the simplest way to access your Instagram posts.

## What's New?

✅ **NO Facebook Page required** (unlike the old method)
✅ Direct Instagram authentication
✅ Simpler OAuth flow
✅ Same 60-day token validity

---

## Prerequisites

You need:
- An Instagram **Business** or **Creator** account (personal accounts don't work with the API)
- A Facebook/Meta Developer account

---

## Step 1: Convert to Instagram Business Account

1. Open your Instagram app
2. Go to **Settings** → **Account Type and Tools**
3. Tap **Switch to Professional Account**
4. Choose **Business** or **Creator**
5. Complete the setup (you can skip connecting to a Facebook Page - not needed!)

---

## Step 2: Create a Meta Developer App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose **"Business"** as app type (or select "Other" → "Business")
4. Fill in:
   - **App Name**: "White Rabbit WCS Website"
   - **Contact Email**: Your email
5. Click **Create App**

---

## Step 3: Add Instagram Platform Product

1. In your app dashboard, click **Add Product**
2. Find **"Instagram Platform"** (not the old "Instagram" product)
3. Click **Set Up**
4. Select **"Instagram API with Instagram Login"** (NOT "Instagram API with Facebook Login")
5. You'll be taken to the API Setup page

---

## Step 4: Configure OAuth Settings

1. In **Instagram > API Setup with Instagram Login**, find **OAuth Redirect URIs**
2. Add these redirect URIs:
   - For local dev: `http://localhost:4321/api/instagram/callback`
   - For production: `https://whiterabbitwcs.com/api/instagram/callback`
3. Save changes
4. Copy your **Instagram App ID** and **Instagram App Secret** (you'll need these)

---

## Step 5: Get Access Token via OAuth

You need to implement an OAuth flow. Here's the process:

### A. Authorization URL

Direct the user (yourself) to this URL in a browser:

```
https://api.instagram.com/oauth/authorize?client_id={YOUR_APP_ID}&redirect_uri={YOUR_REDIRECT_URI}&scope=instagram_business_basic,instagram_business_content_publish&response_type=code
```

Replace:
- `{YOUR_APP_ID}` with your Instagram App ID from Step 4
- `{YOUR_REDIRECT_URI}` with `https://whiterabbitwcs.com/api/instagram/callback` (must match what you set in Step 4)

**Example:**
```
https://api.instagram.com/oauth/authorize?client_id=123456789&redirect_uri=https://whiterabbitwcs.com/api/instagram/callback&scope=instagram_business_basic,instagram_business_content_publish&response_type=code
```

### B. Authorize the App

1. You'll be redirected to Instagram login
2. Log in with your Business/Creator account
3. Grant permissions
4. You'll be redirected back to your redirect URI with a `code` parameter

**Example redirect:**
```
https://whiterabbitwcs.com/api/instagram/callback?code=AQD...xyz#_
```

Copy the **code** value from the URL.

### C. Exchange Code for Short-Lived Token

Use this `curl` command (replace the placeholders):

```bash
curl -X POST https://api.instagram.com/oauth/access_token \
  -F client_id=YOUR_APP_ID \
  -F client_secret=YOUR_APP_SECRET \
  -F grant_type=authorization_code \
  -F redirect_uri=YOUR_REDIRECT_URI \
  -F code=THE_CODE_FROM_STEP_B
```

**Response:**
```json
{
  "access_token": "IGQWRN...",
  "user_id": 123456789
}
```

Copy both the `access_token` and `user_id`.

### D. Exchange for Long-Lived Token (60 days)

Use this `curl` command:

```bash
curl -X GET "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=YOUR_APP_SECRET&access_token=SHORT_LIVED_TOKEN_FROM_STEP_C"
```

**Response:**
```json
{
  "access_token": "IGQWRN...",
  "token_type": "bearer",
  "expires_in": 5184000
}
```

This is your **long-lived token** that lasts 60 days.

---

## Step 6: Add to Your Site

### For Local Development:

Create a `.env` file in the project root:

```bash
INSTAGRAM_ACCESS_TOKEN=your-long-lived-access-token
INSTAGRAM_USER_ID=your-instagram-user-id
```

### For Cloudflare Pages:

1. Go to your Cloudflare Pages dashboard
2. Select your project
3. Go to **Settings** → **Environment variables**
4. Add variables:
   - **Name:** `INSTAGRAM_ACCESS_TOKEN`
     **Value:** Your long-lived access token
     **Environment:** Production (and Preview if desired)
   - **Name:** `INSTAGRAM_USER_ID`
     **Value:** Your Instagram user ID (from Step 5C)
     **Environment:** Production (and Preview if desired)
5. Save and redeploy

---

## Step 7: Test

1. Start your dev server: `pnpm dev`
2. Visit `http://localhost:4321/`
3. You should see your Instagram feed

### Test the API Manually

You can verify your token works:

```bash
# Get your profile info
curl "https://graph.instagram.com/me?fields=id,username&access_token=YOUR_TOKEN"

# Get your media posts
curl "https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=YOUR_TOKEN"
```

---

## Troubleshooting

**"Instagram API credentials not configured"**
- Make sure `.env` file exists and has both variables
- Restart dev server after creating/updating `.env`

**"Instagram API error: 400 or 401"**
- Access token might be invalid or expired
- Make sure you're using a Business/Creator account (not personal)
- Verify you completed the long-lived token exchange (Step 5D)
- Check that your token hasn't expired (60 days)

**"No posts showing"**
- Check that your Instagram account has public posts
- Verify the User ID is correct (it should be a number)
- Test the API endpoint manually (see Step 7)

**OAuth redirect errors**
- Make sure your redirect URI exactly matches what's configured in the app
- Check for typos in the authorization URL

**Feed works locally but not in production**
- Verify environment variables are set in Cloudflare Pages
- Redeploy after adding environment variables
- Check build logs for errors

---

## API Limits

Instagram API has rate limits:
- **200 calls per hour** per Instagram account
- The site should cache the feed for 1 hour to stay well under limits

---

## Refreshing Access Tokens

Long-lived tokens expire after **60 days**. To avoid downtime:

### Manual Refresh

1. Set a calendar reminder for 50 days from now
2. Repeat Step 5 (OAuth flow) to generate a new token
3. Update the environment variable in Cloudflare Pages
4. Redeploy

### Automatic Refresh (Advanced)

You can implement automatic token refresh by:
1. Using the `ig_refresh_token` grant type before the 60-day expiration
2. Storing the token in a database/KV store instead of environment variables
3. Setting up a scheduled worker to refresh the token every 50 days

**Token refresh endpoint:**
```bash
curl -X GET "https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=CURRENT_LONG_LIVED_TOKEN"
```

This returns a new 60-day token.

---

## Required Scopes

- `instagram_business_basic` - Basic profile information
- `instagram_business_content_publish` - Read and publish content

---

## API Endpoints

Base URL: `https://graph.instagram.com/`

**Get user info:**
```
GET /me?fields=id,username,account_type,media_count
```

**Get media posts:**
```
GET /me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username
```

**Get specific media:**
```
GET /{media_id}?fields=id,caption,media_type,media_url,permalink,timestamp
```

---

## Resources

- [Instagram Platform API Docs](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login)
- [OAuth Authorization](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/authorization)
- [Instagram Graph API Reference](https://developers.facebook.com/docs/instagram-api)

---

## Alternative: Static Embed Method

If this OAuth flow seems too complex, you can use the **static embed approach** instead (see `INSTAGRAM_EMBED.md`):
- No API setup required
- Manually add Instagram post URLs to the component
- Uses Instagram's official embed script
- Perfect for simple, occasional updates
