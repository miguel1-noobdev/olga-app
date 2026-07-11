# Dominio del laboratorio de Olga

Este documento deja cerrado el dominio base del futuro dashboard/laboratorio de Olga antes de entrar en implementación.

La intención es simple: que el modelo de datos, las reglas principales y la relación entre entidades queden claras antes de discutir pantallas, flujos y código.

## Resumen rápido

El laboratorio se apoya en 4 colecciones principales:

- `plants` -> conocimiento botánico
- `formulas` -> receta madre del producto
- `lots` -> fabricación real de una fórmula
- `aceites` -> tabla técnica de apoyo para formular

## Visión general

| Colección | Rol | Tipo de uso |
|---|---|---|
| `plants` | Dominio completo de plantas | Consulta, edición interna, proyección pública |
| `formulas` | Ficha principal de formulación | Creación, prueba, validación de recetas |
| `lots` | Ejecución real de fabricación | Trazabilidad y seguimiento operativo |
| `aceites` | Tabla técnica auxiliar | Consulta y edición interna para apoyo a formulación |

## 1. `plants`

### Estado actual
Ya existe implementada.

### Propósito
Es la base del conocimiento botánico del proyecto.

### Uso esperado para Olga
- consultar información completa
- corregir datos
- ampliar notas internas

### Regla importante
`plants` tiene dos caras:

- **dominio completo interno** para Olga
- **proyección pública** hacia `/jardin-digital`

La proyección pública oculta datos internos y muestra solo lo necesario para la web pública.

## 2. `formulas`

### Estado actual
Implementada en código.

### Naming cerrado
- en negocio y documentación se sigue hablando de `aceites`
- en código la entidad se implementa en inglés como `Oil`
- en persistencia, la colección técnica correspondiente queda cerrada como `oils`

Esto evita mezclar español e inglés en modelos/repositorios, pero mantiene el lenguaje de Olga en la documentación funcional.

### Propósito
Guardar la receta madre de cada producto.

### Regla mental
**Fórmula = receta**

### Campos obligatorios
- `productName`
- `formulaCode`
- `formulaCreatedAt`
- `formulaVersion`

### Identidad
- `formulaCode` usa formato tipo `CF-001`
- `formulaVersion` usa formato tipo `1.0`, `1.1`, `1.2`

### Clasificación
- `productObjectives`: lista de objetivos
- `productType`: una sola categoría
- `status`: estado de la fórmula

### Estados de fórmula
- `draft`
- `testing`
- `validated`
- `archived`
- `discarded`

### Estructura interna de la fórmula

#### Cabecera
- nombre del producto
- código de fórmula
- fecha de creación
- versión
- objetivos
- tipo de producto
- estado

#### Bloque `formula`
La fórmula no se modela como tabla plana. Se modela por fases opcionales.

- `targetBatchGrams`
- `phases.aqueous[]`
- `phases.oil[]`
- `phases.actives[]`

Cada ingrediente guarda:
- `ingredient` -> texto libre
- `grams` -> número

### Regla sobre porcentajes
Olga trabaja en gramos.

El porcentaje de cada ingrediente:
- **no es editable**
- **no es fuente de verdad**
- se calcula con la fórmula:

`percentage = (grams / targetBatchGrams) * 100`

#### Procedimiento
Lista ordenada de pasos separados.

Cada paso guarda:
- `stepNumber`
- `instruction`

#### Datos técnicos
- `finalPh` -> numérico
- `productionTemperatureCelsius` -> numérico
- `mixingTimeMinutes` -> numérico
- `preservative` -> texto libre
- `fragrance` -> texto libre
- `color` -> texto libre

#### Evaluación del producto
Todos los campos en texto libre descriptivo:
- textura
- color
- olor
- viscosidad
- absorción
- espuma
- estabilidad

#### Prueba de uso
No usa hitos fijos tipo día 7, 15 o 30.

Se modela como seguimiento flexible:
- `approxExpirationDate`
- `entries[]` con:
  - `date`
  - `note`

#### Bloque `inci`
`INCI` es el nombre del bloque, no un campo.

Campos internos del bloque:
- `function`
- `emulsionType`
- `dosage`
- `temperature`
- `compatibility`
- `inconveniences`
- `ph`

Todos quedan, por ahora, como texto libre descriptivo.

#### Observaciones finales
- `finalObservations`
- notas personales de Olga

### Regla de negocio importante
Una fórmula nueva nace como receta base con su propio proceso inicial de formulación y prueba.

Ese proceso inicial vive en `formulas`, no en `lots`.

## 3. `lots`

### Estado actual
Definida conceptualmente. Pendiente de implementación.

