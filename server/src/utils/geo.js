export const distanceMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1), dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Current date (YYYY-MM-DD) and time (HH:MM) in the school's timezone
export const schoolNow = (tz, d = new Date()) => ({
  date: new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(d),
  time: new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d),
});
