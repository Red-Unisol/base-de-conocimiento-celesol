import {
  Calculator,
  Banknote,
  PiggyBank,
  Inbox,
  LineChart,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

export type Category = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
};

export type Attachment = {
  name: string;
  size: string;
  type: string;
};

export type Process = {
  slug: string;
  title: string;
  summary: string;
  category: string; // category slug
  tags: string[];
  updatedAt: string; // ISO
  duration: string;
  author: string;
  videoEmbedUrl: string;
  document: string;
  attachments: Attachment[];
};

export const categories: Category[] = [
  {
    slug: "contabilidad",
    name: "Contabilidad",
    description: "Registración, conciliaciones y cierres contables de la mutual.",
    icon: Calculator,
  },
  {
    slug: "cobranzas",
    name: "Cobranzas",
    description: "Gestión de cuotas, mora y acuerdos de pago con socios.",
    icon: Banknote,
  },
  {
    slug: "ahorros-y-amt",
    name: "Ahorros y AMT",
    description: "Cuentas de ahorro mutual y ayuda económica con fondos propios.",
    icon: PiggyBank,
  },
  {
    slug: "mesa-de-entrada",
    name: "Mesa de Entrada",
    description: "Recepción, caratulado y derivación de documentación.",
    icon: Inbox,
  },
  {
    slug: "analisis",
    name: "Análisis",
    description: "Evaluación crediticia, scoring y análisis de riesgo.",
    icon: LineChart,
  },
  {
    slug: "management",
    name: "Management",
    description: "Tableros, indicadores y procesos de conducción.",
    icon: Briefcase,
  },
];

export const allTags = [
  "Alta de socio",
  "Créditos",
  "Conciliación",
  "Auditoría",
  "Normativa INAES",
  "Caja",
  "Mora",
  "Sistema",
  "Reportes",
  "Onboarding",
];

const sampleDoc = `## Objetivo

Estandarizar el circuito para que cualquier colaborador pueda ejecutarlo sin
depender de conocimiento informal.

## Alcance

Aplica a todas las sucursales de la provincia de Córdoba.

## Pasos

1. **Verificación inicial.** Confirmar que la documentación del socio esté
   completa y vigente.
2. **Carga en el sistema.** Ingresar los datos en el módulo correspondiente
   respetando la nomenclatura interna.
3. **Control cruzado.** Contrastar el comprobante con el asiento generado.
4. **Aprobación.** Derivar al responsable del sector para su visado.
5. **Archivo.** Guardar el respaldo digital en el repositorio del sector.

## Controles clave

- Ningún registro se cierra sin doble verificación.
- Toda excepción se documenta en la observación del expediente.

## Errores frecuentes

> Cargar el comprobante antes de validar la identidad del socio genera
> diferencias en la conciliación de fin de mes.
`;

