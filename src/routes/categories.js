import { Router } from 'express';
import { getCategories, getCategoryBySlug } from '../services/database.js';

const router = Router();

/**
 * GET /api/categories
 * Get all categories with wallpaper counts
 */
router.get('/', async (req, res) => {
  try {
    const categories = await getCategories();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch categories' 
    });
  }
});

/**
 * GET /api/categories/:slug
 * Get a single category by slug
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await getCategoryBySlug(slug);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        error: 'Category not found' 
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch category' 
    });
  }
});

export default router;

