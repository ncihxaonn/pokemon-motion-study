import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url),
  output = new URL("dist/", root);
// dist is this script's generated output, never the source tree.
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const path of [
  "index.html",
  "style.css",
  "src",
  "vendor",
  "models.json",
  "media",
  "LICENSE",
  "THIRD_PARTY.md",
  "MOTION.md",
])
  await cp(new URL(path, root), new URL(path, output), { recursive: true });
if (process.argv.includes("--local-models"))
  await cp(new URL(".cache/models/", root), new URL("models/", output), {
    recursive: true,
  });
console.log("Built " + fileURLToPath(output));
