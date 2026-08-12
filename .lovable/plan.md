# Etapa 2 — Backend con Lovable Cloud y migración del material de Trupeer

## Decisión de backend

Se usa Lovable Cloud: base de datos, almacenamiento de archivos, login y funciones de servidor quedan provisionados dentro del proyecto, sin cuentas externas ni configuración manual de claves. Es la misma tecnología de base que un proyecto propio, pero administrada desde acá, así que puedo crear tablas, buckets y políticas directamente y ver su estado.

## Qué se construye

1. **Base de datos**: categorías, etiquetas, procesos, relación proceso–etiqueta, adjuntos y roles de usuario.
2. **Almacenamiento privado**: buckets para videos MP4, documentos y adjuntos, con acceso sólo para usuarios autenticados mediante enlaces firmados.
3. **Acceso real**: ingreso con correo y contraseña. Sólo el rol administrador puede cargar y editar; el resto consulta.
4. **Carga en `/admin`**: formulario individual con título, categoría, etiquetas, video MP4, documento (PDF/DOCX/Markdown), adjuntos, resumen y URL original de Trupeer.
5. **Carga masiva (modo migración)**: se arrastran varios MP4 juntos; cada uno queda como borrador con el título tomado del nombre del archivo y luego se completa la ficha.
6. **Panel de migración**: listado con estado por proceso (borrador / completo), qué falta (video, documento, resumen) y contador "X de 55 migrados".
7. **Datos reales**: el buscador, el catálogo por categoría y la ficha de proceso pasan a leer de la base en lugar de los datos de ejemplo.

## Cómo se sube el material de Trupeer

Trupeer no ofrece exportación automática, así que la descarga del MP4 y del documento se hace desde Trupeer video por video. Todo lo posterior queda automatizado en la app.

```text
Trupeer  →  descarga MP4 + documento  →  formulario /admin  →  almacenamiento propio
                                                            →  ficha del proceso
```

## Garantías de no perder nada

- Cada archivo vive en el almacenamiento del proyecto, no en Trupeer.
- Cada proceso guarda la URL original de Trupeer para trazabilidad.
- Un proceso no se marca "completo" si le falta el video o el documento.
- Los archivos se pueden volver a descargar desde la ficha en cualquier momento.
- Exportación del inventario en CSV como respaldo del catálogo.

## Reproductor

Reproductor propio HTML5 sobre el MP4 almacenado, con miniatura y descarga directa. Si un proceso todavía no tiene MP4 subido, se muestra el embed de Trupeer como respaldo temporal.

## Fuera de alcance de esta etapa

La búsqueda semántica con IA sobre el contenido queda para la etapa 3, cuando el material ya esté cargado.

## Detalles técnicos

- Tablas `categories`, `tags`, `processes`, `process_tags`, `attachments` y `user_roles` con función `has_role`; RLS activo: lectura para autenticados, escritura sólo admin, y los GRANT correspondientes en cada tabla nueva.
- `processes` con `video_path`, `video_source_url`, `document_path`, `document_markdown`, `status` (`draft` | `published`) y `updated_at`.
- Buckets privados `process-videos`, `process-docs`, `process-attachments`; subida directa desde el navegador con barra de progreso y carga reanudable para MP4 grandes.
- Lecturas y escrituras a través de funciones de servidor de TanStack Start (`createServerFn`); las rutas de administración pasan al subárbol autenticado.
- Migración inicial con INSERT de las categorías y etiquetas existentes.
- Corrección menor: las fechas de las tarjetas se formatean con la configuración regional del navegador y desajustan al hidratar; se fija formato `es-AR` con zona horaria explícita.
