# Botánica Esencial OB — Stack de Especificaciones

Este repositorio de ideas documenta la visión, el diseño y la arquitectura del proyecto **Botánica Esencial OB**: un ecosistema digital formado por una **web pública** y una **aplicación privada de producción**, ambas intercomunicadas.

## ¿Qué es el proyecto?

Una marca de cosmética natural artesanal que necesita dos herramientas digitales conectadas:

1. **Web pública**: escaparate informativo de la marca, productos, blog, comunidad y contacto.
2. **App de producción**: laboratorio digital privado para crear, documentar y repetir fórmulas, gestionar lotes, investigar ingredientes y publicar contenido derivado.

Ambas comparten identidad, datos de productos/fórmulas, autenticación y componentes visuales.

## Productos

| Producto | Descripción | Usuarias/os principales |
|----------|-------------|-------------------------|
| [Web pública](web/README.md) | Sitio informativo de marca con secciones de productos, blog, comunidad y contacto. | Clientas/es potenciales, comunidad. |
| [App de producción](app/README.md) | Back-office privado para formulación, lotes, inventario botánico y generación de contenido. | La fundadora / administradora. |

## Tecnologías propuestas

> Estas opciones surgen de los documentos originales. Las decisiones finales están pendientes de confirmación.

| Capa | Opciones consideradas | Notas |
|------|----------------------|-------|
| **Frontend web** | HTML + Tailwind CSS + JS vanilla, Astro, Next.js o Nuxt | Astro/Next/Nuxt se preferirán si el blog crece. |
| **Frontend app** | Por definir (React/Vue/Svelte o framework full-stack) | Pendiente decidir según stack backend. |
| **Backend / DB** | SQL relacional con Prisma o TypeORM | Modelo inicial planteado en `modelo-datos-botanico.md`. |
| **Autenticación** | Google OAuth (Firebase Auth, Auth0 o Supabase) | Requerida en web (comunidad) y app (back-office). |
| **Formularios de contacto** | Netlify Forms, Formspree o endpoint propio | Pendiente confirmar hosting. |
| **Generación de datos botánicos** | NotebookLM como fuente semilla + posible scraper de fuentes abiertas (Dr. Duke's USDA) | Ver estrategia en `shared/README.md`. |
| **Email / newsletters** | Por definir | Requerido para reportes y comunidad. |
| **YouTube / blog** | Por definir | Automatización de publicación pendiente. |
| **Hosting** | Por definir | No se eligió proveedor todavía. |

## Roadmap de alto nivel

| Fase | Enfoque | Entregables esperados |
|------|---------|----------------------|
| **Fase 1 — Fundamentos** | Marca, diseño, modelo de datos, estrategia NotebookLM. | Design system, schema inicial, fuentes de datos. |
| **Fase 2 — Web pública** | Landing informativa: hero, productos, blog, comunidad, contacto. | Web desplegada con auth Google y formulario de contacto. |
| **Fase 3 — App de producción** | Inventario botánico, fórmulas, lotes, observaciones, reportes. | MVP funcional para la administradora. |
| **Fase 4 — Integraciones** | Email, YouTube, publicación automática en blog, comunidad conectada. | Flujos de contenido web ↔ app. |
| **Fase 5 — Escalado** | Mejoras de UX, analytics, posible e-commerce futuro. | Versión estable y lista para crecer. |

## Estructura de especificaciones

```
ideas/
├── README.md              ← este documento
├── web/
│   └── README.md          ← especificación de la web pública
├── app/
│   └── README.md          ← especificación de la app de producción
├── shared/
│   └── README.md          ← marca, datos, auth y componentes compartidos
└── designUI/
    └── ejemplo1/          ← ejemplo visual generado en Stitch (referencia)
```

## Decisiones pendientes

- Stack final de frontend y backend para la app.
- Proveedor de hosting y dominio.
- Plataforma de email/newsletter.
- CMS o estrategia para el blog.
- Herramienta de publicación automática en YouTube/blog.
- Licenciamiento y validación de datos botánicos externos.
