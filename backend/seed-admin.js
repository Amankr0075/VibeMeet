const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vibemeet';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
  const usersCol = mongoose.connection.db.collection('users');

  const bcrypt = require('bcryptjs');
  
  // Purge any default seed accounts
  const deleted = await usersCol.deleteMany({ email: 'admin@vibemeet.com' });
  if (deleted.deletedCount > 0) {
    console.log(`Removed ${deleted.deletedCount} default seed account(s).`);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Aman@62478140', salt);

  // Ensure authorized administrator role
  const updateResult = await usersCol.updateOne(
    { email: 'logiterax@gmail.com' },
    { 
      $set: { 
        role: 'ADMIN',
        passwordHash: hashedPassword,
        name: 'Admin'
      } 
    },
    { upsert: true }
  );
  
  if (updateResult.upsertedCount > 0) {
    console.log('Created logiterax@gmail.com as ADMIN.');
  } else if (updateResult.modifiedCount > 0) {
    console.log('Updated logiterax@gmail.com to ADMIN role and updated password.');
  }

  const allAdmins = await usersCol.find({ role: 'ADMIN' }, { projection: { email: 1, role: 1, _id: 0 } }).toArray();
  console.log('Active Administrator Accounts:', allAdmins.map(a => a.email));

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
