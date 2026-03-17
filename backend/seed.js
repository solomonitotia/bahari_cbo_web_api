require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'IoTData' });
  console.log('Connected to MongoDB');

  const email = 'admin@baharicbo.co.ke';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    await mongoose.disconnect();
    return;
  }

  await User.create({
    name: 'Bahari Admin',
    email,
    password: 'Bahari@2024',
    role: 'admin',
    isVerified: true,
    isActive: true,
  });

  console.log('✅ Admin account created!');
  console.log('   Email   : admin@baharicbo.co.ke');
  console.log('   Password: Bahari@2024');
  console.log('   Role    : admin');
  console.log('\n⚠️  Change this password after first login!');
  await mongoose.disconnect();
};

seed().catch((err) => { console.error(err); process.exit(1); });
