import mongoose from 'mongoose';

const wallpaperSchema = new mongoose.Schema({
  _id: {
    type: String, // Overriding _id to use our own ID format (nano ID or from external source)
    required: true
  },
  source: {
    type: String,
    required: true,
    enum: ['unsplash', 'pexels', 'gemini'],
    index: true
  },
  external_id: {
    type: String,
    index: true
  },
  title: String,
  photographer: String,
  photographer_url: String,
  
  // Image URLs
  url_thumb: { type: String, required: true },
  url_regular: { type: String, required: true },
  url_full: { type: String, required: true },
  url_raw: String,
  
  // Metadata
  width: Number,
  height: Number,
  color: String,
  blur_hash: String,
  
  // Categorization
  category: {
    type: String,
    index: true,
    ref: 'Category', // Loose reference usually, but good to document
    localField: 'category',
    foreignField: 'slug'
  },
  tags: [String], // Array of strings
  
  // Stats
  downloads: {
    type: Number,
    default: 0,
    index: -1 // Descending index
  },
  is_featured: {
    type: Boolean,
    default: false,
    index: true
  },
  is_ai_generated: {
    type: Boolean,
    default: false
  },
  
  fetched_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  versionKey: false
});

// Compound index for unique external items
wallpaperSchema.index({ external_id: 1, source: 1 }, { unique: true });

const Wallpaper = mongoose.model('Wallpaper', wallpaperSchema);

export default Wallpaper;
