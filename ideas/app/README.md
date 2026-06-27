# Botánica Esencial OB — Especificación de la App de Producción

## Objetivo

Ser el laboratorio digital privado de la marca: centralizar fórmulas, procesos, observaciones de lotes e investigación botánica, para que la fundadora pueda repetir éxitos, evitar errores y generar contenido para la web.

## Usuarias/os

- **Administradora / Fundadora**: crea fórmulas, registra lotes, investiga ingredientes, gestiona contenido y genera reportes.
- **Web pública** (como lectora): consume contenido aprobado y datos resumidos publicados desde la app.

## Funcionalidades principales

| Módulo | Funcionalidad |
|--------|---------------|
| **Investigación botánica** | Fichas de plantas con compuestos, propiedades, contraindicaciones, partes usadas y extractos. Fuente semilla: NotebookLM. |
| **Inventario de ingredientes** | Registro de plantas, aceites, mantecas, activos, etc., con stock y proveedor. |
| **Creación de fórmulas** | Composición por porcentajes, escalado automático al tamaño del lote, historial de versiones. |
| **Bitácora de lotes** | Fecha, fórmula base, observaciones, fotos, mediciones, resultado. |
| **Fórmulas originales** | Guardado de recetas propias con notas y etiquetas. |
| **Reportes por email** | Envío de resúmenes de producción, stock o lotes. |
| **Generación de videos cortos** | Creación de contenido para YouTube a partir de productos/fichas. |
| **Publicación automática en blog** | Artículos generados desde la app publicados en la web pública. |

## Base de datos

### Fuente semilla: NotebookLM

NotebookLM genera fichas botánicas técnicas que sirven como punto de partida. Cada ficha incluye:

- Nombre común y científico.
- Familia botánica.
- Partes usadas.
- Compuestos activos con rangos cuando aplica.
- Propiedades.
- Contraindicaciones.
- Tipos de extracto disponibles.

### Modelo de datos propuesto

| Entidad | Propósito |
|---------|-----------|
| `plants` | Datos base de cada planta (nombre, especie, familia, descripción). |
| `plant_compounds` | Compuestos químicos asociados a una planta, con rangos o concentraciones. |
| `plant_properties` | Propiedades terapéuticas/cosméticas. |
| `plant_contraindications` | Advertencias de uso. |
| `plant_extracts` | Extractos disponibles (aceite esencial, hidrolato, oleato, etc.). |
| `ingredients` | Ingredientes generales (no botánicos incluidos). |
| `formulas` | Recetas con composición porcentual. |
| `formula_ingredients` | Ingredientes de una fórmula con porcentajes. |
| `batches` | Lotes producidos a partir de una fórmula. |
| `batch_observations` | Observaciones, fotos y mediciones de un lote. |
| `users` | Usuarias/os autenticadas/os (Google OAuth). |
| `articles` | Artículos del blog listos para publicar en la web. |
| `products` | Líneas de productos publicadas en la web. |

### Decisiones de diseño pendientes

- ¿Modelo híbrido (campos comunes en `plants` + tablas relacionadas) o totalmente normalizado?
- ¿Cómo versionar la fuente de cada dato (NotebookLM, manual, fuente externa)?
- ¿Esquema en SQL con Prisma o TypeORM? Pendiente confirmar stack.

## Integraciones

| Servicio | Uso |
|----------|-----|
| **YouTube** | Publicación de videos cortos generados desde productos o fichas botánicas. |
| **Email** | Envío de reportes de producción, lotes, stock y newsletters. |
| **Blog / Web pública** | Publicación automática de artículos aprobados. |

## Integración con la web pública

| Dato | Dirección | Descripción |
|------|-----------|-------------|
| Artículos de blog | App → Web | Artículos aprobados se exponen en la web. |
| Líneas de productos | App → Web | Productos publicados aparecen en la web. |
| Fichas botánicas resumidas | App → Web | Vista pública segura de ingredientes. |
| Miembros de comunidad | Web → App | Registros de la web se reflejan en la app. |

## Decisiones pendientes

- Stack tecnológico exacto (frontend, backend, ORM).
- Proveedor de autenticación Google (Firebase Auth, Auth0, Supabase).
- Servicio de email y newsletter.
- Herramienta de generación/publicación de videos para YouTube.
- CMS o API para publicación automática en blog.
- Estrategia de scraping o importación de datos externos (Dr. Duke's USDA, Fitoterapia.net, etc.).
- Licenciamiento y validación de información botánica.
