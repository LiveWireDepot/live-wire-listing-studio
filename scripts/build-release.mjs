import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function normalizeWranglerConfig(configPath) {
  const input = readFileSync(configPath);
  if (input.length >= 3 && input[0] === 0xef && input[1] === 0xbb && input[2] === 0xbf) {
    throw new Error("Generated Wrangler JSON contains a UTF-8 byte-order mark.");
  }

  const config = JSON.parse(input.toString("utf8"));
  if (Object.hasOwn(config, "compatibility_flags")) {
    if (!Array.isArray(config.compatibility_flags) || config.compatibility_flags.length > 0) {
      throw new Error("Generated Wrangler JSON contains compatibility flags; refusing to normalize them away.");
    }
    delete config.compatibility_flags;
  }

  writeFileSync(configPath, `${JSON.stringify(config)}\n`, { encoding: "utf8" });

  const output = readFileSync(configPath);
  const verified = JSON.parse(output.toString("utf8"));
  if (Object.hasOwn(verified, "compatibility_flags")) {
    throw new Error("Wrangler compatibility_flags remained after normalization.");
  }
  return verified;
}

function build() {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const executable = path.join(root, "node_modules", ".bin", process.platform === "win32" ? "vinext.cmd" : "vinext");
  const command = process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : executable;
  const args = process.platform === "win32" ? ["/d", "/s", "/c", `"${executable}" build`] : ["build"];
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
    stdio: "inherit",
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  normalizeWranglerConfig(path.join(root, "dist", "server", "wrangler.json"));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  build();
}
