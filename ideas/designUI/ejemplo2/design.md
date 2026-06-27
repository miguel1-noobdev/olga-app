# Botánica Esencial OB — Especificación de Diseño para OpenPencil (Ejemplo 2)

> **Versión:** 2.0  
> **Herramienta:** OpenPencil (Design-as-Code)  
> **Base:** Mejora del ejemplo generado por Stitch (`designUI/ejemplo1/`)  
> **Idioma:** Español (`es`)  
> **Enfoque:** Web informativa + puente hacia app de producción

---

## 1. Visión General

Esta especificación describe la **landing page principal** de Botánica Esencial OB, diseñada para ser implementada en OpenPencil como archivo `.op` (JSON editable y versionable).

El objetivo es superar al ejemplo de Stitch en:

- Uso de **imágenes reales** del repositorio (`img/`).
- Mayor riqueza de secciones y contenido.
- Conexión explícita con la futura **app de producción**.
- Mejor estructura semántica para generación AI en OpenPencil.
- Preparación para exportación a React + Tailwind.

### Productos conectados

| Producto | Rol en esta especificación |
|----------|---------------------------|
| Web pública | Landing informativa, blog, comunidad, contacto. |
| App de producción | Fuente de datos: fórmulas, lotes, ingredientes (NotebookLM), contenido para el blog. |

---

## 2. Identidad de Marca

### 2.1 Nombre
- **Primario:** Botánica Esencial OB
- **Corto:** Botánica OB
- **Dominio tentativo:** botanicaesencialob.com

### 2.2 Voz y Tono
- Cálido, artesanal, transparente.
- Español claro, sin jerga técnica excesiva.
- Tagline principal: *"Cosmética natural que cuida tu piel y el planeta."*

### 2.3 Estilo Visual
- Estética de *botanical apothecary*: equilibrio entre artesanal y moderno.
- Espacios aireados, mucho *whitespace*.
- Formas redondeadas, sombras suaves, detalles dorados.
- Fotografía real de ingredientes, laboratorio y productos terminados.

---

## 3. Paleta de Colores (Tokens OpenPencil)

Estos tokens se definen como variables de diseño en el documento `.op` para facilitar cambios de tema y exportación a CSS.

| Token | Hex | Uso |
|-------|-----|-----|
| `--cream` | `#F5F0E6` | Fondo principal de página. |
| `--cream-light` | `#FAF8F2` | Fondos de tarjetas, inputs, secciones alternas. |
| `--sage` | `#5A7D3C` | Botones primarios, acentos activos, badges. |
| `--sage-dark` | `#46602E` | Hover de botones, énfasis. |
| `--lavender` | `#8B7AA8` | Acentos secundarios, links, detalles florales. |
| `--lavender-soft` | `#E8E3F0` | Tags, fondos suaves. |
| `--earth` | `#6B4423` | Headings, texto principal, footer. |
| `--coffee` | `#8B5A2B` | Texto secundario, bordes, iconos. |
| `--gold` | `#C4A35A` | Bordes finos, divisores, detalles decorativos. |
| `--gold-soft` | `#E8DCC8` | Bordes sutiles, contornos de tarjetas. |
| `--text-dark` | `#3E2C22` | Cuerpo de texto. |
| `--text-light` | `#FAF8F2` | Texto sobre fondos oscuros o verdes. |
| `--error` | `#B54A4A` | Estados de error. |
| `--success` | `#4A7C59` | Estados de éxito. |

### Reglas de Uso
- Fondos alternan `cream` y `cream-light` para crear ritmo visual.
- `sage` es acción primaria; usar con moderación.
- `lavender` para hover de links y detalles decorativos.
- `gold` solo para detalles finos.

---

## 4. Tipografía

### Familias
- **Headings:** `Playfair Display` (serif, 400/600/700).
- **Body:** `Inter` (sans, 400/500/600).
- **Accent/Labels:** `Inter` en mayúsculas con letter-spacing amplio.

### Escala (Desktop)

