import mongoose from 'mongoose';
import { UserModel } from '../src/lib/db/models/user';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-ob';

async function checkUsers() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Conectado\n');

    const users = await UserModel.find({});
    
    if (users.length === 0) {
      console.log('No hay usuarios en la base de datos');
    } else {
      console.log('Usuarios encontrados:');
      users.forEach((user, i) => {
        console.log(`\n${i + 1}. Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Password Hash: ${user.passwordHash?.substring(0, 20)}...`);
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();
