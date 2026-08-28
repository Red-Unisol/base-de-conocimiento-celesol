import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { DOC_BUCKET, signedUrl } from "@/lib/kb";
import { extractPdfText, extractPdfTextFromFile } from "@/lib/pdf-text";
import { indexProcess } from "@/lib/rag.functions";

/**
 * Reindexa un proceso después de crearlo o editarlo: extrae el texto del PDF en el
 * navegador y lo envía al servidor para regenerar los fragmentos semánticos.
 */
export async function reindexProcess(processId: string, documentFile?: File | null) {
  let documentText = "";

  if (documentFile && documentFile.name.toLowerCase().endsWith(".pdf")) {
    documentText = await extractPdfTextFromFile(documentFile);
  } else {
    const { data } = await supabase
      .from("processes")
      .select("document_path, document_markdown")
      .eq("id", processId)
      .maybeSingle();
    if (data?.document_path?.toLowerCase().endsWith(".pdf")) {
      const url = await signedUrl(DOC_BUCKET, data.document_path);
      documentText = await extractPdfText(url);
    } else {
      documentText = data?.document_markdown ?? "";
    }
  }

  return indexProcess({ data: { processId, documentText } });
}

/** Igual que reindexProcess, pero avisa por notificación en lugar de romper el guardado. */
export async function reindexProcessSafely(processId: string, documentFile?: File | null) {
  try {
    await reindexProcess(processId, documentFile);
  } catch (e) {
    toast.warning("El proceso se guardó, pero no pudimos actualizar el índice de IA", {
      description: (e as Error).message,
    });
  }
}
