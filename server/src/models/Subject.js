import mongoose from 'mongoose';
export default mongoose.model('Subject', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
}, { timestamps: true }));