| Elemento | Fuente | Tamaño | Weight | Line-height |
|----------|--------|--------|--------|-------------|
| H1 Hero | Playfair Display | 56px | 600 | 1.1 |
| H2 Sección | Playfair Display | 40px | 600 | 1.2 |
| H3 Tarjeta | Playfair Display | 28px | 600 | 1.3 |
| H4 Subsección | Playfair Display | 22px | 600 | 1.3 |
| Body | Inter | 18px | 400 | 1.7 |
| Body Small | Inter | 16px | 400 | 1.6 |
| Label/Tag | Inter | 14px | 500 | 1.4 |
| Button | Inter | 16px | 600 | 1 |

### Escala (Mobile)
- H1 Hero: 36px
- H2 Sección: 28px
- H3 Tarjeta: 22px
- Body: 16px

---

## 5. Layout y Espaciado

### Contenedor
- Max-width: `1280px`.
- Padding horizontal: `16px` mobile, `24px` tablet, `48px` desktop.
- Centrado con auto margins.

### Espaciado de Secciones
- Padding vertical: `80px` mobile, `120px` desktop.
- Entre subsecciones: `48px`.

### Escala de Espaciado
- `4, 8, 12, 16, 24, 32, 48, 64, 96, 128` px.

### Border Radius
- Tarjetas: `16px`.
- Botones primarios: `9999px` (pill).
- Botones secundarios: `12px`.
- Inputs: `12px`.
- Imágenes: `16px` o `24px` para destacadas.

### Sombras
- Tarjeta: `0 4px 20px rgba(62, 44, 34, 0.08)`.
- Hover elevado: `0 8px 30px rgba(62, 44, 34, 0.12)`.

---

## 6. Componentes Globales

### 6.1 Navbar
- Altura: `80px` desktop, `64px` mobile.
- Fondo transparente sobre hero; al hacer scroll, fondo `cream-light` con `backdrop-filter: blur(8px)`.
- Layout horizontal: logo izquierda, links centro, CTA derecha.
- Links: `Inicio`, `Productos`, `Proceso`, `Blog`, `Contacto`.
- CTA: `Unirme` (outline style).
- Mobile: menú hamburguesa que desliza desde la derecha.

### 6.2 Botones

**Primario**
- Fondo: `sage`, texto: `text-light`.
- Padding: `16px 32px`, border-radius: `9999px`.
- Hover: `sage-dark`, lift 2px, sombra aumentada.

**Secundario (Outline)**
- Fondo transparente, borde `2px solid sage`, texto `sage`.
- Hover: fondo `sage`, texto `text-light`.

**Ghost/Social**
- Fondo `cream-light`, icono centrado.
- Hover: fondo `lavender-soft`.

### 6.3 Tarjetas
- Fondo `cream-light`, borde opcional `1px solid gold-soft`.
- Border-radius `16px`, padding `24px`.
- Sombra suave, hover: lift + sombra elevada.

### 6.4 Formularios
- Input: fondo `cream-light`, borde `1px solid gold-soft`, border-radius `12px`, padding `14px 16px`.
- Focus: borde `sage`, sombra sutil.
- Label: Inter 14px sobre el input.
- Error: borde `error`, texto de error debajo.

### 6.5 Divisores Decorativos
- Línea fina `gold` de 1px.
- Divisor floral SVG con hojas/lavanda (entre secciones).

### 6.6 Footer
- Fondo `earth`, texto `text-light` y `gold-soft`.
- Layout de 4 columnas desktop, apilado mobile.
- Columnas: Logo + newsletter, links rápidos, líneas de producto, contacto + redes.
- Redes: Facebook, YouTube, TikTok, Instagram.
- Copyright centrado abajo.

---

## 7. Secciones de la Página

### 7.1 Hero Section (`#inicio`)

**Layout**
- Full viewport height (`100vh`).
- Fondo: imagen `img/hero-img.jpeg` con overlay sutil para legibilidad.
- Contenido centrado vertical y horizontalmente.

**Contenido**
- Eyebrow: "COSMÉTICA ARTESANAL" (uppercase, gold, letter-spacing 2px).
- H1: "Cosmética Natural que Cuida tu Piel y el Planeta".
- Subheadline: "Fórmulas hechas a mano con ingredientes botánicos seleccionados. Sin químicos agresivos, sin crueldad animal."
- CTA primario: "Descubrir Productos" → `#productos`.
- CTA secundario: "Conocer el Proceso" → `#proceso`.

**Imagen**
- `img/hero-img.jpeg` como background cover.

