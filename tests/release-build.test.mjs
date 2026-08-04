import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { normalizeWranglerConfig } from "../scripts/build-release.mjs";

test("release build emits BOM-free Wrangler JSON with no empty compatibility flags", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "livewire-release-"));
  const configPath = path.join(directory, "wrangler.json");
  try {
    writeFileSync(configPath, JSON.stringify({ compatibility_date: "2026-05-15", compatibility_flags: [] }));
    normalizeWranglerConfig(configPath);
    const bytes = readFileSync(configPath);
    assert.notDeepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
    assert.equal(Object.hasOwn(JSON.parse(bytes.toString("utf8")), "compatibility_flags"), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("release build refuses to erase a real compatibility flag", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "livewire-release-"));
  const configPath = path.join(directory, "wrangler.json");
  try {
    writeFileSync(configPath, JSON.stringify({ compatibility_flags: ["nodejs_compat"] }));
    assert.throws(() => normalizeWranglerConfig(configPath), /refusing to normalize/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
