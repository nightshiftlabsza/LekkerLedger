import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const nodeExecutable = process.execPath;
const projectRoot = process.cwd();
const nextBin = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const playwrightDistDir = path.join(projectRoot, ".next-playwright");
const prerenderManifest = path.join(playwrightDistDir, "prerender-manifest.json");
const buildManifest = path.join(playwrightDistDir, "BUILD_ID");
const port = process.env.PORT ?? "3002";

function spawnNext(args, extraEnv = {}) {
  return spawn(nodeExecutable, [nextBin, ...args], {
    stdio: "inherit",
    env: {
      ...process.env,
      PLAYWRIGHT_BUILD: "1",
      E2E_BYPASS_AUTH: "1",
      ...extraEnv,
    },
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`Next process exited from signal ${signal}.`));
        return;
      }

      if (code && code !== 0) {
        reject(new Error(`Next process exited with code ${code}.`));
        return;
      }

      resolve();
    });

    child.on("error", reject);
  });
}

async function ensurePlaywrightBuild() {
  if (existsSync(prerenderManifest) && existsSync(buildManifest)) {
    return;
  }

  const build = spawnNext(["build", "--webpack"]);
  await waitForExit(build);
}

async function main() {
  await ensurePlaywrightBuild();

  const server = spawnNext(["start", "-p", port, "-H", "0.0.0.0"]);

  server.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  process.on("SIGINT", () => server.kill("SIGINT"));
  process.on("SIGTERM", () => server.kill("SIGTERM"));
}

main().catch((error) => {
  console.error("Could not prepare the Playwright web server.");
  console.error(error);
  process.exit(1);
});
