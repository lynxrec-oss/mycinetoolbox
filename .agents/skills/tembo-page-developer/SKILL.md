---
name: tembo-page-developer
description: >-
  Developer instruction set and project system knowledge for the Tembo Page creator bio link platform. Use this skill when resuming the Tembo Page project, implementing new screens, or adding smart personalization logic.
---

# Tembo Page Developer Skill

## Overview
This skill acts as a persistent project memory and development guide for building **Tembo Page**, the smart link-in-bio platform for creators. It provides structural references, branding details, design systems, and concrete implementation patterns so any agent can immediately pick up where the previous session ended.

## Dependencies
None. This is an instruction-only system knowledge base specific to this repository.

## The Savannah Sunset Brand System

All pages, modules, and styles must strictly conform to the Savannah Sunset theme:

### CSS Custom Variables
```css
:root {
  --canvas: hsl(240, 10%, 6%);                    /* Deep Slate/Charcoal #0c0c0e */
  --surface-low: hsl(38, 12%, 8%);                 /* Warm charcoal background #16130b */
  --surface-container-highest: hsl(45, 13%, 19%); /* Card hover background #38342b */
  --outline-variant: rgba(255, 255, 255, 0.05);   /* Thin divider/border */

  --primary: hsl(45, 86%, 63%);                    /* Savannah Warm Gold #f2ca50 */
  --primary-fixed: hsl(45, 100%, 76%);             /* Sunrise Amber/Glow Accent #ffe088 */
  --tertiary: hsl(160, 84%, 39%);                  /* Oasis Green/Success #10b981 */
}
```

### Aesthetic Requirements
1. **Glow Cards:** Use subtle gold or sunset amber top/left borders or text glows on container hover.
2. **Typography:** Headings in bold `Montserrat` (600, 700, 900), UI and body copy in clear `Inter` (400, 600).
3. **Metaphors:** Incorporate high-quality, tasteful copy referencing "the savannah," "herd tracking," "paths," and "wisdom." Keep it professional and elegant—never cartoonish.

---

## Technical Reference & Blueprint

### 1. Three-Panel Visual Builder Layout
When working on the **Page Builder**, ensure a clean three-panel horizontal viewport:
- **Left Panel:** Component library with draggable/interactive tiles representing link types, Spotify players, YouTube integrations, and custom forms.
- **Center Canvas:** A gorgeous high-fidelity rendering of an iPhone mockup, absolute-centered, with a status bar (9:41), Dynamic Island, rounded screen margins, and active glowing gradient blobs behind the device to create dramatic visual depth.
- **Right Panel:** Contextual properties inspector containing dynamic forms, input validation, success/error badges, and custom rules toggles (e.g. traffic-based routing).

### 2. Smart Traffic-Based Personalization Engine
This is the product's primary unique selling proposition (USP).
- **Core logic:** The system intercepts incoming requests, parses the referring domain (e.g., `tiktok.com`, `instagram.com`, `youtube.com`, `news.google.com`), and automatically re-orders or displays specific cards to match that traffic source.
- **Hero Demo Concept:** On the Landing Page, construct a live-updating interactive phone mockup displaying a set of link cards. Place a row of referral source pills above or below it: `[ TikTok ]` `[ Instagram ]` `[ YouTube ]` `[ Newsletter ]`. Clicking a pill must smoothly animate the phone mockup links using Framer Motion physics to reorder and adapt cards in real time.

---

## Workflow for Resuming Development

### Step 1: Read Project Memory
Immediately view and parse [tembo_page_project_memory.md](file:///Volumes/G-Drive/chroma%20key%20pro/chromakey-pro_-vfx-unmixing-lab/tembo_page_project_memory.md) located at the workspace root to check for any updates or specific requirements.

### Step 2: Establish the Development Environment
Ensure the local Vite server can run properly inside this workspace:
- Build dependencies: React, TailwindCSS, Framer Motion, Lucide icons.
- Run server: `npm run dev` (starts on port 3000).

### Step 3: Implement Landing Page Components
Design the components inside `src/` modularly:
- Keep structural layout clean and standard-compliant.
- Include SEO-friendly metadata, titles, and proper heading trees.
- Integrate the HSL variable palette into `src/index.css`.

---

## Common Developer Pitfalls to Avoid
- 🚫 **Do not use generic gray scales.** Avoid standard `#1f2937` (Tailwind Gray 800) or pure black `#000000` without undertone. Stick to HSL slate and savannah sun values (`#0c0c0e`, `#16130b`).
- 🚫 **Do not break visual consistency across sidebars.** The navigation items (Dashboard, Page Builder, Smart Pixel, etc.) must remain in the same sequence and styling across all view states. Standardize button placements and icon styling.
- 🚫 **Do not build plain static mockups for key interactive moments.** When showcasing traffic personalization or the dynamic island phone preview, always include realistic interactions, hover transitions, and state changes to WOW the user.
