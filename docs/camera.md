# Camera controls

The first update to our Hew 1.4.0 fork makes camera navigation feel more
familiar to SketchUp users. It changes how orbiting, panning, and framing
work while preserving Hew's separate Fly mode. This is an initial step toward
SketchUp-style navigation; it does not claim exact behavioral parity.

## Navigation

| Action | Control |
| --- | --- |
| Orbit | Drag with the middle mouse button, or hold Shift while right-dragging. |
| Pan | Drag with the right mouse button, or hold Shift while middle-dragging. You can press or release Shift during a drag to switch gestures. |
| Zoom | Scroll the mouse wheel; zoom is directed toward the cursor. |
| Fly | Enable **Camera > Fly** for flight controls. Right-button drag no longer starts Fly outside this mode. |

Hew also retains its Orbit, Pan, and Zoom camera tools. Orbit and pan track
the pointer without inertia and stop when dragging stops. The Smooth camera
moves setting still controls animated view changes.

Orbiting uses the depth of geometry under the pointer when available. When an
orbit begins over empty space, it retains the current target instead of
choosing an artificial pivot on the ground plane. This is our design choice
and still needs direct comparison with SketchUp.

## Framing the view

- **Camera > Zoom Extents** fits visible scene geometry in the view.
- **Camera > Focus Selection** frames selected objects, groups, or component
  instances. It does not yet frame individual sketch geometry.
- Both actions account for the available viewport and space covered by side
  panels, in perspective and parallel projection. The default perspective
  field of view remains 45 degrees.

## Comparison and remaining work

Compared with original Hew 1.4.0, right-drag now pans rather than entering
hold-to-Fly, selection framing is available from the Camera menu, and framing
accounts for narrow viewports and covered space. Previous/Next camera history
is not yet implemented.

The camera rig and drag-switch unit tests passed during setup. Live comparisons
with the same model in Hew and SketchUp are still needed, particularly for
wheel zoom, orbit pivots and poles, active modeling tools, openings, resize,
and saving and reopening a project. Older right-hold-to-Fly end-to-end tests
also need to be updated for the new binding.

See [Camera navigation: SketchUp reference and Hew work](CAMERA-SKETCHUP-PARITY.md)
for observed reference behavior and [Changes from original Hew 1.4.0](../CHANGES_FROM_V1.4.0.md)
for the file-by-file summary and exact Git comparison command.
