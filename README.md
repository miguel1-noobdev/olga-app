# olga-app

Plataforma web para **Botánica Esencial OB** — negocio de cosmética natural artesanal de Olga.

## Tipo de proyecto

Plataforma **informativa y didáctica** (no e-commerce). Single-tenant, con dos roles de staff (Olga como productora, Miguel como admin) y usuarios suscriptores.

## Stack

- **Frontend + Backend**: Next.js 14+ (App Router)
- **Base de datos**: MongoDB
- **Auth**: NextAuth.js
- **Hosting**: VPS propio (Ubuntu 24.04, 3.8GB RAM, 2 CPU) — `botanicasob.duckdns.org`
- **Process manager**: PM2
- **Reverse proxy + SSL**: Nginx + acme.sh
- **Estilos**: Tailwind CSS

## Estructura

```
olga-app/
├── ideas/              # Contexto y planificación (NO se deploya)
│   └── designUI/
│       └── CONTEXTO_PLATAFORMA.md   # Fuente de verdad del proyecto
├── img/                # Galería de imágenes oficial
│   ├── hero/
│   ├── logo/
│   ├── prd/            # Productos
│   ├── plts/           # Plantas
│   ├── lab/            # Laboratorio
│   ├── etk/            # Etiquetas
│   └── aimg/           # Auxiliares
└── [código fuente]     # Se generará durante el SDD
```

## Estado actual

**Fase de planificación cerrada.** Contexto completo en `ideas/designUI/CONTEXTO_PLATAFORMA.md`.

**Próxima fase**: SDD formal para Auth + Landing + Blog (Fase 1), construido sección por sección.

## Convenciones

- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `style:`, `refactor:`
- **Sin atribución de IA** en commits
- **Un commit por tarea** completada
- **Documentación centralizada** en `CONTEXTO_PLATAFORMA.md`

## Desarrollo local

### Requisitos

- Node.js (ver `package.json`)
- Docker Desktop (Windows) o Docker Engine (Linux/WSL)

### Levantar MongoDB local

La base de datos corre en un contenedor Docker con un volumen persistente:

```bash
docker compose up -d mongo
```

Esto expone MongoDB solo en `localhost:27017` usando el volumen `mongo-data`.

El archivo `.env.local` ya contiene la URI por defecto:

```bash
MONGODB_URI=mongodb://localhost:27017/botanica-ob
```

### Tests

```bash
npm run test:run
```

## Ver también

- [CONTEXTO_PLATAFORMA.md](./ideas/designUI/CONTEXTO_PLATAFORMA.md) — Contexto completo del proyecto
- [AGENTS.md](./AGENTS.md) — Reglas para agentes AI que trabajen en este proyecto
