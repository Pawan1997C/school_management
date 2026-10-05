import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], required: true },
  period: { type: Number, min: 1, max: 12, required: true },
}, { timestamps: true });
// A teacher can't be in two places, and a class can't have two teachers, in the same slot
schema.index({ teacher: 1, day: 1, period: 1 }, { unique: true });
schema.index({ class: 1, day: 1, period: 1 }, { unique: true });
export default mongoose.model('PeriodAssignment', schema);
