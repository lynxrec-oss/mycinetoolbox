---
name: fusion-compact-grid-layout
description: Mandatory layout skill for DaVinci Resolve Fusion node graphs. Enforces compact relative positioning, zero excessive gaps, normalized coordinates, and clear left-to-right main processing chains with close vertical branching.
---

# SKILL: Compact DaVinci Resolve Fusion Node Graph Layout

## Purpose

Create clean, compact, readable Fusion node graphs that can be viewed almost entirely within the node editor without excessive scrolling.

This skill must run automatically after creating, importing, duplicating, or modifying Fusion nodes.

## Problem This Skill Prevents

Never create node graphs where:

- Connected nodes are separated by enormous empty spaces.
- Connection lines stretch across hundreds or thousands of pixels.
- Nodes require excessive horizontal or vertical scrolling.
- Branches fan out toward distant coordinates.
- Node positions are calculated from video resolution, frame count, timeline duration, node ID, array index multiplication, or media dimensions.
- Each newly created node inherits a progressively larger positional offset.
- The graph technically works but is visually unusable.

Node graph position coordinates are organizational coordinates only. They must never be based on the composition’s 1920×1080, 4K, 6K, or other image resolution.

## Mandatory Layout Rules

### 1. Use Compact Relative Positioning

Position every node relative to the node it connects to.

A directly connected node should normally be placed:

- One node-width to the right of its input node (`~1.0 to 1.5 grid units`).
- No more than two node-widths away unless additional nodes must fit between them.
- Approximately one node-height above or below when creating a branch (`~1.0 to 1.5 grid units`).

Never assign distant absolute coordinates without first normalizing the entire graph.

### 2. Organize the Main Processing Chain

Lay out the primary image-processing chain from left to right:

Media/Input → Transform/Effects → Merge/Composite → Output

Keep the main chain on one horizontal row whenever practical.

Use consistent spacing between nodes.

Recommended spacing:

- Horizontal gap: 1.0 to 1.5 node widths.
- Vertical branch gap: 1.0 to 1.5 node heights.
- Maximum ordinary gap between connected nodes: 2 node widths.

### 3. Organize Branches Near Their Merge

Place masks, backgrounds, text, graphics, and secondary image branches close to the node where they are used.

Examples:

- A mask should sit directly above or below the node it controls.
- A Background node should sit near the Merge node receiving it.
- A Text+ node should be positioned close to its Transform or Merge.
- A branch must not begin on one side of the graph and connect to a Merge node located across a massive empty area.

Branches should remain visually attached to their parent processing group.

### 4. Normalize All Coordinates

After placing the nodes:

1. Calculate the minimum and maximum X and Y coordinates of all visible nodes.
2. Remove unnecessary empty space between layers and branches.
3. Translate the entire graph toward a common origin.
4. Center the completed graph inside the node workspace.
5. Ensure there are no extreme or accidental coordinate values.
6. Recalculate graph bounds after normalization.

Do not preserve oversized coordinates merely because the nodes were initially generated there.

### 5. Prevent Overlapping Nodes

Nodes must not overlap.

Before finalizing a position:

- Check the proposed node rectangle against every existing node rectangle.
- Move the node to the nearest available compact position.
- Prefer small vertical adjustments instead of large horizontal jumps.
- Do not solve an overlap by moving a node hundreds of units away.

### 6. Minimize Connection-Line Length

Treat excessive line length as a layout failure.

After the initial layout:

- Measure the distance between every pair of directly connected nodes.
- Identify unusually long connections.
- Move those nodes closer while preserving the logical flow.
- Reduce unnecessary diagonal lines.
- Avoid line crossings whenever a simple vertical branch adjustment can prevent them.

No directly connected pair should be separated by a large unused section of the workspace.

### 7. Fit the Completed Graph to the Viewer

After the graph is compacted:

- Select or frame all nodes.
- Use the Fusion equivalent of “Fit All,” “Frame All,” or “Zoom to Fit.”
- The complete graph should initially be visible in the node editor.
- The graph should remain readable rather than being zoomed out to an unusably tiny scale.

If the graph is too large to be readable at once, organize it into tightly packed processing groups rather than spreading it farther apart.

### 8. Preserve Functionality

This skill may change only:

- Node X position.
- Node Y position.
- Visual grouping.
- Underlay or frame placement.
- Node-editor zoom and pan.

It must not change:

- Node connections.
- Input assignments.
- Foreground and background ordering.
- Masks.
- Keyframes.
- Expressions.
- Modifiers.
- Animation.
- Media paths.
- Resolution.
- Timing.
- Render settings.
- Color values.
- Effect parameters.

The composition must produce exactly the same visual result before and after graph cleanup.
