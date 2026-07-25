// Test-only helper: spins up a throwaway, local vanilla PostgreSQL instance
// (initdb/pg_ctl, no Docker, no cloud account — same approach used by T-002
// for the migration tests, see packages/database/README.md "Verification
// evidence") and applies the real contact_submissions migration to it. This
// lets integration tests exercise real SQL/constraint semantics without a
// live Supabase project.
//
// Explicitly NOT a substitute for testing against real Supabase/PostgREST —
// see __tests__/README.md for the local-vs-live distinction.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Pool } from "pg";

const MIGRATION_PATH = join(
  import.meta.dirname,
  "..",
  "..",
  "..",
  "..",
  "..",
  "..",
  "..",
  "packages",
  "database",
  "supabase",
  "migrations",
  "20260724120000_contact_submissions.sql",
);

export interface LocalPostgres {
  pool: Pool;
  stop: () => Promise<void>;
}

function resolveBin(name: string): string {
  const override = process.env[`PG_${name.toUpperCase()}_BIN`];
  if (override) return override;
  try {
    const found = execFileSync("which", [name], { encoding: "utf8" }).trim();
    if (found) return found;
  } catch {
    // fall through to default candidate below
  }
  return join("/opt/homebrew/opt/postgresql@15/bin", name);
}

export function isLocalPostgresAvailable(): boolean {
  try {
    resolveBin("initdb");
    execFileSync(resolveBin("initdb"), ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const { port } = address;
        server.close(() => resolve(port));
      } else {
        server.close();
        reject(new Error("failed to allocate a free port for local Postgres"));
      }
    });
  });
}

export async function startLocalPostgres(): Promise<LocalPostgres> {
  const dataDir = mkdtempSync(join(tmpdir(), "contact-form-pg-"));
  const port = await findFreePort();
  const initdbBin = resolveBin("initdb");
  const pgCtlBin = resolveBin("pg_ctl");

  execFileSync(initdbBin, ["-D", dataDir, "-U", "postgres", "-A", "trust", "--no-sync"], {
    stdio: "ignore",
  });

  execFileSync(
    pgCtlBin,
    [
      "-D",
      dataDir,
      "-o",
      `-p ${port} -c listen_addresses=127.0.0.1 -c unix_socket_directories=${dataDir}`,
      "-w",
      "-l",
      join(dataDir, "server.log"),
      "start",
    ],
    { stdio: "ignore" },
  );

  const pool = new Pool({
    host: "127.0.0.1",
    port,
    user: "postgres",
    database: "postgres",
  });

  const migrationSql = readFileSync(MIGRATION_PATH, "utf8");
  await pool.query(migrationSql);

  const stop = async () => {
    await pool.end();
    try {
      execFileSync(pgCtlBin, ["-D", dataDir, "-m", "immediate", "stop"], { stdio: "ignore" });
    } finally {
      rmSync(dataDir, { recursive: true, force: true });
    }
  };

  return { pool, stop };
}
