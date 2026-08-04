# Base de Conocimiento UNISOL — Etapa 1: Interfaz

Primera entrega: la interfaz completa con datos de ejemplo, con la identidad de UNISOL aplicada. Sin base de datos todavía.

## Identidad visual (Manual de marca)

- Azul institucional `#182540` (color principal, base del modo oscuro)
- Verde azulado `#6aaf9e` (acento, botones y destacados)
- Gris medio `#aeadb3` y gris claro `#edeef0` (superficies y texto secundario)
- Tipografía Montserrat
- Estética sobria e institucional: tarjetas limpias, bordes suaves, poca decoración
- Modo claro y oscuro con la misma paleta

## Pantallas

**Layout general**
- Sidebar izquierdo con el nombre UNISOL, buscador rápido y listado de categorías: Contabilidad, Cobranzas, Ahorros y AMT, Mesa de Entrada, Análisis, Management
- Cabecera con selector claro/oscuro y acceso a la sección de administración
- El sidebar se colapsa a íconos

**Dashboard (`/`)**
- Barra de búsqueda IA central y protagonista, con texto guía ("¿Qué proceso necesitás consultar?")
- Al buscar: bloque de Respuesta IA (resumen + "Fuentes consultadas" enlazando a los procesos) y, debajo, resultados directos en tarjetas
- En esta etapa la respuesta IA es simulada con contenido de ejemplo; se conecta de verdad en la etapa 2
- Grilla de Procesos Recientes con tarjetas: miniatura, título, categoría, etiquetas y resumen

**Catálogo por categoría (`/categoria/$slug`)**
- Filtros por etiquetas arriba (chips seleccionables) + orden por fecha/título
- Misma grilla de tarjetas

**Detalle de proceso (`/proceso/$slug`)**
- Reproductor de video Trupeer incrustado
- Documento paso a paso renderizado desde Markdown
- Panel lateral con categoría, etiquetas, fecha y archivos adjuntos descargables

**Administración (`/admin`)**
- Formulario de carga: título, categoría, etiquetas, URL/embed de Trupeer, documento (editor Markdown o subida de archivo), resumen para el buscador
- En esta etapa el formulario valida y muestra confirmación, sin guardar aún

**Autenticación**
- Pantalla de ingreso con email y contraseña, maquetada en esta etapa
- Se activa de verdad en la etapa 2, junto con el rol de administrador

## Etapa 2 (después de aprobar la interfaz)

Base de datos con `categories`, `tags`, `processes`, `process_tags`, roles de usuario, bucket de almacenamiento para documentos y adjuntos, login real con email/contraseña, carga funcional y búsqueda semántica con embeddings vectoriales + respuesta IA sobre el contenido real.

## Detalles técnicos

- TanStack Start + rutas en `src/routes/`; tokens de color en `src/styles.css` en formato oklch, sin colores fijos en los componentes
- Componentes Shadcn: sidebar, card, badge, input, tabs, dialog, form, select, skeleton
- Montserrat cargada con `<link>` en `__root.tsx`
- Datos de ejemplo en un módulo `src/data/` para reemplazar por consultas reales sin tocar la UI
- Markdown con `react-markdown`; modo oscuro con `next-themes`
- Cada ruta con su propio `head()` (título y descripción)
