# Hew 1.4.0 camera review — 2026-11-23

## Scope

Read-only inspection of `C:\Users\Tyler\Downloads\Hew3D Sketchup\hew-1.4.0`, compared with the supplied camera requirements. No Hew code was changed. This is a source review, not proof of behavior in a running browser or SketchUp 2017. The `SketchUp.exe` installation is present at `C:\Program Files\SketchUp\SketchUp 2017\SketchUp.exe`, but interactive application control failed to connect to its native pipe on both attempts. No live comparison was performed.

## Code findings

| Topic | What the Hew 1.4.0 source shows | Comparison / qualification |
| --- | --- | --- |
| Projection and up | `app/src/viewport/cameraRig.ts:66` creates a perspective camera at **45 degrees vertical**, and `Viewport.tsx:2660` creates that rig with up `(0,0,1)`. Saved poses may later restore a different FOV. | The supplied description says the current application starts at 42 degrees. The inspected Hew 1.4.0 constructor says 45; verify a fresh document interactively before changing it. This is not a measurement of SketchUp 2017. |
| Projection switching | `cameraRig.ts` matches apparent scale at the target when toggling perspective/parallel. Unit tests describe round-trip checks. | Intended behavior is present in code; no test was run during this review. |
| Orbit and pan | `Viewport.tsx:8002` binds middle to rotate, enables screen-space pan and limits polar angles. `orbitDragSwitch.ts` and `camera-drag-switch.spec.ts` cover Shift switching during a drag. | The requested middle-drag behavior is represented in the source and tests, but has not been interactively checked against the reference. |
| Right drag | `Viewport.tsx:8002` leaves `RIGHT` unbound from OrbitControls; `Viewport.tsx:10973` enters Fly on right-button press. | This differs from the stated temporary right-drag orbit behavior. Determine the intended priority of right-drag orbit versus Hew's existing Fly interaction before any change. |
| Empty-space orbit depth | `Viewport.tsx:8168` picks a solid or sketch region, then may use an acceptable ground-plane hit; otherwise it keeps the existing pivot. `cameraDepth.ts` limits distant ground fallback. | When there is no geometry, the ground plane may set depth, which differs from always falling back to the current view center. Whether this is desirable or matches SketchUp 2017 remains unverified. |
| Wheel zoom | Controls use `zoomToCursor` and cursor-depth retargeting; dynamic limits are in `cameraDepth.ts`. | Source and existing tests describe the intended behavior; feature tracking, holes, trackpads and full-scale behavior require interactive checks. |
| Zoom Extents | `Viewport.tsx:5680` gathers visible objects, instances and sketches, excludes guides, computes a bounding sphere and uses a 1.2 margin. | The fit distance in `cameraRig.ts:307` uses vertical FOV, and the parallel frustum in `frameOrthoToRadius` uses vertical radius. With a sufficiently narrow viewport (for example aspect 0.5), horizontal space can be smaller than the fitted sphere; this is an analytical risk, not a live reproduction. `zoomToWorldBounds` also deserves aspect-ratio testing. |
| Focus and camera history | `zoomToWorldBounds` exists and is used for a Model Health framing action. Searches did not establish a general Focus Selection command or previous/next *camera-history* implementation. | Saved scene next/previous actions exist; they are not evidence of a general camera history. Further inspection and interactive checks are needed. |
| Saved camera | Camera state and load/restore paths exist in `App.tsx` and the kernel camera model. | Saving and reopening with both projections was not exercised in this review. |

## Existing test coverage to run

- `app/src/viewport/cameraRig.test.ts`, `cameraDepth.test.ts`, `orbitDragSwitch.test.ts` and `zoomFloor.test.tsx` cover projection, depth, drag switching and zoom calculations.
- `app/e2e/camera-drag-switch.spec.ts` includes Shift pressed during a middle drag; `camera-zoom.spec.ts` includes a 5 cm feature in a 30 m scene and parallel projection; `camera.spec.ts` and `standard-view-keeps-zoom.spec.ts` exercise projection and standard views.
- These are existing tests, not new observations. They were not executed here: the extracted source has no `node_modules`, and installing dependencies or generating a build was outside this read-only pass.

## Remaining interactive comparison

Once application control is available, use matched scenes and camera poses in Hew and SketchUp 2017: isolated small object; widely separated objects; a deep recess or opening; empty canvas. Record orbit start and pole behavior, Shift before/during/released mid-drag, zoom-to-cursor, projection switching, extents and selection framing at portrait and landscape aspect ratios, tool handoff, resize, and save/reopen. Check geometry identities or a saved-model fingerprint before and after navigation. Record measured observations separately from source expectations.
