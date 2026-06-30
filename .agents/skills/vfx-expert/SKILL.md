---
name: brinkmann-compositing
description: Core digital compositing principles based on Ron Brinkmann's methodologies.
---

# Digital Compositing Principles (Ron Brinkmann)

When working on digital compositing tasks, strictly adhere to these core principles derived from Ron Brinkmann's methodologies:

## 1. Linear Light Compositing
- Always perform compositing operations in a linear color space.
- Apply gamma/log curves only for viewing and final output, never during the merge operations.
- This ensures that the math accurately simulates the physics of light addition, leading to more photorealistic results.

## 2. Separating Matte Extraction from Despill
- Treat matte extraction (creating the alpha channel) and despill (removing background color contamination from the foreground) as two distinct, independent steps.
- Do not rely on a single keyer node to perfectly perform both tasks simultaneously.
- Different mattes might be needed for different parts of the image (e.g., a hard matte for the core, a soft matte for edge detail), while despill requires color correction operations applied to the RGB channels regardless of the matte.

## 3. Algorithmic Spill Suppression
- Use algorithmic approaches to suppress spill rather than simple desaturation or generic hue shifting.
- Understand the math behind spill suppression (e.g., limiting the green channel based on the red and blue channels, such as `G = min(G, max(R, B))` or similar algorithms).
- The goal is to replace the spill color with a neutral color (or background match color) while preserving the original luminance and texture of the foreground subject.

## 4. Handling Uncompressed Formats (e.g., BRAW)
- When dealing with visually lossless or uncompressed RAW formats like BRAW (Blackmagic RAW), take advantage of the intrinsic bit depth and sensor data.
- Ensure debayering and color space transformations are handled strictly before primary compositing operations.
- Maintain floating-point 32-bit linear processing to avoid clamping values above 1.0 (super-whites) or below 0.0, retaining all original sensor highlight and shadow information throughout the comp pipeline.
