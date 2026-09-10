# Full-sequence screen recordings

One recording per character, captured from this project's English browser UI.
Each MP4 covers the complete entrance, interaction and exit in an 18-second video:
0.75 seconds before movement, a 16-second sequence, and 1.25 seconds after departure.

- `pikachu.mp4` / `pikachu.jpg`
- `snorlax.mp4` / `snorlax.jpg`
- `charizard.mp4` / `charizard.jpg`

Capture: Chromium through Playwright, 1440 × 900, 30 frames per second, H.264
with yuv420p and fast-start metadata. The browser is advanced with explicit frame
times; each output frame is a screenshot of the actual page and WebGL renderer.
The command is `npm run record` (requires Chromium, ffmpeg and the local model cache).

These are visual documentation featuring third-party Pokémon assets. See
[the asset and media notices](../THIRD_PARTY.md); the MIT code license does not
grant rights to the depicted characters or models.
