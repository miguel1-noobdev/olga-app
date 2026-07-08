import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/lib/db/models/user';

const MONGODB_URI = process.env.MONGODB_URI;

async function createAdminUser() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI no está definido en .env');
    process.exit(1);
  }

  try {
    console.log('Conectando a MongoDB Atlas...');
    console.log('URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Oculta el password
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log('✓ Conectado a MongoDB Atlas');

    // Crear usuario admin
    const email = 'admin@botanicaob.com';
    const password = 'Admin2024!';
    const passwordHash = await bcrypt.hash(password, 10);

    console.log(`\nCreando usuario admin: ${email}`);
    
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      console.log('⚠ El usuario ya existe, actualizando a admin...');
      existingUser.role = 'admin';
      existingUser.passwordHash = passwordHash;
      await existingUser.save();
      console.log('✓ Usuario actualizado a admin');
    } else {
      const user = new UserModel({
        email,
        passwordHash,
        role: 'admin',
      });
      await user.save();
      console.log('✓ Usuario admin creado exitosamente');
    }

    console.log('\n========================================');
    console.log('Credenciales de acceso:');
    console.log('Email: admin@botanicaob.com');
    console.log('Password: Admin2024!');
    console.log('========================================\n');

    await mongoose.disconnect();
    console.log('✓ Desconectado de MongoDB Atlas');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdminUser();
