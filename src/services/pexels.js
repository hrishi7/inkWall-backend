import axios from 'axios';

const PEXELS_BASE_URL = 'https://api.pexels.com/v1';

/**
 * Create Pexels API client
 */
const pexelsClient = axios.create({
  baseURL: PEXELS_BASE_URL,
  headers: {
    'Authorization': process.env.PEXELS_API_KEY
  }
});

/**
 * Normalize Pexels photo to our wallpaper format
 * @param {Object} photo - Pexels photo object
 * @param {string} category - Category slug
 */
function normalizePhoto(photo, category) {
  return {
    id: `pexels_${photo.id}`,
    source: 'pexels',
    external_id: String(photo.id),
    title: photo.alt || 'Untitled',
    photographer: photo.photographer || 'Unknown',
    photographer_url: photo.photographer_url || null,
    url_thumb: photo.src?.tiny || photo.src?.small,
    url_regular: photo.src?.large || photo.src?.medium,
    url_full: photo.src?.large2x || photo.src?.original,
    url_raw: photo.src?.original,
    width: photo.width,
    height: photo.height,
    color: photo.avg_color,
    blur_hash: null, // Pexels doesn't provide blur hash
    category: category,
    tags: JSON.stringify([]), // Pexels doesn't provide tags in search
    is_featured: 0,
    is_ai_generated: 0
  };
}

/**
 * Search photos by query
 * @param {string} query - Search query
 * @param {string} category - Category slug to assign
 * @param {number} page - Page number
 * @param {number} perPage - Results per page (max 80)
 */
export async function searchPhotos(query, category, page = 1, perPage = 30) {
  try {
    const response = await pexelsClient.get('/search', {
      params: {
        query,
        page,
        per_page: perPage,
        orientation: 'portrait' // Mobile wallpapers
      }
    });

    const photos = response.data.photos || [];
    return photos.map(photo => normalizePhoto(photo, category));
  } catch (error) {
    console.error('❌ Pexels search error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get curated photos
 * @param {string} category - Category slug to assign
 * @param {number} page - Page number
 * @param {number} perPage - Results per page
 */
export async function getCuratedPhotos(category = null, page = 1, perPage = 30) {
  try {
    const response = await pexelsClient.get('/curated', {
      params: {
        page,
        per_page: perPage
      }
    });

    const photos = response.data.photos || [];
    return photos.map(photo => normalizePhoto(photo, category || 'featured'));
  } catch (error) {
    console.error('❌ Pexels curated photos error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get a single photo by ID
 * @param {string} photoId - Pexels photo ID
 */
export async function getPhotoById(photoId) {
  try {
    const response = await pexelsClient.get(`/photos/${photoId}`);
    return normalizePhoto(response.data, null);
  } catch (error) {
    console.error('❌ Pexels get photo error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get remaining rate limit info from headers
 */
export function getRateLimitInfo(headers) {
  return {
    remaining: parseInt(headers['x-ratelimit-remaining'] || '0'),
    limit: parseInt(headers['x-ratelimit-limit'] || '200')
  };
}

export default {
  searchPhotos,
  getCuratedPhotos,
  getPhotoById
};
