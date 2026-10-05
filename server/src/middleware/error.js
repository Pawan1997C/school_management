export const notFound = (req, res) => res.status(404).json({ message: 'Route not found' });

export const errorHandler = (err, req, res, next) => {
  if (err.code === 11000) {
    const k = Object.keys(err.keyPattern || {});
    let m = 'This already exists';
    if (k.includes('teacher') && k.includes('period')) m = 'This teacher already has a class in that period';
    else if (k.includes('class') && k.includes('period')) m = 'This class already has a teacher for that period';
    else if (k.includes('teacher') && k.includes('date')) m = 'Already checked in today';
    else if (k.length) m = `${k.join(', ')} must be unique`;
    return res.status(409).json({ message: m });
  }
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id or value' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'That file is too large. Photos can be up to 2 MB, website images 5 MB, exam papers 10 MB' });
  if (!err.status || err.status >= 500) console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
};
