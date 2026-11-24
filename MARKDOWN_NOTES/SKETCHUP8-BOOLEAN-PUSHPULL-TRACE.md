# SketchUp 8: Boolean and Push/Pull native trace

Investigation: 2026-11-06. Target: supplied x86 `SketchUp.exe`, SHA-256 `81484cc68070239d3852cb2fd4e1f7722c3cd96da9bc11973ca365fd5dd178d5`. Evidence is in [the REA bundle](sketchup8-boolean-pushpull-trace-20261106.json); [the query snapshot](sketchup8-boolean-pushpull-snapshot-20261106.json) preserves eligible observations for later investigation. This is static Ghidra analysis, not original source or an execution trace.

## Finding

The inspected paths **do share lower-level geometry infrastructure**: both construct a `CMergeController` and invoke `0x9a1f60` on that controller. The solid-tool path also has a distinct multi-operand operation dispatcher at `0x9cc000`. The traced Push/Pull path does not show a direct call to that dispatcher, but unresolved indirect calls and unexamined branches mean we cannot conclude that Push/Pull never invokes it or another Boolean-related routine. Sharing a merge controller does not by itself identify a complete Boolean algorithm.

## Solid-tool path

- Constructors `0x4ae210`, `0x4ae240`, and `0x4ae270` set the `CBooleanIntersectTool`, `CBooleanUnionTool`, and `CBooleanDifferenceTool` virtual tables and store mode values 1, 2, and 3 respectively. `0x57f2c0`, a shared virtual-table entry, checks candidate solids, displays prompts and enforces the two-solid restriction for subtract, trim and split. Evidence: `ev_27b970f5f8bc8e61535621cdc6e27677f9065781cd1afce8f831e4a32f7afff9` and the batch containing `0x57f2c0` in the bundle.
- Shared handler `0x4ffed0` branches on the mode. For intersection and union it reaches `0x5005f0`; for the difference-related path it reaches `0x500780`. Both call `0x9cc000`, passing the mode. `0x500940` also calls `0x9cc000` for split-related intersection and difference steps. Evidence: `ev_27b970f5f8bc8e61535621cdc6e27677f9065781cd1afce8f831e4a32f7afff9`, `ev_a896f44dd6886b4fceedd3ae61a3e1301caa420eb642412911e266246af5abb6`.
- `0x9cc000` prepares operands through `0x9cbe90`, and, when there are multiple operands, calls `0x9cb5d0` with the current pair and operation mode. The latter calls `0x9cb050`, calls `0x9c9770` for each operand, and performs further mode-dependent processing. Ghidra's type labels and control flow have unresolved aspects; these observations do not prove the exact geometric algorithms or data types. Evidence: `ev_091b35491591ec852a920a4e29af05126b31c54eec9ac397990d66c859175a5f`, `ev_97e8ec12a00e99703bc666bc71447b30752dce07f942038a464fd957a544d9c7`, `ev_e62bb38aed4d623070b0fca79423a91eb537ae03bd0ecc121c3e45331e009385`.
- RTTI identifies a `CBoolean` class. `0x52d250` assigns a `CBoolFace` virtual table and later restores a `CBoolean` virtual table; `0xaec500` has code references at `0x500250`, `0x500268`, `0x52d29a`, and `0x9c9749`. The role of that class in the complete solid and Push/Pull paths is not established by the class name alone. Evidence: `ev_f4d0432ce21f50222429758e7109bef412f1c446077ba02ad2b39bf7a353e3af` and the batch containing `0x52d250`.

## Push/Pull path

`CPushPullTool` handlers `0x5a1c30`, `0x5a2c80`, and `0x5a3020` call `0x7f0d40`. One branch of `0x7f0d40` calls `0x7f0a90`, which calls `0x7f0670`; the latter can call `0x7efef0`, the previously investigated loop/face-construction candidate. Separately, `0x5a10b0` calls `0x7eea80` to apply a delta and conditionally calls `0x7f0240`. These are static call relationships, not proof that every interaction executes each branch. Evidence: `ev_a210f7be1a5e995a34d1aed64666fab065feb8e60c852fefeb25513443fff1b8`, `ev_a896f44dd6886b4fceedd3ae61a3e1301caa420eb642412911e266246af5abb6`, [earlier caller dossier](sketchup8-pushpull-caller-20261106.json).

## Shared merge controller: instruction-level comparison

`0x99f090` initializes a `CMergeController` virtual table. In the Push/Pull path, `0x7f0240` calls the initializer at `0x7f057c` and `0x9a1f60` at `0x7f05ab`. In the Boolean path, `0x9c9770` calls the initializer at `0x9c984a` and `0x9a1f60` at `0x9c9865`. In each path, the ECX stack-relative addresses refer to the same local object after accounting for pushed arguments and the initializer's `RET 0x8`. The instruction arguments differ, so the calls must not be assumed to perform identical work. Evidence: `ev_a6a7e4163d17052e15477264106a32915a543f15a83dee7655b009ed02c2fe87`, `ev_b7781dfcddd445ab7cde59862910b81bd8363156705966cf65eeb543cadcc867`, and the `0x99f090` assembly record.

Ghidra reports 20 callers of `0x9a1f60`, including both `0x7f0240` and `0x9c9770`. This broad reuse supports identifying it as shared infrastructure, rather than assuming it belongs exclusively to a solid Boolean command. The exact effect of its arguments, input topology, and branch-specific behavior still require tracing. Evidence: `ev_e7e7cb6bb3c4e399cf8441d20e8b33585d2bf7d2be131b9040d976ce8e53d9cb` and `ev_e8c7826ae627c86c8be9efc33a1aa81a3fd163a50435903e3172a27e3215d7d1`.

## Boundaries and next probes

The direct callers reported for `0x9cc000` are `0x5005f0`, `0x500780`, and `0x500940`; the direct callers of `0x9cb5d0` are `0x9cbbe0` and `0x9cc000`. This is evidence about Ghidra's resolved call inventory, not an exhaustive runtime call graph. Ghidra reports unresolved calls, missing original type information, and allocator-related non-return warnings in relevant functions; some apparent type names can be mistaken decompiler signatures.

Next, resolve the four parameters and behavior of `0x9a1f60`, follow `0x9cb050` and `0x9c9770` through face/edge intersection and classification, and trace indirect dispatch around Push/Pull's merge and opposite-face completion. Controlled runtime tracing for a recess, exact through-opening and solid subtraction would establish which branches execute, whether `0x9cc000` is reached indirectly, and how operands and topology change. No runtime trace was collected in this investigation.
