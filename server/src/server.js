import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

await mongoose.connect(process.env.MONGO_URI);
console.log('MongoDB connected');
app.listen(process.env.PORT || 5000, () => console.log(`API on :${process.env.PORT || 5000}`));
