import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/lib/db/models/user';
import { ROLES } from '../src/lib/auth/roles';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-ob';

async function createProductoraUser() {
  const email = process.env.OLGA_EMAIL;
  const password = process.env.OLGA_PASSWORD;

  if (!email) {
    console.error('OLGA_EMAIL is required');
    process.exit(1);
  }

  if (!password) {
    console.error('OLGA_PASSWORD is required');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('OLGA_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected\n');

    const passwordHash = await bcrypt.hash(password, 10);

    const existingUser = await UserModel.findOne({ email: email.toLowerCase().trim() });

    if (existingUser) {
      console.log('Existing user found, updating to productora role...');
      existingUser.role = ROLES.PRODUCTORA;
      existingUser.passwordHash = passwordHash;
      await existingUser.save();
      console.log('User updated successfully');
    } else {
      console.log('Creating new productora user...');
      await UserModel.create({
        email: email.toLowerCase().trim(),
        passwordHash,
        role: ROLES.PRODUCTORA,
      });
      console.log('User created successfully');
    }

    console.log('\n========================================');
    console.log('Olga laboratory account');
    console.log('Email:', email);
    console.log('Role:', ROLES.PRODUCTORA);
    console.log('========================================\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

createProductoraUser();
