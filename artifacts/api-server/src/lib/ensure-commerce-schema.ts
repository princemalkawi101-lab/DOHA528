import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "@workspace/db";

export async function ensureCommerceSchema(): Promise<void> {
  const migrationUrl = new URL("./0001_commerce.sql", import.meta.url);
  const sql = await readFile(fileURLToPath(migrationUrl), "utf8");
  await pool.query(sql);
}