import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../", import.meta.url);
const manifest = JSON.parse(
  await readFile(new URL("models.json", root), "utf8"),
);
await mkdir(new URL(".cache/models/", root), { recursive: true });
for (const model of manifest.models) {
  const response = await fetch(model.url, {
    signal: AbortSignal.timeout(90000),
  });
  if (!response.ok) throw new Error(model.name + ": HTTP " + response.status);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (createHash("sha256").update(bytes).digest("hex") !== model.sha256)
    throw new Error(model.name + ": source hash mismatch");
  await writeFile(new URL(".cache/models/" + model.name + ".glb", root), bytes);
  console.log("Verified " + model.name);
}
console.log(
  "Third-party assets cached locally; they are excluded from Git and the default public build.",
);