---

### 7.2 Productos Section (`#productos`)

**Layout**
- Título e intro centrados.
- Grid de 3 columnas desktop, 1 columna mobile.
- Gap: `32px`.

**Contenido**
Intro: "Tres líneas pensadas para cuidarte de forma natural, desde el rostro hasta el cuerpo."

**Tarjetas de Categoría**

1. **Línea Facial**
   - Imagen: `img/prd/presentacion-producto-1.jpeg`
   - Título: "Línea Facial"
   - Descripción: "Limpieza, hidratación y cuidado delicado para tu rostro."
   - Link: "Ver productos →"

2. **Para el Cabello**
   - Imagen: `img/prd/presentacion-producto-2.jpeg`
   - Título: "Para el Cabello"
   - Descripción: "Shampoos, acondicionadores y tratamientos naturales."
   - Link: "Ver productos →"

3. **Línea Corporal**
   - Imagen: `img/prd/presentacion-producto-3.jpeg`
   - Título: "Línea Corporal"
   - Descripción: "Aceites, cremas y exfoliantes para cuidar tu piel."
   - Link: "Ver productos →"

**Tarjeta de Regalo Destacada**
- Debajo del grid, una tarjeta ancha de "Cestas de Regalo" usando `img/prd/cesta-regalo-1.jpeg`.
- Título: "Cestas y Packs de Regalo"
- Descripción: "Regalá bienestar con nuestras cestas armadas a mano."
- CTA: "Ver opciones".

---

### 7.3 Ingredientes Section (`#ingredientes`) — NUEVA

**Layout**
- Fondo `cream-light`.
- Título e intro centrados.
- Grid de 4 imágenes tipo galería.

**Contenido**
- Título: "Ingredientes que se ven y se sienten"
- Intro: "Trabajamos con materias primas seleccionadas y documentadas en cada fórmula."

**Imágenes**
1. `img/plts/lanvada.jpeg` — Lavanda
2. `img/plts/tomillo.jpeg` — Tomillo
3. `img/lab/materias-primas-1.jpeg` — Materias primas
4. `img/lab/materias-primas-2.jpeg` — Proceso de preparación

---

### 7.4 Proceso Artesanal Section (`#proceso`) — NUEVA

**Layout**
- Dos columnas desktop (imagen izquierda, texto derecha), apilado mobile.
- Imagen con border-radius `24px` y sombra.

**Contenido**
- Título: "Hecho a mano, pensado en detalle"
- Bloques:
  1. **Selección**: ingredientes botánicos de origen responsable.
  2. **Formulación**: cada fórmula se documenta y guarda en nuestra app de producción.
  3. **Elaboración**: lotes pequeños para mantener frescura y calidad.
  4. **Control**: seguimiento de cada producto desde el laboratorio hasta tu hogar.

**Imagen**
- `img/lab/deco-1.jpeg` o `img/lab/materias-primas-3.jpeg`.

---

### 7.5 Conóceme Section (`#conoceme`)

**Layout**
- Dos columnas desktop (texto izquierda, imagen derecha), apilado mobile.

**Contenido**
- Título: "Quién está detrás de Botánica OB"
- Subtítulo: "Una apuesta por la cosmética consciente."
- Bloques:
  1. **Quién soy**: presentación de la fundadora, su historia y conexión con la cosmética natural.
  2. **Qué hago**: productos limpios, transparentes, respetuosos con la piel y el planeta.
  3. **Cómo lo hago**: procesos artesanales, lotes pequeños, trazabilidad completa.

**Imagen**
- Placeholder o foto de la fundadora (a definir). Mientras tanto, usar `img/lab/deco-2.jpeg` como ambiente de laboratorio.

---

### 7.6 Comunidad Section (`#comunidad`)

**Layout**
- Fondo `sage`, texto `text-light`.
- Dos columnas: texto izquierda, formulario derecha.

**Contenido (izquierda)**
- Título: "Únete a nuestra comunidad"
- Texto: "Recibí tips de cuidado natural, lanzamientos exclusivos y descuentos especiales."
- Beneficios:
  - Acceso anticipado a nuevos productos.
  - Guías de rutinas naturales.
  - Descuentos solo para miembros.

