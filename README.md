# Pokémon Motion Study

**Every move has weight.** A small, interactive Three.js study of scroll-directed
character animation: soft landings, planted feet, overlapping motion and a
reactive tail flame.

[Open the interactive study](https://ncihxaonn.github.io/pokemon-motion-study/) ·
[Motion notes](MOTION.md) · [Credits & asset rights](THIRD_PARTY.md)

### Pikachu

Run in, brake, settle, then dash away. Ears, wrists and the tail follow the stride
with a slight delay.

<video controls preload="metadata" playsinline poster="https://raw.githubusercontent.com/ncihxaonn/pokemon-motion-study/main/media/pikachu.jpg" width="100%">
  <source src="https://raw.githubusercontent.com/ncihxaonn/pokemon-motion-study/main/media/pikachu.mp4" type="video/mp4">
</video>

[Open Pikachu's full recording](media/pikachu.mp4)

### Snorlax

Drop into the stage, settle into sleep, reach for an itch, roll past the support
and slip off. The hands, feet and smaller joints react after the heavy core.

<video controls preload="metadata" playsinline poster="https://raw.githubusercontent.com/ncihxaonn/pokemon-motion-study/main/media/snorlax.jpg" width="100%">
  <source src="https://raw.githubusercontent.com/ncihxaonn/pokemon-motion-study/main/media/snorlax.mp4" type="video/mp4">
</video>

[Open Snorlax's full recording](media/snorlax.mp4)

### Charizard

Brake, reach with the feet, absorb the landing, crouch, push through the toes,
then fly left toward the camera. The tail follows in seven segments; the flame
bends with tail movement, relative airflow and upward buoyancy.

<video controls preload="metadata" playsinline poster="https://raw.githubusercontent.com/ncihxaonn/pokemon-motion-study/main/media/charizard.jpg" width="100%">
  <source src="https://raw.githubusercontent.com/ncihxaonn/pokemon-motion-study/main/media/charizard.mp4" type="video/mp4">
</video>

[Open Charizard's full recording](media/charizard.mp4)

The recordings are actual browser frames of the full sequence, one per character.
The interactive page also has an inline video gallery under **Watch the full recordings**.

## Try it locally

Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:8080/**. The page downloads the original character models
from the pinned upstream URLs. Internet access is needed for those model files.
There is no backend, account or API key.

- Scroll over the stage or drag **Sequence** to scrub forward and backward.
- Use **Play full sequence**, **Slow · ¼×**, or **Pause** to inspect the motion.
- Jump between the named poses or use the frame buttons.
- Focus the stage: **← / →** step, **Space** pauses or resumes.
- Reduced-motion preferences start playback paused. Hidden tabs stop rendering.

For local cached models:

```sh
npm run models:fetch
node scripts/build.mjs --local-models
npm run preview
```

Then open **http://127.0.0.1:8080/?models=local**. Downloaded GLBs stay in the
ignored `.cache/` directory and are excluded from the default public build.

## How it works

| File                      | Responsibility                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------- |
| `src/choreography.js`     | Pure scroll-to-pose curves, contact phases and screen-space paths                       |
| `src/characters.js`       | Original rig cloning, native clip blending, additive motion, foot IK and flame response |
| `src/app.js`              | One scene clock, UI, timeline, framing, playback and capture                            |
| `models.json`             | Pinned model provenance, clips and hashes                                               |
| `scripts/verify-rigs.mjs` | Real-mesh tests for pose continuity, contact, reverse scrubbing and asset preservation  |

Motion is deterministic at the same scroll position and clock time. It does not
accumulate per-frame joint offsets. Original character proportions and rig segment
lengths are preserved; only uniform presentation scale and joint poses change.

## Verify

```sh
npm test
npm run models:fetch
npm run test:rig
npm run build
```

The rig checks parse the actual GLBs, check original hashes and source isolation,
plant the toes through contact, check extended flight legs and attached flame
segments, and sweep the full sequence for discontinuities and clipping. These
checks support visual review; they do not certify physically exact animal motion.

## Re-record the demos

Install Chromium for Playwright and have `ffmpeg` on your PATH:

```sh
npx playwright install chromium
npm run models:fetch
npm run record
```

To reuse an existing Chromium installation, set `STUDY_CHROMIUM_PATH` to its
executable path when running `npm run record`.

This builds a local capture view, renders the real page at **1440 × 900 / 30 fps**,
and writes one complete MP4 plus a poster per character into `media/`. Capture
uses explicit frame times so dropped real-time browser frames do not become
stutters in the recording. No reference video or generated movie is substituted
for the running application. See `media/README.md` for capture details.

## License

Original project code: **MIT**. Three.js: **MIT**, with its license included.
Pokémon models, textures, native clips and character artwork are third-party
material and are **not granted an open-source asset license** by this project.
They are not bundled in Git. See [THIRD_PARTY.md](THIRD_PARTY.md) for the distinction,
upstream credits and the status of the demonstration media.
