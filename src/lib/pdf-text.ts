/** Extracción de texto de PDFs en el navegador, con el mismo motor del visor. */
export async function extractPdfText(url: string): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const doc = await pdfjs.getDocument({ url }).promise;
  const parts: string[] = [];
  for (let n = 1; n <= doc.numPages; n += 1) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    const line = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (line) parts.push(line);
  }
  return parts.join("\n\n");
}

/** Extrae el texto de un archivo PDF ya seleccionado en el formulario. */
export async function extractPdfTextFromFile(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    return await extractPdfText(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}
