import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  icon: String,
  color: String,
  wallpaper_count: {
    type: Number,
    default: 0
  },
  cover_image_url: String,
  search_query: String
}, {
  timestamps: false, // We'll handle updates manually if needed
  versionKey: false
});

const Category = mongoose.model('Category', categorySchema);

export default Category;
