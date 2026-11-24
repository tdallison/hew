# Push/Pull: logic and parity

Status: 2026-11-06. This document describes the current implementation and the bounded comparisons recorded against the supplied SketchUp 8. A match for a fixture does not establish complete tool or geometry-engine parity. See [runtime observations](SKETCHUP8-RUNTIME-COMPARISON.md) and [native investigation](SKETCHUP8-INFERENCE-INVESTIGATION.md) for evidence and uncertainties.

## User workflow

In Sketch Modeler, select Push/Pull with **P**, then click a face and move the pointer and click again, or drag and release. Enter a signed distance and press Enter while the operation is active. Double-clicking another face repeats the last successful distance. Ctrl toggles retaining the starting face; switching tools resets that mode. Escape cancels. A successful operation can be undone.

The viewport projects pointer movement onto the selected face's displayed normal to obtain a signed distance. The model uses meters internally; typed values may include the simple units listed in the [README](README.md). A supported opposing face can attract the movement to an exact stop within a six-pixel projected aperture. That aperture is a project choice, not a recovered SketchUp parameter. The viewport creates a temporary copy for the preview and applies the operation to the actual model on commit. See [ModelViewport.cs](ModelViewport.cs) and [PushPullInteraction.cs](PushPullInteraction.cs).

## Geometry logic

The model is a planar edge-and-face graph. A face contains an outer loop and may contain hole loops. [GeometryModel.cs](GeometryModel.cs) implements the movement:

1. Check the selected face, finite nonzero distance, and whether the specific movement is supported. The displacement is the face normal multiplied by the signed distance.
2. For a simple whole prism, moving the cap to its opposite face collapses it; moving farther can recreate the prism on the other side. For a supported inset at exactly the opposite face, create side walls, suppress the two interior caps and leave openings in both surrounding faces.
3. Otherwise, generate a translated boundary and side connections. On a simple attached cap in normal mode, remove the old perimeter where possible and join collinear side edges, avoiding a redundant seam. The first pull of an isolated face keeps the original as the base; Ctrl mode retains the starting face for supported operations.
4. Split and deduplicate edges, rebuild planar faces and honor suppressed face keys. Supported inset movement past the opposite face follows the observed surface movement and can leave a self-intersecting arrangement; it is not treated as a Boolean subtraction.

Exact through-cuts require an inset enclosed by a surrounding source face, or a simple recessed cap surrounded by perpendicular walls, a containing parallel opposite face and no detected intervening obstruction. A recessed cap must belong to a validated closed solid; continuing it to the far face removes the old rim seam and validates the resulting solid before committing. Other attachments, partial overlaps, holes and copy-mode cuts have narrower support. Complex face intersections and universal topology behavior remain incomplete. See also [the separate solid Boolean notes](SOLID-BOOLEAN-LOGIC-AND-PARITY.md).

## Reference comparison

| Case | SketchUp 8 observation | Sketch Modeler status |
| --- | --- | --- |
| Extrude a 100 x 100 rectangle by 30 | 6 faces, 12 edges | Matching regression fixture. |
| Extend that cap by 20 normally | 6 faces, 12 edges; no intermediate seam | Matching regression and interactive check. |
| Extend a cap by 10 with retained starting face | 11 faces, 20 edges | Matching API-sized fixture; Ctrl mode also checked in the UI. |
| Push a 20 x 20 inset exactly through a 100 x 100 x 30 box | 10 faces, 24 edges; openings at both ends | Matching regression; exact stop and through-opening also checked interactively. |
| Push that inset by -10 or -40 | Shallow recess leaves the far face intact; overshoot leaves a cap beyond the intact far face | Corresponding bounded regression cases exist. Overshoot is not a general-purpose cut. |
| Move an entire cap to or past its base | Collapse at the base; inverted prism beyond it | Matching simple-prism regression cases. |
| Pull a ring face of an existing through-hole | Observed ring extension retains the opening | Supported for the tested simple holed-cap fixture. |
| Push an inset in two stages, then make a second opening | No direct reference comparison recorded for this sequence | Automated test makes a shallow recess, continues to the opposite face, then creates a second opening; verifies closed volume and reconstruction. |

The comparison uses recorded UI and Ruby API observations, not an instruction-level trace. Counts and shapes in these fixtures do not prove equivalent handling of arbitrary geometry. The staged-cut change and the newer decimal-coordinate **Push/Pull Cut** fallback have automated coverage but have not been checked interactively in the updated build.

## Native-code evidence and limits

Ghidra identifies a `CPushPullTool` path whose pointer movement gate compares each coordinate difference with `2`, and a Control-key handler that toggles stored mode state. A distance path derives a sign from a dot product; another path limits a delta using stored bounds. A separate topology path conditionally calls a function consistent with creating a loop, four edge uses and a face. These are decompiler observations, not recovered original source or a complete algorithm. Units, full condition meanings, unresolved virtual calls, and the connection through all topology branches remain open. The investigated global `0.001` has not been established as a directly usable meter-based tolerance.

Evidence: [2026-11-05 bundle](sketchup8-inference-evidence-20261105.json), [face-construction bundle](sketchup8-pushpull-evidence-20261106.json), and [caller dossier](sketchup8-pushpull-caller-20261106.json). The latter has 15 unresolved call destinations and a decompiler control-flow warning.

The [Boolean and Push/Pull follow-up](SKETCHUP8-BOOLEAN-PUSHPULL-TRACE.md) establishes that a conditional Push/Pull path and a solid-operation path both initialize and invoke the same `CMergeController` method. A distinct solid-operation dispatcher is also identified. No direct call from the inspected Push/Pull path to that dispatcher was established; indirect paths and runtime behavior remain open.

## Verification and next work

Run `dotnet run --project tests/GeometryTests.csproj`. Geometry and interaction tests cover the bounded cases above, including exact-stop and past-face behavior. Expand reference comparisons to complex adjoining geometry, partial overlap, copy-mode cuts, distance rounding, inference and snapping, and repeat-distance interaction. Investigate the remaining native branches and compare their results in the original application before claiming broader parity.
