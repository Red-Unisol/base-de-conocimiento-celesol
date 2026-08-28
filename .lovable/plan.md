# Etapa 3 — Búsqueda con IA real (RAG) sobre el material propio

Respuesta corta a tu pregunta: sí, va a soportar la carga futura, siempre que la indexación quede enganchada al propio flujo de carga. Eso es justamente lo que hace este plan: cada proceso que subas o edites se indexa solo, y hay un botón para reindexar todo cuando haga falta.

## Situación actual verificada

- 36 procesos publicados: 33 tienen documento PDF, 36 tienen resumen, y **ninguno tiene texto en Markdown**.
- La "Respuesta IA" de hoy no usa IA: busca coincidencias de palabras y recorta el primer documento encontrado.

Como el contenido vive dentro de PDFs, el primer paso real del RAG es extraer ese texto. Sin eso, la IA sólo puede responder con títulos y resúmenes.

## Qué se construye

1. **Extracción de texto de los PDFs.** Al subir o editar un proceso, el visor de PDF que ya usamos extrae el texto del documento y lo guarda junto al proceso. Es el mismo motor que hoy muestra el PDF en pantalla, así que no cambia nada de lo que ve el usuario.
2. **Índice semántico.** Cada proceso se parte en fragmentos (título + resumen + tramos del documento) y cada fragmento se convierte en un vector con el servicio de IA de Lovable. Se guarda en una tabla nueva de fragmentos.
3. **Búsqueda semántica.** La consulta del usuario también se vectoriza y la base devuelve los fragmentos más parecidos por significado, no por palabra exacta. Encuentra "cómo doy de alta un socio" aunque el documento diga "afiliación de asociados".
4. **Respuesta generada con fuentes reales.** Los fragmentos recuperados se pasan al modelo, que responde en español rioplatense citando únicamente el material interno. Debajo, "Fuentes consultadas" enlaza los procesos exactos de donde salió cada dato. Si no hay material suficiente, lo dice en lugar de inventar.
5. **Respeto de permisos.** La recuperación corre con la sesión del usuario, así que un usuario sin rol IT nunca recibe respuestas ni fuentes de la categoría Sistemas.
6. **Reindexado automático y manual.**
   - Automático: al publicar o editar un proceso, sus fragmentos se regeneran.
   - Manual: botón "Reindexar base" en el panel de administración, con contador "X de N procesos indexados" y detalle de los que quedaron sin texto.
7. **Backfill de los 36 actuales.** Una pasada inicial desde el panel de administración indexa todo el material ya cargado.

## Garantía para cargas futuras

| Situación | Qué pasa |
| --- | --- |
| Subís un proceso nuevo con PDF | Se extrae el texto y se indexa al guardar |
| Editás el documento o el resumen | Se reindexa ese proceso |
| Borrás un proceso | Sus fragmentos se borran con él |
| Un PDF es sólo imágenes escaneadas | Queda marcado como "sin texto extraíble" en el panel, para cargar un resumen a mano |
| Se cae la indexación de un proceso | Aparece en el panel como pendiente y se reintenta con el botón |

## Detalle técnico

- Migración: extensión `vector`; columna `document_text` en `processes`; tabla `process_chunks` (process_id, category_id, chunk_index, content, embedding vector(1536)) con índice ivfflat, GRANT a `authenticated`/`service_role`, RLS de lectura reutilizando `private.can_view_category`, y escritura sólo admin. Función `private.match_process_chunks(query_embedding, match_count)` que filtra por visibilidad del solicitante.
- Embeddings y respuesta a través de la pasarela de IA de Lovable (sin claves propias): endpoint de embeddings para indexar y consultar, y `openai/gpt-5.6-terra` para redactar la respuesta, con streaming desde una server function y manejo explícito de 429/402/403.
- Extracción de texto con `pdfjs-dist` en el navegador (ya instalado), reutilizando la lógica de `src/components/pdf-viewer.tsx`; el texto se envía al servidor para trocear e indexar.
- Fragmentos de ~1000 caracteres con solapamiento, deduplicados por proceso.
- `src/components/ai-search.tsx` pasa de `buildAiAnswer`/`searchProcesses` locales a la server function de RAG; se mantiene la pestaña "Resultados directos" con el ranking semántico.
- `src/lib/kb.ts`: se retira `buildAiAnswer` y `searchProcesses` queda como respaldo si la IA no está disponible.
- Panel de indexación dentro de `/admin` con estado por proceso.

## Costo

Cada consulta usa créditos de IA (una llamada de embedding + una de respuesta). La indexación es una sola vez por proceso.
