export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  timestamp: string;
}

const ACCESS_TOKEN = import.meta.env.INSTAGRAM_ACCESS_TOKEN;
const USER_ID = import.meta.env.INSTAGRAM_USER_ID;

export async function fetchInstagramPosts(limit: number = 6): Promise<InstagramPost[]> {
  if (!ACCESS_TOKEN || !USER_ID) {
    console.warn('Instagram API credentials not configured');
    return [];
  }

  try {
    const fields = 'id,caption,media_type,media_url,permalink,timestamp';
    const url = `https://graph.instagram.com/${USER_ID}/media?fields=${fields}&limit=${limit}&access_token=${ACCESS_TOKEN}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    return [];
  }
}
