# AGENTS.md — Botánica Esencial OB

> Archivo de reglas y contexto para cualquier agente AI que trabaje en este proyecto.
> **Lee este archivo completo antes de hacer cualquier cambio.**
> GGA (Gentleman Guardian Angel) lo usa para validar commits automáticamente.

---

## 1. ¿Qué es este proyecto?

**Botánica Esencial OB** es una plataforma web para el negocio de cosmética natural artesanal de Olga (y operado digitalmente por Admin).

**Tipo**: plataforma **informativa y didáctica**, NO es e-commerce.

**Audiencia**:
- **Visitantes anónimos** → ven la landing, pueden registrarse
- **Usuarios suscriptores** → acceden al blog (solo registrados), reciben emails informativos
- **Olga** (staff) → su dashboard privado ("laboratorio") para registrar producción
- **Admin** (admin) → dashboard admin para operación digital y publicación

---

## 2. Contexto completo

**Toda la información detallada del proyecto está en:**
- **`ideas/designUI/CONTEXTO_PLATAFORMA.md`** — fuente de verdad (léelo antes de proponer cambios)
- **`img/`** — galería oficial de assets locales. Para galerías de plantas, también se autorizan URLs remotas curadas y persistidas en `images[]`; no se buscan ni generan imágenes arbitrariamente.
- **`ideas/designUI/ejemplo3/`** — referencias visuales de Stitch (no assets finales)

Si tenés una duda sobre QUÉ construir, leé primero el CONTEXTO_PLATAFORMA.md.

---

## 3. Stack tecnológico (NO cambiar sin consultar)

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Frontend + Backend | Next.js 14+ (App Router) | SSR/SSG para SEO, ecosistema maduro |
| Lenguaje | TypeScript | Tipado fuerte, menos bugs |
| Estilos | Tailwind CSS | Rapidez de desarrollo |
| Base de datos | MongoDB | Flexibilidad para datos semi-estructurados |
| Auth | NextAuth.js | Email/contraseña + Google OAuth |
| Hosting | VPS propio (Ubuntu 24.04) | botanicasob.duckdns.org |
| Process manager | PM2 | Ya instalado en VPS |
| Reverse proxy | Nginx 1.24 | Ya instalado en VPS |
| SSL | acme.sh | Ya instalado en VPS |

**Especificaciones del VPS**:
- Ubuntu 24.04.4 LTS, 3.8GB RAM, 2 CPU, 87GB disco libre
- Ya tiene: Node.js, PM2, Docker, Nginx, acme.sh

---

## 4. Reglas de código (OBLIGATORIAS)

### 4.1 Calidad
- **Código limpio y bien estructurado** siempre
- **Nada de parches temporales** ("lo arreglo después") — si algo se hace, se hace bien desde el inicio
- **Los problemas se solucionan y se archivan** en memoria persistente (no se "pierde" el aprendizaje)
- **Se delega cuando es necesario** — usá sub-agentes para tareas grandes
- **Sin emoji en código** (regla del repo)
- **Comentarios solo cuando agreguen valor** (no narrar lo obvio)

### 4.2 Commits
- **Conventional Commits**: `feat:`, `fix:`, `docs:`, `chore:`, `style:`, `refactor:`, `test:`
- **Sin atribución de IA** (nunca añadir `Co-Authored-By: ...` o similar)
- **Un commit por tarea** completada (no megacomits)
- **Push después de cada commit**
- Mensaje en inglés, conciso, descriptivo

### 4.3 Trabajo atómico
- **Una tarea a la vez** — no empezar la siguiente sin cerrar la anterior
- **Si algo falla, se corrige antes de seguir** (no acumular deuda)
- **Tareas pequeñas** que se completen en una sesión

### 4.4 Documentación
- **Todo en `CONTEXTO_PLATAFORMA.md`** (es la fuente de verdad)
- **Session summary al cerrar sesión** vía herramienta de memoria persistente
- **Si descubrís algo importante**, guardalo en memoria

---

## 5. Herramientas obligatorias

### 5.1 Codegraph
**Usar SIEMPRE antes de modificar código existente.** Codegraph indexa el repo y te da el contexto de archivos y símbolos relevantes en una sola llamada.

Cuándo usarlo:
- Antes de editar un archivo que ya existe
- Para entender cómo se conecta un módulo con otros
- Para encontrar dónde se usa una función o variable
- Antes de refactorizar

### 5.2 TDD estricto
**Escribir tests PRIMERO, después el código de producción.**

