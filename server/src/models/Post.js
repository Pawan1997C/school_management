import mongoose from 'mongoose';
export default mongoose.model('Post', new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  type: { type: String, enum: ['news', 'event'], default: 'news' },
  date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'Use a valid date'] }, // event date or publish date
  body: { type: String, trim: true, maxlength: 3000 },
  image: { url: String, publicId: String },
}, { timestamps: true }));
