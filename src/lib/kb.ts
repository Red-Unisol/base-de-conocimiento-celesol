import {
  Banknote,
  Briefcase,
  Calculator,
  Folder,
  Inbox,
  LineChart,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const VIDEO_BUCKET = "process-videos";
export const DOC_BUCKET = "process-docs";
export const ATTACHMENT_BUCKET = "process-attachments";

const ICONS: Record<string, LucideIcon> = {
  Calculator,
  Banknote,
  PiggyBank,
  Inbox,
  LineChart,
  Briefcase,
  Folder,
};

export function categoryIcon(name: string | null | undefined): LucideIcon {
  return ICONS[name ?? "Folder"] ?? Folder;
}

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
};

export type Tag = { id: string; slug: string; name: string };

export type Attachment = {
  id: string;
  name: string;
  path: string;
  size_bytes: number;
  file_type: string;
};

export type Process = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  author: string;
  duration_label: string;
  status: "draft" | "published";
  updated_at: string;
  video_path: string | null;
  video_source_url: string | null;
  poster_path: string | null;
  document_path: string | null;
  document_markdown: string | null;
  category: { slug: string; name: string } | null;
  tags: string[];
  attachments: Attachment[];
};

const SELECT =
  "id, slug, title, summary, author, duration_label, status, updated_at, video_path, video_source_url, poster_path, document_path, document_markdown, categories(slug, name), process_tags(tags(name)), attachments(id, name, path, size_bytes, file_type)";

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProcess(row: any): Process {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary ?? "",
    author: row.author ?? "",
    duration_label: row.duration_label ?? "",
    status: row.status,
    updated_at: row.updated_at,
    video_path: row.video_path,
    video_source_url: row.video_source_url,
    poster_path: row.poster_path,
    document_path: row.document_path,
    document_markdown: row.document_markdown,
    category: row.categories ?? null,
    tags: (row.process_tags ?? []).map((pt: any) => pt.tags?.name).filter(Boolean),
    attachments: row.attachments ?? [],
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, description, icon, sort_order")
    .order("sort_order");
  if (error) throw error;
  return data as Category[];
}

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from("tags").select("id, slug, name").order("name");
  if (error) throw error;
  return data as Tag[];
}

export async function createTag(name: string): Promise<Tag> {
  const clean = name.trim();
  const slug = slugify(clean);
  const { data: existing } = await supabase
    .from("tags")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing as Tag;

  const { data, error } = await supabase
    .from("tags")
    .insert({ slug, name: clean })
    .select("id, slug, name")
    .single();
  if (error) throw error;
  return data as Tag;
}


export async function fetchProcesses(options?: {
  categorySlug?: string;
  includeDrafts?: boolean;
}): Promise<Process[]> {
  let query = supabase.from("processes").select(SELECT).order("updated_at", { ascending: false });
  if (!options?.includeDrafts) query = query.eq("status", "published");
  const { data, error } = await query;
  if (error) throw error;
  const list = (data ?? []).map(mapProcess);
  return options?.categorySlug
    ? list.filter((p) => p.category?.slug === options.categorySlug)
    : list;
}

export async function fetchProcess(slug: string): Promise<Process | null> {
  const { data, error } = await supabase.from("processes").select(SELECT).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? mapProcess(data) : null;
}

