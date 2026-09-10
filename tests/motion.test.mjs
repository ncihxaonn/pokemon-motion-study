import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import test from "node:test";
const root = new URL("../", import.meta.url);
const context = vm.createContext({});
vm.runInContext(
  readFileSync(new URL("src/choreography.js", root), "utf8"),
  context,
);
const motion = (kind, distance, intro = 1, still = false) =>
  context.pokemonScrollMotion(kind, distance, intro, still);
const anchor = { left: 860, top: 200, width: 220, height: 220 },
  viewport = { width: 1280, height: 800 };
const rect = (kind, state, base = anchor, view = viewport) =>
  context.pokemonScreenPose(kind, state, base, view);
const near = (actual, expected, epsilon = 1e-6) =>
  assert(Math.abs(actual - expected) < epsilon);

test("Snorlax reaches before rolling, then falls only after losing support", () => {
  const itchy = motion("snorlax", 0.15),
    leading = motion("snorlax", 0.22),
    turning = motion("snorlax", 0.34);
  assert.equal(itchy.scratch, 1);
  assert.equal(itchy.turn + itchy.fall, 0);
  assert(leading.shoulderLead > leading.turn);
  assert.equal(leading.slip + leading.fall, 0);
  assert(turning.turn > 0.5);
  assert.equal(turning.fall, 0);
  near(rect("snorlax", turning).top, anchor.top);
  const y = (exit) =>
    rect("snorlax", motion("snorlax", 0.18 + exit * 0.55)).top;
  assert(y(0.9) - y(0.8) > y(0.7) - y(0.6));
  assert.equal(motion("snorlax", 0.5).scratch, 0);
});
test("Snorlax enters above and departs below without an early fade", () => {
  assert(rect("snorlax", motion("snorlax", -0.72)).bottom < 0);
  near(rect("snorlax", motion("snorlax", 0)).top, anchor.top);
  assert.equal(motion("snorlax", 0.55).opacity, 1);
  assert(rect("snorlax", motion("snorlax", 0.73)).top > viewport.height);
});
test("Charizard accepts load, crouches and pushes before toe-off", () => {
  const touching = motion("charizard", -0.72 + 0.7 * 0.62);
  assert(
    touching.support > 0.5 && touching.landingLoad > 0 && touching.reach > 0,
  );
  const crouch = motion("charizard", 0.3),
    push = motion("charizard", 0.365);
  assert(
    crouch.crouch > 0.99 && push.crouch < crouch.crouch && push.push > 0.8,
  );
  for (const state of [crouch, push]) {
    assert.equal(state.support, 1);
    near(rect("charizard", state).left, anchor.left);
    near(rect("charizard", state).top, anchor.top);
  }
  assert.equal(motion("charizard", 0.46).support, 0);
});
test("Charizard anticipates the destination without an airborne spin", () => {
  const look = motion("charizard", 0.27);
  assert(look.gazeYaw < -0.5);
  near(look.yaw, 0);
  for (const [base, view] of [
    [anchor, viewport],
    [
      { left: 300, top: 180, width: 180, height: 180 },
      { width: 539, height: 963 },
    ],
  ]) {
    let prior = rect("charizard", motion("charizard", 0.4), base, view),
      yaw = 0;
    for (let d = 0.405; d <= 0.731; d += 0.005) {
      const state = motion("charizard", d),
        now = rect("charizard", state, base, view);
      assert(now.left + now.width / 2 <= prior.left + prior.width / 2);
      assert(now.width >= prior.width);
      assert(state.yaw > -Math.PI / 2 && state.yaw <= 0);
      assert(Math.abs(state.yaw - yaw) < 0.045);
      prior = now;
      yaw = state.yaw;
    }
    assert(prior.right < 0);
    assert(
      rect("charizard", motion("charizard", 0.18 + 0.55 * 0.92), base, view)
        .right < 0,
    );
  }
});
test("Launch position and velocity meet continuously", () => {
  const e = 0.00001,
    at = 0.18 + 0.55 * 0.4,
    points = [at - e, at, at + e].map((d) =>
      rect("charizard", motion("charizard", d)),
    );
  for (const key of ["left", "top", "width"]) {
    assert(Math.abs(points[2][key] - points[0][key]) < 0.001);
    assert(
      Math.abs(
        (points[2][key] - points[1][key]) / e -
          (points[1][key] - points[0][key]) / e,
      ) < 1,
    );
  }
});
test("Reverse scrubbing is deterministic and reduced motion settles all actors", () => {
  for (const kind of ["pikachu", "snorlax", "charizard"]) {
    const samples = [-0.7, -0.4, -0.1, 0, 0.3, 0.5, 0.7].map((d) => ({
      d,
      state: motion(kind, d),
    }));
    for (const { d, state } of samples.reverse())
      assert.deepEqual(motion(kind, d), state);
    const still = motion(kind, -0.2, 0.3, true);
    near(rect(kind, still).left, anchor.left);
    near(rect(kind, still).top, anchor.top);
    assert.equal(still.run + still.flight, 0);
  }
});
test("All shipped scripts parse and the UI is English", () => {
  for (const name of ["app", "characters", "choreography"])
    new vm.Script(readFileSync(new URL("src/" + name + ".js", root), "utf8"));
  const html = readFileSync(new URL("index.html", root), "utf8");
  assert(html.includes('lang="en"'));
  assert(!/\p{Script=Han}/u.test(html));
  assert(
    !/requestAnimationFrame|setInterval|Date\.now\(/.test(
      readFileSync(new URL("src/characters.js", root), "utf8"),
    ),
  );
});
