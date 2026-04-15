const { spawn } = require("node:child_process");
const { existsSync } = require("node:fs");
const net = require("node:net");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npm.cmd" : "npm";
const backendPort = process.env.BACKEND_PORT || "8000";
const frontendPort = process.env.FRONTEND_PORT || "3000";

const children = [];
let shuttingDown = false;
let exitCode = 0;

function resolvePython() {
  const localVenv = path.join(
    rootDir,
    ".venv",
    isWindows ? "Scripts" : "bin",
    isWindows ? "python.exe" : "python",
  );
  if (existsSync(localVenv)) {
    return { command: localVenv, args: [] };
  }

  const backendVenv = path.join(
    rootDir,
    "backend",
    ".venv",
    isWindows ? "Scripts" : "bin",
    isWindows ? "python.exe" : "python",
  );
  if (existsSync(backendVenv)) {
    return { command: backendVenv, args: [] };
  }

  if (isWindows) {
    return { command: "py", args: ["-3.11"] };
  }

  return { command: "python3", args: [] };
}

function killChild(child) {
  if (!child || child.exitCode !== null || child.killed) {
    return;
  }

  if (isWindows) {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }

  child.kill("SIGTERM");
}

function shutdown(nextExitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  exitCode = exitCode || nextExitCode;

  for (const child of children) {
    killChild(child);
  }

  setTimeout(() => {
    process.exit(exitCode);
  }, 250);
}

function startProcess(name, command, args, cwd, options = {}) {
  console.log(`[dev:all] starting ${name}...`);

  let child;
  try {
    child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      windowsHide: false,
      ...options,
    });
  } catch (error) {
    throw new Error(`failed to start ${name}: ${error.message}`);
  }

  child.on("error", (error) => {
    console.error(`[dev:all] failed to start ${name}: ${error.message}`);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const details =
      signal !== null
        ? `signal ${signal}`
        : `exit code ${code === null ? "unknown" : code}`;

    console.error(`[dev:all] ${name} stopped with ${details}.`);
    shutdown(code ?? 1);
  });

  children.push(child);
  return child;
}

function ensurePortAvailable(port, serviceName) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") {
        reject(
          new Error(
            `${serviceName} could not start because port ${port} is already in use. ` +
              `Set ${serviceName === "backend" ? "BACKEND_PORT" : "FRONTEND_PORT"} to another port and try again.`,
          ),
        );
        return;
      }

      reject(error);
    });

    server.once("listening", () => {
      server.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }
        resolve();
      });
    });

    server.listen(Number(port), "127.0.0.1");
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`[dev:all] received ${signal}, shutting down...`);
    shutdown(0);
  });
}

async function main() {
  await ensurePortAvailable(backendPort, "backend");
  await ensurePortAvailable(frontendPort, "frontend");

  const python = resolvePython();

  startProcess(
    "backend",
    python.command,
    [
      ...python.args,
      "-m",
      "uvicorn",
      "app.main:app",
      "--reload",
      "--port",
      backendPort,
    ],
    path.join(rootDir, "backend"),
  );

  startProcess(
    "frontend",
    isWindows ? "npm run dev -- --port " + frontendPort : npmCommand,
    isWindows ? [] : ["run", "dev", "--", "--port", frontendPort],
    path.join(rootDir, "frontend"),
    isWindows ? { shell: true } : {},
  );
}

main().catch((error) => {
  console.error(`[dev:all] ${error.message}`);
  shutdown(1);
});
