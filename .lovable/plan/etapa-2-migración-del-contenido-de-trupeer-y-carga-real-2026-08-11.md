# Etapa 2 — Migración del contenido de Trupeer y carga real

## Cómo se sube el material (respuesta corta)

Trupeer no ofrece hoy una API pública para exportar la biblioteca de forma automática. La descarga del MP4 y del documento se hace desde Trupeer, video por video. Lo que sí podemos automatizar es todo lo que viene después: la app va a tener un cargador que sube el archivo, extrae los datos y deja el material guardado en nuestro propio almacenamiento.

Decisión tomada: el MP4 propio es la fuente principal de reproducción. El embed de Trupeer queda como dato opcional de referencia. Si mañana se cierra la cuenta de Trupeer, la base de conocimiento sigue funcionando completa.

## Flujo de carga

```text
Trupeer  →  descarga MP4 + documento  →  formulario /admin  →  almacenamiento propio
                                                            →  ficha del proceso
```

Para los 55 procesos existentes:

1. **Carga individual** desde `/admin`: título, categoría, etiquetas, video MP4, documento (PDF/DOCX/Markdown), adjuntos y resumen.
2. **Carga masiva (modo migración)**: pantalla donde se arrastran varios MP4 de una vez. Cada archivo queda como borrador con el título tomado del nombre del archivo, y después se completan categoría, etiquetas y documento uno por uno. Esto reduce mucho el trabajo de los 55.
3. **Panel de control de migración**: listado con estado de cada proceso (borrador / completo), qué le falta (video, documento, resumen), y contador "X de 55 migrados". Ese es el control sobre lo almacenado en Trupeer que buscás.

## Garantías de no perder nada

- Todo archivo vive en el almacenamiento propio del proyecto, no en Trupeer.
- Cada proceso registra la URL original de Trupeer para trazabilidad.
- Estado de integridad por proceso: no se marca como "completo" si falta el video o el documento.
- Los archivos se pueden volver a descargar desde la ficha del proceso en cualquier momento.
- Exportación del inventario completo (CSV) para tener un respaldo del catálogo fuera de la app.

## Reproductor

Reproductor propio HTML5 sobre el MP4 almacenado, con póster (miniatura) y descarga directa. Si un proceso todavía no tiene MP4 subido, muestra el embed de Trupeer como respaldo temporal hasta completar la migración.

## Alcance de esta etapa

- Backend con base de datos y almacenamiento (Lovable Cloud)
- Tablas: `categories`, `tags`, `processes`, `process_tags`, `attachments`, roles de usuario
- Buckets privados para videos, documentos y adjuntos
- Login real con email/contraseña y rol administrador (solo admin carga y edita)
- Formulario `/admin` funcional + carga masiva + panel de migración
- El buscador y las fichas pasan a leer datos reales

La búsqueda semántica con IA sobre el contenido queda para la etapa 3, una vez que el material esté cargado.

## Detalles técnicos

- Supabase Storage: buckets privados `process-videos`, `process-docs`, `process-attachments`, con URLs firmadas y política de lectura para usuarios autenticados.
- Subida directa del navegador al bucket con progreso por archivo; los MP4 grandes usan carga reanudable para que no se corte a mitad.
- `processes` guarda `video_path`, `video_source_url` (Trupeer), `document_path`, `document_markdown`, `status` (`draft` | `published`) y `updated_at`.
- Roles en tabla `user_roles` aparte con función `has_role`; RLS: lectura autenticada, escritura solo admin.
- Migración con INSERTs de las categorías y etiquetas iniciales.
- Corrección menor pendiente: las fechas de las tarjetas se formatean con la configuración regional del navegador y provocan un desajuste al hidratar; se pasa a un formato fijo `es-AR` con zona horaria explícita.
