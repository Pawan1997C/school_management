import mongoose from 'mongoose';
const D = /^\d{4}-\d{2}-\d{2}$/;
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  startDate: { type: String, required: true, match: [D, 'Use a valid start date'] },
  endDate: { type: String, match: [D, 'Use a valid end date'] }, // empty = single day
}, { timestamps: true });

schema.pre('validate', function (next) {
  if (!this.endDate) this.endDate = this.startDate;
  if (this.startDate && this.endDate < this.startDate) this.invalidate('endDate', 'End date cannot be before the start date');
  next();
});
export default mongoose.model('Holiday', schema);
