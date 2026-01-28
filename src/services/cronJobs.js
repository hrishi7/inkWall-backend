/**
 * Cron Job Scheduler
 * Automatically fetches new wallpapers from APIs at regular intervals
 * 
 * Strategy:
 * - Run every 2 hours
 * - Pexels: More generous limits (200 req/hr, 80/req)
 * - Unsplash: Limited (50 req/hr, 30/req)
 * - Alternates between pages to get fresh content
 */

import cron from 'node-cron';
import { getCategories, updateCategoryCounts, insertWallpapers, wallpaperExists } from '../services/database.js';
import unsplash from '../services/unsplash.js';
import pexels from '../services/pexels.js';

// Track current page for pagination
let currentPage = {
  unsplash: 1,
  pexels: 1
};

/**
 * Fetch from Pexels with maximum efficiency
 * 80 images per request, multiple pages per category
 */
async function fetchFromPexels(category, page = 1) {
  try {
    const wallpapers = await pexels.searchPhotos(
      category.search_query,
      category.slug,
      page,
      80  // Max per request
    );
    
    // Filter duplicates
    const newWallpapers = wallpapers.filter(
      w => !wallpaperExists(w.external_id, w.source)
    );
    
    if (newWallpapers.length > 0) {
      insertWallpapers(newWallpapers);
    }
    
    return newWallpapers.length;
  } catch (error) {
    console.error(`Pexels error for ${category.slug}:`, error.message);
    return 0;
  }
}

/**
 * Fetch from Unsplash
 * 30 images per request
 */
async function fetchFromUnsplash(category, page = 1) {
  try {
    const wallpapers = await unsplash.searchPhotos(
      category.search_query,
      category.slug,
      page,
      30  // Max per request
    );
    
    // Filter duplicates
    const newWallpapers = wallpapers.filter(
      w => !wallpaperExists(w.external_id, w.source)
    );
    
    if (newWallpapers.length > 0) {
      insertWallpapers(newWallpapers);
    }
    
    return newWallpapers.length;
  } catch (error) {
    console.error(`Unsplash error for ${category.slug}:`, error.message);
    return 0;
  }
}

/**
 * Main cron job function
 * Fetches from both APIs for all categories
 */
export async function runFetchJob() {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 Cron Job Started: ${new Date().toISOString()}`);
  console.log('='.repeat(50));
  
  const categories = getCategories();
  let totalNew = 0;
  
  // Increment pages for variety
  currentPage.pexels = (currentPage.pexels % 10) + 1;
  currentPage.unsplash = (currentPage.unsplash % 5) + 1;
  
  console.log(`📄 Pages: Pexels=${currentPage.pexels}, Unsplash=${currentPage.unsplash}`);
  
  for (const category of categories) {
    console.log(`\n📷 Processing: ${category.name}`);
    
    // Fetch from Pexels (primary - more generous)
    const pexelsCount = await fetchFromPexels(category, currentPage.pexels);
    console.log(`   Pexels: +${pexelsCount} new`);
    totalNew += pexelsCount;
    
    // Small delay to be nice to APIs
    await new Promise(r => setTimeout(r, 500));
    
    // Fetch from Unsplash (secondary)
    const unsplashCount = await fetchFromUnsplash(category, currentPage.unsplash);
    console.log(`   Unsplash: +${unsplashCount} new`);
    totalNew += unsplashCount;
    
    // Delay between categories
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Update category wallpaper counts
  updateCategoryCounts();
  
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Cron Job Complete: Added ${totalNew} new wallpapers`);
  console.log('='.repeat(50) + '\n');
  
  return totalNew;
}

/**
 * Start the cron scheduler
 * Runs every 2 hours
 */
export function startCronJobs() {
  console.log('⏰ Starting cron scheduler...');
  
  // Run every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    try {
      await runFetchJob();
    } catch (error) {
      console.error('❌ Cron job failed:', error.message);
    }
  });
  
  console.log('✅ Cron jobs scheduled:');
  console.log('   - Wallpaper fetch: Every 2 hours');
  
  // Also run immediately on startup (optional)
  // runFetchJob();
}

export default {
  startCronJobs,
  runFetchJob
};
