import axios from 'axios';

const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

/**
 * Create Unsplash API client
 */
const unsplashClient = axios.create({
  baseURL: UNSPLASH_BASE_URL,
  headers: {
    'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
    'Accept-Version': 'v1'
  }
});

/**
 * Normalize Unsplash photo to our wallpaper format
 * @param {Object} photo - Unsplash photo object
 * @param {string} category - Category slug
 */
function normalizePhoto(photo, category) {
  return {
    id: `unsplash_${photo.id}`,
    source: 'unsplash',
    external_id: photo.id,
    title: photo.description || photo.alt_description || 'Untitled',
    photographer: photo.user?.name || 'Unknown',
    photographer_url: photo.user?.links?.html || null,
    url_thumb: photo.urls?.thumb || photo.urls?.small,
    url_regular: photo.urls?.regular,
    url_full: photo.urls?.full,
    url_raw: photo.urls?.raw,
    width: photo.width,
    height: photo.height,
    color: photo.color,
    blur_hash: photo.blur_hash,
    category: category,
    tags: JSON.stringify(photo.tags?.map(t => t.title) || []),
    is_featured: 0,
    is_ai_generated: 0
  };
}

/**
 * Search photos by query
 * @param {string} query - Search query
 * @param {string} category - Category slug to assign
 * @param {number} page - Page number
 * @param {number} perPage - Results per page (max 30)
 */
export async function searchPhotos(query, category, page = 1, perPage = 30) {
  try {
    const response = await unsplashClient.get('/search/photos', {
      params: {
        query,
        page,
        per_page: perPage,
        orientation: 'portrait', // Mobile wallpapers should be portrait
        order_by: 'relevant'
      }
    });

    const photos = response.data.results || [];
    return photos.map(photo => normalizePhoto(photo, category));
  } catch (error) {
    console.error('❌ Unsplash search error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get curated/popular photos
 * @param {string} category - Category slug to assign
 * @param {number} page - Page number
 * @param {number} perPage - Results per page
 */
export async function getPopularPhotos(category = null, page = 1, perPage = 30) {
  try {
    const response = await unsplashClient.get('/photos', {
      params: {
        page,
        per_page: perPage,
        order_by: 'popular'
      }
    });

    const photos = response.data || [];
    return photos.map(photo => normalizePhoto(photo, category || 'featured'));
  } catch (error) {
    console.error('❌ Unsplash popular photos error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get a single photo by ID
 * @param {string} photoId - Unsplash photo ID
 */
export async function getPhotoById(photoId) {
  try {
    const response = await unsplashClient.get(`/photos/${photoId}`);
    return normalizePhoto(response.data, null);
  } catch (error) {
    console.error('❌ Unsplash get photo error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Track download (required by Unsplash API guidelines)
 * @param {string} photoId - Unsplash photo ID
 */
export async function trackDownload(photoId) {
  try {
    await unsplashClient.get(`/photos/${photoId}/download`);
    console.log(`📥 Tracked download for ${photoId}`);
  } catch (error) {
    // Don't throw, just log - this is non-critical
    console.error('⚠️ Failed to track download:', error.message);
  }
}

/**
 * Get remaining rate limit info from headers
 */
export function getRateLimitInfo(headers) {
  return {
    remaining: parseInt(headers['x-ratelimit-remaining'] || '0'),
    limit: parseInt(headers['x-ratelimit-limit'] || '50')
  };
}

export default {
  searchPhotos,
  getPopularPhotos,
  getPhotoById,
  trackDownload
};
