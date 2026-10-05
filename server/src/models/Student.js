import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  rollNo: { type: String, required: true, trim: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  guardianName: String,
  guardianPhone: String,
  photo: { url: String, publicId: String },
}, { timestamps: true });
schema.index({ class: 1, rollNo: 1 }, { unique: true });
export default mongoose.model('Student', schema);
