// Pure helpers for monthly attendance reports (no imports, easy to test).
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekday = (d) => DAY[new Date(`${d}T00:00:00Z`).getUTCDay()];

export const round1 = (n) => Math.round(n * 10) / 10;
export const pctOf = (attended, base) => (base > 0 ? round1((attended / base) * 100) : null);
export const delta = (a, b) => (a == null || b == null ? null : round1(a - b));

export const isMonth = (m) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m || '');
export const prevMonthOf = (m) => {
  const [y, mo] = m.split('-').map(Number);
  const d = new Date(Date.UTC(y, mo - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
};
export const datesOf = (m) => {
  const [y, mo] = m.split('-').map(Number);
  const n = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  return Array.from({ length: n }, (_, i) => `${m}-${String(i + 1).padStart(2, '0')}`);
};
export const dayBefore = (d) => new Date(Date.parse(`${d}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);

// Days teachers are expected at school: not a weekly off, not inside a holiday. `limit` cuts off the current month.
export const workingDates = (month, { weeklyOff = [], holidays = [], limit } = {}) =>
  datesOf(month).filter((d) => (!limit || d <= limit) && !weeklyOff.includes(weekday(d)) && !holidays.some((h) => h.startDate <= d && h.endDate >= d));

// One teacher, one month. records: [{date,status}], leaves: approved [{fromDate,toDate}], join: first date that counts.
// `present` includes late days. Approved leave (with no check-in) is not counted as absent or in the percentage.
export const teacherMonth = (days, join, records, leaves) => {
  const mine = days.filter((d) => d >= join);
  const byDate = new Map(records.map((r) => [r.date, r.status]));
  let present = 0, late = 0, leave = 0;
  for (const d of mine) {
    const st = byDate.get(d);
    if (st === 'present') present += 1;
    else if (st === 'late') late += 1;
    else if (leaves.some((l) => l.fromDate <= d && l.toDate >= d)) leave += 1;
  }
  return { present: present + late, late, leave, absent: mine.length - present - late - leave, days: mine.length, percent: pctOf(present + late, mine.length - leave) };
};

// One student, one month, from saved registers.
export const studentMonth = ({ present = 0, late = 0, absent = 0 } = {}) => {
  const attended = present + late;
  return { present: attended, late, absent, days: attended + absent, percent: pctOf(attended, attended + absent) };
};

export const totals = (list) => {
  const attended = list.reduce((a, r) => a + r.present, 0);
  const base = list.reduce((a, r) => a + r.days - (r.leave || 0), 0);
  return { attended, absent: list.reduce((a, r) => a + r.absent, 0), leave: list.reduce((a, r) => a + (r.leave || 0), 0), percent: pctOf(attended, base) };
};
