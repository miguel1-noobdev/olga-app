# Contexto de la Plataforma — Botánica Esencial OB

> Documento vivo. Se va actualizando con las decisiones del usuario **antes** de lanzar el SDD formal.
> Sirve como base para la fase de propuesta del SDD.

---

## Visión global

Plataforma single-tenant con dos roles diferenciados.

**Acceso por capas:**

| Capa | Quién | Qué ve |
|------|-------|--------|
| Pública | Visitantes anónimos | Landing completa, pueden registrarse |
| Restringida | Usuarios registrados (suscriptores) | Blog (parte de la landing) + emails informativos |
| Privada | Olga (cuenta staff) | Dashboard de producción — su "laboratorio" |
| Privada | Admin (admin) | Dashboard admin — operación digital, publicación, administración |

**Reglas de acceso:**
- Visitantes anónimos: ven la landing completa, NO acceden al blog
- Usuarios suscriptores (registrados con email/contraseña; Google OAuth aplazado): acceden al blog + reciben emails informativos
- Olga y Admin: tienen cuentas con rol especial que los lleva a su dashboard privado
- Los dashboards privados son **apps separadas** que se construyen después, una a una

**Decisión arquitectónica clave**: Single-tenant con dos roles de staff + usuarios suscriptores. NO multi-tenant.

---

## Estado actual: cierre funcional de Fase 1

Fase 1 se considera **cerrada funcionalmente**. Las versiones actuales son aceptables como primera entrega; los retoques estéticos y de UX quedan aplazados.

| Pieza | Estado | Notas |
|-------|--------|-------|
| **Landing** | Primera versión aceptada | Quedan retoques estéticos pendientes |
| **Blog** | Primera versión aceptada | Funcional para lectura y publicación básica |
| **Jardín Digital** | Primera versión aceptada | Vista pública de plantas implementada |
| **Auth** | Email/contraseña operativo | Google OAuth y mejoras de UX de registro quedan aplazadas |

### Decisiones aplazadas (deferred)
- **Google OAuth**: cableado en la config de NextAuth pero no expuesto en UI; se activará en una fase posterior.
- **Mejoras de UX de registro**: flujo actual funcional, optimizaciones posteriores.
- **Retoques estéticos de landing**: micro-ajustos visuales, no bloqueantes.

### Sobre `/admin/blog/*` (herramienta temporal)
- El formulario en `/admin/blog/nuevo` y sus rutas asociadas existen **solo para crear artículos de forma rápida** mientras no hay dashboard admin real.
- **No es el hogar definitivo** del admin de contenido: su lugar correcto es el futuro **dashboard de Admin (admin)**.
- Cuando se construya el dashboard admin, esta herramienta provisional será absorbida por él.

### Modelo de datos de plantas
- **`plantas` (glosario botánico)**: es el **dominio fuente de verdad completo**. Contiene todas las fichas técnicas, propiedades, contraindicaciones, extractos y relaciones posibles.
- **`/jardin-digital`**: es la **representación visual pública** de *una parte* de ese dominio. Los visitantes registrados ven solo lo que se decide proyectar; el dominio completo permanece disponible para los dashboards privados.
- El futuro **dashboard de Olga** accederá al dominio completo de plantas (no solo a la vista pública).

---

## Roles y modelo de negocio

### Usuarios suscriptores (públicos)
- Registro con **email/contraseña** (Google OAuth aplazado)
- Acceso a un **blog** (contenido restringido a registrados)
- Reciben **emails informativos** cuando Olga publica nuevas creaciones o productos
- **NO es e-commerce** — la web es informativa y didáctica
- Sin pagos, sin carrito, sin checkout, sin pedidos, sin facturación

### Olga (rol: productora / staff)
- Carga datos de producción desde su casa a través de **su dashboard privado**
- Datos típicos: productos, recetas, procesos, fotos, materia prima
- No publica directamente en el blog

### Admin (rol: admin / operador digital / staff)
- Extrae datos de la base
- Curación, redacción, publicación de artículos del blog
- Administración de la plataforma (usuarios, BD, automatizaciones, datos, redes)

### Registro / autenticación
- **Un solo flujo de registro** para todos los usuarios (suscriptores, Olga, Admin)
- Registro con **email/contraseña** (único camino habilitado en UI por ahora)
- **Google OAuth aplazado**: cableado en la configuración de NextAuth pero no expuesto en UI; se activará en una fase posterior
- **Primer usuario registrado = admin automáticamente** (Admin)
- Admin asigna roles después: `suscriptora` → `productora` (Olga)
- Olga puede usar el blog desde el día 1, sin esperar su dashboard

