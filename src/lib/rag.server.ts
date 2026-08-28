/** Helpers de servidor para la búsqueda semántica (RAG). No importar desde el cliente. */

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const EMBEDDING_MODEL = "openai/text-embedding-3-small";
const CHAT_MODEL = "google/gemini-3.7-flash";

export class AiGatewayError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function apiKey(): string {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Falta la clave del servicio de IA (LOVABLE_API_KEY).");
  return key;
}

function friendly(status: number, raw: string): AiGatewayError {
  if (status === 429) {
    return new AiGatewayError(status, "El servicio de IA está saturado. Probá de nuevo en un minuto.");
  }
  if (status === 402) {
    return new AiGatewayError(status, "Se agotaron los créditos de IA del proyecto. Recargalos para seguir usando la búsqueda inteligente.");
  }
  if (status === 403) {
    return new AiGatewayError(status, "El uso de IA está bloqueado por la configuración del espacio de trabajo.");
  }
  return new AiGatewayError(status, `El servicio de IA devolvió un error (${status}). ${raw.slice(0, 200)}`);
}

async function gateway(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${GATEWAY}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey(),
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw friendly(res.status, await res.text());
  return res.json();
}

/** Vectoriza uno o varios textos. Devuelve los vectores en el mismo orden. */
export async function embed(inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  const json = (await gateway("/embeddings", {
    model: EMBEDDING_MODEL,
    input: inputs,
  })) as { data: { embedding: number[]; index: number }[] };
  return json.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/** Normaliza el texto crudo de un PDF: colapsa espacios y saltos redundantes. */
export function normalizeText(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Trocea el contenido en fragmentos solapados aptos para indexar. */
export function chunkText(text: string, size = 1000, overlap = 150): string[] {
  const clean = normalizeText(text);
  if (!clean) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + size, clean.length);
    if (end < clean.length) {
      const cut = clean.lastIndexOf("\n", end);
      const dot = clean.lastIndexOf(". ", end);
      const best = Math.max(cut, dot);
      if (best > start + size * 0.5) end = best + 1;
    }
    const piece = clean.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks.slice(0, 120);
}

/** Arma los fragmentos de un proceso: encabezado contextual + tramos del documento. */
export function buildChunks(meta: { title: string; category: string; summary: string }, documentText: string): string[] {
  const header = `Proceso: ${meta.title}\nCategoría: ${meta.category}\nResumen: ${meta.summary}`;
  const body = chunkText(documentText);
  if (body.length === 0) return [header];
  return [header, ...body.map((c) => `${meta.title} — ${meta.category}\n${c}`)];
}

export type SourceContext = { title: string; slug: string; category: string; content: string };

/** Redacta la respuesta final citando únicamente el material recuperado. */
export async function answerFromContext(query: string, sources: SourceContext[]): Promise<string> {
  const context = sources
    .map((s, i) => `[${i + 1}] ${s.title} (${s.category})\n${s.content}`)
    .join("\n\n---\n\n");

  const json = (await gateway("/chat/completions", {
    model: CHAT_MODEL,
    messages: [
      {
        role: "system",
        content:
          "Sos el asistente interno de la base de conocimiento de UNISOL, una mutual argentina. " +
          "Respondés en español rioplatense, con tono institucional, claro y breve (máximo 250 palabras). " +
          "Usás EXCLUSIVAMENTE la documentación provista; si no alcanza para responder, decilo con franqueza " +
          "y sugerí revisar las categorías del menú. Nunca inventes pasos, montos ni normativa. " +
          "Citá las fuentes con su número entre corchetes, por ejemplo [1].",
      },
      {
        role: "user",
        content: `Consulta: ${query}\n\nDocumentación interna disponible:\n\n${context}`,
      },
    ],
  })) as { choices?: { message?: { content?: string } }[] };

  return (
    json.choices?.[0]?.message?.content?.trim() ||
    "No pude redactar una respuesta con el material disponible. Revisá las fuentes listadas abajo."
  );
}
