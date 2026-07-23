import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/lib/db/models/user';
import { readProductoraProvisioningEnvironment } from './productora-provisioning-environment';
import {
  applyProductoraAccountRecovery,
  createProductoraAccountRecoveryUpdate,
} from './productora-account-recovery';

async function createProductoraUser() {
  let config;

  try {
    config = readProductoraProvisioningEnvironment();
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
    });
    console.log('Connected to MongoDB.');

    const passwordHash = await bcrypt.hash(config.OLGA_PASSWORD, 10);

    const existingUser = await UserModel.findOne({ email: config.OLGA_EMAIL });

    if (existingUser) {
      console.log('Existing productora account found, applying recovery update...');
      applyProductoraAccountRecovery(existingUser, passwordHash);
      await existingUser.save();
      console.log('Olga productora account updated.');
    } else {
      console.log('Creating Olga productora account...');
      await UserModel.create({
        email: config.OLGA_EMAIL,
        ...createProductoraAccountRecoveryUpdate(passwordHash),
      });
      console.log('Olga productora account created.');
    }
  } catch {
    console.error('Productora provisioning failed. Check database connectivity and retry.');
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
    } catch {
      console.error('Productora provisioning cleanup failed.');
      process.exitCode = 1;
    }
  }
}

createProductoraUser();
