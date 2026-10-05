import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  marks: { type: Number, min: 0, default: null },
  absent: { type: Boolean, default: false },
}, { timestamps: true });
schema.index({ exam: 1, student: 1 }, { unique: true });
export default mongoose.model('Mark', schema);
