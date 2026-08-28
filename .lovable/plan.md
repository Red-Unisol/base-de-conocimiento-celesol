# Informe institucional de la Base de Conocimiento (versión 2)

Nuevo documento Word con la identidad UNISOL (azul #182540, verde #6AAF9E, Montserrat/Arial), que actualiza el informe de agosto e incorpora la etapa de búsqueda con IA real.

Se genera como archivo nuevo `Informe-Base-de-Conocimiento-UNISOL-v2.docx`, sin pisar el informe original.

## Contenido del informe

1. **Portada y resumen ejecutivo** — qué es la base de conocimiento, para qué sirve y estado actual.
2. **Cómo funciona** — acceso privado por código de correo, navegación por categorías, ficha de proceso con video de Drive, documento PDF embebido y adjuntos.
3. **Capacidades actuales**
   - Catálogo por categorías y etiquetas, con filtros y búsqueda directa.
   - Búsqueda inteligente con IA sobre la documentación propia, con respuesta redactada y fuentes citadas.
   - Carga individual y carga masiva de material, edición y publicación.
   - Panel de usuarios con roles (usuario, IT, admin) y sección Sistemas restringida.
   - Panel de índice de IA para indexar/reindexar y ver el estado de cada proceso.
4. **Cifras actuales** — 36 procesos publicados, 33 con documento PDF, 8 categorías, 44 etiquetas, 3 usuarios registrados, índice de IA recién habilitado y pendiente de la primera indexación.
5. **Evolución por versiones**
   - v1: maqueta con datos de ejemplo.
   - v2: base de datos real, almacenamiento y carga de material.
   - v3: video por Google Drive, documentos PDF visibles dentro de la página, categorías Marketing y Sistemas.
   - v4: apertura de accesos con registro por código, panel de usuarios y roles.
   - v5 (actual): búsqueda con IA real sobre el material propio, indexación automática al guardar y panel de reindexación.
6. **Comparativa versión inicial vs. actual** — tabla breve (búsqueda, contenido, accesos, administración).
7. **Próximos pasos** — completar la carga del material restante, ejecutar la indexación inicial de los 36 procesos, revisar los PDF sin texto extraíble y definir la revisión periódica de accesos.

## Detalles técnicos

- Generación con la librería `docx` en Node, siguiendo la misma estructura de estilos del informe anterior (encabezados con color de marca, tablas con anchos DXA, viñetas por numbering).
- Validación del archivo y control de calidad convirtiendo cada página a imagen para revisar cortes de texto, tablas y colores antes de entregarlo.
- El documento queda disponible para descarga desde el chat.