**Formulario (derecha)**
- Botón "Continuar con Google".
- Divider "o".
- Campos: Nombre completo, Correo electrónico, Contraseña.
- Checkbox: "Acepto la política de privacidad y recibir comunicaciones."
- Submit: "Crear cuenta".
- Link: "¿Ya tenés cuenta? Iniciar sesión."

---

### 7.7 Blog Section (`#blog`)

**Layout**
- Título e intro centrados.
- Grid de 3 artículos.
- Link "Ver todos los artículos" debajo.

**Artículos**
1. "5 ingredientes naturales para una piel radiante" — imagen `img/plts/rosas-petalo.jpeg`
2. "Cómo armar tu rutina capilar con productos botánicos" — imagen `img/plts/lavanda-tomillo.jpeg`
3. "El poder del aloe vera en la cosmética artesanal" — imagen `img/aimg/IA-1.jpeg`

Cada tarjeta incluye: imagen, tag de categoría, título, extracto 2-3 líneas, link "Leer más →".

---

### 7.8 Redes Sociales Section (`#redes`)

**Layout**
- Fondo `cream`.
- Título centrado.
- 4 tarjetas cuadradas en fila (2x2 mobile).

**Plataformas**
| Plataforma | Label | CTA |
|------------|-------|-----|
| Facebook | Facebook | "Síguenos en Facebook" |
| YouTube | YouTube | "Mirá nuestros videos" |
| TikTok | TikTok | "Unite a nuestra comunidad" |
| Instagram | Instagram | "Descubrí nuestro día a día" |

---

### 7.9 Contacto Section (`#contacto`)

**Layout**
- Dos columnas: formulario izquierda, info derecha.

**Formulario**
- Título: "Envianos un mensaje"
- Campos: Nombre, Correo electrónico, Mensaje.
- Submit: "Enviar mensaje".
- Mensaje de éxito: "Gracias por escribirnos. Te responderemos pronto."

**Info de contacto**
- Email: hola@botanicaesencialob.com
- WhatsApp: +54 9 11 0000 0000
- Ubicación: Ciudad Autónoma de Buenos Aires, Argentina
- Mapa placeholder (rounded, borde `gold-soft`).

---

### 7.10 Footer

Ver sección 6.6.

---

## 8. Interacciones y Animaciones

### Scroll
- Smooth scroll en todos los anchors.
- Navbar cambia de transparente a `cream-light` con blur después de 50px de scroll.

### Reveal
- Secciones entran con fade + translateY (`20px → 0`).
- `IntersectionObserver` o scroll-driven animations.
- Stagger de 100ms entre items de grid.
- Duración 600ms, easing `cubic-bezier(0.22, 1, 0.36, 1)`.

### Hover
- Botones: lift 2px + sombra.
- Tarjetas: lift 4px + sombra + borde `gold`.
- Links: transición a `lavender` o `sage-dark`.
- Imágenes: scale 1.03 dentro de contenedor `overflow: hidden`.

### Formularios
- Focus: borde `sage` + glow sutil.
- Loading state: spinner + disabled.
- Validación: mensajes que slidean debajo del campo.

---

## 9. Responsive Breakpoints

| Breakpoint | Ancho | Comportamiento |
|------------|-------|----------------|
| Mobile | < 640px | 1 columna, menú hamburguesa, secciones apiladas. |
| Tablet | 640px – 1024px | 2 columnas, spacing ajustado. |
| Desktop | > 1024px | Layout completo, max-width container, hover effects. |

---

## 10. Accesibilidad

- Contraste mínimo 4.5:1 para texto.
- Focus rings visibles (`2px solid sage` o `gold`).
- Alt text en español para todas las imágenes.
- Labels asociadas a inputs.
- HTML semántico: `header`, `nav`, `main`, `section`, `article`, `footer`.
- Skip-to-content link.
- Botones con nombres accesibles; iconos con `aria-hidden`.

---

## 11. Assets del Repositorio

### Imágenes Reales Disponibles

