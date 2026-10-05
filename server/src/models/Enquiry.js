import mongoose from 'mongoose';
export default mongoose.model('Enquiry', new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, trim: true, maxlength: 20 },
  email: { type: String, trim: true, lowercase: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  status: { type: String, enum: ['new', 'read'], default: 'new' },
}, { timestamps: true }));
