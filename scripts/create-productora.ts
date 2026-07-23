import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { readProductoraProvisioningEnvironment } from './productora-provisioning-environment';
import { provisionProductoraAccount } from './productora-provisioning';

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
      socketTimeoutMS: 10000,
    });
    console.log('Connected to MongoDB.');

    const passwordHash = await bcrypt.hash(config.OLGA_PASSWORD, 10);

    await provisionProductoraAccount(config.OLGA_EMAIL, passwordHash);
    console.log('Olga productora account provisioned.');
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
