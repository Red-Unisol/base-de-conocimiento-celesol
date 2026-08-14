# Carga del material — Ahorros y AMT

## Estado actual verificado

- Las 6 categorías ya existen en la base (Contabilidad, Cobranzas, **Ahorros y AMT**, Mesa de Entrada, Análisis, Management) y hoy no hay ningún proceso cargado (0 en total).
- El panel `/admin` ya permite: carga individual completa, carga masiva de MP4 (crea borradores) y panel de migración con contador y exportación CSV.
- Falta una pieza para poder trabajar por tandas: **no existe pantalla para editar un proceso ya cargado**. Hoy, si un borrador queda incompleto, sólo se puede eliminar y volver a subirlo. Eso bloquea el flujo "subo los videos primero, después completo los datos".

## Qué se agrega antes de empezar la carga

1. **Edición de procesos** (`/admin/proceso/$id`): mismo formulario que la carga individual, pero cargado con los datos existentes. Permite cambiar título, categoría, etiquetas, resumen, autor, duración y URL de Trupeer; reemplazar o agregar el video, el documento y los adjuntos; borrar adjuntos; y pasar de borrador a publicado.
2. **Botón "Completar" en el panel de migración**, junto a cada proceso, que lleva a esa pantalla de edición.
3. **Filtro por categoría y por estado** en el panel de migración, para trabajar sólo sobre "Ahorros y AMT" sin ver el resto.
4. **Categoría por defecto en la carga masiva**: al subir varios MP4 se elige antes la categoría (Ahorros y AMT), así los borradores ya nacen clasificados y aparecen en el filtro.
5. **Etiquetas del sector**: se agregan etiquetas propias de Ahorros y AMT — Cuenta de ahorro, Plazo fijo, AMT, Acreditaciones, Débitos, Cierre de cuenta — sumadas a las existentes.

## Cómo va a ser la carga (flujo de trabajo)

```text
Trupeer  →  descargás MP4 + documento por proceso  →  /admin
   1) Carga masiva: seleccionás todos los MP4 de Ahorros y AMT
   2) Quedan como borradores, ya con la categoría asignada
   3) Panel de migración filtrado por Ahorros y AMT
   4) "Completar" en cada uno: documento, resumen, etiquetas, duración
   5) Publicar
```

Alternativa para pocos procesos: carga individual, que sube video + documento + datos en un solo paso y publica directo.

## Recomendaciones para la primera tanda

- Nombrá los MP4 con el título final del proceso (ej. `Apertura de caja de ahorro.mp4`): el título del borrador se toma del nombre del archivo.
- Subí de a 5 a 8 videos por tanda para controlar el resultado antes de seguir.
- El documento se puede cargar como archivo (PDF/DOCX) y además pegar el texto en Markdown; el texto pegado es el que alimenta el buscador y la futura búsqueda con IA, así que conviene pegarlo siempre.
- Un proceso se marca como completo cuando tiene video, documento, resumen y categoría.

## Detalles técnicos

- Nueva ruta `src/routes/_authenticated/admin.proceso.$id.tsx` (protegida y con verificación de rol admin, igual que `/admin`).
- En `src/lib/kb.ts`: `fetchProcessById`, `updateProcess` (patch de campos + subida opcional de nuevos archivos con reemplazo de path), `deleteAttachment` (borra fila y objeto del bucket) y `addAttachments`.
- `createDraftFromVideo` acepta `categoryId` opcional.
- El panel de migración recibe estado local de filtros (categoría / estado) sobre el listado ya consultado con `includeDrafts: true`.
- Migración SQL sólo para insertar las nuevas etiquetas del sector (`INSERT ... ON CONFLICT DO NOTHING`); no cambia el esquema.
