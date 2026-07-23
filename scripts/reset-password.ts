import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/lib/db/models/user';
import { withMongoLeaseLock } from '../src/lib/db/mongo-lease-lock';
import { readAdminProvisioningEnvironment } from './admin-provisioning-environment';
import { createAdminAccountRecoveryUpdate } from './admin-account-recovery';

async function resetPassword() {
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
    const passwordHash = await bcrypt.hash(config.ADMIN_PASSWORD, 10);

    const result = await withMongoLeaseLock(async (guard) => {
      await guard.assertOwnership();
      return UserModel.updateOne(
        { email: config.ADMIN_EMAIL },
        { $set: createAdminAccountRecoveryUpdate(passwordHash) }
      );
    });

    if (result.matchedCount === 0) {
      console.error('No administrator account matched the designated email.');
      process.exitCode = 1;
    } else if (result.modifiedCount > 0) {
      console.log('Password updated.');
    } else {
      console.log('No password was updated.');
    }
  } catch {
    console.error('Password reset failed. Check database connectivity and retry.');
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch {
      console.error('Password reset cleanup failed.');
      process.exitCode = 1;
    }
  }
}

resetPassword();
