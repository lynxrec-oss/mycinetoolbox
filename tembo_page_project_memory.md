# 🐘 Tembo Page — Project Memory & Context Recaller
> **Brand Tagline:** *"Your Bio Link Should Think."*  
> **Metaphor:** *The Digital Savannah (Wisdom, memory, and elegant motion)*  
> **Status:** Paused for Creator Break ⏸️ Ready to Resume  

---

## 🌟 How to Resume (For the Next AI Agent)
> [!IMPORTANT]
> **If you are the AI agent taking over this workspace, read this section first!**  
> 1. Read this file completely to absorb the project architecture, style system, and user intent.
> 2. Read the custom developer skill file at [.agents/skills/tembo-page-developer/SKILL.md](file:///Volumes/G-Drive/chroma%20key%20pro/chromakey-pro_-vfx-unmixing-lab/.agents/skills/tembo-page-developer/SKILL.md).
> 3. Acknowledge to the user that you have read the project memory and are fully caught up. Use the Swahili-Savannah branding tone to show you are aligned (e.g., *"The herd is gathered, and the memory of the elephant is intact. Let's cultivate the savanna."*).
> 4. We have fully completed:
>    - **Scroll Restoration:** Added global scroll-to-top on route changes.
>    - **Showcase Navigation & Routing:** Landing page anchor-scrolling is fixed, and custom profiles dynamic routing (e.g. `#/mycinetoolbox` or `#/@mycinetoolbox`) works.
>    - **Elena Rust Personalization:** Removed all hardcoded user-facing references to Elena Rust across components; they now dynamically fall back to "Creator" or display your customized "My Cine Toolbox" profile.
>    - **Page Builder Interactive Features:** Drag-and-drop tiles from Component Library onto mockup canvas, Framer Motion drag-reordering, properties inspector configuration, and YouTube autoplay/mute controls are fully active.
>    - **Firestore Security Rules & Document Creation:** Rules are updated to allow prototype saves, and `setDoc(..., { merge: true })` resolves the "document does not exist" creation bugs.
>    - **Dynamic Booking & Slots:** Syncs available calendar slots from admin config to the visitor drawer and writes confirmed strategic slot visitor bookings back to Firestore.
>    - **Brand Logo Cutoff Fix:** Resolved the horizontal elephant "T" icon clipping in `iconOnly` mode by introducing absolute-position alignment (with a `5%` horizontal buffer). Reconfigured the "Origins of our Name" About page card to display the full brand logo (elephant symbol + "TEMBO PAGE" wordmark text) with zero cutoff.
> 5. Ready for the next session! Let's build out more of the scheduler capabilities, audio v2 parameters, or landing page animations.

---

## 🎨 The Brand System: Savannah Sunset (Premium Dark Mode)
The design language is inspired by the warmth, depth, and intelligence of the African golden hour. It rejects generic dark grays and bright neon primary colors, opting instead for a luxurious HSL-tailored palette.

### Color Palette (Tokens)
```css
:root {
  /* Canvas & Containers */
  --canvas: hsl(240, 10%, 6%);                    /* Deep Slate/Charcoal #0c0c0e */
  --surface-low: hsl(38, 12%, 8%);                 /* Warm charcoal background #16130b */
  --surface-container-highest: hsl(45, 13%, 19%); /* Card hover background #38342b */
  --outline-variant: rgba(255, 255, 255, 0.05);   /* Thin divider/border */

  /* Brand Accents */
  --primary: hsl(45, 86%, 63%);                    /* Savannah Warm Gold #f2ca50 */
  --primary-fixed: hsl(45, 100%, 76%);             /* Sunrise Amber/Glow Accent #ffe088 */
  --tertiary: hsl(160, 84%, 39%);                  /* Oasis Green/Success #10b981 */
  
  /* Glassmorphism & Shadows */
  --glass-bg: rgba(255, 255, 255, 0.02);
  --glass-border: rgba(255, 255, 255, 0.06);
  --glow-card-shadow: 0 4px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
```

### Typography
- **Headings (Brand):** `Montserrat` (900/700/600) — Bold, geometric, authoritative.
- **Body & UI:** `Inter` (400/600) — Clean, legible, modern.
- **Icons:** `Material Symbols Outlined` or `Lucide` (clean stroke weights).

---

## 🖥️ Screen Architecture Summary
The user has designed and shared the HTML structures for three core pages of the **Tembo Page** ecosystem. They are structured as modern, dark-themed, highly polished views:

### 1. The Creator Dashboard (Analytics overview)
* **Visual Layout:** Bento-grid stat cards (`Total Views`, `CTR`, `Active Rules`, `Total Revenue`), AI Insights Banner, traffic analytics chart mockup, and a table of top-performing cards.
* **Core Philosophy:** Displays data-driven insights. It is clean, respects the HSL palette, and highlights the "Smart" nature of Tembo by putting AI advice front-and-center.
* **Standout Details:** The `glow-card` effect with the subtle gold top/left border.

### 2. The Page Builder (Dynamic Visual Canvas)
* **Visual Layout:** A premium **Three-Panel Layout**:
  1. *Left Panel:* Component library (drag-and-drop tiles for links, forms, Spotify, YouTube).
  2. *Center Panel:* A live vertical viewport showing an exact high-fidelity iPhone mockup (complete with Dynamic Island, 9:41 status bar, rounded display corners, and golden sunset glow backing).
  3. *Right Panel:* Contextual Properties Inspector (manage visibility, custom rules, toggle switches, and CTAs like `Save Changes`).
* **Core Philosophy:** Dedicated strictly to creation and customization. It separates editing mechanics from viewing metrics.

### 3. The Smart Pixel Setup (Onboarding/Integration)
* **Visual Layout:** Split-column view:
  1. *Left Column (5/12):* Pixel ID card, copy badges, and step-by-step setup guides.
  2. *Right Column (7/12):* A developer terminal mock interface containing the integration script snippet (`tembo('init', 'TMB-9842-XQ'); tembo('track', 'PageView');`).
* **Branding Gem:** Uses excellent Savannah-themed copy: *"Deploy your tracking infrastructure. Add the Tembo snippet to your digital savanna to monitor herd movements and conversion events."*

---

## 🗺️ Product Roadmap & Key Features
Tembo Page is designed to be a complete suite comprising **10 core pages/flows**:
1. **Landing Page** (Current focus: Rebuilding and expanding here to sell the app).
2. **Creator Dashboard** (Overview and Bento analytics).
3. **Page Builder** (3-panel visual canvas with phone mockup).
4. **Analytics Dashboard** (Deep-dive charts and traffic flows).
5. **Smart Pixel Setup** (JS integration snippet console).
6. **Public Creator Page** (The actual bio link hosted for visitors).
7. **Campaign Manager** (A/B testing, scheduled drops).
8. **Tembo Chat Setup** (Real-time creator-to-fan conversational widget).
9. **Onboarding Flow** (Selecting niche, claiming handle, choosing starter theme).
10. **Pricing Plans** (Free, Pro/Savannah Explorer, Agency/Pride Leader).

---

## 🚀 Immediate Next Action: Rebuilding the Landing Page
When the user returns from their break, our primary goal is to **build/expand the Landing Page directly inside this workspace**. 

### Strategic Landing Page Requirements:
- **Hero Section:** Capture attention immediately with the header *"Your Bio Link Should Think."* set in bold `Montserrat`.
- **Dynamic Interactive Mockup:** A visual preview of a phone mockup in the hero section. Let users click different traffic source buttons (e.g. `[ TikTok ]`, `[ Instagram ]`, `[ YouTube ]`) and see the link tiles smoothly slide and re-arrange themselves in the preview. This visually *demonstrates* the Traffic-Based Personalization feature in real-time.
- **The Core Value Props:** Explain the 3 pillars:
  1. *Smart Content Cards* (Rich media embedded smoothly).
  2. *Traffic-Based Personalization* (Serve the right links to the right audience).
  3. *AI Recommendations* (Actionable strategy notifications).
- **Aesthetic Excellence:** Rich CSS sunset glowing gradient blobs, elegant dark backgrounds, custom card borders, and smooth micro-animations.

---

## 💾 Saved State Data (Draft References)
Keep these variables handy when generating components in React/Vite:
```typescript
export const SAVANNAH_THEME = {
  canvas: '#0c0c0e',
  surfaceLow: '#16130b',
  accentGold: '#f2ca50',
  accentAmber: '#ffe088',
  successGreen: '#10b981',
  fontHeading: 'Montserrat',
  fontBody: 'Inter'
};
```

---

## 📝 Reminders for Next Sessions
- [ ] **Social Auth Expansion Discussion:** When Aaron returns, discuss whether we want to enable other Authentication providers (like Facebook, Apple, etc.) for client galleries, visitor account portal logins, or digital product download checkouts on the main My Cine Toolbox website.