export async function signedUrl(bucket: string, path: string, expiresIn = 3600) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export async function uploadFile(bucket: string, processId: string, file: File) {
  const path = `${processId}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export type ProcessInput = {
  title: string;
  categoryId: string | null;
  summary: string;
  author: string;
  durationLabel: string;
  tagIds: string[];
  videoSourceUrl: string;
  documentMarkdown: string;
  status: "draft" | "published";
  videoFile?: File | null;
  documentFile?: File | null;
  attachmentFiles?: File[];
};

export async function createProcess(input: ProcessInput) {
  const baseSlug = slugify(input.title) || `proceso-${Date.now()}`;
  const { data: user } = await supabase.auth.getUser();

  const { data: row, error } = await supabase
    .from("processes")
    .insert({
      slug: `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`,
      title: input.title,
      summary: input.summary,
      category_id: input.categoryId,
      author: input.author,
      duration_label: input.durationLabel,
      video_source_url: input.videoSourceUrl || null,
      document_markdown: input.documentMarkdown || null,
      status: input.status,
      created_by: user.user?.id ?? null,
    })
    .select("id, slug")
    .single();
  if (error) throw error;

  if (input.tagIds.length) {
    const { error: tagError } = await supabase
      .from("process_tags")
      .insert(input.tagIds.map((tag_id) => ({ process_id: row.id, tag_id })));
    if (tagError) throw tagError;
  }

  const patch: { video_path?: string; document_path?: string } = {};
  if (input.videoFile) patch.video_path = await uploadFile(VIDEO_BUCKET, row.id, input.videoFile);
  if (input.documentFile)
    patch.document_path = await uploadFile(DOC_BUCKET, row.id, input.documentFile);
  if (Object.keys(patch).length) {
    const { error: upErr } = await supabase.from("processes").update(patch).eq("id", row.id);
    if (upErr) throw upErr;
  }

  for (const file of input.attachmentFiles ?? []) {
    const path = await uploadFile(ATTACHMENT_BUCKET, row.id, file);
    const { error: attErr } = await supabase.from("attachments").insert({
      process_id: row.id,
      name: file.name,
      path,
      size_bytes: file.size,
      file_type: (file.name.split(".").pop() ?? "").toUpperCase().slice(0, 5),
    });
    if (attErr) throw attErr;
  }

  return row;
}

/** Carga masiva: crea un borrador por cada MP4, con el título tomado del nombre del archivo. */
export async function createDraftFromVideo(file: File, categoryId?: string | null) {
  const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return createProcess({
    title: title || file.name,
    categoryId: categoryId ?? null,
    summary: "",
    author: "",
    durationLabel: "",
    tagIds: [],
    videoSourceUrl: "",
    documentMarkdown: "",
    status: "draft",
    videoFile: file,
  });
}

export async function fetchProcessById(id: string): Promise<Process | null> {
  const { data, error } = await supabase.from("processes").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapProcess(data) : null;
}

export async function fetchProcessTagIds(processId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("process_tags")
    .select("tag_id")
    .eq("process_id", processId);
  if (error) throw error;
  return (data ?? []).map((r) => r.tag_id);
}

export type ProcessUpdate = ProcessInput & { id: string };

export async function updateProcess(input: ProcessUpdate) {
  const patch: {
    title: string;
    summary: string;
    category_id: string | null;
    author: string;
    duration_label: string;
    video_source_url: string | null;
    document_markdown: string | null;
    status: string;
    video_path?: string;
    document_path?: string;
  } = {
    title: input.title,
    summary: input.summary,
    category_id: input.categoryId,
    author: input.author,
    duration_label: input.durationLabel,
    video_source_url: input.videoSourceUrl || null,
    document_markdown: input.documentMarkdown || null,
    status: input.status,
  };

  if (input.videoFile)
    patch.video_path = await uploadFile(VIDEO_BUCKET, input.id, input.videoFile);
  if (input.documentFile)
    patch.document_path = await uploadFile(DOC_BUCKET, input.id, input.documentFile);


  const { error } = await supabase.from("processes").update(patch).eq("id", input.id);
  if (error) throw error;

  const { error: delErr } = await supabase
    .from("process_tags")
    .delete()
    .eq("process_id", input.id);
  if (delErr) throw delErr;
  if (input.tagIds.length) {
    const { error: tagErr } = await supabase
      .from("process_tags")
      .insert(input.tagIds.map((tag_id) => ({ process_id: input.id, tag_id })));
    if (tagErr) throw tagErr;
  }

  await addAttachments(input.id, input.attachmentFiles ?? []);
  return { id: input.id };
}

export async function addAttachments(processId: string, files: File[]) {
  for (const file of files) {
    const path = await uploadFile(ATTACHMENT_BUCKET, processId, file);
    const { error } = await supabase.from("attachments").insert({
      process_id: processId,
      name: file.name,
      path,
      size_bytes: file.size,
      file_type: (file.name.split(".").pop() ?? "").toUpperCase().slice(0, 5),
    });
    if (error) throw error;
  }
}

export async function deleteAttachment(attachment: { id: string; path: string }) {
  const { error } = await supabase.from("attachments").delete().eq("id", attachment.id);
  if (error) throw error;
  await supabase.storage.from(ATTACHMENT_BUCKET).remove([attachment.path]);
}

export async function deleteProcess(id: string) {
  const { error } = await supabase.from("processes").delete().eq("id", id);
  if (error) throw error;
}


export function isComplete(p: Process) {
  return Boolean(
    p.video_path && (p.document_path || p.document_markdown) && p.summary && p.category,
  );
}

export function missingPieces(p: Process) {
  const missing: string[] = [];
  if (!p.video_path) missing.push("video");
  if (!p.document_path && !p.document_markdown) missing.push("documento");
  if (!p.summary) missing.push("resumen");
  if (!p.category) missing.push("categoría");
  return missing;
}

export function searchProcesses(query: string, list: Process[]): Process[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return list
    .map((p) => {
      const haystack = [p.title, p.summary, p.tags.join(" "), p.category?.name ?? ""]
        .join(" ")
        .toLowerCase();
      const score = terms.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
      return { p, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.p);
}

/** Respuesta IA provisoria sobre el contenido real. La etapa 3 la reemplaza por RAG semántico. */
export function buildAiAnswer(query: string, results: Process[]) {
  if (results.length === 0) {
    return "No encontré documentación relacionada con esa consulta en la base de conocimiento. Probá con otros términos o revisá las categorías del menú lateral.";
  }
  const top = results[0]!;
  const extract = (top.document_markdown ?? top.summary ?? "")
    .replace(/[#*`>]/g, "")
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 6)
    .join(" ")
    .slice(0, 600);
  return `Según la documentación interna, **${top.title}** (${
    top.category?.name ?? "sin categoría"
  }) responde a tu consulta sobre "${query}".\n\n${extract}${
    results.length > 1
      ? `\n\nHay ${results.length - 1} documento(s) adicional(es) relacionado(s) que conviene revisar.`
      : ""
  }`;
}