### Propósito
Guardar cada fabricación real de una fórmula.

### Regla mental
**Lote = fabricación real de una receta**

### Relación con fórmulas
- cada lote pertenece a una sola fórmula
- una fórmula puede tener muchos lotes

### Regla de nacimiento
- una fórmula nueva nace como receta base con su propio proceso inicial de formulación y prueba
- los `lots` aparecen recién cuando se fabrica más producto a partir de una fórmula ya existente
- una fórmula ya existente puede crear **Lote 1, 2, 3, 4...** dentro de su historial de producción operativa

### Identidad del lote
- `formulaId`
- `formulaCode`
- `formulaVersion`
- `lotNumber`
- `lotCode`

Formato recomendado:
- `lotCode`: `CF-001-L002`

### Estados de lote
- `planned`
- `in_progress`
- `completed`
- `cancelled`

### Regla de cierre
El lote pasa a `completed` cuando termina su seguimiento.

### Datos propios del lote
- `targetBatchGrams`
- `status`
- `followUp.entries[]`
- `operationalObservations`

### Snapshot obligatorio
Cada lote debe guardar un `formulaSnapshot` con los datos necesarios para reproducir esa fabricación concreta.

Ese snapshot debe incluir, como mínimo:
- nombre del producto
- tipo de producto
- fases
- ingredientes y gramos recalculados
- procedimiento usado

### Regla de arquitectura importante
El lote:
- **apunta** a la fórmula madre
- pero también guarda una **foto congelada** de la fabricación

Así, si la fórmula cambia más adelante, los lotes viejos no cambian.

### Lo que NO vive en `lots`
No se replica aquí:
- prueba de uso
- evaluación completa del producto
- bloque INCI
- observaciones finales de la fórmula

Eso sigue viviendo en `formulas`.

## 4. `aceites`

### Estado actual
Definida conceptualmente. Pendiente de implementación.

### Propósito
Tabla técnica auxiliar editable por Olga.

### Regla mental
`aceites` no es receta ni fabricación.
Es conocimiento técnico de apoyo para formular mejor.

### Campos principales
- `name`
- `inciName` opcional
- `hlb`
- `phase`
- `recommendedPercentage`
- `observations`
- `notes`

### Tipado esperado
- `name` -> string
- `inciName` -> string opcional
- `hlb` -> número opcional
- `phase` -> string opcional
- `recommendedPercentage` -> número nullable
- `observations` -> string opcional
- `notes` -> string opcional

### Reglas ya cerradas
- `hlb` es valor técnico real
- `phase` sirve para indicar fase oleosa o acuosa
- `% recomendado` se guarda como número nullable
- si falta dato, en UI se muestra **"No hay dato"**
- la mayoría del resto de campos siguen flexibles por ahora

### Uso esperado para Olga
- consultar aceites
- corregir información
- ampliar información técnica
- apoyarse en esa tabla mientras formula

## Relación general entre colecciones

```text
plants   -> apoyo botánico / glosario / edición interna
formulas -> receta madre
lots     -> fabricación real de una fórmula
aceites  -> tabla técnica auxiliar
```

## Reglas simples del dominio

### Regla 1
Si Olga está creando o probando una receta nueva, trabaja con **fórmulas**.

### Regla 2
Si Olga quiere volver a fabricar una receta que ya existe, crea un **lote**.

### Regla 3
La **prueba de uso** pertenece a la **fórmula**.

### Regla 4
El **seguimiento operativo** pertenece al **lote**.

### Regla 5
`plants` y `aceites` funcionan como tablas de conocimiento editables para apoyar el laboratorio.

### Regla 6
Una fórmula que tenga uno o más lotes asociados **no se puede eliminar**.

- El borrado físico se rechaza mientras existan lotes.
- El camino seguro es archivar la fórmula cambiando su `status` a `archived`.
- No se implementa borrado en cascada ni borrado lógico por ahora.

## Orden recomendado de implementación

1. `formulas`
2. `lots`
3. `aceites`

### Razón
- primero la receta
- después la fabricación
- después la tabla técnica auxiliar

## Qué queda fuera de este documento

Este documento cierra el **dominio**.

Todavía quedan por discutir aparte:
- pantallas del dashboard de Olga
- flujo exacto de navegación
- permisos finos
- decisiones UX
- plan de implementación por pasos

## Conclusión

El dominio del laboratorio queda cerrado así:

- `plants` ya existe como base botánica editable
- `formulas` será la entidad central del laboratorio
- `lots` será la traza operativa de fabricación
- `aceites` será la tabla técnica de apoyo

Con esta base, la implementación en código y el diseño del dashboard ya pueden discutirse sobre una estructura estable.
