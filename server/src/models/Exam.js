import mongoose from 'mongoose';
export default mongoose.model('Exam', new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // e.g. "Mid-term"
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  date: { type: String, required: true, match: [/^\d{4}-\d{2}-\d{2}$/, 'Use a valid exam date'] }, // YYYY-MM-DD
  maxMarks: { type: Number, required: true, min: 1 },
  paper: { url: String, publicId: String, resourceType: String, fileName: String },
}, { timestamps: true }));
