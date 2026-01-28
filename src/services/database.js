import Wallpaper from '../models/Wallpaper.js';
import Category from '../models/Category.js';

/**
 * Initialize the database
 * For MongoDB, this is just a placeholder or could handle initial connection checks if needed.
 * The actual connection is handled in index.js
 */
export async function initializeDatabase() {
  console.log('✅ Database service initialized');
  // Initial category seed check could go here if we wanted to be robust
  const count = await Category.countDocuments();
  if (count === 0) {
    console.log('⚠️ No categories found, seeding defaults...');
    const defaultCategories = [
      { slug: 'nature', name: 'Nature', icon: '🌿', color: '#22c55e', search_query: 'nature landscape mountains forest' },
      { slug: 'wildlife', name: 'Wildlife', icon: '🦁', color: '#f59e0b', search_query: 'wildlife animals lion tiger' },
      { slug: 'abstract', name: 'Abstract', icon: '🎨', color: '#8b5cf6', search_query: 'abstract art patterns colorful' },
      { slug: 'anime', name: 'Anime & Cartoons', icon: '🧸', color: '#ec4899', search_query: 'anime cartoon illustration art' },
      { slug: 'city', name: 'City & Urban', icon: '🏙️', color: '#6366f1', search_query: 'city urban architecture skyline' },
      { slug: 'space', name: 'Space & Galaxy', icon: '🌌', color: '#1e3a8a', search_query: 'space galaxy stars nebula cosmos' },
      { slug: 'minimal', name: 'Minimal', icon: '🌸', color: '#f43f5e', search_query: 'minimal aesthetic simple clean' },
      { slug: 'gaming', name: 'Gaming', icon: '🎮', color: '#10b981', search_query: 'gaming esports neon cyberpunk' }
    ];
    await Category.insertMany(defaultCategories);
    console.log('✅ Default categories seeded');
  }
}

/**
 * Get all categories with wallpaper counts
 */
export async function getCategories() {
  return Category.find().sort({ name: 1 }).lean();
}

/**
 * Get wallpapers with pagination
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (1-indexed)
 * @param {number} options.limit - Items per page
 * @param {string} options.category - Optional category filter
 * @param {string} options.sort - Sort by: 'popular', 'newest', 'random'
 */
export async function getWallpapers({ page = 1, limit = 20, category = null, sort = 'popular' }) {
  // If sort is random, use aggregation pipeline
  if (sort === 'random') {
    const pipeline = [];
    
    // Match stage
    if (category) {
      pipeline.push({ $match: { category } });
    }
    
    // Sample stage (Random selection)
    // Note: $sample can be slow on very large collections (millions), but fine here
    // For pagination effectively with random, we'd need a seed, but basic $sample 
    // works for "refresh to get new random"
    pipeline.push({ $sample: { size: limit } });
    
    return Wallpaper.aggregate(pipeline);
  }

  // Standard query for non-random sorts
  const query = {};
  
  if (category) {
    query.category = category;
  }
  
  let sortOption = {};
  
  switch (sort) {
    case 'newest':
      sortOption = { created_at: -1 };
      break;
    case 'popular':
    default:
      sortOption = { downloads: -1, created_at: -1 };
  }
  
  const skip = (page - 1) * limit;
  
  return Wallpaper.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();
}

/**
 * Get total wallpaper count (for pagination)
 */
export async function getWallpaperCount(category = null) {
  const query = {};
  if (category) {
    query.category = category;
  }
  return Wallpaper.countDocuments(query);
}

/**
 * Get a single wallpaper by ID
 */
export async function getWallpaperById(id) {
  return Wallpaper.findById(id).lean();
}

/**
 * Insert a new wallpaper
 */
export async function insertWallpaper(wallpaperData) {
  // Ensure _id is set if provided, else Mongoose generates one (but we want to use the one passed if any)
  if (wallpaperData.id) {
    wallpaperData._id = wallpaperData.id;
    delete wallpaperData.id;
  }
  
  // Handle tags if they come as JSON string
  if (typeof wallpaperData.tags === 'string') {
    try {
      wallpaperData.tags = JSON.parse(wallpaperData.tags);
    } catch (e) {
      wallpaperData.tags = [];
    }
  }

  return Wallpaper.findOneAndUpdate(
    { _id: wallpaperData._id },
    wallpaperData,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

/**
 * Insert multiple wallpapers
 */
export async function insertWallpapers(wallpapers) {
  const bulkOps = wallpapers.map(w => {
    // Fix ID mapping
    const doc = { ...w };
    if (doc.id) {
      doc._id = doc.id;
      delete doc.id;
    }
    // Fix tags
    if (typeof doc.tags === 'string') {
      try {
        doc.tags = JSON.parse(doc.tags);
      } catch (e) {
        doc.tags = [];
      }
    }
    
    return {
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: doc },
        upsert: true
      }
    };
  });
  
  if (bulkOps.length > 0) {
    await Wallpaper.bulkWrite(bulkOps);
    console.log(`✅ Inserted/Updated ${wallpapers.length} wallpapers`);
  }
}

/**
 * Increment download count for a wallpaper
 */
export async function incrementDownloadCount(id) {
  return Wallpaper.findByIdAndUpdate(id, { $inc: { downloads: 1 } });
}

/**
 * Check if wallpaper exists by external ID and source
 */
export async function wallpaperExists(externalId, source) {
  const count = await Wallpaper.countDocuments({ external_id: externalId, source: source });
  return count > 0;
}

/**
 * Get featured wallpapers
 */
export async function getFeaturedWallpapers(limit = 10) {
  return Wallpaper.find({ is_featured: true })
    .sort({ downloads: -1 })
    .limit(limit)
    .lean();
}

/**
 * Update category wallpaper counts
 */
export async function updateCategoryCounts() {
  const categories = await Category.find();
  
  for (const cat of categories) {
    const count = await Wallpaper.countDocuments({ category: cat.slug });
    await Category.updateOne({ _id: cat._id }, { wallpaper_count: count });
  }
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(slug) {
  return Category.findOne({ slug }).lean();
}

/**
 * Get similar wallpapers (same category)
 */
export async function getSimilarWallpapers(wallpaperId, category, limit = 10) {
  // Using aggregation $sample for random selection which is efficient enough here
  return Wallpaper.aggregate([
    { $match: { category: category, _id: { $ne: wallpaperId } } },
    { $sample: { size: limit } }
  ]);
}

export default {
  initializeDatabase,
  getCategories,
  getWallpapers,
  getWallpaperCount,
  getWallpaperById,
  insertWallpaper,
  insertWallpapers,
  incrementDownloadCount,
  wallpaperExists,
  getFeaturedWallpapers,
  updateCategoryCounts,
  getCategoryBySlug,
  getSimilarWallpapers
};


