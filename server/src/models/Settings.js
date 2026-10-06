import mongoose from 'mongoose';

export const DEFAULT_PERIODS = [
  { number: 1, start: '08:30', end: '09:15' }, { number: 2, start: '09:15', end: '10:00' },
  { number: 3, start: '10:00', end: '10:45' }, { number: 4, start: '10:45', end: '11:30' },
  { number: 5, start: '12:00', end: '12:45' }, { number: 6, start: '12:45', end: '13:30' },
  { number: 7, start: '13:30', end: '14:15' }, { number: 8, start: '14:15', end: '15:00' },
];
export const THEME_IDS = ['royal', 'emerald', 'crimson', 'violet', 'ocean', 'slate'];
const period = new mongoose.Schema({ number: Number, start: String, end: String }, { _id: false });

export default mongoose.model('Settings', new mongoose.Schema({
  schoolName: { type: String, default: 'School Manager', trim: true },
  logo: { url: String, publicId: String },
  school: { lat: Number, lng: Number },
  radiusMeters: { type: Number, default: 150 },
  lateAfter: { type: String, default: '09:00' }, // HH:MM
  checkOutFrom: { type: String, default: '14:00' }, // check-in closes and check-out opens
  passPercent: { type: Number, default: 33 },
  timezone: { type: String, default: 'Asia/Kolkata' },
  weeklyOff: { type: [String], default: ['Sun'] },
  theme: { site: { type: String, enum: THEME_IDS, default: 'royal' }, admin: { type: String, enum: THEME_IDS, default: 'royal' } },
  periods: { type: [period], default: () => DEFAULT_PERIODS.map((p) => ({ ...p })) },
}));
