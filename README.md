# TITANIC — Countdown to Disaster (procedural documentary video)

A ~20-minute, 16:9 (1920×1080) documentary video generated entirely in code and synced to the
voice-over transcript (`assets/script.json`, Whisper JSON with word-level timestamps).

* **3D** — Three.js (procedural Titanic & other liners, ocean shader, sky with stars, icebergs,
  stylised low-poly characters, interiors, shipyard, underwater wreck, the Titan submersible),
  post-processing with bloom, ACES tone mapping, vignette, film grain, chromatic aberration, zoom-blur
  transitions and colour grading per scene.
* **2D / 2.5D** — canvas motion graphics in the "stylish montage" spirit: paper backgrounds with serif
  italics + bold condensed type, counters, comparisons, maps with animated routes, hull cut-away with
  flooding compartments, newspapers, stamps, check-lists.
* **Countdown cards** — "14 YEARS / BEFORE THE COLLISION" etc. are pure text on black with a low boom
  and clock ticks.
* **Sound** — everything is synthesised with the Web Audio API (no samples): ocean / wind / rain /
  crowd / boiler-room beds, rivet hammers, ship horns, morse code, bells, telegraph, metal tearing,
  splashes, rockets, glass, heartbeat, an ambient music score that follows the mood of every act,
  and the hymn "Nearer, My God, to Thee". The SFX bus is mixed well below the voice.
* **Captions** — word-synchronised, current word highlighted (toggle in the player or `--no-captions`).

Every scene starts at the timestamp of a sentence in the JSON, and inside scenes animations are keyed
to individual words (e.g. the three bells ring on "rings the bell three times"), so the picture follows the
narration without delay.

## Setup

```bash
npm install            # three, fonts, puppeteer (downloads Chrome for Puppeteer)
```

Requires Node 18+ and `ffmpeg` on the PATH.

## Preview in the browser (real-time, with voice-over and Web Audio SFX)

```bash
npm run dev            # http://localhost:5173
```

Space = play/pause, ←/→ = ±5 s, PageUp/PageDown = previous/next scene, `?t=540` in the URL jumps to a time.

## Render the video (30 fps, Puppeteer → ffmpeg)

```bash
node render.js                          # → out/titanic.mp4
node render.js --workers 4              # parallel browsers (use ≈ number of GPU/CPU cores)
node render.js --start 540 --end 620    # render only a section (for checking)
node render.js --resume                 # continue an interrupted render (finished parts are reused)
node render.js --no-captions            # without burned-in captions
node render.js --sfx 0.25               # SFX/music level relative to the voice (default 0.32)
node render.js --gl egl                 # pick the GL backend if WebGL is slow (auto | egl | gl | swiftshader)
CHROME_PATH=/path/to/chrome node render.js
```

What it does:
1. starts a local static server, opens `index.html?render=1` in headless Chrome;
2. renders the whole sound design offline (`OfflineAudioContext`) to `out/parts/sfx.wav`;
3. for every frame calls `window.__T.frame(t)` (fully deterministic — time is the only input) and
   pipes the JPEG frames into ffmpeg (libx264, CRF 18, yuv420p);
4. concatenates the parts and mixes `assets/voiceover.mp3` + SFX (with a limiter) into `out/titanic.mp4`.

The render log prints the WebGL renderer: with a GPU it should not say "SwiftShader". On a machine
without a GPU everything still works, only slower (≈1–3 s per frame).

Single stills for checking: `node tools/snap.js 12.5 300 543.2` or `node tools/snap.js --scenes --mid`.

## Project layout

```
index.html            player / render page
render.js             Puppeteer renderer
server.js             static server
src/engine.js         renderer, post-processing, timeline, transitions
src/captions.js       word-synced captions
src/audio.js          Web Audio synths, beds, music score
src/lib/              ship builder, ocean/sky/iceberg, characters & crowds, 2D motion-graphics helpers
src/scenes/act1..5.js all scenes in order (each keyed to segment ids of the JSON)
src/scenes/common.js  countdown cards, ocean world, camera helpers
src/scenes/worlds.js  rooms, shipyard, underwater, city
src/scenes/sets.js    wireless room, bridge, dining saloon, crow's nest, grand staircase
src/scenes/diagrams.js cut-away, newspaper, North-Atlantic map, stopwatch, counters
assets/               voice-over mp3 + transcript JSON
```

To re-time for a new voice-over, replace `assets/voiceover.mp3` and `assets/script.json`
(same Whisper format): scenes are anchored to segment ids, so as long as the text is the same,
everything re-syncs automatically.
