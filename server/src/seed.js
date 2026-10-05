import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Settings from './models/Settings.js';

await mongoose.connect(process.env.MONGO_URI);
const email = (process.env.ADMIN_EMAIL || 'admin@school.com').toLowerCase();
if (!(await User.findOne({ email }))) {
  await User.create({ name: process.env.ADMIN_NAME || 'School Admin', email, password: process.env.ADMIN_PASSWORD || 'Admin@12345', role: 'admin' });
  console.log(`Admin created: ${email}`);
} else console.log('Admin already exists');
if (!(await Settings.findOne())) await Settings.create({});
await mongoose.disconnect();
