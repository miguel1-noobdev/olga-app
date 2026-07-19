import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/lib/db/models/user';
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
    await mongoose.connect(config.MONGODB_URI);
    const passwordHash = await bcrypt.hash(config.ADMIN_PASSWORD, 10);
    
    const result = await UserModel.updateOne(
      { email: config.ADMIN_EMAIL },
      { $set: createAdminAccountRecoveryUpdate(passwordHash) }
    );
    
    if (result.modifiedCount > 0) {
      console.log('Password updated.');
    } else {
      console.log('No password was updated.');
    }

    await mongoose.disconnect();
  } catch {
    console.error('Password reset failed. Check database connectivity and retry.');
    process.exitCode = 1;
  }
}

resetPassword();
