import mongoose from 'mongoose';
import { createUserRepository } from '../src/lib/db/repository/user';
import { ROLES } from '../src/lib/auth/roles';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-ob';

async function resetAdminUser() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Conectado a MongoDB\n');
    
    const email = 'admin@botanicaob.com';
    const password = 'Admin123!';
    
    // Eliminar usuario existente
    console.log('Eliminando usuario existente...');
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection('users').deleteOne({ email });
      console.log('✓ Usuario eliminado\n');
    } else {
      console.log('No se pudo eliminar el usuario (DB no disponible)');
    }
    
    // Crear nuevo usuario
    console.log('Creando nuevo usuario admin...');
    const repo = createUserRepository();
    const user = await repo.create({
      email,
      password,
      role: ROLES.ADMIN,
    });
    
    console.log('✓ Usuario creado exitosamente\n');
    console.log('========================================');
    console.log('Credenciales:');
    console.log('Email:', user.email);
    console.log('Password:', password);
    console.log('Role:', user.role);
    console.log('========================================');
    
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    await mongoose.disconnect();
    process.exit(1);
  }
}

resetAdminUser();