---

## Stack técnico

**Decisión**: Next.js 14+ (App Router) + MongoDB en VPS propio

### Stack completo

| Capa | Tecnología | Razón |
|------|-----------|-------|
| Frontend + Backend | Next.js 14+ (App Router) | SSR/SSG para SEO, ecosistema maduro, popular |
| Base de datos | MongoDB | Flexibilidad para datos variables (plantas, laboratorio) |
| Auth | NextAuth.js | Email/contraseña + Google OAuth resuelto en pocas líneas |
| Hosting | VPS propio (Ubuntu 24.04) | botanicasob.duckdns.org |
| Process manager | PM2 | Ya instalado en el VPS |
| Reverse proxy | Nginx 1.24 | Ya instalado en el VPS |
| SSL | acme.sh | Ya instalado en el VPS |
| Imágenes | Estáticas en /img | Ya disponibles, no se busca ni genera nada |
| Emails | Por definir (SMTP) | Pendiente |

### Specs del VPS

- **OS**: Ubuntu 24.04.4 LTS
- **RAM**: 3.8GB total, 2.1GB disponible
- **CPU**: 2 cores
- **Disco**: 116GB, 87GB disponible
- **Ya instalado**: Node.js, PM2, Docker, Nginx, acme.sh

### Estado de la infraestructura

✅ DNS: `botanicasob.duckdns.org` → IP del VPS (212.227.149.125)
✅ Nginx respondiendo (redirige HTTP a HTTPS)
✅ Otros subdominios funcionando: clau-app.duckdns.org, engram-cloud.duckdns.org, jessnails
❌ Falta: server block específico para botanicasob en nginx
❌ Falta: certificado SSL para botanicasob.duckdns.org
❌ Falta: deploy de la app Next.js

### Justificación del stack

- **Next.js** sobre alternativas: más popular, mejor documentación, NextAuth maduro, deploy simple con PM2
- **MongoDB** sobre PostgreSQL+JSONB: las plantas tienen datos semi-estructurados (campos fijos + listas variables + texto libre), el laboratorio tiene campos que varían por lote
- **VPS propio** sobre cloud: el usuario quiere tener todo alojado en su servidor
- **Sin Docker obligatorio**: se puede deployar con PM2 directamente, Docker queda como opción para futuro

### Colecciones MongoDB

1. `plantas` — fichas técnicas (NotebookLM)
2. `usuarios` — auth y roles
3. `laboratorio` — producción de Olga (lotes, extractos, observaciones, fases)

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
- 13 landing pages HTML exportadas de Stitch están disponibles como referencia visual
- 4 sistemas de diseño (DESIGN.md) con paletas comparadas
- Mapa completo en `ideas/designUI/ejemplo3/INDEX.md`

## Carpeta `ideas/` (planificación, NO se deploya)

- **Contiene**: CONTEXTO_PLATAFORMA.md, ejemplos de Stitch, OpenPencil, diseños previos
- **NO se deploya al VPS** — es solo para trabajo de planificación
- **Se elimina cuando todo esté funcionando** (temporal)
- En el proceso de deploy hay que **excluir esta carpeta** del upload al servidor

---

## Pieza por pieza (decisiones del usuario)

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
4. **Journal**: 3 tarjetas con últimas entradas del blog → **página aparte** (solo registrados)
5. **Jardín Digital**: preview de 3-4 plantas con tarjetas → acceso a `/jardin-digital` (solo registrados)
6. **Presentación**: "Detrás de la marca" con foto circular de Olga + cita
7. **Únete**: registro de usuarios
8. **Acceso a redes**: botones grandes o tarjetas que enlacen a redes sociales
9. **Footer**: grande y bonito, contenido a decidir durante la construcción

**Páginas separadas (no en la landing):**
- Productos (página informativa)
- Blog (solo registrados)
- Jardín Digital (`/jardin-digital`, solo registrados)

**Presentacion de Olga (seccion en la landing)**
- **Formato**: "Detrás de la marca" con foto circular de Olga
- Título tipo: "Soy Olga, tu alquimista botánica"
- Texto descriptivo sobre su pasión y proceso
- Cita destacada con borde lateral (estilo warm, más personal que el glassmorphism)

**Acceso a redes (seccion en la landing)**
- **Formato**: botones grandes o tarjetas que enlacen a las redes sociales
- Diseño simple y directo

**Footer**
- **Formato**: grande y bonito
- Contenido a decidir durante la construcción (navegación, contacto, redes, legal, etc.)

