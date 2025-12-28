# Instagram Feed Setup Guide

Follow these steps to connect your Instagram feed to the White Rabbit WCS site.

## Prerequisites

You need:
- An Instagram **Business** or **Creator** account (personal accounts won't work)
- A Facebook Page connected to your Instagram account
- A Facebook Developer account

## Step 1: Convert to Instagram Business Account

1. Open your Instagram app
2. Go to **Settings** → **Account**
3. Tap **Switch to Professional Account**
4. Choose **Business** or **Creator**
5. Connect to your Facebook Page (create one if needed)

## Step 2: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose **Business** as app type
4. Fill in:
   - **App Name**: "White Rabbit WCS Website"
   - **Contact Email**: Your email
5. Click **Create App**

## Step 3: Add Instagram Graph API

1. In your app dashboard, click **Add Product**
2. Find **Instagram** and click **Set Up**
3. Click **Settings** under Instagram in the left menu
4. Add **Instagram Graph API** if not already added

## Step 4: Get Your User ID

1. In your app, go to **Tools** → **Graph API Explorer**
2. Click **Generate Access Token**
3. Select your Instagram account
4. Grant permissions:
   - `instagram_basic`
   - `pages_show_list`
   - `pages_read_engagement`
5. Copy the **Access Token** that appears
6. In the Graph API Explorer, make a request to `me/accounts`
7. Find your page and copy the **Instagram Business Account ID**

## Step 5: Generate Long-Lived Access Token

Short-lived tokens expire in 1 hour. You need a long-lived token (60 days):

1. Go to [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
2. Paste your access token
3. Click **Extend Access Token**
4. Copy the new long-lived token

Note: You'll need to refresh this every 60 days, or set up automatic refresh.

## Step 6: Add to Your Site

### For Local Development:

Create a `.env` file in the project root:

```bash
INSTAGRAM_ACCESS_TOKEN=your-long-lived-access-token
INSTAGRAM_USER_ID=your-instagram-business-account-id
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
     **Value:** Your Instagram Business Account ID
     **Environment:** Production (and Preview if desired)
5. Save and redeploy

## Step 7: Test

1. Start your dev server: `pnpm dev`
2. Visit `http://localhost:4321/`
3. You should see your Instagram feed at the bottom of the homepage
4. If you see "See our latest updates on Instagram" instead, check:
   - Environment variables are set correctly
   - Access token is valid (check in Access Token Debugger)
   - Instagram account is a Business/Creator account
   - App has proper permissions

## Troubleshooting

**"Instagram API credentials not configured"**
- Make sure `.env` file exists and has both variables
- Restart dev server after creating/updating `.env`

**"Instagram API error: 400"**
- Access token might be invalid or expired
- Generate a new long-lived token
- Make sure you're using a Business/Creator account

**"No posts showing"**
- Check that your Instagram account has public posts
- Verify the User ID is correct (it should be a number)
- Check API Explorer to make sure token has proper permissions

**Feed works locally but not in production**
- Verify environment variables are set in Cloudflare Pages
- Redeploy after adding environment variables
- Check build logs for errors

## API Limits

Instagram Graph API has rate limits:
- 200 calls per hour per user
- The site caches feed for 1 hour, so you should be well under limits

## Refreshing Access Tokens

Long-lived tokens expire after 60 days. To avoid downtime:

1. Set a calendar reminder for 50 days from now
2. Generate a new long-lived token following Step 5
3. Update the environment variable in Cloudflare Pages
4. Redeploy

For automatic refresh, you'd need to implement token refresh logic (more complex).