Ciclo Red-Green-Refactor:
1. **Red**: escribir un test que falla
2. **Green**: escribir el código mínimo para que pase
3. **Refactor**: mejorar el código sin romper el test

**Excepción justificada**: solo si la tarea es puramente visual (UI estática sin lógica) y el usuario lo aprueba explícitamente.

### 5.3 GGA (Gentleman Guardian Angel)
**Pre-commit hook que valida cada commit contra este AGENTS.md usando un LLM (OpenCode).**

Si GGA falla el commit:
1. Leé el feedback del LLM
2. Corregí lo que señala
3. Volvé a hacer `git commit`

Si GGA está en un bucle o no para de fallar por cosas razonables, **avisale al usuario antes de seguir**.

---

## 6. Estructura de trabajo

### 6.1 Fases de producción

El proyecto se construye en **4 fases** (ver CONTEXTO_PLATAFORMA.md para detalles):

1. **Fase 1** — Auth + Landing + Blog + Jardín Digital (cerrada funcionalmente; retoques y Google OAuth aplazados)
2. **Fase 2** — Dominio de plantas: consolidar `plantas` como fuente de verdad, estructura pública vs. interna, carga de plantas, refinar `/jardin-digital` como proyección pública
3. **Fase 3** — Dashboard de Olga (laboratorio): lotes, fases, seguimiento, stock sobre el dominio completo de plantas
4. **Fase 4** — Dashboard de Admin (admin): dashboard real que absorbe la herramienta temporal `/admin/blog/*`

### 6.2 Approach: sección por sección

**La Landing se construye sección por sección** (no toda de una vez):
1. Hero → validar con el usuario
2. Productos preview → validar
3. Y así hasta terminar las 9 secciones

**Razón**: aunque tarde más, evita refactorizar.

**Blog**: mismo enfoque (sección por sección o artículo por artículo, se discute cuando lleguemos).

### 6.3 Validación
- **El agente valida** que cada fase se completó
- **El usuario aprueba** el resultado antes de pasar a la siguiente
- **Cero megafeatures** sin confirmación del usuario

---

## 7. Comunicación con el usuario

- **Una pregunta a la vez** (no bombardear)
- **Pasito a pasito**, no correr
- **Validar la visión del usuario** antes de proponer
- Si hay bucle o repetición, el usuario puede frenarte
- **Tono**: cálido, directo, en rioplatense (español argentino) cuando habla en español
- **Sin emoji en código, código o mensajes** (puede haberlos solo en conversación)

---

## 8. Assets visuales

**Regla de oro**: NO buscar ni generar imágenes arbitrariamente. Los assets locales del proyecto están en `/img`:

- `hero/` — 2 opciones para el hero
- `logo/` — 4 versiones del logo
- `prd/` — productos
- `plts/` — plantas
- `lab/` — laboratorio
- `etk/` — etiquetas
- `aimg/` — auxiliares

**Galerías de plantas**: las URLs reales, curadas y persistidas en `images[]`, preferentemente de Wikimedia Commons cuando estén disponibles, están autorizadas para las galerías públicas e internas. Se procura incluir hasta tres imágenes adecuadas por planta; se aceptan menos cuando no existe una imagen adicional válida. Nunca se inventan URLs ni se usan dominios de ejemplo o placeholder. `/img` no es la única fuente permitida para imágenes de plantas.

Si necesitás una imagen fuera de los assets locales o de las URLs curadas de plantas, **preguntale al usuario** antes de hacer nada.

---

## 9. Lo que NO hacer

- ❌ NO inventar imágenes o assets
- ❌ NO usar emojis en código
- ❌ NO hacer megacomits
- ❌ NO acumular deuda técnica
- ❌ NO asumir decisiones sin preguntar
- ❌ NO correr (ir pasito a pasito)
- ❌ NO saltar la validación del usuario
- ❌ NO usar palabras como "simplemente", "obviamente", "fácilmente"

---

## 10. Resumen rápido

```
¿Podés resumir este proyecto en una línea?
→ Plataforma informativa (no e-commerce) para cosmética natural.
  Next.js + MongoDB en VPS propio. Single-tenant.
  Olga carga producción, Admin publica. Usuarios leen blog.

¿Cuál es el primer paso?
→ SDD de Fase 1: Auth + Landing (sección por sección) + Blog.
```

---

**Antes de cualquier cambio importante, leé `CONTEXTO_PLATAFORMA.md`.**