| Asset | Ruta | Uso propuesto |
|-------|------|---------------|
| Hero | `img/hero-img.jpeg` | Background hero. |
| Logo | `img/logo.jpeg` | Navbar y footer. |
| Logo con borde | `img/logo-borde.jpeg` | Variante footer. |
| Producto 1 | `img/prd/presentacion-producto-1.jpeg` | Línea Facial. |
| Producto 2 | `img/prd/presentacion-producto-2.jpeg` | Cabello. |
| Producto 3 | `img/prd/presentacion-producto-3.jpeg` | Corporal. |
| Cesta regalo | `img/prd/cesta-regalo-1.jpeg` | Tarjeta regalos. |
| Lavanda | `img/plts/lanvada.jpeg` | Galería ingredientes. |
| Tomillo | `img/plts/tomillo.jpeg` | Galería ingredientes. |
| Rosas pétalo | `img/plts/rosas-petalo.jpeg` | Blog artículo 1. |
| Lavanda-tomillo | `img/plts/lavanda-tomillo.jpeg` | Blog artículo 2. |
| Materias primas 1 | `img/lab/materias-primas-1.jpeg` | Galería / proceso. |
| Materias primas 2 | `img/lab/materias-primas-2.jpeg` | Galería / proceso. |
| Deco laboratorio | `img/lab/deco-1.jpeg` | Proceso artesanal. |
| IA auxiliar | `img/aimg/IA-1.jpeg` | Blog artículo 3. |

### Iconos Necesarios
- Navegación: menu, close, arrow-right, chevron-down.
- Redes: Facebook, YouTube, TikTok, Instagram.
- UI: check, email, phone, map-pin, lock, eye.
- Decorativos: leaf, flower, drop, hand.

### Fuentes
- Google Fonts: `Playfair Display` (400, 600, 700) + `Inter` (400, 500, 600).

---

## 12. Notas para OpenPencil

### Estructura del Documento `.op`

El archivo `.op` debe seguir el esquema `PenDocument`:

```json
{
  "version": "1.0",
  "name": "Botanica Esencial OB - Landing v2",
  "variables": {
    "cream": { "type": "color", "value": "#F5F0E6" },
    "sage": { "type": "color", "value": "#5A7D3C" },
    "...": "..."
  },
  "pages": [
    {
      "id": "page-1",
      "name": "Inicio",
      "children": [ /* nodos de cada sección */ ]
    }
  ],
  "children": []
}
```

### Roles Semánticos para AI

Al generar con OpenPencil, usar roles en los nodos:

- `navbar`, `hero`, `section`, `footer`
- `heading`, `body-text`, `caption`, `label`
- `button`, `card`, `feature-card`, `image-card`
- `input`, `form-group`
- `icon`

### Variables Recomendadas

Definir variables para colores, spacing y tipografía. Usar `$variableName` en lugar de valores hardcodeados cuando sea posible.

### Exportación

Una vez generado en OpenPencil, exportar a:
- **React + Tailwind** para integración con la web.
- **HTML + CSS** para preview estático.

---

## 13. Mapa de Navegación

| Link | Target | Sección |
|------|--------|---------|
| Inicio | `#inicio` | Hero |
| Productos | `#productos` | Categorías + regalos |
| Proceso | `#proceso` | Proceso artesanal |
| Blog | `#blog` | Artículos |
| Contacto | `#contacto` | Formulario + info |
| Unirme | `#comunidad` | Signup |

---

## 14. Diferencias respecto al Ejemplo 1 (Stitch)

| Aspecto | Ejemplo 1 (Stitch) | Ejemplo 2 (OpenPencil) |
|---------|-------------------|------------------------|
| Imágenes | Placeholders | Imágenes reales de `img/` |
| Secciones | 8 básicas | 10+ enriquecidas |
| Proceso | No tenía | Sección dedicada con imágenes del laboratorio |
| Ingredientes | No tenía | Galería visual con fotos reales |
| Variables | CSS hardcodeado | Variables de diseño en `.op` |
| App conexión | No mencionada | Integración explícita con app de producción |
| Export | HTML estático | React + Tailwind / HTML + CSS |

---

## 15. Decisiones Pendientes

- Logo final en formato vectorial.
- Foto de la fundadora para la sección Conóceme.
- Stack final de desarrollo (Astro, Next.js, etc.).
- Proveedor de email/newsletter.
- CMS o estrategia para el blog.
- Herramienta de generación de videos cortos para YouTube.

---

*Documento creado para OpenPencil. Diseño-as-Código, versionable y listo para exportar.*
