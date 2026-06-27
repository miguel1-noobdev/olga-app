# Botánica Esencial OB — Especificación de la Web Pública

## Objetivo

Ser el escaparate digital de la marca: transmitir confianza, naturaleza y comunidad, y permitir que visitantes descubran productos, se informen sobre cosmética natural, se unan a la comunidad y contacten a la marca.

## Usuarias/os

- **Visitantes**: personas interesadas en cosmética natural artesanal.
- **Miembros de la comunidad**: usuarias/os registrados que reciben contenido, tips y lanzamientos.
- **Administradora**: publica artículos y gestiona contenido desde la app de producción.

## Secciones y funcionalidades

| Sección | Contenido / Funcionalidad |
|---------|---------------------------|
| **Hero** | Imagen principal de botánica, título "Cosmética Natural que Cuida tu Piel y el Planeta", subtítulo y CTAs a productos y conocer la marca. |
| **Productos** | Tres líneas de cuidado: facial, capilar y corporal. Cada una con tarjeta descriptiva y enlace. |
| **Redes Sociales** | Enlaces a Instagram, TikTok, Facebook y YouTube con CTAs claros. |
| **Conóceme** | Historia de la fundadora en tres bloques: quién soy, qué hago, cómo lo hago. |
| **Comunidad** | Beneficios de unirse y formulario de registro (nombre, email, contraseña, Google). |
| **Blog** | Artículos sobre ingredientes, rutinas y transparencia. Publicación gestionada desde la app. |
| **Contacto** | Formulario de contacto + email, WhatsApp, ubicación y mapa. |
| **Footer** | Logo, tagline, newsletter, links rápidos, líneas de productos, contacto y redes. |

## Autenticación

- Registro e inicio de sesión con **Google OAuth**.
- Opción de registro con email y contraseña.
- Los usuarios registrados pertenecen a la comunidad y pueden recibir comunicaciones.

## Integración con la app de producción

| Dato compartido | Origen | Uso en web |
|-----------------|--------|------------|
| Líneas de productos | App de producción | Sección Productos. |
| Artículos del blog | App de producción | Sección Blog. |
| Fichas botánicas resumidas | App de producción | Contenido divulgativo de ingredientes. |
| Datos de contacto / marca | App de producción | Footer y sección Contacto. |

La web lee contenido aprobado para público; la app conserva los datos técnicos completos.

## Diseño y estilo

La web sigue el sistema de diseño definido en [`designUI/ejemplo1/design-system.md`](../designUI/ejemplo1/design-system.md) y la especificación original en [`designUI/ejemplo1/design.md`](../designUI/ejemplo1/design.md).

### Identidad visual

- **Estilo**: botica botánica moderna + taller artesanal.
- **Sensación**: cálida, limpia, orgánica, elegante.

### Paleta de colores principales

| Token | Hex | Uso |
|-------|-----|-----|
| Cream | `#F5F0E6` | Fondo principal |
| Cream light | `#FAF8F2` | Tarjetas, inputs, secciones claras |
| Sage | `#5A7D3C` | Botones primarios, acentos |
| Sage dark | `#46602E` | Hover, énfasis |
| Lavender | `#8B7AA8` | Links, acentos decorativos |
| Lavender soft | `#E8E3F0` | Fondos suaves, tags |
| Earth | `#6B4423` | Encabezados, texto, footer |
| Coffee | `#8B5A2B` | Texto secundario, bordes |
| Gold | `#C4A35A` | Bordes, divisores, detalles |
| Gold soft | `#E8DCC8` | Bordes sutiles, tarjetas |

### Tipografía

- **Títulos**: Playfair Display (serif, pesos 400/600/700).
- **Cuerpo**: Inter (sans-serif, pesos 400/500/600).
- **Etiquetas**: Inter en mayúsculas con amplio espaciado entre letras.

### Layout

- Contenedor máximo: `1280px`.
- Padding horizontal: `16px` mobile, `24px` tablet, `48px` desktop.
- Espaciado vertical de secciones: `80px` mobile, `120px` desktop.
- Tarjetas con radio `16px`, botones en forma de píldora.

### Responsive

| Breakpoint | Comportamiento |
|------------|----------------|
| Mobile (< 640px) | Una columna, menú hamburguesa, tipografía reducida. |
| Tablet (640px – 1024px) | Dos columnas, espaciado ajustado. |
| Desktop (> 1024px) | Layout completo, efectos hover, grid de 12 columnas. |

### Animaciones e interacciones

- Scroll suave en anclas.
- Navbar con fondo difuminado al hacer scroll.
- Secciones reveladas con fade + translateY al entrar al viewport.
- Hover en tarjetas: elevación y sombra más profunda.
- Imágenes con escala sutil (`1.03`) al hacer hover.

## Assets disponibles

Ver el inventario completo en [`img/README.md`](../../img/README.md).

| Ubicación | Contenido |
|-----------|-----------|
| `img/hero-img.jpeg` | Imagen principal del hero/banner. |
| `img/logo.jpeg` | Logo principal. |
| `img/logo-borde.jpeg` | Logo con borde (variante). |
| `img/aimg/` | Imágenes auxiliares (IA generada, decoración). |
| `img/etk/` | Etiquetas de productos (9 archivos). |
| `img/lab/` | Fotos del laboratorio y materias primas. |
| `img/plts/` | Plantas e ingredientes botánicos (lavanda, tomillo, rosas, etc.). |
| `img/prd/` | Productos finales: cestas de regalo y presentaciones. |

## SEO (español)

- **Título**: Botanica Esencial OB — Cosmética Natural Artesanal
- **Meta descripción**: Descubre cosmética natural hecha a mano con ingredientes botánicos. Línea facial, capilar y corporal. Unite a nuestra comunidad.
- OG tags para compartir en redes.

## Decisiones pendientes

- Logo final y variantes (claro/oscuro).
- Foto de la fundadora para la sección Conóceme.
- Nombres, precios y fichas finales de productos.
- Plataforma/CMS para el blog.
- Proveedor de hosting y dominio.
- Backend de formularios de contacto.
