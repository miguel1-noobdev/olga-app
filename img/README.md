# Galería de Imágenes

Estructura organizada por secciones de la web "Botanica Esencial OB".

## Estructura de Carpetas

```
img/
├── aimg/     → Imágenes auxiliares y varias
├── etk/      → Etiquetas de productos
├── lab/      → Laboratorio (decoración y materias primas)
├── plts/     → Plantas e ingredientes botánicos
├── prd/      → Productos finales (cestas, presentaciones)
├── hero-img.jpeg
├── logo-borde.jpeg
└── logo.jpeg
```

## Convenciones de Nombres

- **Guiones en vez de espacios**: `cesta-regalo-1.jpeg` (no `cesta-regalo (1).jpeg`)
- **Minúsculas**: todo en minúsculas
- **Descriptivo**: el nombre debe indicar qué contiene la imagen
- **Secuencias numéricas**: usar `-1`, `-2`, `-3` para variantes

## Descripción de Carpetas

### `aimg/` — Auxiliares
Imágenes de apoyo, texturas, o recursos no clasificados en otras secciones.

### `etk/` — Etiquetas
Etiquetas de productos, diseños de packaging, mockups de etiquetas.

### `lab/` — Laboratorio
- `deco-*.jpeg` — Decoración del laboratorio
- `materias-primas-*.jpeg` — Ingredientes y materias primas

### `plts/` — Plantas
Fotos de plantas e ingredientes botánicos usados en las formulaciones.

### `prd/` — Productos
- `cesta-regalo-*.jpeg` — Cestas y packs de regalo
- `presentacion-producto-*.jpeg` — Presentaciones individuales de productos

### Archivos raíz
- `hero-img.jpeg` — Imagen principal del hero/banner
- `logo.jpeg` — Logo principal
- `logo-borde.jpeg` — Logo con borde (variante)

## Uso en la Web

Cuando referencies estas imágenes en el código, usa rutas relativas desde la raíz del proyecto:

```html
<img src="img/plts/lavanda.jpeg" alt="Lavanda">
<img src="img/prd/cesta-regalo-1.jpeg" alt="Cesta de regalo">
```
