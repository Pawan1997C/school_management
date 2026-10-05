import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  type: { type: String, enum: ['casual', 'sick', 'other'], default: 'casual' },
  fromDate: { type: String, required: true }, // YYYY-MM-DD
  toDate: { type: String, required: true },
  reason: { type: String, required: true, trim: true, maxlength: 500 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewNote: { type: String, trim: true, maxlength: 300 },
  reviewedAt: Date,
}, { timestamps: true });
schema.index({ teacher: 1, fromDate: 1 });
export default mongoose.model('LeaveRequest', schema);