**Referencias adicionales para la construcción**
- `ideas/designUI/ejemplo3/landing_page_premium_botanica_esencial/code.html` (2º puesto en votaciones)
- Se usará como fuente de ideas generales para ir incorporando secciones bonitas durante la construcción paso a paso de la landing

---

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
- **Autores**: sistema flexible (Admin ahora, Olga después si aprende)
- **Imágenes destacadas**: siempre obligatorias
- **Búsqueda**: habilitada
- **Newsletter**: integrado

**Modelo de datos:**
- Artículos: título, contenido, imagen destacada, categoría (Recursos/Blog), autor, fecha, tags
- Comentarios: texto, autor (usuario registrado), artículo, fecha, estado (activo/eliminado)
- Categorías: Recursos, Blog (fijas por ahora, escalables)

---

### Jardín Digital (`/jardin-digital`)
- **Acceso**: solo usuarios registrados
- En la landing: 3-4 tarjetas informativas + acceso al Jardín Digital
- Es la **vista pública del dominio de plantas**: muestra una selección/proyección de las fichas técnicas
- **NO contiene todo el dominio**: el glosario completo (`plantas`) es la fuente de verdad y se usará desde los dashboards privados

---

### Dashboard de Olga (laboratorio)
*En construcción con el usuario*

**Acceso**: `botanicaob.com/laboratorio` (mismo patrón que `/admin` para Admin)

### Archivo reconciliado: experimento de UI de Laboratorio descartado
- El experimento `feat/laboratorio-hub-stitch` queda descartado: no se incorpora código, QA ni documentación de implementación como autoridad.
- El futuro diseño se crea y aprueba en Stitch como en Figma, página por página: primero escritorio y luego móvil; recién después se implementa código.
- El hub privado conserva intención y copy en español: saludo fijo `Hola, Olga`, acción secundaria `Nueva fórmula` y sin panel de workflow.
- Sus cuatro dominios y rutas canónicas son: `Fórmulas` (`/laboratorio/formulas`), `Lotes` (`/laboratorio/lotes`), `Mi jardín` (`/laboratorio/plantas`) y `Mis aceites` (`/laboratorio/aceites`).
- La navegación conserva enlace de marca al hub (`/laboratorio`), pestañas de escritorio desde `640px`, y navegación móvil solo con iconos accesibles, etiquetas programáticas y objetivos de al menos `44px`. El cierre de sesión sigue separado y conserva su callback de retorno.
- Dirección de producto global: Laboratorio oscuro por defecto, con selector claro/oscuro. Los tokens visuales y la composición se redefinen desde las nuevas pantallas de Stitch aprobadas; no se copian del experimento descartado.

**Visualización**: Tablero **Kanban vitaminado** (idea, no religión — puede evolucionar)
- Prioridad: **rapidez de carga**
- **NO** dashboard con números grandes
- **SÍ** tablero donde cada tarjeta es un lote y se mueve entre columnas según su estado
- Cada tarjeta muestra: nombre del producto, lote, último seguimiento, próximo seguimiento
- Calendario/vista de seguimiento integrado

**Estructura del Kanban (3 columnas):**
1. **En producción** — lotes en F.A. + F.O. con seguimiento activo
2. **En stock** — lotes aptos para uso, con seguimiento post-uso
3. **Archivados** — lotes sin seguimiento activo

*Detalles finales se concretarán en la fase de creación*

**Flujo real de Olga (basado en su cuaderno):**
- Cada producto se identifica por un **LOTE** único (ej: Lote 100100620261)
- La APP es escalable (poder crecer, añadir fases, funcionalidades, productos)
- Cada lote tiene **FASES** definidas por polaridad de ingredientes:
  - **F.A. (Fase Acuosa)**: ingredientes solubles en agua (hidrolatos, aloe, glicerina)
  - **F.O. (Fase Oleosa)**: ingredientes solubles en aceite (oleatos, mantecas, aceites)
  - (Si surgen más, se añadirán después)
- Cada fase tiene **INGREDIENTES con PORCENTAJES** (deben sumar 100%)
- Cada lote tiene **SEGUIMIENTO TEMPORAL** con fechas y observaciones:
  - Color, textura, olor
  - Separación, burbujas
  - Notas libres
  - Puede haber campos variables según lo que Olga quiera anotar
- **Siempre hay imagen/URL** del cuaderno original o del producto fabricado

