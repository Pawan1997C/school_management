import multer from 'multer';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(Object.assign(new Error('Only image files are allowed'), { status: 400 })),
});

const paperTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
export const paperUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    paperTypes.includes(file.mimetype) ? cb(null, true) : cb(Object.assign(new Error('Upload the paper as a PDF or an image'), { status: 400 })),
});

// Website images can be larger than profile photos
export const siteUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(Object.assign(new Error('Only image files are allowed'), { status: 400 })),
});
