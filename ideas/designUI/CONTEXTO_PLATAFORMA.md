# Contexto de la Plataforma — Botánica Esencial OB

> Documento vivo. Se va actualizando con las decisiones del usuario **antes** de lanzar el SDD formal.
> Sirve como base para la fase de propuesta del SDD.

---

## Visión global

Plataforma single-tenant con dos roles diferenciados.

**Acceso por capas:**

| Capa | Quién | Qué ve | Estado |
|------|-------|--------|--------|
| Pública | Visitantes anónimos | Landing completa, pueden registrarse | Diseño y estructura → se concreta después |
| Restringida | Usuarios registrados (suscriptores) | Blog (parte de la landing) + emails informativos | Se diseña con la landing |
| Privada | Olga (cuenta staff) | Dashboard de producción — su "laboratorio" | Se crea después, paso a paso |
| Privada | Miguel (admin) | Dashboard admin — operación digital, publicación, administración | Se crea después, paso a paso |

**Reglas de acceso:**
- Visitantes anónimos: ven la landing completa, NO acceden al blog
- Usuarios suscriptores (registrados con email/contraseña o Google): acceden al blog + reciben emails informativos
- Olga y Miguel: tienen cuentas con rol especial que los lleva a su dashboard privado
- Los dashboards privados son **apps separadas** que se construyen después, una a una

**Decisión arquitectónica clave**: Single-tenant con dos roles de staff + usuarios suscriptores. NO multi-tenant.

---

## Roles y modelo de negocio

### Usuarios suscriptores (públicos)
- Registro con **email/contraseña** o **Google OAuth**
- Acceso a un **blog** (contenido restringido a registrados)
- Reciben **emails informativos** cuando Olga publica nuevas creaciones o productos
- **NO es e-commerce** — la web es informativa y didáctica
- Sin pagos, sin carrito, sin checkout, sin pedidos, sin facturación

### Olga (rol: productora / staff)
- Carga datos de producción desde su casa a través de **su dashboard privado**
- Datos típicos: productos, recetas, procesos, fotos, materia prima
- No publica directamente en el blog (pendiente confirmar)

### Miguel (rol: admin / operador digital / staff)
- Extrae datos de la base
- Curación, redacción, publicación de artículos del blog
- Administración de la plataforma (usuarios, BD, automatizaciones, datos, redes)

**Decisión arquitectónica clave**: Single-tenant. NO multi-tenant.

**Pregunta abierta crítica**: ¿Cómo se crean las cuentas de Olga y Miguel? Opciones:
- (a) Se registran por la web pública como cualquier otro y un admin les cambia el rol
- (b) Son cuentas pre-creadas / invitadas por un super-admin (no se registran por la web)
- (c) Hay un proceso de invitación por email con link de setup

---

## Stack técnico
*Pendiente definir*

---

## Pieza por pieza (decisiones del usuario)
*Se va completando a medida que el usuario describe cada parte*

### Blog (página separada)
- **Acceso**: solo usuarios registrados
- En la landing se muestra preview (3 últimas entradas) + mensaje de acceso restringido
- Página completa con todas las entradas

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

**Estructura visual** (adaptada de davidzamora.blog):
- Hero con presentación de Olga + newsletter
- Artículos destacados (3-4 tarjetas grandes)
- Grid de últimos artículos con filtros por categoría
- Newsletter CTA
- Footer (mismo que landing)

**Categorías:**
- **Recursos**: contenido educativo, curado, guías, referencias externas. "Aprendé sobre este mundo"
- **Blog**: diario personal, trabajo de Olga, productos, ingredientes. "Detrás de escena"

