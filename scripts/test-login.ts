import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createUserRepository } from '../src/lib/db/repository/user';
import { UserModel } from '../src/lib/db/models/user';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-ob';

async function testLogin() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Conectado\n');

    const repo = createUserRepository();
    const email = 'admin@botanicaob.com';
    const password = 'Admin123!';

    console.log('Buscando usuario...');
    const user = await repo.findByEmail(email);

    if (!user) {
      console.log('Usuario no encontrado');
      await mongoose.disconnect();
      return;
    }

    console.log('✓ Usuario encontrado');
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);

    console.log('\nVerificando contraseña...');
    const isValid = await repo.verifyPassword(user, password);

    if (isValid) {
      console.log('✓ Contraseña válida\n');
      console.log('========================================');
      console.log('LOGIN EXITOSO');
      console.log('========================================');
    } else {
      console.log('❌ Contraseña inválida');
      console.log('\nGenerando nuevo hash...');
      const newHash = await bcrypt.hash(password, 10);
      await UserModel.updateOne({ email }, { passwordHash: newHash });
      console.log('✓ Contraseña actualizada');

      // Verificar de nuevo
      const verifyAgain = await bcrypt.compare(password, newHash);
      console.log(`Verificación: ${verifyAgain ? '✓ OK' : '❌ FALLÓ'}`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testLogin();
