# Motion notes

The goal is a clear chain of cause and reaction. The body initiates a movement;
free limbs and distal joints respond later. Delays and amplitudes are authored
for readable character animation, not fitted to measurements of a real animal.

| Study                | Natural reference                                                                                                                                                          | Applied idea                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pikachu's stride     | [Harvard Concord Field Station: high-speed jerboa footage](https://cfs.mcz.harvard.edu/news-media/jerboa)                                                                  | Review the relationship between propulsion, flight and body posture while keeping the source run clip. Ears and tail follow the same stride phase. |
| Snorlax's roll       | [Smithsonian: Bei Bei Plays in the Snow](https://nationalzoo.si.edu/animals/news/bei-bei-plays-snow)                                                                       | A large body moves past its support before falling. Limbs continue moving after contact; the response decays.                                      |
| The itchy reach      | [Jordan's observational black bear study, chapter 5](https://trace.tennessee.edu/server/api/core/bitstreams/b4d87b2e-dc2a-409a-b366-9705316ddb69/content)                  | Forelimbs reach to groom the body. The specific scratch-leading-to-a-fall story is invented character acting, not a recorded event in this source. |
| Charizard's landing  | [Roderick et al., eLife 2019, Video 2](https://elifesciences.org/articles/46415#video2)                                                                                    | Separate aerial braking, impact absorption, anchoring and adjustment. The knee chain blends into contact, with toes fixed during full support.     |
| Takeoff              | [Chin & Lentink, Nature Communications 2019](https://www.nature.com/articles/s41467-019-13347-3)                                                                           | Coordinate the leg push and wing downstroke before the aerial path takes over.                                                                     |
| Trailing flight legs | [Cornell Lab: great blue heron](https://www.allaboutbirds.org/guide/great_blue_heron/id)                                                                                   | A reference for an extended, rearward silhouette. Different birds use different flight leg postures; the character keeps its original short legs.  |
| Wing recovery        | [Brown University: robotic bat wing](https://engineering.brown.edu/news/2013-02-20/brown-researchers-build-robotic-bat-wing)                                               | Distinguish the extended power stroke and folded recovery. Wingtip reversals occur later than the root.                                            |
| Tail balance         | [Lacava et al., Journal of Experimental Biology 2024](https://journals.biologists.com/jeb/article/227/21/jeb247552/362590/The-role-of-mouse-tails-in-response-to-external) | Use tail movement as a counterweight and stabilizing response. Charizard's seven segments share the body and wing signals at increasing delays.    |
| Tail flame           | [NASA: Studying Combustion and Fire Safety](https://www.nasa.gov/missions/station/iss-research/studying-combustion-and-fire-safety/)                                       | Preserve upward rise while relative air and tail-tip movement bend the shape. The three existing flame joints articulate around an attached root.  |

## Continuity

The same progress and shared clock yield the same pose in either scrub direction.
Delayed samples come from the authored timeline, not the previous rendered frame.
This trades a full history-dependent dynamics simulation for predictable scrubbing.
Small flame-tip fluctuations and sustained flight use the same clock as the body.

The original model hierarchy remains intact. Additive offsets are restored before
each native animation sample. Two-segment foot IK preserves limb lengths and blends
the entire hip–knee–ankle chain into contact. The local pose is independent of the
external display turntable; the flame's buoyant direction is deliberately world-up.

## Deliberate stylization

Charizard is a fictional six-limbed animal, so no single natural reference defines
its whole movement. The references inform separate mechanical principles. Phase
lengths, delays, the 42% power / 58% recovery wing split, and response amplitudes are
artistic parameters. The flame is an articulated visual approximation, not CFD.

## Shoulder-led takeoff refinement

The wing controller separates shoulder depression, elbow extension and wrist
folding. The raised-wing preparation is followed by a first power stroke that overlaps
leg extension and toe-off. Two further power strokes follow before the exit. During that stroke the outer wing remains open.
The elbow and wrist then fold later than the shoulder during recovery. The source
idle clip no longer adds an unrelated wing cycle over this authored sequence.
Chest elevation follows the downstroke, the neck counter-rotates to steady the
head, and the ankles and toes respond after the hips. Foot IK retains ownership
until contact releases. These are artistic timings for this six-limbed character.

References checked for this refinement:

- [Baier, Gatesy & Dial (2013), shoulder and distal-joint XROMM kinematics](https://pmc.ncbi.nlm.nih.gov/articles/PMC3655074/): the shoulder dominates the wing excursion; distal joints modify wing shape and can reverse at different times.
- [Parslew et al. (2018), avian jumping takeoff](https://pmc.ncbi.nlm.nih.gov/articles/PMC6227979/): leg propulsion and body attitude during the transition to the first downstroke.
- [Provini & Abourachid (2018), whole-body 3D takeoff kinematics](https://pubmed.ncbi.nlm.nih.gov/29330588/): preparatory head/trunk alignment followed by hip and ankle extension. The researcher's [dual-view high-speed dove footage](https://www.audubon.org/news/how-birds-take-flight-such-ease) was inspected frame by frame.
- [Berg & Biewener (2010), pigeon takeoff and landing](https://journals.biologists.com/jeb/article/213/10/1651/9685/Wing-and-body-kinematics-of-takeoff-and-landing): body pitch changes through each stroke and helps orient the stroke plane.

Regression checks include the actual imported wingtip moving from above to below
the shoulder, raised wings during leg loading, sequential distal-joint response,
and preserved contact, camera framing, pause and reverse-scrub continuity.

## Sustained takeoff sequence

Three main power/recovery cycles are concentrated before the close flyby, with
a further beat continuing through the exit.
The first downstroke overlaps the leg push while the toes still bear weight;
the second and third continue after the feet release. Chest loading begins during
the combined effort, with delayed neck compensation. Each beat adds a delayed
upward component to the screen path, so the character keeps gaining height during
recovery instead of completing one flap and sliding away. The existing leftward,
toward-camera direction is preserved. The number and timing of beats are artistic
choices, not a universal bird takeoff template.

[Chin & Lentink (2019)](https://www.nature.com/articles/s41467-019-13347-3)
measure force over the first three wingbeats and find most aerodynamic force in
the downstroke. [Berg & Biewener (2010)](https://pubmed.ncbi.nlm.nih.gov/20435815/)
report continued acceleration over several takeoff beats, with the largest
acceleration in the second beat. These sources support a sustained sequence;
leg and wing contributions differ with species and the flight task.

### Flexible membrane surfaces

The study stage centers each character and removes the decorative dashboard card.
Contact and release timing stays shared with the Hero; the study uses an implied
support surface so the character silhouette remains the focus.

Charizard's membrane spar trails the leading edge. A bounded bind-space camber
corrective bows the flexible panels under each downstroke, softens during
recovery, and briefly reverses as the trailing edge catches up. The corrective
uses the original membrane-spar skin weights; only an instance-owned geometry
copy changes. The cached GLB, rigid attachments, body, and other characters remain
unchanged. Normals follow the changing surface. Disposing the actor also disposes
its private membrane geometry.

This is an authored approximation of aeroelastic response, not a fluid simulation.
The reference is Brown University's [bat membrane stiffness and curvature research](https://engineering.brown.edu/news/2014-05-24/tiny-muscles-help-bats-fine-tune-flight),
which describes load-dependent wing shape and active control of membrane stiffness.
The lag and amplitudes are chosen for the character's rig and scroll choreography.
