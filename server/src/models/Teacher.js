import mongoose from 'mongoose';
export default mongoose.model('Teacher', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: String,
  employeeId: String,
  designation: { type: String, trim: true, maxlength: 80 },
  qualification: { type: String, trim: true, maxlength: 120 },
  bio: { type: String, trim: true, maxlength: 400 },
  showOnWebsite: { type: Boolean, default: true },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  photo: { url: String, publicId: String },
}, { timestamps: true }));
