import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  takenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  records: [{
    _id: false,
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  }],
}, { timestamps: true });
schema.index({ class: 1, date: 1 }, { unique: true }); // one register per class per day
export default mongoose.model('StudentAttendance', schema);
