(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const canvas = $("canvas"),
    stage = $("#stage"),
    slider = $("#progress");
  const pause = $("#pause"),
    loop = $("#loop"),
    slow = $("#slow");
  const params = new URLSearchParams(location.search);
  const capture = params.has("capture");
  if (capture) document.body.dataset.capture = "true";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const MIN = -0.72,
    MAX = 0.73,
    DURATION = 16;
  const clamp = (value) => Math.max(MIN, Math.min(MAX, value));
  const stories = {
    pikachu: ["Pikachu", "Run in. Settle. Dash away."],
    snorlax: ["Snorlax", "Land. Snooze. Scratch. Slip."],
    charizard: ["Charizard", "Brake. Land. Push off. Fly past."],
  };
  const poses = {
    pikachu: [
      [-0.4, "Run in"],
      [-0.2, "Brake & settle"],
      [0, "Rest"],
      [0.23, "Turn & start"],
      [0.38, "Run out"],
    ],
    snorlax: [
      [-0.38, "Fall in"],
      [-0.25, "Soft landing"],
      [-0.2, "Limb recoil"],
      [0, "Sleep"],
      [0.15, "Scratch"],
      [0.29, "Reach across"],
      [0.34, "Roll over"],
      [0.46, "Lose support"],
      [0.56, "Fall & follow through"],
    ],
    charizard: [
      [-0.38, "Brake & reach"],
      [-0.212, "Absorb impact"],
      [0, "Stand"],
      [0.3, "Crouch"],
      [0.365, "Push off"],
      [0.43, "Extend"],
      [0.49, "Sweep legs back"],
      [0.53, "Fly toward us"],
      [0.59, "Pass the camera"],
      [0.67, "Exit left"],
    ],
  };
  let kind = Object.hasOwn(stories, params.get("pokemon"))
    ? params.get("pokemon")
    : "charizard";
  const actors = new Map();
  let renderer,
    scene,
    active,
    clock = 0,
    previous = 0,
    frame = 0;
  let paused = reduced.matches || capture,
    looping = false,
    loopTime = 0,
    speed = 1;
  // Keep exact animation progress separate from the range input's step quantization.
  let sequencePosition = 0;
  let renderWidth = 0,
    renderHeight = 0,
    ready = false;

  function phaseLabel(motion) {
    if (kind === "pikachu")
      return motion.entry < 0.8
        ? "Run in"
        : motion.entry < 1
          ? "Brake & settle"
          : motion.exit < 0.01
            ? "Rest"
            : motion.exit < 0.2
              ? "Turn → push off"
              : "Run out";
    if (kind === "snorlax")
      return motion.entry < 1
        ? "Fall → soft contact → recoil"
        : motion.scratch > 0.2 && motion.exit < 0.04
          ? "An itchy belly"
          : motion.exit < 0.04
            ? "Sleep"
            : motion.exit < 0.48
              ? "Reach → roll → lose support"
              : "Slip → fall → follow through";
    return {
      approach: "Approach",
      brake: "Brake & extend the legs",
      touchdown: "Feet make contact",
      absorb: "Bend the knees · absorb the load",
      settle: "Recover balance",
      rest: "Stand",
      crouch: "Crouch · store energy",
      push: "Push through the toes",
      liftoff: "Extend · sweep the legs back",
      fly: "Fly left · toward the camera",
    }[motion.action];
  }
  function syncButtons() {
    pause.setAttribute("aria-pressed", String(paused));
    pause.textContent = paused ? "Resume" : "Pause";
    loop.setAttribute("aria-pressed", String(looping));
    loop.textContent = looping ? "Stop sequence" : "Play full sequence";
    slow.setAttribute("aria-pressed", String(speed === 0.25));
  }
  function stopLoop() {
    looping = false;
    syncButtons();
  }
  function select(next) {
    if (!actors.has(next)) return;
    if (active) scene.remove(active.actor.group);
    kind = next;
    active = actors.get(kind);
    scene.add(active.actor.group);
    document.documentElement.dataset.model = kind;
    document
      .querySelectorAll("[data-kind]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.kind === kind),
        ),
      );
    if (capture) {
      $("h1").textContent = stories[kind][0];
      $("#story").textContent = stories[kind][1];
    }
    const controls = $(".controls");
    controls.replaceChildren();
    for (const [at, label] of poses[kind]) {
      const button = document.createElement("button");
      button.textContent = label;
      button.addEventListener("click", () => seek(at));
      controls.append(button);
    }
    render();
  }
  function render() {
    if (!ready || !active) return;
    const w = canvas.clientWidth,
      h = canvas.clientHeight;
    if (w !== renderWidth || h !== renderHeight) {
      renderer.setSize(w, h, false);
      renderWidth = w;
      renderHeight = h;
    }
    renderer.setScissorTest(false);
    renderer.clear();
    const distance = sequencePosition,
      intro = Math.max(0, Math.min(1, (distance + 0.72) / 0.62));
    const motion = pokemonScrollMotion(kind, distance, intro);
    active.actor.update(clock, false, motion);
    const card = $("#card").getBoundingClientRect(),
      area = canvas.getBoundingClientRect();
    const size = Math.min(340, w * 0.38, h * 0.56),
      fit = active.camera.userData.frame;
    const base = {
      left: card.right - area.left - size * 0.88,
      top:
        card.top -
        area.top -
        size * (fit.foot - (kind === "snorlax" ? 0.16 : 0)),
      width: size,
      height: size,
    };
    const expanded = {
      left: base.left + fit.x * size,
      top: base.top + fit.y * size,
      width: size * fit.scale,
      height: size * fit.scale,
    };
    const rect = pokemonScreenPose(kind, motion, expanded, {
      width: w,
      height: h,
    });
    renderer.setViewport(rect.left, h - rect.bottom, rect.width, rect.height);
    renderer.render(scene, active.camera);
    canvas.style.opacity = String(motion.opacity);
    $("#phase").textContent = phaseLabel(motion);
    $("#progress-value").value =
      Math.round(((distance - MIN) / (MAX - MIN)) * 100) + "%";
    document.documentElement.dataset.progress = String(distance);
  }
  function queue() {
    if (!frame && ready && !paused && !document.hidden && !capture)
      frame = requestAnimationFrame(tick);
  }
  function tick(now) {
    frame = 0;
    const dt = previous ? Math.min(0.05, (now - previous) / 1000) : 0;
    previous = now;
    if (!paused) {
      clock += dt * speed;
      if (looping) {
        loopTime = (loopTime + dt * speed) % DURATION;
        sequencePosition = MIN + ((MAX - MIN) * loopTime) / DURATION;
        slider.value = String(sequencePosition);
      }
    }
    render();
    queue();
  }
  function seek(value) {
    stopLoop();
    sequencePosition = clamp(value);
    slider.value = String(sequencePosition);
    render();
  }
  function setPaused(value) {
    paused = value;
    previous = 0;
    cancelAnimationFrame(frame);
    frame = 0;
    syncButtons();
    render();
    queue();
  }
  function step(direction) {
    stopLoop();
    setPaused(true);
    clock = Math.max(0, clock + direction / 60);
    sequencePosition = clamp(sequencePosition + direction * 0.005);
    slider.value = String(sequencePosition);
    render();
  }
  slider.addEventListener("input", () => seek(Number(slider.value)));
  document.querySelectorAll("[data-kind]").forEach((button) =>
    button.addEventListener("click", () => {
      stopLoop();
      sequencePosition = 0;
      slider.value = "0";
      select(button.dataset.kind);
    }),
  );
  pause.addEventListener("click", () => setPaused(!paused));
  slow.addEventListener("click", () => {
    speed = speed === 1 ? 0.25 : 1;
    syncButtons();
  });
  loop.addEventListener("click", () => {
    looping = !looping;
    if (looping) {
      loopTime = 0;
      clock = 0;
      sequencePosition = MIN;
      slider.value = String(MIN);
      setPaused(false);
    }
    syncButtons();
  });
  $("#back").addEventListener("click", () => step(-1));
  $("#forward").addEventListener("click", () => step(1));
  stage.addEventListener(
    "wheel",
    (event) => {
      if (!ready) return;
      event.preventDefault();
      seek(sequencePosition + event.deltaY * 0.0007);
    },
    { passive: false },
  );
  stage.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      step(event.key === "ArrowRight" ? 1 : -1);
    }
    if (event.code === "Space") {
      event.preventDefault();
      setPaused(!paused);
    }
  });
  document.addEventListener("visibilitychange", () => {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (!document.hidden) {
      render();
      queue();
    }
  });
  reduced.addEventListener("change", (event) => {
    if (event.matches) {
      stopLoop();
      setPaused(true);
    }
  });
  new ResizeObserver(render).observe(stage);
  $("#retry").addEventListener("click", () => location.reload());
  function fail(error) {
    document.documentElement.dataset.characterStatus = "error";
    $("#error").hidden = false;
    $("#error-detail").textContent =
      error.message ||
      "Please check WebGL support and your connection, then try again.";
    $("#status").textContent =
      "Preview unavailable. The recorded demos below are still available.";
  }
  async function boot() {
    document
      .querySelectorAll("nav button,input")
      .forEach((button) => (button.disabled = true));
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
      });
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.physicallyCorrectLights = true;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.setPixelRatio(capture ? 1 : Math.min(devicePixelRatio, 1.75));
      scene = new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xcfeaff, 0x243342, 0.7));
      for (const [color, intensity, position] of [
        [0xffedcf, 2.4, [-3, 5, 6]],
        [0x7acbe8, 1.3, [4, 3, -4]],
        [0xe9f4ff, 0.35, [3, 1, 5]],
      ]) {
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(...position);
        scene.add(light);
      }
      const response = await fetch("models.json");
      if (!response.ok)
        throw new Error("The model manifest could not be loaded.");
      const manifest = await response.json();
      const localModels = params.get("models") === "local";
      await loadPokemonModels((name) =>
        localModels
          ? "models/" + name + ".glb"
          : manifest.models.find((model) => model.name === name).url,
      );
      for (const name of Object.keys(stories)) {
        const actor = createPokemonCharacter(name);
        if (actor)
          actors.set(name, {
            actor,
            camera: createPokemonJourneyCamera(actor, name),
          });
      }
      if (actors.size !== 3)
        throw new Error(
          "One or more model downloads failed. Check your connection and retry.",
        );
      ready = true;
      select(kind);
      syncButtons();
      render();
      queue();
      document
        .querySelectorAll("nav button,input")
        .forEach((button) => (button.disabled = false));
      document.documentElement.dataset.characterStatus = "ready";
      $("#status").textContent =
        "One shared clock. Reversible motion. Original rig proportions.";
    } catch (error) {
      console.warn("Motion study could not start.", error);
      fail(error);
    }
  }
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    ready = false;
    cancelAnimationFrame(frame);
    frame = 0;
    fail(
      new Error(
        "The graphics context was lost. Reload to restore the preview.",
      ),
    );
  });
  addEventListener("pagehide", () => {
    cancelAnimationFrame(frame);
    for (const { actor } of actors.values()) actor.dispose();
    renderer?.dispose();
  });
  // Deterministic screen capture uses the same DOM, rig, clock and renderer.
  // It is available only in the explicit capture view, with no extra RAF loop.
  if (capture)
    window.motionStudy = Object.freeze({
      get ready() {
        return ready;
      },
      setFrame({ character = kind, distance = 0, time = 0 } = {}) {
        if (!ready) throw new Error("Models are not ready.");
        if (
          !Object.hasOwn(stories, character) ||
          !Number.isFinite(distance) ||
          !Number.isFinite(time)
        )
          throw new Error("Invalid capture frame.");
        clock = Math.max(0, time);
        sequencePosition = clamp(distance);
        slider.value = String(sequencePosition);
        if (character !== kind) select(character);
        render();
      },
    });
  boot();
})();
