import { Router } from 'express';
import { 
  getWallpapers, 
  getWallpaperById, 
  getWallpaperCount,
  incrementDownloadCount,
  getSimilarWallpapers
} from '../services/database.js';
import unsplash from '../services/unsplash.js';

const router = Router();

/**
 * GET /api/wallpapers
 * Get paginated list of wallpapers
 * Query params: page, limit, category, sort
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50); // Max 50
    const category = req.query.category || null;
    const sort = req.query.sort || 'popular'; // popular, newest, random
    
    const wallpapers = await getWallpapers({ page, limit, category, sort });
    const total = await getWallpaperCount(category);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: wallpapers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching wallpapers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch wallpapers' 
    });
  }
});

/**
 * GET /api/wallpapers/category/:slug
 * Get wallpapers by category
 */
router.get('/category/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const sort = req.query.sort || 'popular';
    
    const wallpapers = await getWallpapers({ page, limit, category: slug, sort });
    const total = await getWallpaperCount(slug);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: wallpapers,
      category: slug,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching category wallpapers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch wallpapers' 
    });
  }
});

/**
 * GET /api/wallpapers/:id
 * Get a single wallpaper by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const wallpaper = await getWallpaperById(id);
    
    if (!wallpaper) {
      return res.status(404).json({ 
        success: false, 
        error: 'Wallpaper not found' 
      });
    }
    
    res.json({
      success: true,
      data: wallpaper
    });
  } catch (error) {
    console.error('Error fetching wallpaper:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch wallpaper' 
    });
  }
});

/**
 * POST /api/wallpapers/:id/download
 * Track a download (increment count)
 */
router.post('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    const wallpaper = await getWallpaperById(id);
    
    if (!wallpaper) {
      return res.status(404).json({ 
        success: false, 
        error: 'Wallpaper not found' 
      });
    }
    
    // Increment local download count
    await incrementDownloadCount(id);
    
    // Track download with Unsplash (if from Unsplash)
    if (wallpaper.source === 'unsplash' && wallpaper.external_id) {
      await unsplash.trackDownload(wallpaper.external_id);
    }
    
    res.json({
      success: true,
      message: 'Download tracked',
      downloadUrl: wallpaper.url_full
    });
  } catch (error) {
    console.error('Error tracking download:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to track download' 
    });
  }
});

/**
 * GET /api/wallpapers/:id/similar
 * Get similar wallpapers (same category)
 */
router.get('/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    
    const wallpaper = await getWallpaperById(id);
    
    if (!wallpaper) {
      return res.status(404).json({ 
        success: false, 
        error: 'Wallpaper not found' 
      });
    }
    
    const similarWallpapers = await getSimilarWallpapers(id, wallpaper.category, limit);
    
    res.json({
      success: true,
      data: similarWallpapers
    });
  } catch (error) {
    console.error('Error fetching similar wallpapers:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch similar wallpapers' 
    });
  }
});

export default router;

