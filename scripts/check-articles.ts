import mongoose from 'mongoose';
import { connectToDatabase } from '../src/lib/db/connect';
import { ArticleModel } from '../src/lib/db/models/article';

async function checkArticles() {
  try {
    console.log('Conectando a MongoDB...');
    await connectToDatabase();
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
  } catch {
    console.error('Error: MongoDB operation failed.');
    process.exit(1);
  }
}

checkArticles();
