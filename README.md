# Base de Conocimiento Celesol

Actúa como un desarrollador Full-Stack Senior especializado en React, Tailwind CSS, Shadcn UI y Supabase. 

Necesito construir una aplicación web de Base de Conocimiento Institucional para una empresa mutual. La app albergará videos y guías escritas creados en Trupeer para la documentación de procesos de negocio.

Sigue rigurosamente las siguientes especificaciones:

1. DISEÑO E IDENTIDAD DE MARCA:

- Aplica el Brand Kit adjunto/proporcionado para definir la paleta de colores, tipografía, logos e identidad visual.

- La interfaz debe transmitir profesionalismo, orden e institucionalidad. Utiliza componentes de Shadcn UI.

- Incluye modo claro/oscuro alineado con la paleta de la marca.

2. ARQUITECTURA DE CONTENIDO Y NAVEGACIÓN:

- Navegación lateral (Sidebar): Listado de Categorías de procesos de negocio (ej. Operaciones, Legales, Atención al Socio, Auditoría).

- Filtros por Etiquetas (Tags) en la parte superior del catálogo.

- Vista de Detalle de Proceso: Contendrá el video incrustado (Trupeer Embed/Player), el documento paso a paso (soporte para Markdown/Rich Text) y archivos adjuntos descargables.

3. SISTEMA DE BÚSQUEDA INTELIGENTE CON IA:

- Ubica una barra de búsqueda central y destacada en el Dashboard principal.

- Implementa dos modos de búsqueda o una respuesta unificada:

  a) Respuesta IA (RAG): La consulta del usuario debe generar una respuesta resumida y precisa basada únicamente en los documentos y transcripciones de la base de conocimiento, incluyendo un bloque de "Fuentes consultadas" con accesos directos a los documentos o videos correspondientes.

  b) Resultados directos: Lista de tarjetas de documentos y videos altamente relevantes con coincidencias por título, descripción o etiquetas.

4. MÓDULO DE CARGA (ADMINISTRACIÓN):

- Crea una sección restringida/formulario para subir nuevo material de Trupeer:

  - Título del proceso.

  - Categoría y Etiquetas.

  - URL / Embed Code del video de Trupeer.

  - Documento explicativo (Editor de texto o carga de archivo).

  - Resumen breve para el buscador.

5. BASE DE DATOS (SUPABASE):

- Genera los esquemas de tablas para: `categories`, `tags`, `processes`, `process_tags` y los buckets de almacenamiento en Supabase Storage para documentos.

- Configura la estructura para almacenar embeddings vectoriales si se activa la búsqueda semántica.

Comienza generando la interfaz general (Layout, Sidebar con Categorías, Barra de Búsqueda IA prominente y la rejilla de Procesos Recientes).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bef50b6a-4a5c-467c-9ca2-7fabf1f1f7c0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
