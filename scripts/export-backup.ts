/**
 * Respaldo de la base de datos de la Base de Conocimiento (UNISOL / Celesol).
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... bun run backup:export
 *
 * Requiere una clave con permisos de servicio para leer todas las filas
 * (las políticas de acceso ocultan datos a usuarios comunes). Nunca subir esa
 * clave al repositorio: usar variables de entorno, secretos de GitHub o Kestra.
 *
 * Salida: backups/<fecha>/<tabla>.json + manifest.json (conteos por tabla).
 * Los JSONB (p. ej. policy_siisa_nodes.config_siisa) se guardan tal cual.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Orden de dependencia: padres antes que hijos, para restaurar en el mismo orden.
const TABLES = [
  "categories",
  "processes",
  "process_chunks",
  "profiles",
  "user_roles",
  "policies",
  "policy_lines",
  "policy_rules",
  "policy_questions",
  "policy_traces",
  "policy_siisa_nodes",
  "policy_siisa_edges",
  "policy_change_log",
] as const;

const PAGE = 1000;

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false } });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = join(process.cwd(), "backups", stamp);
  await mkdir(dir, { recursive: true });

  const manifest: Record<string, number | string> = {};
  for (const table of TABLES) {
    const rows: unknown[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await db.from(table).select("*").range(from, from + PAGE - 1);
      if (error) {
        console.error(`✗ ${table}: ${error.message}`);
        manifest[table] = `error: ${error.message}`;
        break;
      }
      rows.push(...(data ?? []));
      if (!data || data.length < PAGE) break;
    }
    if (typeof manifest[table] !== "string") {
      await writeFile(join(dir, `${table}.json`), JSON.stringify(rows, null, 2));
      manifest[table] = rows.length;
      console.log(`✓ ${table}: ${rows.length} filas`);
    }
  }

  await writeFile(
    join(dir, "manifest.json"),
    JSON.stringify({ created_at: new Date().toISOString(), order: TABLES, counts: manifest }, null, 2),
  );
  console.log(`\nRespaldo guardado en ${dir}`);
  if (Object.values(manifest).some((v) => typeof v === "string")) process.exit(2);
}

main();
