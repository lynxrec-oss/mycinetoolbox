---
name: davinci-resolve-manual-first
description: Mandatory pre-computation verification skill for DaVinci Resolve Studio and Blackmagic Design Fusion node compositions, particle systems, scripting, and macros. Ensures all node architectures, input IDs, and connection rules are verified against official Blackmagic Design Fusion manual specifications before generating or modifying compositions.
---

# DaVinci Resolve & Fusion Manual-First Directive

When building, modifying, debugging, or generating DaVinci Resolve Studio scripts, Fusion node compositions (`.comp`), or macros (`.setting`), you MUST strictly adhere to this Manual-First verification workflow before writing code or altering node trees:

## 1. Zero Hallucination & Pre-Verification Requirement
- **Never guess node input names, output names, or parameter IDs (`INPS_ID` / `OUTS_ID`).**
- Before creating or connecting nodes programmatically, verify exact input and parameter IDs either by consulting official Blackmagic Design Fusion manuals/documentation or by running an introspection query (`tool.GetInputList()` / `tool.GetOutputList()`).
- Always check what inputs are actually available on a tool before calling `.SetInput()` or `.ConnectTo()`. For example:
  - On a `Dissolve` node, the mask input is `EffectMask`, NOT `GarbageMatte` or `MatteCombine`.
  - On a `MatteControl` node, alpha extraction requires specific `CombineOp` / `MatteCombine` modes depending on whether `Background` or `Foreground` carries the alpha.

## 2. Strict Fusion Particle Architecture Rules (`From Fusion Manual`)
When working with Fusion 2D/3D Particle Systems (`pEmitter`, `pImageEmitter`, `pTurbulence`, `pDirectionalForce`, `pRender`):
- **PROHIBITION OF PARTICLE BRANCHING:** Particle data streams (`pStream`) cannot be branched. A particle node (`pEmitter`, `pDirectionalForce`, `pTurbulence`, etc.) **cannot feed more than one destination tool simultaneously.** Branching a particle output throws the critical engine error `"Particles can't be branched"` (`or "Cannot branch particle tools"`) and disables the entire particle simulation.
- **Linear Stream Wiring:** All particle forces and modifiers must be connected sequentially in a single, unbranched chain:
  `[pEmitter / pImageEmitter] -> [pDirectionalForce / pGravity] -> [pTurbulence] -> [pRender]`
- **pImageEmitter Region Specification (`Image vs Bitmap Mode`):**
  - When `pImageEmitter` emits from a 2D image source (`Transform1` / `MediaIn`), `Region` (`RegionNest`) MUST be explicitly set to `Bitmap` (`Region: Bitmap` vs `AllRgn`).
  - When `Region` is set to `Bitmap`, wire the image (`Transform1`) to the `Bitmap` region input (`INPS_ID: 'Bitmap'`) so particles physically spawn from the non-zero alpha/luma pixels of that exact image.
  - Wire the image to `Input` (`StyleInput`) when `Style` is set to `ParticleStyleBitmap` or when coloring points from the source image (`ColorOverLife`).
- **Initial Velocity vs Continuous Forces:**
  - `Velocity` on `pImageEmitter` only defines initial launch speed at birth (`StartAge = 0`).
  - To make particles continuously move, accelerate, and blow across the screen (`e.g., wind carrying embers away`), you MUST insert a continuous force node (`pDirectionalForce` or `pGravity`) into the particle stream before `pRender`.
- **pRender 2D vs 3D Requirements:**
  - If `OutputMode` is set to `TwoD`, `pRender` outputs a standard 2D RGBA image stream (`Image`). Do NOT connect a 3D Camera (`Camera3D`) to `pRender` in `TwoD` mode.
  - If `OutputMode` is set to `ThreeD`, `pRender` requires `Camera` (`SceneInput` / `Camera`) and outputs a 3D scene that must pass through `Renderer3D` (`Renderer3D1`) to produce 2D pixels.

## 3. Scripting & Modifier Order (`Python / DaVinciResolveScript API`)
- **Add Modifiers Before Keyframing:** In Fusion API scripting, `tool.AddModifier(param_id, "BezierSpline")` MUST be called *before* attempting `tool.SetInput(param_id, value, frame)`. Setting keyframes on an un-modified property will fail silently or throw errors.
- **Global In/Out Clamping:** Fusion tools (`FastNoise`, `pImageEmitter`, `pRender`) default to composition-level clamps or `GlobalOut: 95`. When building custom multi-second compositions (`e.g., 120 frames / 5 seconds`), always explicitly set `TOOLS_GlobalStart: 0`, `TOOLS_GlobalEnd: 120` and call `SetInput("GlobalOut", 120.0)` across every generated tool.
- **SaveSettings vs UI Serialization:** Avoid relying on `tool.SaveSettings()` when complex internal objects (`OrderedDict`, LUTs) are present, as the Python-Lua bridge can fail to serialize internal C++ types cleanly. Use explicit property assignments (`SetInput` / `SetAttrs`) for guaranteed programmatic construction.
