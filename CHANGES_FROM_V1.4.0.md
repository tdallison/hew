# Changes from original Hew v1.4.0

Baseline: upstream tag `v1.4.0` (`557bae4ce4fe973ac8d76341c1b7674fb6f1f11a`).
The camera changes were committed as `fdcf90f` on `local-v1.4-camera`.

## Camera behavior

- Middle drag orbits and right drag pans. Holding Shift switches each to the
  other gesture, including during a drag. Previously right drag was used for
  hold-to-fly, and middle drag orbited.
- Orbit and pan track the pointer without inertia and stop when dragging stops.
- Fly remains available as an explicit Camera menu mode. Right-button flight
  is only engaged while Fly is enabled.
- Orbiting over empty space keeps the current target instead of using the
  ground plane as an artificial pivot. Pan and other applicable gestures can
  still use the ground as a depth fallback.
- Zoom Extents and selection framing share a fit calculation that accounts
  for viewport aspect ratio and space covered by side panels. Perspective
  and parallel projection both use aspect-aware framing.
- Camera > Focus Selection frames selected objects, groups, and component
  instances. Individual sketch geometry is not yet supported.

The original 45-degree field of view remains. Previous/Next camera history is
not implemented. Further SketchUp comparisons and updates to older Fly
end-to-end tests are noted in `docs/CAMERA-SKETCHUP-PARITY.md`.

## Code and tests

| File | Change |
| --- | --- |
| `app/src/App.tsx` | Computes selection world bounds and connects Focus Selection to the viewport. |
| `app/src/panels/MenuBar.tsx` | Adds the Focus Selection menu action and updates Fly descriptions. |
| `app/src/viewport/Viewport.tsx` | Shares framing logic, handles dock-aware fitting, changes orbit/pan bindings and pivot fallback, and limits right-button Fly activation. |
| `app/src/viewport/cameraRig.ts` | Fits a bounding sphere against both viewport axes in perspective and parallel projection. |
| `app/src/viewport/orbitDragSwitch.ts` | Uses switchable middle-orbit and right-pan bindings. |
| `app/src/viewport/cameraRig.test.ts` | Updates framing tests. |
| `app/src/viewport/orbitDragSwitch.test.ts` | Updates drag binding tests. |
| `app/e2e/camera-drag-switch.spec.ts` | Adds/updates browser coverage for drag switching. |
| `docs/CAMERA-SKETCHUP-PARITY.md` | Records reference observations, implemented behavior, and remaining validation. |

To see the exact committed patch, run:

```powershell
git diff v1.4.0 HEAD
```

To include uncommitted tracked edits as well, use `git diff v1.4.0`. New
untracked files are not included in either diff; `git status` lists them.
