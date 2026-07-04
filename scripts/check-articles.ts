import mongoose from 'mongoose';
import { ArticleModel } from '../src/lib/db/models/article';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/botanica-ob';

async function checkArticles() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Conectado\n');

    const articles = await ArticleModel.find({});
    
    console.log(`Total de artículos en la base de datos: ${articles.length}\n`);
    
    if (articles.length > 0) {
      articles.forEach((article, i) => {
        console.log(`${i + 1}. ${article.title}`);
        console.log(`   Slug: ${article.slug}`);
        console.log(`   Categoría: ${article.category}`);
        console.log(`   Publicado: ${article.published}`);
        console.log(`   Fecha: ${article.publishedAt || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('No hay artículos en la base de datos.');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

checkArticles();
