import { connectToDatabase } from '../src/lib/db/connect';
import { createArticleRepository } from '../src/lib/db/repository/article';

async function seedArticles() {
  await connectToDatabase();
  const repo = createArticleRepository();

  const articles = [
    {
      title: 'Bienvenida a Botánica Esencial OB',
      slug: 'bienvenida-botanica-esencial-ob',
      excerpt: 'Descubre el poder de la cosmética natural artesanal. Plantas, ciencia y tradición se unen para cuidar tu piel de forma consciente y sostenible.',
      content: `
La cosmética natural no es una moda pasajera: es un regreso a lo esencial. En **Botánica Esencial OB**, cada producto nace del conocimiento profundo de las plantas, de la ciencia que las respalda y de la tradición que las ha utilizado durante siglos.

Mi filosofía es simple: **si la naturaleza lo creó, no necesita aditivos artificiales para funcionar**. Trabajo con extractos vegetales puros, aceites esenciales destilados con cuidado e ingredientes que respetan el equilibrio natural de tu piel.

## ¿Por qué cosmética botánica?

La cosmética convencional utiliza cientos de compuestos sintéticos que, aunque aprobados, pueden acumularse en el organismo o generar reacciones no deseadas. La cosmética natural, en cambio, se basa en:

- **Ingredientes biodegradables** que no contaminan el agua ni el suelo
- **Extractos vegetales** con afinidad natural por tu bioquímica
- **Sin parabenos, sulfatos ni siliconas** que obstruyen los poros o alteran el microbioma cutáneo
- **Procesos artesanales** que respetan la integridad de los principios activos

## Lo que encontrarás aquí

En el **Jardín Digital** podrás explorar una colección de 21 plantas medicinales con sus propiedades, compuestos activos, formas de uso y contraindicaciones. En el **Journal**, comparto artículos como este para ayudarte a entender mejor cómo cuidar tu piel y tu bienestar con lo que la naturaleza nos ofrece.

## Mi compromiso

No hago cosmética para vender. Hago cosmética porque creo que **cada persona merece productos que realmente funcionen, sin comprometer su salud ni el planeta**. Cada lote lo documento, lo pruebo y le hago seguimiento en el tiempo para garantizar su calidad y eficacia.

Te invito a explorar, aprender y sumarte a esta forma más consciente de cuidarte.
      `.trim(),
      category: 'Blog',
      image: '/img/logo/logotrans3-256.png',
      imageAlt: 'Logo de Botánica Esencial OB',
      readingTime: '4 min',
    },
    {
      title: 'Aloe Vera: el oro verde de la cosmética natural',
      slug: 'aloe-vera-oro-verde-cosmetica-natural',
      excerpt: 'El Aloe barbadensis es mucho más que una planta decorativa. Descubre por qué es uno de los ingredientes más versátiles y eficaces para el cuidado de la piel.',
      content: `
Pocas plantas tienen un currículum tan impresionante como el **Aloe Vera** (*Aloe barbadensis Miller*). Desde el antiguo Egipto —donde la llamaban "planta de la inmortalidad"— hasta los laboratorios de cosmética más avanzados, el gel de aloe ha demostrado ser un ingrediente extraordinario.

## ¿Qué lo hace tan especial?

El secreto está en su composición única. El gel de aloe contiene:

- **Más de 75 compuestos activos** entre vitaminas (A, C, E, B12), minerales (zinc, magnesio), enzimas y aminoácidos
- **Polisacáridos como el acemanano**, responsables de su capacidad para retener agua y formar una barrera protectora sobre la piel
- **Propiedades antiinflamatorias y calmantes** que alivian irritaciones, quemaduras solares y rojeces
- **Capacidad regeneradora** que estimula la producción de colágeno y acelera la cicatrización

## Cómo usarlo en tu rutina diaria

**Aplicación directa del gel fresco**: la forma más pura y efectiva. Corta una hoja, extrae el gel transparente y aplícalo directamente sobre la piel limpia. Ideal después de la exposición solar.

**Como sérum hidratante**: mezcla una cucharada de gel de aloe con 3 gotas de tu aceite facial favorito (rosa mosqueta o jojoba funcionan de maravilla). Aplica antes de tu crema habitual.

**Mascarilla calmante semanal**: combina 2 cucharadas de gel de aloe con 1 cucharadita de miel cruda. Deja actuar 15 minutos y enjuaga con agua tibia.

**After-sun natural**: guarda gel de aloe en la nevera. El frío potencia su efecto descongestivo sobre pieles castigadas por el sol.

**Gel fijador para cejas**: una alternativa natural a los geles sintéticos. Aplica una mínima cantidad con un cepillo limpio.

## Precauciones importantes

El gel (pulpa transparente) es seguro para uso tópico. Sin embargo, el **látex amarillento** que se encuentra entre la corteza y el gel contiene aloína, un compuesto con efecto laxante potente que **no debe aplicarse sobre la piel ni ingerirse sin supervisión**.

Si usas aloe fresco en casa, asegúrate de lavar bien la hoja y eliminar completamente la capa de látex antes de extraer el gel.

## Mi experiencia

En Botánica Esencial OB utilizo aloe en mis fórmulas de hidratación profunda. Su compatibilidad con otros extractos vegetales lo convierte en una base ideal para sinergias botánicas.
      `.trim(),
      category: 'Recursos',
      image: 'https://upload.wikimedia.org/wikipedia/commons/5/54/Aloe-vera-20080327.JPG',
      imageAlt: 'Planta de Aloe vera en flor',
      readingTime: '5 min',
    },
    {
      title: 'Cuidados de la piel en verano con cosmética natural casera',
      slug: 'cuidados-piel-verano-cosmetica-natural',
      excerpt: 'El sol, el cloro y la sal pueden dañar tu piel. Te contamos cómo protegerla este verano con ingredientes naturales que tienes al alcance de la mano.',
      content: `
El verano es maravilloso: días largos, baños de sol, piscina, playa... Pero tu piel no siempre comparte el entusiasmo. La combinación de **radiación UV, cloro, sal marina y sudor** puede deshidratarla, irritarla y acelerar su envejecimiento.

La buena noticia es que no necesitas productos caros ni fórmulas complejas para cuidarla. La naturaleza ya te da todo lo necesario.

## Los 4 pilares del cuidado estival

### 1. Hidratación desde dentro

El primer paso es el más obvio pero el más olvidado: **beber suficiente agua**. En verano perdemos más líquidos de lo habitual. Las infusiones frías de **toronjil, menta o manzanilla** son una forma deliciosa de mantenerte hidratada mientras disfrutas de los beneficios calmantes y digestivos de estas plantas.

### 2. Protección suave pero constante

Aunque la cosmética natural no sustituye un protector solar con SPF adecuado, ciertos aceites vegetales ofrecen una capa adicional de protección:

- **Aceite de semilla de frambuesa**: contiene antioxidantes naturales que ayudan a combatir el daño de los radicales libres
- **Aceite de zanahoria**: rico en betacarotenos, prepara la piel para la exposición solar
- **Aceite de jojoba**: su similitud con el sebo humano lo hace ideal para mantener el equilibrio sin obstruir poros

Aplica unas gotas por la mañana antes de tu protector solar.

### 3. After-sun reparador casero

Después de un día de playa o piscina, tu piel necesita calma e hidratación. Esta mezcla es mi remedio favorito:

**Gel after-sun de aloe y lavanda:**
- 3 cucharadas de gel de aloe vera (mejor si está frío)
- 5 gotas de aceite esencial de lavanda
- 1 cucharadita de aceite de rosa mosqueta

Mezcla todo y aplica generosamente sobre la piel aún húmeda después de la ducha. La **lavanda calma y regenera**, mientras que la **rosa mosqueta aporta los ácidos grasos** que la piel necesita para repararse.

### 4. Exfoliación suave

El sudor, el protector solar y las células muertas se acumulan más rápido en verano. Una vez por semana:

- Mezcla **posos de café usados** (sí, has leído bien) con aceite de coco y una cucharada de miel
- Masajea suavemente con movimientos circulares
- Enjuaga con agua tibia

El café estimula la microcirculación y la miel es un humectante natural que deja la piel increíblemente suave.

## Lo que NO debes hacer

- Evita los aceites esenciales cítricos (limón, naranja, bergamota) en las zonas expuestas al sol: son **fotosensibilizantes** y pueden provocar manchas
- No uses exfoliantes agresivos justo antes de exponerte al sol
- No sustituyas el protector solar por aceites vegetales
- Si tu piel es muy clara o sensible, consulta con un dermatólogo antes de probar nuevos ingredientes

## Escucha a tu piel

Cada piel es única. Lo que funciona para una persona puede no irle bien a otra. La cosmética natural te invita a **experimentar, observar y adaptar**. Si algo te irrita, deja de usarlo. Si algo te sienta bien, incorpóralo a tu rutina.

En Botánica Esencial OB creo que **cuidarse es un acto de amor propio**, no una obligación estética. Disfruta del verano con consciencia y deja que la naturaleza sea tu aliada.
      `.trim(),
      category: 'Blog',
      image: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Chamomile%40original_size.jpg',
      imageAlt: 'Flores de manzanilla — ingrediente natural calmante para el verano',
      readingTime: '6 min',
    },
  ];

  for (const article of articles) {
    const existing = await repo.findBySlug(article.slug);
    if (existing) {
      console.log(`Article "${article.title}" already exists, skipping.`);
      continue;
    }

    const created = await repo.create({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      image: article.image,
      imageAlt: article.imageAlt,
      readingTime: article.readingTime,
    });

    await repo.publish(created.id);
    console.log(`Created and published: "${article.title}"`);
  }

  console.log('Done seeding articles.');
  process.exit(0);
}

seedArticles().catch((err) => {
  console.error(err);
  process.exit(1);
});
