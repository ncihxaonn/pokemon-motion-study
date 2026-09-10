import { chromium } from "playwright";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { once } from "node:events";
import { mkdir, writeFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const exec = promisify(execFile),
  root = fileURLToPath(new URL("../", import.meta.url));
const width = 1440,
  height = 900,
  fps = 30,
  seconds = 18,
  count = seconds * fps;
const requested = process.argv.slice(2);
const names = requested.length
  ? requested
  : ["pikachu", "snorlax", "charizard"];
if (names.some((name) => !["pikachu", "snorlax", "charizard"].includes(name)))
  throw new Error("Choose pikachu, snorlax or charizard.");
for (const name of ["pikachu", "snorlax", "charizard"])
  await access(new URL("../.cache/models/" + name + ".glb", import.meta.url));
await exec("ffmpeg", ["-version"]);
await exec(process.execPath, ["scripts/build.mjs", "--local-models"], {
  cwd: root,
});
await mkdir(new URL("../output/playwright/", import.meta.url), {
  recursive: true,
});
const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  cwd: root,
  env: { ...process.env, PORT: "0" },
  stdio: ["ignore", "pipe", "pipe"],
});
let browser;
try {
  const url = await new Promise((resolve, reject) => {
    let output = "";
    const timer = setTimeout(
      () => reject(new Error("Preview server did not start.")),
      15000,
    );
    server.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    server.once("exit", (code) => {
      clearTimeout(timer);
      reject(new Error("Preview server exited: " + code));
    });
    server.stdout.on("data", (chunk) => {
      output += chunk;
      const match = output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if (match) {
        clearTimeout(timer);
        resolve(match[0]);
      }
    });
  });
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.STUDY_CHROMIUM_PATH || chromium.executablePath(),
  });
  for (const character of names) {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(url + "/?capture=1&models=local&pokemon=" + character, {
      waitUntil: "networkidle",
    });
    await page.waitForFunction(
      () => window.motionStudy?.ready,
      {},
      { timeout: 60000 },
    );
    const filename = fileURLToPath(
      new URL("../media/" + character + ".mp4", import.meta.url),
    );
    const encoder = spawn(
      "ffmpeg",
      [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "image2pipe",
        "-framerate",
        String(fps),
        "-vcodec",
        "png",
        "-i",
        "pipe:0",
        "-an",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-movflags",
        "+faststart",
        filename,
      ],
      { stdio: ["pipe", "ignore", "pipe"] },
    );
    let encoderError = "",
      pipeError;
    encoder.stderr.on("data", (data) => (encoderError += data.toString()));
    encoder.stdin.on("error", (error) => {
      pipeError = error;
    });
    const encoded = new Promise((resolve, reject) => {
      encoder.once("error", reject);
      encoder.once("close", (code) =>
        code === 0
          ? resolve()
          : reject(new Error(encoderError || "ffmpeg exited " + code)),
      );
    });
    // Attach a handler immediately, while frames are being written.
    encoded.catch(() => {});
    try {
      const posterDistance = character === "charizard" ? 0.53 : 0;
      const posterIndex = Math.round(
        (0.75 + ((posterDistance + 0.72) / 1.45) * 16) * fps,
      );
      for (let index = 0; index < count; index++) {
        const time = index / fps,
          progress = Math.max(0, Math.min(1, (time - 0.75) / 16));
        await page.evaluate(
          ({ character, distance, time }) =>
            window.motionStudy.setFrame({ character, distance, time }),
          {
            character,
            distance: -0.72 + progress * 1.45,
            time: Math.max(0, time - 0.75),
          },
        );
        const screenshot = await page.screenshot({ type: "png" });
        if (pipeError) throw pipeError;
        if (!encoder.stdin.write(screenshot))
          await once(encoder.stdin, "drain");
        if (index === posterIndex) {
          await page.screenshot({
            path: fileURLToPath(
              new URL("../media/" + character + ".jpg", import.meta.url),
            ),
            type: "jpeg",
            quality: 92,
          });
          await writeFile(
            new URL(
              "../output/playwright/" + character + "-capture.png",
              import.meta.url,
            ),
            screenshot,
          );
        }
        if (index % 90 === 0)
          console.log(
            character + ": " + Math.round((index / count) * 100) + "%",
          );
      }
      encoder.stdin.end();
      await encoded;
    } catch (error) {
      encoder.kill("SIGTERM");
      throw error;
    }
    if (errors.length) throw new Error("Browser errors: " + errors.join("; "));
    await page.close();
    console.log("Recorded " + filename);
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
