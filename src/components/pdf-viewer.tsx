import { useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type Props = { url: string; title?: string };

/**
 * Visor de PDF embebido: renderiza cada página en un canvas con pdf.js.
 * Evita depender del visor nativo del navegador dentro de un iframe.
 */
export function PdfViewer({ url, title }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        const doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;
        setPages(doc.numPages);

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        const width = container.clientWidth || 800;
        for (let n = 1; n <= doc.numPages; n += 1) {
          const page = await doc.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const scale = (width / base.width) * Math.min(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "block w-full rounded-lg border border-border bg-white shadow-sm";
          canvas.setAttribute("aria-label", `${title ?? "Documento"} — página ${n}`);
          container.appendChild(canvas);

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvas, canvasContext: ctx, viewport }).promise;
        }
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, title]);

  return (
    <div className="mt-4 space-y-4">
      {status === "loading" && <Skeleton className="h-[70vh] w-full" />}
      {status === "error" && (
        <p className="text-sm text-muted-foreground">
          No se pudo mostrar el documento en la página.
        </p>
      )}
      <div ref={containerRef} className="space-y-4" />
      {status === "ready" && pages > 0 && (
        <p className="text-xs text-muted-foreground">
          {pages} página{pages === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