**Funcionalidades:**
- **Comentarios**: solo usuarios registrados, moderación reactiva (eliminables, no aprobados previamente)
- **Autores**: sistema flexible (Miguel ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

### Glosario botánico (página separada)
- **Acceso**: solo usuarios registrados
- En la landing: 3-4 tarjetas informativas + acceso al glosario completo
- Página completa con todas las entradas del glosario

### Presentación de Olga (sección en la landing)
- **Formato**: "Detrás de la marca" con foto circular de Olga
- Título tipo: "Soy Olga, tu alquimista botánica"
- Texto descriptivo sobre su pasión y proceso
- Cita destacada con borde lateral (estilo warm, más personal que el glassmorphism)
- **Referencia visual**: imagen proporcionada por el usuario (formato Olivia/alquimista)

### Acceso a redes (sección en la landing)
- **Formato**: botones grandes o tarjetas que enlacen a las redes sociales
- Diseño simple y directo

### Footer
- **Formato**: grande y bonito
- Contenido a decidir durante la construcción (navegación, contacto, redes, legal, etc.)

### Referencias adicionales para la construcción
- `ideas/designUI/ejemplo3/landing_page_premium_botanica_esencial/code.html` (2º puesto en votaciones)
- Se usará como fuente de ideas generales para ir incorporando secciones bonitas durante la construcción paso a paso de la landing

### Landing page
**Base elegida**: `ideas/designUI/ejemplo3/bot_nica_esencial_ob_landing_page_glassmorphism/code.html`

**Estilo visual**: Glassmorphism (vidrio esmerilado, blur, transparencias)
- **Paleta**: Verde botánico (#334537), dorado (#e9c349), crema (#f4fbf2)
- **Tipografía**: Playfair Display (headlines) + Plus Jakarta Sans (body)
- **Efectos**: Parallax en hero, hover en cards, navbar que cambia con scroll

**Estructura definitiva (9 secciones en orden):**
1. **Hero**: imagen espectacular
2. **Productos**: preview de 3-4 destacados + enlace "Ver colección completa" → **páginas separadas**
3. **Nuestros métodos**: proceso de Olga (de los ejemplos)
4. **Journal**: 3 tarjetas con últimas entradas del blog → acceso al blog completo (solo registrados)
5. **Glosario botánico**: preview de 3-4 ingredientes con tarjetas → acceso al glosario completo (solo registrados)
6. **Presentación**: "Detrás de la marca" con foto circular de Olga + cita
7. **Únete**: registro de usuarios
8. **Acceso a redes**: botones grandes o tarjetas que enlacen a redes sociales
9. **Footer**: grande y bonito, contenido a decidir durante la construcción

**Páginas separadas (no en la landing):**
- Productos (página informativa)
- Blog (solo registrados)
- Glosario botánico (solo registrados)

**Pendiente definir:**
- Contenido exacto del footer

### Blog
*Pendiente*

### Dashboard de Olga
*Pendiente*

### Dashboard de Miguel (admin)
*Pendiente*

### Registro / autenticación
- **Un solo flujo de registro** para todos los usuarios (suscriptores, Olga, Miguel)
- Registro con **email/contraseña** o **Google OAuth**
- **Primer usuario registrado = admin automáticamente** (Miguel)
- Admin asigna roles después: `suscriptora` → `productora` (Olga)
- **NO** cuentas pre-creadas manualmente
- **NO** sistema de invitaciones por email
- Olga puede usar el blog desde el día 1, sin esperar su dashboard

### Emails
- Informativos de nuevas creaciones/productos
*Pendiente definir proveedor, frecuencia, plantilla*

---

## Imágenes y assets
- **Todas las imágenes del proyecto están en `/img`** (galería oficial)
- **NO se buscan ni generan imágenes adicionales** — solo se usa lo que hay
- Organización:
  - `hero/`: 2 opciones para el hero
  - `logo/`: 4 versiones del logo (con fondo, transparente, con borde)
  - `prd/`: productos (crema, gotas, cestas regalo, presentaciones)
  - `plts/`: plantas (lavanda, tomillo, rosas, planta extra)
  - `lab/`: laboratorio (materias primas, deco)
  - `etk/`: etiquetas (7 etiquetas + 2 extras)
  - `aimg/`: imágenes auxiliares (IA, logo transparente, naturaleza)
- Las carpetas `ideas/designUI/ejemplo3/*.jpeg/screen.png` son **referencias de galería** (inspiración), no assets finales
- Solo **3 imágenes** pasarán al producto final (ya incluidas en `/img`)
- 13 landing pages HTML exportadas de Stitch están disponibles como referencia visual
- 4 sistemas de diseño (DESIGN.md) con paletas comparadas
- Mapa completo en `ideas/designUI/ejemplo3/INDEX.md`

---

## Preguntas abiertas
- ~~¿El blog es público para todos o solo para registrados?~~ → **Resuelto**: solo registrados
- ~~¿Hay contenido premium?~~ → **No definido aún**
- ¿Olga puede publicar directo o siempre pasa por Miguel?
- ¿Cómo se crean las cuentas staff (Olga, Miguel)? (auto-registro con cambio de rol, pre-creadas, o invitación por email)
- ¿Qué hace exactamente Olga en su "centro de trabajo"? (recetas, inventario, clientes, agenda...)
- ¿Stack técnico preferido? (Next.js, Astro, etc.)
- ¿Proveedor de emails? (Resend, SendGrid, etc.)
- ¿Hospedaje? (Vercel, Netlify, VPS propio)
- ¿Las "automatizaciones" son emails, o también algo más?
- Las "redes" — ¿integración con Instagram/TikTok, o solo gestión de contenido?
