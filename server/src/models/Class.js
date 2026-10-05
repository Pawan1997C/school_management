import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },     // e.g. "Grade 8"
  section: { type: String, required: true, trim: true },  // e.g. "A"
}, { timestamps: true });
schema.index({ name: 1, section: 1 }, { unique: true });
export default mongoose.model('Class', schema);
