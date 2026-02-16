import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.join(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const COFG_DIR = path.join(ROOT_DIR, "dist_config");

fs.copyFileSync(
  path.join(COFG_DIR, "styles.css"),
  path.join(DIST_DIR, "index.css"),
);
fs.renameSync(
  path.join(DIST_DIR, "index.global.js"),
  path.join(DIST_DIR, "index.js"),
  { force: true },
);
fs.rmSync(path.join(DIST_DIR, "index.d.ts"), { force: true });
