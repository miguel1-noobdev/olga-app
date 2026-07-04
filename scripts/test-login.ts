import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-ob';

async function testLogin() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Conectado\n');

    const UserSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ['suscriptora', 'productora', 'admin'], default: 'suscriptora' },
    }, { timestamps: { createdAt: true, updatedAt: false } });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    const email = 'admin@botanicaob.com';
    const password = 'Admin123!';
    
    console.log('Buscando usuario...');
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log(' Usuario no encontrado');
      await mongoose.disconnect();
      return;
    }
    
    console.log('✓ Usuario encontrado');
    console.log(`  Email: ${user.email}`);
    console.log(`  Role: ${user.role}`);
    
    console.log('\nVerificando contraseña...');
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (isValid) {
      console.log('✓ Contraseña válida\n');
      console.log('========================================');
      console.log('LOGIN EXITOSO');
      console.log('========================================');
    } else {
      console.log('❌ Contraseña inválida');
      console.log('\nGenerando nuevo hash...');
      const newHash = await bcrypt.hash(password, 10);
      await User.updateOne({ email }, { passwordHash: newHash });
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
