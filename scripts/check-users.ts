import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/connect';
import { UserModel } from '../src/lib/db/models/user';

async function checkUsers() {
  try {
    console.log('Conectando a MongoDB...');
    await connectToDatabase();
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
      });
    }

    await mongoose.disconnect();
  } catch {
    console.error('Error: MongoDB operation failed.');
    process.exit(1);
  }
}

checkUsers();
