# Antigravity Agent Configuration — Tembo Page Video Suite

This repository utilizes Remotion for programmatic video compilation and rendering. To ensure consistent visual layouts, frame-accurate animation rendering, and to prevent conflicts between different agent models, all AI agents (Gemini and Claude) MUST strictly adhere to the following directives:

## 🎬 Remotion Best Practices Directive
- **Strict Skill Compliance:** You MUST load and follow the instructions in the local skill folder:
  `./.agents/skills/remotion-best-practices/SKILL.md` (and its sub-rules under `rules/`).
- **No CSS/Tailwind Transitions:** Raw CSS transitions, keyframe animations, or Tailwind transition classes are strictly FORBIDDEN. They run on standard wall-clock time and will glitch during static MP4 rendering.
- **Frame-Based Interpolation:** All properties (opacity, translation, scale, color) MUST be animated using Remotion's frame-based state engine (`useCurrentFrame()`, `useVideoConfig()`, `interpolate()`, and Bézier/Easing methods).
- **No Standard Hooks/Timers:** Avoid `useEffect` timers, `setInterval`, `setTimeout`, or `requestAnimationFrame` loops inside your video compositions.
- **Pre-loading Fonts:** Load Google Fonts using the `@remotion/google-fonts` loader to avoid visual flickering.

## 🐘 Savannah Sunset Design Guidelines
- **Color System:** Stick to HSL variables defined in the theme (deep warm canvas `#16130b`, sunset amber accents `#f2ca50`).
- **Typography:** Montserrat (bold display titles) and Inter (body and terminal code views).
- **Assets:** Always reference static files using `staticFile('audio/...')` or `staticFile('logo.png')`.
