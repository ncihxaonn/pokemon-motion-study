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
lengths, delays, the 38% power / 62% recovery wing split, and response amplitudes are
artistic parameters. The flame is an articulated visual approximation, not CFD.
