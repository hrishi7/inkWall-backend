import { getCategories } from '../services/database.js';
import unsplash from '../services/unsplash.js';
import pexels from '../services/pexels.js';
import { insertWallpapers, wallpaperExists, updateCategoryCounts } from '../services/database.js';

/**
 * Fetch wallpapers for a specific category
 * @param {Object} category - Category object with slug and search_query
 * @param {number} perPage - Number of wallpapers to fetch
 */
async function fetchCategoryWallpapers(category, perPage = 30) {
  console.log(`\n📷 Fetching wallpapers for: ${category.name}`);
  
  let wallpapers = [];
  
  try {
    // Try Unsplash first (primary source)
    wallpapers = await unsplash.searchPhotos(
      category.search_query,
      category.slug,
      1,
      perPage
    );
    console.log(`  ✅ Got ${wallpapers.length} from Unsplash`);
  } catch (error) {
    console.log(`  ⚠️ Unsplash failed, trying Pexels...`);
    
    try {
      // Fallback to Pexels
      wallpapers = await pexels.searchPhotos(
        category.search_query,
        category.slug,
        1,
        perPage
      );
      console.log(`  ✅ Got ${wallpapers.length} from Pexels`);
    } catch (pexelsError) {
      console.error(`  ❌ Both APIs failed for ${category.name}`);
      return 0;
    }
  }
  
  // Filter out existing wallpapers (Async check)
  const newWallpapers = [];
  for (const w of wallpapers) {
    const exists = await wallpaperExists(w.external_id, w.source);
    if (!exists) {
      newWallpapers.push(w);
    }
  }
  
  if (newWallpapers.length > 0) {
    await insertWallpapers(newWallpapers);
    console.log(`  💾 Saved ${newWallpapers.length} new wallpapers`);
  } else {
    console.log(`  ℹ️ No new wallpapers to save`);
  }
  
  return newWallpapers.length;
}

/**
 * Fetch wallpapers for all categories
 * This is the main cron job function
 */
export async function fetchAllCategoryWallpapers() {
  console.log('\n🚀 Starting wallpaper fetch job...');
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  
  const categories = await getCategories();
  let totalNew = 0;
  
  for (const category of categories) {
    try {
      const count = await fetchCategoryWallpapers(category, 20);
      totalNew += count;
      
      // Small delay between categories to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error fetching ${category.name}:`, error.message);
    }
  }
  
  // Update category counts
  await updateCategoryCounts();
  
  console.log(`\n✅ Fetch job complete! Added ${totalNew} new wallpapers.`);
  return totalNew;
}

/**
 * Fetch featured/popular wallpapers (no category filter)
 */
export async function fetchFeaturedWallpapers() {
  console.log('\n⭐ Fetching featured wallpapers...');
  
  try {
    const wallpapers = await unsplash.getPopularPhotos('featured', 1, 30);
    
    // Mark as featured
    const candidates = wallpapers.map(w => ({ ...w, is_featured: true }));
    
    // Async filter duplicates
    const newWallpapers = [];
    for (const w of candidates) {
      const exists = await wallpaperExists(w.external_id, w.source);
      if (!exists) {
        newWallpapers.push(w);
      }
    }
    
    if (newWallpapers.length > 0) {
      await insertWallpapers(newWallpapers);
      console.log(`💾 Saved ${newWallpapers.length} featured wallpapers`);
    }
    
    return newWallpapers.length;
  } catch (error) {
    console.error('❌ Failed to fetch featured:', error.message);
    return 0;
  }
}

/**
 * Initial seed: fetch wallpapers for all categories + featured
 */
export async function seedDatabase() {
  console.log('\n🌱 Seeding database with initial wallpapers...\n');
  
  await fetchFeaturedWallpapers();
  await fetchAllCategoryWallpapers();
  
  console.log('\n🎉 Database seeding complete!');
}

export default {
  fetchAllCategoryWallpapers,
  fetchFeaturedWallpapers,
  seedDatabase
};

