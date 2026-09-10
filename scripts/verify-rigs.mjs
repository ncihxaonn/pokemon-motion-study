import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import vm from "node:vm";
import assert from "node:assert/strict";
const read = (path) => readFileSync(new URL(path, import.meta.url));
const context = vm.createContext({
  console,
  TextDecoder,
  TextEncoder,
  URL,
  Blob,
  setTimeout,
  clearTimeout,
});
vm.runInContext(read("../vendor/three.min.js").toString(), context);
vm.runInContext(read("../vendor/three-examples.js").toString(), context);
const source = read("../src/characters.js").toString();
vm.runInContext(read("../src/choreography.js").toString(), context);
vm.runInContext(source, context);
// Decode real meshes, skins and animation clips in the actual r149 loader.
// Only browser image decoding is stubbed here; textures are checked in-browser.
vm.runInContext(
  `var testLoader = new PokemonGLTF.GLTFLoader(); testLoader.register(() => ({name:'TEST_IMAGE_DECODE', loadTexture:() => Promise.resolve(new THREE.Texture())}));`,
  context,
);
const manifest = JSON.parse(read("../models.json"));
const THREE = context.THREE,
  report = [];
const pose = (root) => {
  const result = [];
  root.traverse((n) =>
    result.push(
      ...n.position.toArray(),
      ...n.quaternion.toArray(),
      ...n.scale.toArray(),
    ),
  );
  return result;
};
for (const entry of manifest.models) {
  const buffer = read(`../.cache/models/${entry.name}.glb`);
  assert.equal(
    createHash("sha256").update(buffer).digest("hex"),
    entry.sha256,
    "Pinned original GLB must not be stretched/re-exported",
  );
  context.input = Array.from(buffer);
  const gltf = await vm.runInContext(
    'testLoader.parseAsync(new Uint8Array(input).buffer, "")',
    context,
  );
  context.loaded = gltf;
  context.kind = entry.name;
  vm.runInContext("POKEMON_MODELS.set(kind, loaded)", context);
  const actor = context.createPokemonCharacter(entry.name),
    sibling = context.createPokemonCharacter(entry.name);
  const sourcePose = pose(gltf.scene),
    sourceVertices = [];
  gltf.scene.traverse((node) => {
    if (node.isMesh)
      sourceVertices.push({
        geometry: node.geometry,
        positions: Array.from(node.geometry.attributes.position.array),
      });
  });
  let meshes = 0,
    skinned = 0,
    triangles = 0;
  actor.group.traverse((node) => {
    assert(!node.isSprite);
    if (!node.isMesh) return;
    meshes++;
    if (node.isSkinnedMesh) skinned++;
    const position = node.geometry.getAttribute("position");
    assert([...position.array].every(Number.isFinite));
    triangles += (node.geometry.index?.count ?? position.count) / 3;
  });
  assert(skinned > 0 && meshes < 30 && triangles < 100000);
  const siblingPose = pose(sibling.group),
    initial = pose(actor.group);
  actor.update(1.3, false);
  assert.notDeepEqual(
    pose(actor.group),
    initial,
    "Native skeleton must animate",
  );
  assert.deepEqual(
    pose(sibling.group),
    siblingPose,
    "Cloned actors must have independent skeletons",
  );
  const frozen = pose(actor.group);
  actor.update(40, true);
  assert.deepEqual(
    pose(actor.group),
    frozen,
    "Pause must freeze the current pose",
  );
  actor.update(0, false);
  const cameras = [0, Math.PI / 2, Math.PI, 0.3].map((angle) =>
    context.createPokemonCamera(actor, angle, 0.65, 1),
  );
  for (const time of [0, 0.3, 1.3, 2.7, 5.2, 7.5, 8.2, 11, 33]) {
    actor.update(time, false);
    const bounds = context.pokemonPoseBounds(actor.group);
    assert(
      [
        ...bounds.min.toArray(),
        ...bounds.max.toArray(),
        ...pose(actor.group),
      ].every(Number.isFinite),
    );
    // All posed mesh vertices must fit inside each review/hero camera.
    for (const camera of cameras) {
      let max = 0;
      actor.group.traverse((node) => {
        if (!node.isMesh) return;
        const p = node.geometry.getAttribute("position"),
          v = new THREE.Vector3();
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i);
          if (node.isSkinnedMesh) node.boneTransform(i, v);
          v.applyMatrix4(node.matrixWorld).project(camera);
          max = Math.max(max, Math.abs(v.x), Math.abs(v.y));
        }
      });
      assert(
        max < 1,
        `${entry.name}: clipped animation at ${time}, NDC=${max}`,
      );
    }
  }
  const fixedMotion = context.pokemonScrollMotion(entry.name, -0.4, 0.5);
  actor.update(1.5, false, fixedMotion);
  const fixedPose = pose(actor.group);
  for (let repeat = 0; repeat < 30; repeat++)
    actor.update(1.5, false, fixedMotion);
  assert.deepEqual(
    pose(actor.group),
    fixedPose,
    "Holding scroll must not accumulate additive joint rotations",
  );
  if (entry.name !== "charizard") {
    const turntable = new THREE.Group();
    turntable.add(actor.group);
    turntable.rotation.y = 0.4;
    turntable.updateMatrixWorld(true);
    actor.update(1.5, false, fixedMotion);
    pose(actor.group).forEach((value, i) =>
      assert(
        Math.abs(value - fixedPose[i]) < 1e-6,
        `Body-local inertia must not depend on the surrounding turntable orientation: ${entry.name} component ${i}, delta ${value - fixedPose[i]}`,
      ),
    );
    turntable.remove(actor.group);
  }
  if (entry.name === "charizard") {
    const vertices = (root) => {
      const result = [];
      root.traverse((n) => {
        if (n.isMesh) result.push(...n.geometry.attributes.position.array);
      });
      return result;
    };
    const siblingVertices = vertices(sibling.group);
    actor.update(0, false, context.pokemonScrollMotion("charizard", 0, 1));
    const resting = vertices(actor.group);
    const normals = () => {
      const result = [];
      actor.group.traverse((n) => {
        if (n.isMesh) result.push(...n.geometry.attributes.normal.array);
      });
      return result;
    };
    const restingNormals = normals();
    actor.update(0, false, {
      ...context.pokemonScrollMotion("charizard", 0, 1),
      wingDrive: 1e-6,
    });
    assert(
      Math.max(...normals().map((v, i) => Math.abs(v - restingNormals[i]))) <
        1e-4,
      "A vanishingly small wing load must not cause a lighting discontinuity",
    );
    const loaded = context.pokemonScrollMotion(
      "charizard",
      0.18 + 0.55 * 0.34,
      1,
    );
    actor.update(0, false, loaded);
    const bowed = vertices(actor.group);
    assert(
      Math.max(...bowed.map((v, i) => Math.abs(v - resting[i]))) > 0.025,
      "The actual membrane surface must bow under load, independently of skeletal skinning",
    );
    actor.group.traverse((mesh) => {
      if (!mesh.isSkinnedMesh) return;
      const original = gltf.scene.getObjectByName(mesh.name).geometry.attributes
        .position.array;
      const { position, skinIndex, skinWeight } = mesh.geometry.attributes;
      for (let i = 0; i < position.count; i++) {
        let wing = false;
        for (let j = 0; j < 4; j++)
          if (
            skinWeight.array[i * 4 + j] > 0.001 &&
            mesh.skeleton.bones[skinIndex.array[i * 4 + j]].name.endsWith(
              "_wing_b",
            )
          )
            wing = true;
        for (let a = 0; a < 3; a++) {
          const delta = Math.abs(
            position.array[i * 3 + a] - original[i * 3 + a],
          );
          assert(delta < 0.15, "Membrane deflection stays bounded");
          if (!wing || a !== 2)
            assert.equal(
              delta,
              0,
              "Body and rigid attachments keep their authored geometry",
            );
        }
      }
    });
    actor.update(
      0,
      false,
      context.pokemonScrollMotion("charizard", 0.18 + 0.55 * 0.465, 1),
    );
    assert.notDeepEqual(
      vertices(actor.group),
      bowed,
      "Recovery must release membrane camber",
    );
    actor.update(0, false, loaded);
    assert.deepEqual(
      vertices(actor.group),
      bowed,
      "Reverse scrubbing restores identical membrane geometry",
    );
    actor.update(0, false, context.pokemonScrollMotion("charizard", 0, 1));
    assert.deepEqual(
      vertices(actor.group),
      resting,
      "Unloaded membranes return to their original shape",
    );
    assert.deepEqual(
      vertices(sibling.group),
      siblingVertices,
      "Membrane deformation must not leak to another character instance",
    );
  }
  // Probe the real rig on both sides of phase boundaries, including reversed
  // playback. A continuous root path alone does not rule out a snapped joint.
  const boundaries = [
    -0.72, -0.3232, -0.286, -0.2736, -0.2116, -0.1, 0.025, 0.1, 0.16, 0.18, 0.3,
    0.365, 0.378, 0.4, 0.422, 0.444, 0.46, 0.576, 0.7,
  ];
  const snapshot = () => {
    const nodes = [];
    actor.group.traverse((n) =>
      nodes.push({ node: n, q: n.quaternion.clone(), p: n.position.clone() }),
    );
    return nodes;
  };
  for (const boundary of boundaries) {
    const at = (d) =>
      context.pokemonScrollMotion(
        entry.name,
        d,
        Math.max(0, Math.min(1, (d + 0.72) / 0.62)),
      );
    actor.update(0.6, false, at(boundary - 0.00001));
    const before = snapshot();
    actor.update(0.6, false, at(boundary + 0.00001));
    before.forEach(({ node, q, p }) => {
      assert(
        node.quaternion.angleTo(q) < 0.01,
        `${entry.name}: joint snap at ${boundary}: ${node.name}`,
      );
      assert(
        node.position.distanceTo(p) < 0.01,
        `${entry.name}: translation snap at ${boundary}: ${node.name}`,
      );
    });
    actor.update(0.6, false, at(boundary - 0.00001));
    before.forEach(({ node, q, p }) => {
      // Source float quaternions need not have mathematically exact unit
      // length; angleTo(q) can be nonzero even for identical components.
      assert(
        node.quaternion
          .toArray()
          .every((value, i) => Math.abs(value - q.toArray()[i]) < 1e-6),
        `${entry.name}: reverse scroll changed joint ${node.name}`,
      );
      assert(
        node.position.distanceTo(p) < 1e-6,
        `${entry.name}: reverse scroll changed position ${node.name}`,
      );
    });
  }
  if (entry.name === "charizard") {
    // Check the actual imported skeleton, not just a scalar called "downstroke".
    const relativeWingHeight = (exit) => {
      actor.update(
        0,
        false,
        context.pokemonScrollMotion("charizard", 0.18 + exit * 0.55),
      );
      actor.group.updateMatrixWorld(true);
      const root = actor.group
        .getObjectByName("left_wing_a_01")
        .getWorldPosition(new THREE.Vector3());
      const tip = actor.group
        .getObjectByName("left_wing_a_06")
        .getWorldPosition(new THREE.Vector3());
      return actor.group.worldToLocal(tip).y - actor.group.worldToLocal(root).y;
    };
    for (const [raised, lowered] of [
      [0.2, 0.4],
      [0.48, 0.56],
      [0.64, 0.72],
    ]) {
      const raisedWing = relativeWingHeight(raised),
        loweredWing = relativeWingHeight(lowered);
      assert(
        raisedWing > 0.5 && loweredWing < -0.5,
        "The actual wingtip must complete all three above-to-below power strokes",
      );
    }
    const q = (name) => actor.group.getObjectByName(name).quaternion.toArray();
    actor.update(0.1, false, fixedMotion);
    const names = [
      "left_wing_a_01",
      "left_wing_a_03",
      "left_wing_a_05",
      "spine_02",
      "head",
      "left_arm_02",
      "left_hand",
      "left_foot",
      "tail_01",
      "tail_04",
      "tail_07",
      "center_feeler_01",
      "center_feeler_02",
      "center_feeler_03",
    ];
    const before = names.map(q);
    actor.update(0.75, false, fixedMotion);
    names.forEach((name, i) =>
      assert.notDeepEqual(
        q(name),
        before[i],
        "Clock must keep the articulated flight moving at held scroll: " + name,
      ),
    );
    const fire = [1, 2, 3].map((i) =>
      actor.group.getObjectByName("center_feeler_0" + i),
    );
    const fireRest = fire.map((b) => b.position.clone());
    const fireShape = () => fire.map((b) => b.quaternion.toArray());
    actor.update(0.3, false, context.pokemonScrollMotion(entry.name, 0.55));
    const hotPose = fireShape();
    actor.update(100, true, context.pokemonScrollMotion(entry.name, 0));
    assert.deepEqual(
      fireShape(),
      hotPose,
      "Pausing must freeze flame flicker as well as the body",
    );
    actor.update(0.3, false, context.pokemonScrollMotion(entry.name, 0));
    assert.notDeepEqual(
      fireShape(),
      hotPose,
      "At the same clock time, flight airflow must change the flame shape",
    );
    for (const distance of [-0.5, -0.212, 0, 0.365, 0.43, 0.53, 0.63])
      for (const time of [0, 0.3, 0.7, 1.1]) {
        actor.update(
          time,
          false,
          context.pokemonScrollMotion(entry.name, distance),
        );
        fire.forEach((bone, i) =>
          assert(
            bone.position.distanceTo(fireRest[i]) < 1e-6,
            "Flame roots and segment lengths must remain attached to the original tail",
          ),
        );
        const base = fire[0].getWorldPosition(new THREE.Vector3()),
          tip = fire[2].getWorldPosition(new THREE.Vector3());
        assert(
          tip.y > base.y + 0.12,
          "Buoyant flame must still rise while the body banks",
        );
      }
    actor.update(0, false, context.pokemonScrollMotion(entry.name, 0));
    const feet = ["left_toe", "right_toe"].map((name) =>
      actor.group.getObjectByName(name),
    );
    const contacts = feet.map((foot) =>
      foot.getWorldPosition(new THREE.Vector3()),
    );
    for (const distance of [-0.267, -0.2116, -0.15, 0, 0.24, 0.3, 0.35]) {
      actor.update(
        0.6,
        false,
        context.pokemonScrollMotion(entry.name, distance),
      );
      feet.forEach((foot, i) =>
        assert(
          foot.getWorldPosition(new THREE.Vector3()).distanceTo(contacts[i]) <
            0.012,
          "Toes must remain planted during load acceptance and push: " +
            distance,
        ),
      );
    }
    // Measure the real posed legs in actor coordinates (+Z is forward).
    // Checking a named 'extend' parameter would miss a reversed imported axis.
    for (const distance of [-0.6, 0.56, 0.63])
      for (const time of [0.1, 0.6, 1.1]) {
        actor.update(
          time,
          false,
          context.pokemonScrollMotion(entry.name, distance),
        );
        actor.group.updateMatrixWorld(true);
        for (const side of ["left", "right"]) {
          const point = (name) =>
            actor.group.worldToLocal(
              actor.group
                .getObjectByName(side + "_" + name)
                .getWorldPosition(new THREE.Vector3()),
            );
          const hip = point("leg_01"),
            knee = point("leg_02"),
            ankle = point("foot"),
            toe = point("toe");
          const upper = knee.clone().sub(hip),
            lower = ankle.clone().sub(knee);
          assert(
            ankle.z < hip.z - 0.6,
            "Flying ankle must trail behind the hip: " + distance,
          );
          assert(
            toe.z < ankle.z - 0.1,
            "Flying toes must point aft, not forward: " + distance,
          );
          assert(
            upper.angleTo(lower) < 0.35,
            "Flying leg must extend without curling under the belly: " +
              distance,
          );
        }
      }
  }
  if (entry.name === "pikachu") {
    // Compare at one clock time: ears/wrists/tail must follow changing stride
    // and braking, not just an unrelated idle animation timer.
    const names = [
      "spine_01",
      "head",
      "left_ear_02",
      "right_ear_03",
      "left_hand",
      "tail_01",
      "tail_03",
    ];
    actor.update(
      0.4,
      false,
      context.pokemonScrollMotion(entry.name, -0.23, 0.79),
    );
    const before = names.map((name) =>
      actor.group.getObjectByName(name).quaternion.clone(),
    );
    actor.update(
      0.4,
      false,
      context.pokemonScrollMotion(entry.name, -0.16, 0.9),
    );
    names.forEach((name, i) =>
      assert(
        actor.group.getObjectByName(name).quaternion.angleTo(before[i]) > 0.005,
        "Running and braking must carry through to " + name,
      ),
    );
  }
  if (entry.name === "snorlax") {
    const q = (name) => actor.group.getObjectByName(name).quaternion.toArray();
    const names = [
      "hips",
      "spine_01",
      "spine_02",
      "left_arm_01",
      "right_arm_01",
      "left_leg_01",
      "right_leg_01",
      "head",
      "left_ear",
      "right_ear",
      "left_toe",
      "right_toe",
      "right_ring",
    ];
    actor.update(0, false, context.pokemonScrollMotion(entry.name, 0.38));
    const before = names.map(q);
    actor.update(0, false, context.pokemonScrollMotion(entry.name, 0.57));
    names.forEach((name, i) =>
      assert.notDeepEqual(
        q(name),
        before[i],
        "The fall must articulate the original skeleton: " + name,
      ),
    );
    actor.update(0, false, context.pokemonScrollMotion(entry.name, -0.235));
    const wrist = actor.group.getObjectByName("left_hand");
    const recoil = wrist.quaternion.clone();
    actor.update(0, false, context.pokemonScrollMotion(entry.name, -0.185));
    assert(
      wrist.quaternion.angleTo(recoil) > 0.2,
      "Landing must visibly recoil and swing back at the wrist",
    );
    const dropped = pose(actor.group);
    actor.update(12, true, fixedMotion);
    assert.deepEqual(
      pose(actor.group),
      dropped,
      "Pause must freeze falling limbs too",
    );
  }
  const journeyCamera = context.createPokemonJourneyCamera(actor, entry.name);
  const journeyNeutral = context.pokemonScrollMotion(entry.name, 0, 1);
  actor.update(0, false, journeyNeutral);
  context.pokemonPoseBounds(actor.group);
  for (const [w, h] of [
    [1324, 574],
    [357, 437],
  ]) {
    const size = Math.min(
      480,
      w * 0.7,
      h * (entry.name === "charizard" ? 0.48 : 0.62),
    );
    const f = journeyCamera.userData.frame;
    const left = (w - size) / 2 + f.x * size,
      top = (h - size) / 2 + f.y * size;
    const screenBounds = new THREE.Box3();
    actor.group.traverse((node) => {
      if (!node.isMesh) return;
      const positions = node.geometry.attributes.position,
        v = new THREE.Vector3();
      for (let i = 0; i < positions.count; i++) {
        v.fromBufferAttribute(positions, i);
        if (node.isSkinnedMesh) node.boneTransform(i, v);
        v.applyMatrix4(node.matrixWorld).project(journeyCamera);
        v.set(
          left + ((v.x + 1) * size * f.scale) / 2,
          top + ((1 - v.y) * size * f.scale) / 2,
          0,
        );
        screenBounds.expandByPoint(v);
      }
    });
    const center = screenBounds.getCenter(new THREE.Vector3());
    assert(
      Math.abs(center.x - w / 2) < 0.01 && Math.abs(center.y - h / 2) < 0.01,
      `${entry.name}: actual resting mesh must be centered on the study stage, got ${center.x},${center.y}`,
    );
  }
  actor.update(2, false, journeyNeutral);
  if (entry.name === "snorlax")
    assert.notDeepEqual(
      pose(actor.group),
      initial,
      "Perched Snorlax must use native sleep pose",
    );
  for (const sampleTime of entry.name === "charizard"
    ? [0.12, 0.42, 0.75, 1.1]
    : [1.5])
    for (let step = 0; step <= 100; step++) {
      const distance = -0.72 + (step / 100) * 1.45,
        intro = Math.max(0, Math.min(1, (distance + 0.72) / 0.62));
      const motion = context.pokemonScrollMotion(entry.name, distance, intro);
      actor.update(sampleTime, false, motion);
      context.pokemonPoseBounds(actor.group);
      actor.group.traverse((node) => {
        if (!node.isMesh) return;
        const p = node.geometry.getAttribute("position"),
          v = new THREE.Vector3();
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i);
          if (node.isSkinnedMesh) node.boneTransform(i, v);
          v.applyMatrix4(node.matrixWorld).project(journeyCamera);
          assert(
            Math.max(Math.abs(v.x), Math.abs(v.y)) < 1,
            `${entry.name}: clipped scroll pose ${step}`,
          );
        }
      });
    }
  report.push({
    frameWidth: journeyCamera.right - journeyCamera.left,
    idleWidth: cameras[3].right - cameras[3].left,
    kind: entry.name,
    meshes,
    skinned,
    triangles,
    clips: gltf.animations.map((c) => c.name),
  });
  assert.deepEqual(
    pose(gltf.scene),
    sourcePose,
    "Runtime follow-through must not modify the source skeleton",
  );
  sourceVertices.forEach(({ geometry, positions }) =>
    assert.deepEqual(
      Array.from(geometry.attributes.position.array),
      positions,
      "Runtime follow-through must not distort the original mesh",
    ),
  );
  actor.dispose();
  sibling.dispose();
}
assert(!/requestAnimationFrame|setInterval|Date\.now\(/.test(source));
console.log(
  JSON.stringify(
    {
      three: THREE.REVISION,
      characters: report,
      checks:
        "Original assets, isolated skeletons, full-body follow-through, flame attachment/airflow/buoyancy, planted toes, extended flight legs, pause/reverse continuity and animated framing passed.",
    },
    null,
    2,
  ),
);
