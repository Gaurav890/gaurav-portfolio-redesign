// Spins up a throwaway, local vanilla PostgreSQL cluster for integration
// tests — same approach as ../../session/__tests__/fixtures/local-postgres.ts
// (packages/database/README.md's T-002 approach), duplicated here rather
// than imported across the route-tree boundary — see
// ../../lib/http.ts's header comment for why this task keeps its test
// infrastructure self-contained instead of depending on a sibling task's
// directory that may be edited in a different worktree concurrently.
//
// Requires local `initdb`/`pg_ctl`/`psql` binaries (Postgres 15). If they
// aren't on PATH or at the Homebrew default location, set PG_BIN_DIR to
// the directory containing them.

import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";

const DEFAULT_PG_BIN_DIRS = [
  process.env.PG_BIN_DIR,
  "/opt/homebrew/opt/postgresql@15/bin",
  "/usr/lib/postgresql/15/bin",
  "/usr/local/opt/postgresql@15/bin",
].filter((dir): dir is string => Boolean(dir));

function resolvePgBinDir(): string {
  for (const dir of DEFAULT_PG_BIN_DIRS) {
    if (existsSync(path.join(dir, "initdb"))) return dir;
  }
  return "";
}

function bin(name: string): string {
  const dir = resolvePgBinDir();
  return dir ? path.join(dir, name) : name;
}

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        reject(new Error("Could not determine a free TCP port for the test Postgres instance."));
      }
    });
  });
}

function findMigrationsDir(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, "packages/database/supabase/migrations");
    if (existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    `Could not locate packages/database/supabase/migrations by walking up from ${startDir}`,
  );
}

export interface LocalPostgres {
  connectionString: string;
  stop(): void;
}

export async function startLocalPostgres(): Promise<LocalPostgres> {
  const dataDir = mkdtempSync(path.join(tmpdir(), "agent-turn-pg-"));
  const port = await getFreePort();

  execFileSync(
    bin("initdb"),
    ["-D", dataDir, "-U", "postgres", "-A", "trust", "--no-sync"],
    { stdio: "ignore" },
  );

  const logFile = path.join(dataDir, "postgres.log");
  execFileSync(
    bin("pg_ctl"),
    ["-D", dataDir, "-o", `-p ${port} -h 127.0.0.1`, "-l", logFile, "-w", "start"],
    { stdio: "ignore" },
  );

  const connectionString = `postgresql://postgres@127.0.0.1:${port}/postgres`;

  try {
    const migrationsDir = findMigrationsDir(process.cwd());
    const files = readdirSync(migrationsDir)
      .filter((f: string) => f.endsWith(".sql"))
      .sort();
    for (const file of files) {
      execFileSync(bin("psql"), [connectionString, "-v", "ON_ERROR_STOP=1", "-f", path.join(migrationsDir, file)], {
        stdio: "ignore",
      });
    }
  } catch (err) {
    spawnSync(bin("pg_ctl"), ["-D", dataDir, "-m", "immediate", "stop"], { stdio: "ignore" });
    rmSync(dataDir, { recursive: true, force: true });
    throw err;
  }

  return {
    connectionString,
    stop() {
      spawnSync(bin("pg_ctl"), ["-D", dataDir, "-m", "immediate", "stop"], { stdio: "ignore" });
      rmSync(dataDir, { recursive: true, force: true });
    },
  };
}
