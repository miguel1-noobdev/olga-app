import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI no está definido en .env');
  process.exit(1);
}

async function createAdminUser() {
  try {
    console.log('Conectando a MongoDB Atlas...');
    console.log('URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@')); // Oculta el password
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log('✓ Conectado a MongoDB Atlas');

    // Definir el modelo de Usuario
    const UserSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ['admin', 'user'], default: 'user' },
      createdAt: { type: Date, default: Date.now },
    });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    // Crear usuario admin
    const email = 'admin@botanicaob.com';
    const password = 'Admin2024!';
    const passwordHash = await bcrypt.hash(password, 10);

    console.log(`\nCreando usuario admin: ${email}`);
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠ El usuario ya existe, actualizando a admin...');
      existingUser.role = 'admin';
      existingUser.passwordHash = passwordHash;
      await existingUser.save();
      console.log('✓ Usuario actualizado a admin');
    } else {
      const user = new User({
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
