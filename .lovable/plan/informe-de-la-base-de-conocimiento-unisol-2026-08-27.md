# Informe de la Base de Conocimiento UNISOL

Entregable: un documento Word (.docx) con la identidad de UNISOL, descargable desde el chat. No implica cambios en la aplicación.

## Contenido del informe

1. **Portada y resumen ejecutivo** — qué es la Base de Conocimiento, para qué sirve y en qué estado está hoy.
2. **Funcionamiento general** — acceso privado con usuario y contraseña, rol de administrador, navegación por categorías (Contabilidad, Cobranzas, Ahorros y AMT, Mesa de Entrada, Análisis, Management, Marketing), inicio con procesos recientes.
3. **Capacidades actuales**
   - Buscador destacado con respuesta resumida + "Fuentes consultadas" y resultados directos por título, resumen, categoría y etiquetas.
   - Catálogo por categoría con filtros por etiquetas.
   - Ficha de proceso: video embebido desde Google Drive, documento PDF visible dentro de la página, adjuntos y datos del proceso.
   - Carga de material: alta individual, carga masiva de borradores, creación de etiquetas nuevas al vuelo, edición y publicación por proceso.
   - Panel de migración con estado por proceso (borrador / completo), faltantes y contador de avance.
   - Modo claro y oscuro con la paleta institucional.
4. **Evolución respecto de versiones anteriores** — tabla comparativa por versión:
   - v1 (interfaz con datos de ejemplo, sin base de datos)
   - v2 (backend real: base de datos, almacenamiento privado, login y roles, carga funcional, panel de migración)
   - v3 (ajustes: categoría Marketing, etiquetas nuevas desde el formulario, ver contraseña en el login)
   - v4 (actual: video por enlace de Google Drive en lugar de subir MP4, y documentos PDF visibles en la propia página en lugar de descargables)
   - Endurecimiento de seguridad: verificación de rol movida a un esquema interno no expuesto.
5. **Beneficios y control del material** — independencia respecto de Trupeer, acceso restringido, trazabilidad del avance de migración.
6. **Próximos pasos** — completar la migración de los ~55 procesos y activar la búsqueda semántica con IA sobre el contenido real.

## Detalles técnicos

- Generación con la librería `docx` en un script temporal fuera del proyecto; salida en `/mnt/documents/`.
- Página carta, Montserrat no está garantizada en Word, por lo que se usa Arial con la paleta de marca (#182540 y #6AAF9E) en títulos y encabezados de tabla.
- Estilos de encabezado propios, tabla comparativa de versiones y listas con numeración nativa.
- Idioma: español rioplatense, tono institucional.
