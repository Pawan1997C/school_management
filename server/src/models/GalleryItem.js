import mongoose from 'mongoose';
export default mongoose.model('GalleryItem', new mongoose.Schema({
  image: { url: { type: String, required: true }, publicId: String },
  caption: { type: String, trim: true, maxlength: 140 },
  category: { type: String, trim: true, default: 'General', maxlength: 40 },
}, { timestamps: true }));
