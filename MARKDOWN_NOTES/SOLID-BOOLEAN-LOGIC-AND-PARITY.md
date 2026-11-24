# Solid Boolean operations: logic and parity

Status: 2026-11-06. Sketch Modeler's Boolean engine is an independent experimental implementation. The evidence collected so far does **not** recover SketchUp 8's Boolean algorithm or establish feature parity with its solid tools. Regular SketchUp-style Push/Pull and the separate **Push/Pull Cut** extension have different semantics; see [Push/Pull logic](PUSH-PULL-LOGIC-AND-PARITY.md).

## Operations and workflow

**Tools > Solid Operations** loads a second `.smodel` and combines it with the current model. Union keeps material in either input; subtract removes the second input's volume from the current model; intersection keeps their common volume. A successful operation is undoable. Inputs are expected to be supported closed solids, not arbitrary surface models. The format is Sketch Modeler's own and is not `.skp`.

**Push/Pull Cut** is an independent extension: choose its purple toolbar button, select a face, and move inward or enter a signed distance. It sweeps that face and subtracts the swept volume. Regular Push/Pull instead follows the reference-style face movement: pushing past the far side can leave a protruding cap and intact far face, rather than performing a Boolean cut.

## Implementation

The main components are [SolidBoolean.cs](SolidBoolean.cs) and [GeometryModel.cs](GeometryModel.cs):

1. Validate each input as a bounded, single connected closed shell. The validator checks, among other things, face and coordinate limits, edge pairing, consistent orientation, and certain face intersections. Model-level operations also reject loose edges. These checks are conservative and do not prove validity for every possible mesh.
2. Triangulate and orient faces, then construct binary space partitioning (BSP) trees. Union, difference and intersection use tree inversion, clipping and rebuilding to produce oriented polygon fragments. Complexity budgets limit work and recursion.
3. Convert fragment boundaries back into the application's edge graph, split and deduplicate edges, remove coplanar subdivision seams, rebuild faces and suppress unsupported reconstructed faces.
4. Validate the reconstructed shell and compare its volume and surface area with the fragments. If suppression prevents a valid result, retry without it under the same checks. For intersections, a bounded convex vertical-prism reconstruction can also be attempted: each fragment's vertices, edge midpoints and triangle centroids must lie on its boundary, and the same closed-shell, volume and area checks must pass. Commit only a validated candidate; failures leave the current model unchanged. An empty Boolean result clears the model.

For a face cut, the implementation checks that a small inward probe lies inside the source, constructs a swept cutter and performs a difference. If the BSP result cannot be reconstructed, a narrowly scoped fallback handles a simple unobstructed inset reaching a containing opposite face: it constructs the exact-stop topology on a clone and checks the closed result and expected removed volume before committing. This fallback does not bypass input validation. It is an implementation choice, not a recovered native algorithm.

## Parity and validation

| Scenario | Current evidence and behavior |
| --- | --- |
| Overlapping axis-aligned boxes | Automated union, subtract and intersection tests validate reconstructed volumes of 12, 4 and 4 respectively for the stated 2 x 2 x 2 fixtures. |
| Subtract a solid from itself | The kernel test produces an empty result. |
| Inset through-cut | A 10 x 10 x 3 fixture with a 2 x 2 opening produces a closed solid of volume 288 with openings at both ends; reconstruction preserves it. |
| Decimal-coordinate inset through-cut | A 4 x 4 x 1.2 fixture with a 0.8 x 0.8 inset cut through by 2 produces volume 18.432 and two openings; automated reconstruction passes. The latest fix has not been rechecked interactively. |
| Rotated square-prism intersection | The previously rejected test now reconstructs a closed octagonal prism with the expected analytic volume, and the result survives reconstruction. Other rotated or non-prismatic results can still be rejected safely. |
| Concave intersection | A regression verifies that the test shape retains its volume if accepted, or leaves the original unchanged if rejected; this is not general concave-solid support. |
| Open, loose-edge or self-intersecting input | Tested invalid cases are rejected without changing the model. |
| Direct SketchUp 8 solid-operation comparison | Not yet performed; no Boolean feature-parity claim can be made. |

The [native follow-up](SKETCHUP8-BOOLEAN-PUSHPULL-TRACE.md) identifies a solid-operation dispatcher and establishes that a Boolean helper and a conditional Push/Pull path both initialize and invoke the same `CMergeController` method. It does not establish whether Push/Pull indirectly invokes the solid dispatcher, what the shared method does in each mode, or whether the native algorithm uses BSP. In Sketch Modeler the normal Push/Pull workflow creates the supported opening directly; the explicit Boolean cut remains an additional operation, rather than a required second step.

The normal Push/Pull path now supports continuing a simple recessed face to the opposite face and making another separate opening on the same solid. Automated geometry checks verify a closed result and that both openings survive reconstruction; direct SketchUp 8 comparison for that sequence remains outstanding.

## Limits and next work

The implementation currently bounds inputs to 256 faces, 2,048 boundary vertices and coordinates within +/-4096 model units. Disconnected or nested shells, open surfaces, loose edges, complex or overlapping intersections, and a cut sourced from a face with holes can be rejected. Some rotated results cannot yet be reconstructed. Validity checks and volume/area comparisons are safeguards, not proof of correctness for all geometry.

Run `dotnet run --project tests/GeometryTests.csproj`; Boolean cases are in [SolidBooleanTests.cs](tests/SolidBooleanTests.cs), with persistence checks in [PersistenceTests.cs](tests/PersistenceTests.cs). Next steps are to improve boundary reconstruction, add controlled tests for rotated and more complex shapes, and compare supported solid-tool workflows against SketchUp 8 before describing parity.
