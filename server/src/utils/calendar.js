import Holiday from '../models/Holiday.js';

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const weekdayOf = (date) => DAY[new Date(`${date}T00:00:00Z`).getUTCDay()];
export const daysBetween = (a, b) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000) + 1;

// Weekly off day or listed holiday -> { name }, otherwise null
export const holidayOn = async (date, settings) => {
  const wk = weekdayOf(date);
  if ((settings.weeklyOff || []).includes(wk)) return { name: `Weekly off (${wk})` };
  const h = await Holiday.findOne({ startDate: { $lte: date }, endDate: { $gte: date } });
  return h ? { name: h.name } : null;
};
