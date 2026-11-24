# Camera navigation: SketchUp reference and Hew work

## Direct reference observations

In SketchUp Make 2017, the Camera menu lists Previous and Next views,
perspective and parallel projection, Orbit (O), Pan (H), Zoom (Z), and Zoom
Extents. With Orbit active, its status bar identifies Shift as Pan and Ctrl
as suspending gravity. An Orbit drag changed the view of the open sauna model;
Camera > Previous restored the earlier view. These observations do not establish
the exact orbit pivot, speed, scroll behavior, or behavior at the poles.

## Hew changes

- Middle drag orbits and right drag pans; Shift switches between orbit and
  pan during either drag. Fly remains a separate Camera command. Orbit and
  pan have no inertia.
- An orbit starting over empty space retains the current target instead of
  choosing an artificial ground-plane pivot. This is a design choice pending
  direct reference comparison.
- Zoom Extents and object framing use aspect-aware bounding-sphere fitting,
  including the space covered by side panels, in perspective and parallel.
- Camera > Focus Selection currently frames selected objects, groups, and
  component instances. Individual sketch geometry is not yet supported.
- The existing 45-degree default field of view is retained.

## Remaining work and validation

Previous/Next camera history is not implemented. Interactive comparisons with
the same model in Hew and SketchUp, including wheel zoom, active modeling
tools, openings, poles, resize, and saved-project reopening, remain to be run.
The former right-hold-to-Fly end-to-end tests describe the old binding and
must be updated for the separate Fly command before the full browser suite is
considered current. The extracted source checkout requires its generated WASM
package and Rust toolchain for a complete build and browser tests.