**Ciclo canónico del lote:**
1. Crear lote en `in_production` (En producción).
2. Registrar seguimiento y observaciones append-only durante la producción.
3. Cerrar normalmente en `finalized` (Finalizado), o salir de forma terminal en `discarded` (Descartado).
4. Un lote finalizado permanece en la misma colección como histórico; su seguimiento y observaciones append-only siguen disponibles indefinidamente.

**Estados del lote:**
- `in_production` — en producción y pruebas; único estado operativo editable.
- `finalized` — histórico terminal; conserva seguimiento append-only.
- `discarded` — salida terminal; conserva seguimiento append-only.

**Estructura del documento `laboratorio`:**
```json
{
  "lote": "100100620261",
  "producto": { "nombre": "Crema Facial Hidratante", "tipo": "Crema", "peso_total": "100gr" },
  "fecha_creacion": "2026-06-05",
  "autora": "Olga",
  "estado": "en_seguimiento",
  "fases": [
    {
      "nombre": "F.A. (Fase Acuosa)",
      "ingredientes": [
        { "nombre": "Hidrolato Rosa", "porcentaje": 55, "gramos": 55 },
        { "nombre": "Aloe Vera", "porcentaje": 10, "gramos": 10 },
        { "nombre": "Glicerina", "porcentaje": 5, "gramos": 5 }
      ]
    },
    {
      "nombre": "F.O. (Fase Oleosa)",
      "ingredientes": [
        { "nombre": "Oleato Rosas", "porcentaje": 8, "gramos": 8 },
        { "nombre": "Rosa Mosqueta", "porcentaje": 5, "gramos": 5 },
        { "nombre": "Manteca Karité", "porcentaje": 5, "gramos": 5 },
        { "nombre": "Aceite Lavanda", "porcentaje": 5, "gramos": 5 },
        { "nombre": "Oleato Aguacate", "porcentaje": 4, "gramos": 4 }
      ]
    }
  ],
  "seguimiento": [
    {
      "fecha": "2026-06-11",
      "observaciones": {
        "color": "bien",
        "textura": "sin grumos",
        "olor": "normal",
        "nota": "Siento la piel hidratada, funciona"
      }
    },
    {
      "fecha": "2026-06-12",
      "observaciones": {
        "color": "estable",
        "textura": "bolitas diminutas de aceite",
        "nota": "Sudor, pero por lo demás bien"
      }
    },
    {
      "fecha": "2026-06-15",
      "observaciones": {
        "separacion": "aceite",
        "burbujas": "pequeñas"
      }
    },
    {
      "fecha": "2026-06-19",
      "observaciones": {
        "color": "mismo",
        "textura": "ha mejorado",
        "burbujas": "estables"
      }
    }
  ],
  "instrucciones_uso": {
    "modo_de_uso": "Aplicar sobre el rostro limpio, mañana y noche",
    "beneficios": "Hidratación profunda, piel suave, sin grumos",
    "fecha_documento": "2026-06-19"
  },
  "imagenes": [
    { "tipo": "cuaderno_original", "url": "/img/lab/cuaderno_100100620261.jpg", "fecha": "2026-06-05" },
    { "tipo": "producto_fabricado", "url": "/img/lab/crema_100100620261.jpg", "fecha": "2026-06-19" }
  ]
}
```

**Ejemplo de planta (colección `plantas`):**
```json
{
  "nombre_comun": "Lavanda / Espliego",
  "especie": "Lavandula angustifolia Mill.",
  "familia": "Lamiaceae",
  "partes_usadas": ["Flores", "Sumidades floridas"],
  "compuestos": [
    { "nombre": "Linalool", "porcentaje": "25-38%" },
    { "nombre": "Acetato de linalilo", "porcentaje": "25-45%" },
    { "nombre": "Lavandulol" },
    { "nombre": "Terpinen-4-ol" }
  ],
  "propiedades": {
    "oral": ["Ansiolítico", "Sedante", "Neuroprotector"],
    "topico": ["Antiinflamatorio", "Cicatrizante", "Antiséptico", "Regenerador cutáneo"]
  },
  "contraindicaciones": [
    "Hipersensibilidad a la planta",
    "No baños con heridas abiertas",
    "No oral en embarazo/lactancia/niños <12"
  ],
  "extractos_disponibles": [
    { "tipo": "Aceite Esencial", "metodo": "Destilación por arrastre de vapor", "descripcion": "100% puro" },
    { "tipo": "Hidrolato", "descripcion": "Agua floral rica en polifenoles" },
    { "tipo": "Extracto CO2", "descripcion": "Alta estabilidad y pureza de activos" }
  ]
}
```

