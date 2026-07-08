import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/lib/db/models/user';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-ob';

async function resetPassword() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Conectado\n');

    const email = 'admin@botanicaob.com';
    const newPassword = 'Admin123!';
    
    console.log(`Reseteando contraseña para: ${email}`);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    const result = await UserModel.updateOne(
      { email },
      { passwordHash }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✓ Contraseña actualizada exitosamente\n');
      console.log('========================================');
      console.log('Credenciales:');
      console.log('Email: admin@botanicaob.com');
      console.log('Password: Admin123!');
      console.log('========================================');
    } else {
      console.log('No se pudo actualizar la contraseña');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();
