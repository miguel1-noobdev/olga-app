import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/lib/db/models/user';
import { withMongoLeaseLock } from '../src/lib/db/mongo-lease-lock';
import { readAdminProvisioningEnvironment } from './admin-provisioning-environment';
import { applyAdminAccountRecovery } from './admin-account-recovery';

async function createAdminUser() {
  let config;

  try {
    config = readAdminProvisioningEnvironment();
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Configuration error.');
    process.exitCode = 1;
    return;
  }

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB.');
    const passwordHash = await bcrypt.hash(config.ADMIN_PASSWORD, 10);

    await withMongoLeaseLock(async (guard) => {
      const existingUser = await UserModel.findOne({ email: config.ADMIN_EMAIL });
      if (existingUser) {
        await guard.assertOwnership();
        applyAdminAccountRecovery(existingUser, passwordHash);
        await guard.assertOwnership();
        await existingUser.save();
        console.log('Admin account updated.');
      } else {
        const user = new UserModel({
          email: config.ADMIN_EMAIL,
          passwordHash,
          role: 'admin',
          accountStatus: 'active',
        });
        await guard.assertOwnership();
        await user.save();
        console.log('Admin account created.');
      }
    });
  } catch {
    console.error('Admin provisioning failed. Check database connectivity and retry.');
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
    } catch {
      console.error('Admin provisioning cleanup failed.');
      process.exitCode = 1;
    }
  }
}

createAdminUser();