**Conexión con plantas:** Cada ingrediente puede tener un `planta_id` que lo conecta con la colección `plantas` (ej: "Aceite Lavanda" → planta Lavandula angustifolia)

---

### Dashboard de Admin (admin)
*Pendiente*

---

## Reglas de trabajo

### Estructura del SDD
- **Spec**: qué tiene que hacer (requisitos, escenarios)
- **Design**: cómo lo hace (arquitectura, archivos, decisiones técnicas)
- **Tasks**: tareas pequeñas y verificables (chequeables una a una)
- **Apply**: implementación paso a paso

### Commits y versionado
- **Conventional commits**: `feat:`, `fix:`, `docs:`, `chore:`, `style:`, `refactor:`
- **Sin atribución de IA** (regla del repo)
- **Un commit por tarea** completada (no megacomits)
- Push después de cada commit

### Trabajo atómico
- **Una tarea a la vez**, no empezar la siguiente sin cerrar la anterior
- **Si algo falla, se corrige antes de seguir** (no acumular deuda)
- **Tareas pequeñas** que se completen en una sesión

### Approach de construcción por secciones
- **La Landing se construye sección por sección** (no toda de una vez)
- Cada sección se valida con el usuario antes de seguir a la siguiente
- **Aunque tarde más**, evita refactorizar
- **Blog**: mismo enfoque, se discute cuando lleguemos ahí

### Calidad de código
- **Código y archivos limpios y bien estructurados**
- **Se delega cuando es necesario** (sub-agentes cuando aplique)
- **Nada de parches temporales** — si algo se hace, se hace bien desde el inicio
- **Los problemas se solucionan y se archivan** (memoria persistente)

### Documentación
- **Todo en `CONTEXTO_PLATAFORMA.md`** (es la fuente de verdad)
- **Session summary al cerrar sesión** (memoria persistente)
- **Comentarios en código solo cuando agreguen valor** (no narrar lo obvio)
- **Sin emoji en código** (regla del repo)

### Feedback bidireccional
- Yo aviso si algo no tiene sentido técnico
- Vos podés parar, ajustar o cambiar el scope en cualquier momento
- Decisiones de scope: **vos decidís**, yo propongo con razones

### Validación antes de avanzar
- **Yo valido** que cada fase se completó (no vos)
- **Vos aprobás** el resultado antes de pasar a la siguiente
- **Cero megafeatures** sin tu confirmación

### Deploy
- **Local primero**, deploy al VPS solo cuando algo esté cerrado
- **Server block de nginx + SSL** se configura al deploy final
- **PM2** para mantener la app corriendo

### Comunicación
- **Una pregunta a la vez** (no bombardear)
- **Pasito a pasito**, no correr
- **Validar tu visión** antes de proponer
- Si hay bucle, me frenas

---

## Próximas tareas

### Fases de producción (vigentes)

**Fase 1 — Auth + Landing + Blog** *(cerrada funcionalmente)*
- Auth email/contraseña, landing, blog y Jardín Digital como primeras versiones aceptables.
- Google OAuth, mejoras de registro y retoques estéticos quedan aplazados.

**Fase 2 — Dominio de plantas y proyección pública**
- Consolidar el dominio de plantas (`plantas`) como fuente de verdad.
- Definir la estructura de datos pública vs. interna.
- Continuar la carga de plantas (lavanda como primera, más fichas siguientes).
- Refinar `/jardin-digital` como proyección pública de una parte del dominio.

**Fase 3 — Dashboard de Olga (laboratorio) y flujos reales**
- Construir el dashboard de Olga sobre el dominio completo de plantas.
- Lotes, fases (F.A., F.O.), seguimiento temporal, stock y observaciones.
- Flujos reales de trabajo a partir de su cuaderno de producción.

**Fase 4 — Dashboard de Admin (admin)**
- Dashboard admin real.
- Absorbe la herramienta temporal `/admin/blog/*` para gestión de contenido.
- Administra usuarios, datos, automatizaciones y publicación.

### Tareas previas a la producción
- Consolidar contexto y lanzar SDD formal de Fase 2
- Definir emails (SMTP) cuando llegue el momento

---

## Preguntas pendientes
- ¿Olga puede duplicar un lote como base para uno nuevo?
- ¿Necesita ver histórico de lotes?
- ¿Necesita alertas? (materia prima baja, lote sin seguimiento)
- ¿Hay más fases además de F.A. y F.O.?
- ¿Quién puede editar qué en el laboratorio? (¿Olga sola o Admin también?)
