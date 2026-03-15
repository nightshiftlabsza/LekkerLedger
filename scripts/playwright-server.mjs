import { spawn } from "node:child_process";

const child = spawn("npx next start -p 3002", {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    E2E_BYPASS_AUTH: "1",
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
