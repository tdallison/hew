# SketchUp 8 runtime comparison, 2026-11-05

The supplied `Google SketchUp 8/SketchUp.exe` was exercised in a separate unsaved test document through computer-use. The original binary was not patched. These are observed UI and Ruby API results, separate from the static REA evidence in [the investigation](SKETCHUP8-INFERENCE-INVESTIGATION.md). No instruction-level runtime trace was collected. Tests below establish bounded behavior, not complete kernel equivalence.

## Push/Pull

The UI showed that extending a box cap normally merged the adjoining side walls without leaving a horizontal seam. Tapping Ctrl changed the status to create a new starting face; extending again retained a horizontal boundary. An inset dragged beyond the opposing wall produced a protrusion on the far side, so arbitrary overshoot must not be interpreted as a through-hole.

The Ruby Console provided exact topology counts. Coordinates and distances below are numeric SketchUp API values; the reconstruction tests use the same dimensionless fixture proportions. This does not establish the units of the native controller's `0.001` global.

| Fixture | Native observed | Reconstruction regression |
|---|---|---|
| 100 by 100 rectangle, extrude 30 | 6 faces, 12 edges | Matches |
| Extend its cap another 20 normally | 6 faces, 12 edges | Matches, including merging collinear edge pieces |
| Extend new cap 10 with API copy argument `true` | 11 faces, 20 edges | Matches, including retained starting cap |
| Separate 100 by 100 by 30 box; 20 by 20 inset pushed exactly -30 | 10 faces, 24 edges; top and bottom each have 2 loops | Matches; both ring faces triangulate to area 9,600 |

Exact-cut console output:

```text
SM_BASE faces=6 edges=12
SM_EXACT_CUT faces=10 edges=24 top_loops=[2] bottom_loops=[2]
SM_EXTEND faces=6 edges=12
SM_COPY faces=11 edges=20
```

The implementation supports an inset wholly within a surrounding face reaching a containing parallel opposite face, with no intervening obstruction. Unsupported overshoot, copy-mode through-cuts, and partial overlap are rejected transactionally. The viewport snaps close to a supported opposite-face distance and previews the same model operation used for commit. Its 6-pixel stop aperture is a project policy, not a recovered native parameter.

## Endpoint acquisition

An isolated group contained one line from `[1500,500,100]` to `[1600,500,100]`. The camera was orthographic, looking from `[1550,450,200]` toward `[1550,500,100]`, with Z up. After Zoom to the group and redraw, `screen_coords` for the first endpoint returned approximately `(47.5,479.5)` in viewport coordinates. `InputPoint.pick` returned:

| Integer pick coordinate | Result |
|---|---|
| `(42,480)` and `(48,474)` | `vertex=true`, `Endpoint in Group` |
| `(41,480)` and `(48,473)` | `vertex=false`, blank tooltip |
| offsets of 8 or 9 on those directions | `vertex=false`, blank tooltip |

This brackets endpoint acquisition between the sampled distances of approximately 5.52 and 6.52 viewport-coordinate units on this machine and fixture. A 6-pixel point radius now approximates this observation in the reconstruction. The exact shape, boundary inclusion, DPI conversion, zoom dependence, overlapping-candidate priority, and UI-tool-specific behavior remain unproven. An earlier perspective probe was discarded for calibration because returned positions revealed that other test groups overlapped the intended endpoint.

The original [Ruby probe helper](reference/SketchUp8Probes.rb) captures equivalent setup and measurements for repeatable work in a disposable reference document. The recorded session used individual one-line console statements. The consolidated helper itself has not been loaded into the original app.

## Implementation checks

The independent inference engine uses normalized ray-distance candidates, continuous visibility checks, depth clipping shared with the renderer, and line/plane constraints. Regression tests cover endpoint zoom behavior, midpoints, edge interiors, front-face occlusion, holes, coplanarity, extreme zoom, behind-camera candidates, Shift release preserving arrow lock, held-key repeat, and secondary edge intersections while locked. These are correctness tests for our implementation; native occlusion and full lock-state parity still need controlled reference probes.

For the orthographic camera, point acquisition/ranking now computes the equivalent projected screen distance directly. A reproduced minimum-scale float cancellation error in the earlier eye-origin ray calculation reached 3.6 pixels; a 169-sample aperture grid and translated-camera tests guard the correction. The native ray-distance observation supports the geometric relationship, not the use of our float representation or our candidate priority.

Interactive checks of the rebuilt OpenGL app verified rectangle drawing, first extrusion, seam-free normal extension, Ctrl retained-face extension, and Ctrl+Z preserving the mode. Loading [pushpull-inset.smodel](reference/pushpull-inset.smodel), dragging its inset downward near the bottom, and orbiting above it showed a through-opening. The saved [result](reference/pushpull-throughcut-result.smodel) preserves that geometry. The final numerical picker correction was validated by regression tests after this UI pass.

Validation commands: `dotnet build -o .\bin\iteration-20261105-final` and `dotnet run --project tests\GeometryTests.csproj`. The final run passed geometry, persistence, inference, and interaction checks; the build completed without warnings or errors.

Next comparisons should isolate midpoint and edge acquisition, repeat at multiple zoom/DPI settings, measure hidden versus visible endpoints, test Shift hold/release with secondary inference, and expand Push/Pull to more topology configurations. The native rounding-step helper and distance units should be resolved before implementing its observed minimum-distance threshold or dynamic quantization.

## Additional reference observations

In a new unsaved SketchUp 8 document, separate Ruby API fixtures used a 100×100×30 box with a 20×20 inset. An inset push of -10 produced 11 faces and 24 edges with the far face intact; exactly -30 produced 10 faces and 24 edges with two openings; -40 produced 11 faces and 24 edges with a cap beyond the intact far face. The latter is a self-intersecting surface arrangement and does not establish a Boolean subtraction.

For an entire 100×100 cap, -10 produced a six-face box 20 units high, -30 left no faces or edges, and -40 produced a six-face box on the other side of the original base. Extending the ring face of a through-hole by 10 produced 10 faces and 24 edges, with a two-loop ring at the new height. These are API observations for the stated fixtures, not universal topology guarantees.

In the same reference application, a double-click on a box face selected one face and four edges; a triple-click selected the connected box's six faces and twelve edges. The Push/Pull cursor showed its plus cue after Ctrl, then the cue disappeared after switching to Select and returning to Push/Pull. Our tool resets to normal mode on tool entry; its explicit Boolean cut mode is an independent extension.
