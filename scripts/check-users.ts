import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-ob';

async function checkUsers() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Conectado\n');

    const UserSchema = new mongoose.Schema({
      email: String,
      passwordHash: String,
      role: String,
      createdAt: Date,
    });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    const users = await User.find({});
    
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
