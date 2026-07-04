import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/lib/db/models/user';

async function createTestUser() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-esencial';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully');

    const testEmail = 'test@botanica.com';
    const testPassword = 'Test123!';

    console.log('Creating test user...');
    
    // Check if user already exists
    const existing = await UserModel.findOne({ email: testEmail });
    if (existing) {
      console.log('User already exists, skipping creation');
      console.log('  Email:', existing.email);
      console.log('  ID:', existing._id.toString());
      console.log('  Role:', existing.role);
    } else {
      const passwordHash = await bcrypt.hash(testPassword, 10);
      const user = await UserModel.create({
        email: testEmail,
        passwordHash,
        role: 'admin',
      });
      
      console.log('Test user created successfully:');
      console.log('  Email:', user.email);
      console.log('  ID:', user._id.toString());
      console.log('  Role:', user.role);
    }
    
    console.log('\nYou can now login with:');
    console.log('  Email: test@botanica.com');
    console.log('  Password: Test123!');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
