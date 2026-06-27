# Modelo de datos para el inventario botánico

## Idea clave

Usar NotebookLM como **fuente semilla** de fichas botánicas. Cada planta genera dos caras:

1. **Vista técnica / laboratorio**: ficha completa con compuestos, porcentajes, partes usadas, extractos y contraindicaciones. Es la que usaría la app privada de formulación y fabricación.
2. **Vista divulgativa / web**: resumen limpio y seguro para mostrar al público en la web informativa.

## Decisión de diseño provisional

**No son dos tablas separadas.** Es la misma entidad `plant` vista desde dos ángulos. La tabla central guarda todos los datos técnicos; la web simplemente muestra un subconjunto de campos.

Esto evita duplicar información y que los datos técnicos y web se desincronicen con el tiempo.

## Preocupación abierta: tablas enormes

Cada planta puede tener compuestos que otras no tienen. Si metemos todo en columnas fijas de una tabla `plants`, la tabla se vuelve ancha y rígida.

Opciones para resolverlo:

- **EAV (Entity-Attribute-Value)**: flexible pero difícil de consultar y mantener.
- **Tablas relacionadas normalizadas**: `plants`, `plant_compounds`, `plant_properties`, `plant_contraindications`, `plant_extracts`, etc. Cada compuesto/propiedad es una fila. Más trabajo inicial, pero más limpio y escalable.
- **Híbrida**: campos comunes en `plants` (nombre, familia, descripción) y compuestos variables en tablas relacionadas.

## Ejemplo concreto: Lavanda

La ficha de Lavandula angustifolia Mill. tiene:

- Datos base: nombre común, especie, familia, descripción.
- Partes usadas: sumidades floridas.
- Compuestos con rangos: Linalol (25-38%), Acetato de linalilo (25-45%), etc.
- Propiedades: ansiolítico, sedante, antiinflamatorio, cicatrizante, antiséptico.
- Contraindicaciones: hipersensibilidad, heridas abiertas, embarazo/lactancia vía oral.
- Extractos: aceite esencial, hidrolato, extracto de CO2, oleato, glicerito.

## Siguientes pasos (cuando se retome)

1. Generar más fichas con NotebookLM para ver qué campos se repiten y cuáles son variables.
2. Decidir si se normaliza todo o se usa un modelo híbrido.
3. Definir el schema inicial en SQL/Prisma/TypeORM (según el stack que elijamos).
4. Pensar cómo versionar la fuente (¿de dónde salió cada dato? ¿quién lo validó?).

## Estado

Fase de ideación. No implementar todavía. Este documento es un borrador para seguir refinando.
