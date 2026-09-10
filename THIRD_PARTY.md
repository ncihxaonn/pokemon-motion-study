# Third-party material

## Project code

The original motion choreography, additive rig controller, interface and tooling
in this repository are released under the [MIT license](LICENSE).

## Three.js

The renderer and example utilities are Three.js r149, MIT licensed by the
Three.js authors. The full license is in [vendor/THREE-LICENSE.txt](vendor/THREE-LICENSE.txt).

- [Official renderer](https://github.com/mrdoob/three.js/blob/r149/build/three.min.js)
- [GLTFLoader](https://github.com/mrdoob/three.js/blob/r149/examples/jsm/loaders/GLTFLoader.js)
- [SkeletonUtils](https://github.com/mrdoob/three.js/blob/r149/examples/jsm/utils/SkeletonUtils.js)
- [BufferGeometryUtils](https://github.com/mrdoob/three.js/blob/r149/examples/jsm/utils/BufferGeometryUtils.js)

`vendor/three-examples.js` wraps those official example modules for the shared
THREE namespace. It includes the original license. The renderer's SHA-256 is
`8a5f7249903b54d30f79f708699d2fed2d6a1d0741a4cd41377d1f01bb5a2271`.

## Pokémon models, textures and native animation clips

Model source: [06wj/pokemon](https://github.com/06wj/pokemon), pinned to commit
`00d96f7f18894055e7f1db44fa0df6462e5e4c8a`. Exact paths, URLs, original clip
metadata and SHA-256 hashes are in [models.json](models.json).

The source repository licenses its code under MIT, but explicitly does not
grant rights to the Pokémon assets. Those models, textures and original clips
are **not open-source assets and are not covered by this project's MIT license**.
The GLB files are not committed here. The interactive demonstration loads the
pinned third-party files from their source. The optional local download script
verifies their hashes and stores them in a Git-ignored cache.

Pokémon characters and related assets belong to their respective rights holders.
This is an unofficial fan-made technical study, with no affiliation or endorsement
from The Pokémon Company, Nintendo, Game Freak or Creatures.

## Demonstration media

The three MP4 screen recordings and JPEG preview frames were captured from this
project's browser renderer. They show third-party Pokémon characters and assets;
the code license does not grant rights to those characters, models or artwork.
They are provided as visual documentation, not as a reusable character asset pack.

## Motion references

Links in [MOTION.md](MOTION.md) point to the original institutions and research.
No reference footage is copied into this repository. The animation uses authored
curves and deterministic delayed samples; it is not a motion-capture reproduction
or a physical/fluid solver.

No ThreeUI Pro landing-page source, scene, paid artwork, fonts or shaders are
included in this independent project.
