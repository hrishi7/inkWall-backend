import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

import { initializeDatabase } from './services/database.js';
import wallpapersRouter from './routes/wallpapers.js';
import categoriesRouter from './routes/categories.js';
import { fetchAllCategoryWallpapers, seedDatabase } from './jobs/fetchWallpapers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, '../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 1080;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/wallpapers', wallpapersRouter);
app.use('/api/categories', categoriesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

import mongoose from 'mongoose';

// Initialize database
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env');
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('📦 Connected to MongoDB');
    initializeDatabase();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });


// Schedule cron jobs for wallpaper fetching
// Runs every 2 hours for maximum content
cron.schedule('0 */2 * * *', async () => {
  console.log('\n⏰ Scheduled wallpaper fetch starting...');
  await fetchAllCategoryWallpapers();
});

// Start server
app.listen(PORT, async () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🖼️  WallCraft API Server                        ║
║                                                   ║
║   Running on: http://localhost:${PORT}              ║
║                                                   ║
║   Endpoints:                                      ║
║   • GET  /api/health                              ║
║   • GET  /api/wallpapers                          ║
║   • GET  /api/wallpapers/:id                      ║
║   • GET  /api/wallpapers/category/:slug           ║
║   • POST /api/wallpapers/:id/download             ║
║   • GET  /api/categories                          ║
║   • GET  /api/categories/:slug                    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
  
  // Check if API keys are configured
  if (!process.env.UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY.includes('your_')) {
    console.log('⚠️  Warning: UNSPLASH_ACCESS_KEY not configured');
    console.log('   Copy .env.example to .env and add your API keys\n');
  }
  
  if (!process.env.PEXELS_API_KEY || process.env.PEXELS_API_KEY.includes('your_')) {
    console.log('⚠️  Warning: PEXELS_API_KEY not configured\n');
  }
});

export default app;
