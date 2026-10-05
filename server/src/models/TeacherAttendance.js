import mongoose from 'mongoose';
const point = { lat: Number, lng: Number, accuracy: Number };
const schema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD in the school's timezone
  checkInAt: { type: Date, required: true },
  location: point,
  distanceFromSchool: Number, // metres, computed on the server
  status: { type: String, enum: ['present', 'late'], required: true },
  checkOutAt: Date,
  checkOutLocation: point,
  checkOutDistance: Number,
}, { timestamps: true });
schema.index({ teacher: 1, date: 1 }, { unique: true });
export default mongoose.model('TeacherAttendance', schema);
