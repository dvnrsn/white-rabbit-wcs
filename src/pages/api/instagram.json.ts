import type { APIRoute } from 'astro';
import { fetchInstagramPosts } from '../../lib/instagram';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const posts = await fetchInstagramPosts(6);

    return new Response(JSON.stringify(posts), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // Cache for 1 hour
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);

    return new Response(
      JSON.stringify({ error: 'Failed to fetch Instagram posts' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
