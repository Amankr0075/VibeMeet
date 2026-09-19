const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI not found in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const usersCol = mongoose.connection.db.collection('users');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Aman@62478140', salt);

  // Upsert the admin account with all required fields for login to work
  const result = await usersCol.updateOne(
    { email: 'logiterax@gmail.com' },
    {
      $set: {
        name: 'Admin',
        email: 'logiterax@gmail.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        accountStatus: 'ACTIVE',   // required by emailSignIn check
        isVerified: true,
        loginAttempts: 0,          // reset any lockout
        lockoutUntil: null,
        loginOtpHash: null,
        loginOtpExpiresAt: null
      }
    },
    { upsert: true }
  );

  if (result.upsertedCount > 0) {
    console.log('✅ Created new admin account: logiterax@gmail.com');
  } else if (result.modifiedCount > 0) {
    console.log('✅ Updated existing admin account: logiterax@gmail.com');
  } else {
    console.log('ℹ️  Admin account already up to date.');
  }

  // Print what is actually stored
  const admin = await usersCol.findOne(
    { email: 'logiterax@gmail.com' },
    { projection: { email: 1, role: 1, accountStatus: 1, isVerified: 1, loginAttempts: 1, lockoutUntil: 1, _id: 0 } }
  );
  console.log('\nAdmin record in Atlas:');
  console.log(JSON.stringify(admin, null, 2));

  await mongoose.disconnect();
  console.log('\nDone!');
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
