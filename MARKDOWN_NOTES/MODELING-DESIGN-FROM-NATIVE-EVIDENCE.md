# Modeling design informed by SketchUp 8 evidence

This note connects the [native Push/Pull and Boolean trace](SKETCHUP8-BOOLEAN-PUSHPULL-TRACE.md) to Sketch Modeler. It records design direction and current code, not a claim that SketchUp's complete algorithm has been recovered.

## Workflow and behavior

The intended experience is a continuous modeling action: draw an inset on a face, activate Push/Pull, move it to the opposite face, and obtain an opening. A separate solid-operation command should not be required for that supported workflow. Preview, inference and commit should represent the same operation, with undo restoring the prior model. A recess can be continued to the opposing face in a later action.

Keep the separately observed overshoot behavior distinct: the SketchUp 8 fixture that moved beyond the far face retained that face and produced a cap beyond it. Do not silently convert every overshoot into a Boolean subtraction. The explicit Push/Pull Cut and solid operations are additional workflows. See [runtime comparison](SKETCHUP8-RUNTIME-COMPARISON.md).

## Architecture and current implementation

| Layer | Current modeler behavior | Direction informed by evidence |
| --- | --- | --- |
| Tool interaction | [ModelViewport.cs](ModelViewport.cs) selects a face, computes movement, previews a clone, and commits through the active tool. | Keep a single continuous user action and preserve distinct movement and solid-operation intents. |
| Face and topology edits | [GeometryModel.cs](GeometryModel.cs) handles face movement, edge splitting, face rebuilding and exact opposite-face cuts. Normal Push/Pull and the explicit cut's guarded fallback both use `ApplyExactCut` in supported cases. | Continue consolidating common topology and merge operations where equivalent behavior is demonstrated, without treating all face movement as solid subtraction. |
| Solid operations | [SolidBoolean.cs](SolidBoolean.cs) provides an independent BSP experiment; `GeometryModel.TryBoolean` validates and reconstructs its result. Intersections with convex vertical-prism results can use a guarded reconstruction path if the general edge-graph conversion fails. | Reuse compatible topology, validation and intersection services as evidence and tests support them. Its BSP implementation is not known to match SketchUp's algorithm. |
| Validation and commit | Boolean operations validate candidates before committing; the staged exact-cut path also validates the resulting closed solid. Candidate-based Push/Pull and Boolean paths use a shared model-state commit helper. | Retain transactional edits and meaningful failure messages while widening supported geometry. |

The static trace found that a conditional native Push/Pull path and a solid-operation path each construct a `CMergeController` and call the same method with different arguments. It also found a separate solid-operation dispatcher. This supports pursuing shared geometry infrastructure in our own design; it does **not** establish the method's complete behavior, a one-to-one equivalent to our code, or that Push/Pull calls the native solid dispatcher.

## Parity priorities

1. Compare the full rectangle-on-cube workflow, including hover and opposite-face snap, exact opening, a staged recess, undo/redo, and repeated openings in SketchUp 8 and Sketch Modeler. Verify topology and interaction, not merely appearance.
2. Trace the shared controller's inputs and branch behavior for recesses, exact openings and solid subtraction. Use controlled runtime traces where available and retain evidence separately from implementation assumptions.
3. Improve intersection and boundary reconstruction for rotated solids and complex attachments, with closed-shell and volume checks. Preserve failure without mutation when a result cannot be represented.
4. Expand copy-mode cuts, partial overlap, multi-component geometry and inference behavior only as their reference behavior is observed and testable. The current supported scope and tests are detailed in [Push/Pull parity](PUSH-PULL-LOGIC-AND-PARITY.md) and [Boolean parity](SOLID-BOOLEAN-LOGIC-AND-PARITY.md).

The existing automated tests cover bounded simple cases. They do not establish full application, workflow, algorithm or geometry-kernel parity. The staged-cut change still needs an interactive comparison against the original application.
