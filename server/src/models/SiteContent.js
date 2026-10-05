import mongoose from 'mongoose';

const img = { url: String, publicId: String };
const str = (def = '') => ({ type: String, default: def, trim: true });
const stat = new mongoose.Schema({ label: String, value: String }, { _id: false });

// One document holds all editable website text. Lists (gallery, news) have their own collections.
export default mongoose.model('SiteContent', new mongoose.Schema({
  hero: {
    headline: str('Learning that lasts a lifetime'),
    subheadline: str('A caring community where every child is encouraged to think, create and grow.'),
    ctaText: str('Apply for admission'), ctaLink: str('/contact'), image: img,
  },
  about: {
    title: str('About our school'),
    body: str('Our school has been nurturing curious, confident learners for many years. We combine strong academics with sports, arts and values, in a safe and welcoming campus.\n\nEvery classroom is led by experienced, caring teachers who know each child by name.'),
    mission: str('To give every student a joyful, rigorous education that builds knowledge, character and confidence.'),
    vision: str('To be a school where children grow into thoughtful, capable and kind citizens.'),
    image: img,
  },
  stats: { type: [stat], default: () => [{ label: 'Years of excellence', value: '25+' }, { label: 'Students', value: '1200+' }, { label: 'Teachers', value: '60+' }, { label: 'Clubs and activities', value: '20+' }] },
  principal: { name: str(''), title: str('Principal'), message: str('Welcome to our school family. We believe every child can shine when given care, challenge and encouragement. I invite you to visit us and see our classrooms in action.'), photo: img },
  admissions: { open: { type: Boolean, default: true }, headline: str('Admissions are open'), text: str('Visit the school or send us an enquiry to learn about the admission process, fees and available seats.') },
  contact: { address: str(''), phone: str(''), email: str(''), hours: str('Mon to Sat, 8:00 AM to 4:00 PM'), lat: Number, lng: Number },
  social: { facebook: str(), instagram: str(), youtube: str(), x: str() },
  footerText: str('Building confident learners for tomorrow.'),
}, { timestamps: true }));
