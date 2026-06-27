# Botánica Esencial OB — Especificación de Componentes Compartidos

Este documento reúne los puntos en común entre la web pública y la app de producción: marca, datos, autenticación, diseño y estrategia de contenido.

## Identidad de marca

| Aspecto | Definición |
|---------|------------|
| **Nombre principal** | Botanica Esencial OB |
| **Nombre corto** | Botanica OB |
| **Sector** | Cosmética natural artesanal |
| **Eslogan de referencia** | "Cosmética natural que cuida tu piel y el planeta." |
| **Voz** | Cálida, cercana, conocedora, sin tecnicismos innecesarios. |
| **Tono** | Confiado pero nada invasivo. Español claro y profesional. |
| **Sensación visual** | Botica botánica moderna + taller artesanal: aireada, elegante, orgánica. |

### Colores compartidos

| Token | Hex | Uso |
|-------|-----|-----|
| Cream | `#F5F0E6` | Fondo principal |
| Cream light | `#FAF8F2` | Tarjetas, inputs, fondos claros |
| Sage | `#5A7D3C` | Acciones primarias |
| Sage dark | `#46602E` | Hover, énfasis |
| Lavender | `#8B7AA8` | Acentos secundarios, links |
| Lavender soft | `#E8E3F0` | Tags, fondos suaves |
| Earth | `#6B4423` | Textos, footer |
| Coffee | `#8B5A2B` | Texto secundario, bordes |
| Gold | `#C4A35A` | Divisores, bordes, detalles |
| Gold soft | `#E8DCC8` | Bordes sutiles |

### Tipografía compartida

- **Títulos**: Playfair Display.
- **Cuerpo y UI**: Inter.
- **Etiquetas**: Inter en mayúsculas con espaciado amplio.

## Modelo de datos compartido

Las dos aplicaciones operan sobre el mismo conjunto de entidades, con diferentes niveles de visibilidad:

| Entidad | Web pública | App de producción |
|---------|-------------|-------------------|
| `products` | Solo líneas publicadas y descripción general. | Gestión completa: fórmulas, lotes, costos. |
| `formulas` | No visible. | Creación, edición, historial, escalado. |
| `batches` | No visible. | Bitácora completa con observaciones. |
| `plants` | Vista divulgativa: nombre, descripción, beneficios suaves. | Vista técnica: compuestos, contraindicaciones, extractos. |
| `articles` | Artículos publicados. | Borradores, programación, publicación. |
| `users` | Miembros de comunidad. | Administradora y permisos. |

> **Principio clave**: no duplicar datos. La web muestra un subconjunto de campos aprobados; la app guarda la fuente única de verdad.

## Autenticación

- Mecanismo principal: **Google OAuth**.
- Opcionalmente registro con email/contraseña.
- Roles mínimos:
  - `admin`: acceso completo a la app de producción.
  - `member`: usuario de la comunidad en la web.

## Componentes y diseño compartidos

Los siguientes elementos deben reutilizarse entre web y app para mantener coherencia:

- **Navbar**: logo, links principales, botón "Unirme" / acceso.
- **Botones**: primario (sage, píldora), secundario (outline), ghost.
- **Tarjetas**: fondo cream-light, borde gold-soft, radio 16px, sombra suave.
- **Inputs**: fondo cream-light, borde gold-soft, radio 12px, focus sage.
- **Tags/Chips**: píldora con fondo lavender-soft y texto lavender.
- **Dividores**: línea floral SVG o línea fina gold.
- **Iconografía**: leaf, flower, drop, hand, cocoa bean, flechas, check.

Ver el sistema completo en [`designUI/ejemplo1/design-system.md`](../designUI/ejemplo1/design-system.md).

## Estrategia de datos NotebookLM

NotebookLM se usa como **fuente semilla** para fichas botánicas. El flujo propuesto es:

1. **Generación**: NotebookLM produce una ficha técnica a partir de fuentes confiables.
2. **Revisión**: la administradora valida y ajusta la ficha en la app.
3. **Almacenamiento**: los datos se guardan en el modelo relacional (`plants` + tablas relacionadas).
4. **Divulgación**: la app genera una vista pública segura para la web.
5. **Trazabilidad**: cada dato debe registrar su fuente y estado de validación.

### Fuentes de investigación adicionales

- Dr. Duke's Phytochemical and Ethnobotanical Databases (USDA) — permite descarga CSV.
- Fitoterapia.net.
- Atlas Virtual de Plantas Medicinales (UMH).
- Compendium of Botanicals (EFSA).

> **Nota legal**: revisar licencias antes de scrapear o importar datos externos.

## Decisiones pendientes

- Stack de implementación del design system (Tailwind, CSS variables, component library).
- Sistema de roles y permisos.
- Estrategia de versionado de fichas botánicas.
- Herramienta de generación de contenido (blog/videos) desde la app.
- Normalización definitiva del modelo de datos botánicos.