export const processes: Process[] = [
  {
    slug: "conciliacion-bancaria-mensual",
    title: "Conciliación bancaria mensual",
    summary:
      "Circuito completo para conciliar extractos bancarios contra el mayor contable y detectar partidas pendientes.",
    category: "contabilidad",
    tags: ["Conciliación", "Auditoría", "Reportes"],
    updatedAt: "2026-07-28",
    duration: "8 min",
    author: "Sector Contabilidad",
    videoEmbedUrl: "https://www.trupeer.ai/embed/demo-conciliacion",
    document: sampleDoc,
    attachments: [
      { name: "Plantilla-conciliacion.xlsx", size: "48 KB", type: "XLSX" },
      { name: "Checklist-cierre-mensual.pdf", size: "120 KB", type: "PDF" },
    ],
  },
  {
    slug: "gestion-de-mora-temprana",
    title: "Gestión de mora temprana",
    summary:
      "Cómo detectar, contactar y registrar la gestión de socios con cuotas vencidas de hasta 30 días.",
    category: "cobranzas",
    tags: ["Mora", "Créditos", "Sistema"],
    updatedAt: "2026-07-22",
    duration: "6 min",
    author: "Sector Cobranzas",
    videoEmbedUrl: "https://www.trupeer.ai/embed/demo-mora",
    document: sampleDoc,
    attachments: [{ name: "Guion-de-contacto.docx", size: "32 KB", type: "DOCX" }],
  },
  {
    slug: "alta-de-cuenta-de-ahorro-mutual",
    title: "Alta de cuenta de ahorro mutual",
    summary:
      "Requisitos, validaciones y carga en sistema para dar de alta una cuenta de ahorro de un socio activo.",
    category: "ahorros-y-amt",
    tags: ["Alta de socio", "Normativa INAES", "Onboarding"],
    updatedAt: "2026-07-18",
    duration: "11 min",
    author: "Ahorros y AMT",
    videoEmbedUrl: "https://www.trupeer.ai/embed/demo-ahorro",
    document: sampleDoc,
    attachments: [
      { name: "Formulario-alta-ahorro.pdf", size: "210 KB", type: "PDF" },
      { name: "Instructivo-INAES.pdf", size: "1.2 MB", type: "PDF" },
    ],
  },
  {
    slug: "otorgamiento-de-ayuda-economica",
    title: "Otorgamiento de ayuda económica (AMT)",
    summary:
      "Del pedido del socio a la acreditación: controles de garantía, límites y firma del convenio.",
    category: "ahorros-y-amt",
    tags: ["Créditos", "Normativa INAES"],
    updatedAt: "2026-07-15",
    duration: "14 min",
    author: "Ahorros y AMT",
    videoEmbedUrl: "https://www.trupeer.ai/embed/demo-amt",
    document: sampleDoc,
    attachments: [{ name: "Convenio-AMT-modelo.docx", size: "64 KB", type: "DOCX" }],
  },
  {
    slug: "recepcion-y-caratulado-de-expedientes",
    title: "Recepción y caratulado de expedientes",
    summary:
      "Cómo recibir documentación en mesa de entrada, generar la carátula y derivar al sector correspondiente.",
    category: "mesa-de-entrada",
    tags: ["Onboarding", "Sistema"],
    updatedAt: "2026-07-10",
    duration: "5 min",
    author: "Mesa de Entrada",
    videoEmbedUrl: "https://www.trupeer.ai/embed/demo-mesa",
    document: sampleDoc,
    attachments: [],
  },
  {
    slug: "analisis-crediticio-y-scoring",
    title: "Análisis crediticio y scoring del socio",
    summary:
      "Variables del scoring interno, consulta de antecedentes y armado del dictamen de riesgo.",
    category: "analisis",
    tags: ["Créditos", "Reportes", "Auditoría"],
    updatedAt: "2026-07-05",
    duration: "17 min",
    author: "Sector Análisis",
    videoEmbedUrl: "https://www.trupeer.ai/embed/demo-scoring",
    document: sampleDoc,
    attachments: [{ name: "Matriz-de-scoring.xlsx", size: "88 KB", type: "XLSX" }],
  },
  {
    slug: "arqueo-de-caja-diario",
    title: "Arqueo de caja diario",
    summary:
      "Procedimiento de cierre de caja, conteo, registro de diferencias y resguardo de valores.",
    category: "contabilidad",
    tags: ["Caja", "Conciliación"],
    updatedAt: "2026-06-30",
    duration: "7 min",
    author: "Sector Contabilidad",
    videoEmbedUrl: "https://www.trupeer.ai/embed/demo-arqueo",
    document: sampleDoc,
    attachments: [{ name: "Planilla-arqueo.xlsx", size: "26 KB", type: "XLSX" }],
  },
  {
    slug: "tablero-mensual-de-indicadores",
    title: "Tablero mensual de indicadores",
    summary:
      "Cómo se construye el tablero de gestión que se presenta al Consejo Directivo cada mes.",
    category: "management",
    tags: ["Reportes", "Auditoría"],
    updatedAt: "2026-06-24",
    duration: "12 min",
    author: "Management",
    videoEmbedUrl: "https://www.trupeer.ai/embed/demo-tablero",
    document: sampleDoc,
    attachments: [{ name: "Tablero-modelo.pdf", size: "540 KB", type: "PDF" }],
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}

export function getProcess(slug: string) {
  return processes.find((p) => p.slug === slug);
}

export function categoryName(slug: string) {
  return getCategory(slug)?.name ?? slug;
}

export function searchProcesses(query: string): Process[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return processes
    .map((p) => {
      const haystack = [p.title, p.summary, p.tags.join(" "), categoryName(p.category)]
        .join(" ")
        .toLowerCase();
      const score = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
      return { p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.p);
}

/** Respuesta IA simulada. En la etapa 2 se reemplaza por RAG sobre el contenido real. */
export function buildAiAnswer(query: string, results: Process[]) {
  if (results.length === 0) {
    return "No encontré documentación relacionada con esa consulta en la base de conocimiento. Probá con otros términos o revisá las categorías del menú lateral.";
  }
  const top = results[0]!;
  return `Según la documentación interna, el circuito de **${top.title.toLowerCase()}** (${categoryName(
    top.category,
  )}) responde a tu consulta sobre "${query}". El procedimiento arranca con la verificación de la documentación del socio, sigue con la carga en el sistema respetando la nomenclatura interna y cierra con un control cruzado y el visado del responsable del sector. Ninguna registración se da por cerrada sin doble verificación, y toda excepción se documenta en la observación del expediente.${
    results.length > 1
      ? ` Hay ${results.length - 1} documento(s) adicional(es) relacionado(s) que conviene revisar.`
      : ""
  }`;
}
