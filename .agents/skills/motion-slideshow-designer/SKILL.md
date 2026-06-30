---
name: motion-slideshow-designer
description: Guidelines and instructions for building high-end motion graphic-style slideshows instead of generic templates.
---

# Skill: Build Motion Graphic-Style Slideshows

## Purpose

Create premium motion graphic-style slideshows for restaurants, events, promotions, venues, products, and social media displays.

Do not build basic photo slideshows. Do not create static poster cards. Every slide must feel intentionally motion-designed, with animated hierarchy, branded structure, image movement, transitions, and graphic timing.

The goal is to create slides that look like professional venue-screen motion graphics, not generic slideshow software output.

---

# Critical Rules

## 1. No black cards or black layout panels

Do not use black information cards.
Do not use black title cards.
Do not use black background inserts with text.
Do not use black Shield's interstitial cards, bumper cards, or insert screens.

Use white cards only for information-card layouts.

Allowed card colors:

* white
* warm white (#faf8f5)
* soft off-white
* very light cream

Text on cards should use:

* black or dark gray for headlines
* Shield's red (#e31837) for accents and tags
* medium gray for supporting copy

## 2. Never use generic output blanking

Do not use blurred side panels as a default solution for vertical or portrait images.

Instead, use designed layouts:

* split-screen photo + branded white card
* full-bleed crop with overlay text
* white information card with logo
* layered image collage
* parallax image frame

Blurred background filler is only allowed as a subtle secondary texture, not as the main design solution.

## 3. Every slide must have motion

A slide is not complete unless at least three things move with intention.

Each slide should include some combination of:

* photo push-in (slow scale from 1.0 to 1.05)
* photo pan
* subtle parallax
* card wipe/slide-in
* text reveal (staggered, line by line)
* logo settle (fade + scale from 96% to 100%)
* red accent line draw (width from 0 to target)
* masked headline reveal (translateY + opacity)
* foreground element slide
* outgoing transition

Do not leave the photo static.
Do not leave the card static.
Do not reveal all text at once.

## 4. Full-screen images must stay full-screen

If an image is a full-screen feature (food hero, strong crowd/atmosphere shot), it does NOT need to share space with a white card.

Do not split those slides.
Do not squeeze them into a card layout.
Do not force another panel onto them.

For full-screen slides:

* let the image own the frame
* overlay text only if needed, using a subtle gradient or lower-third
* keep text minimal and elegant
* use subtle motion, not layout clutter

## 5. Do not crop people badly

For people/event slides:

* do not crop heads
* do not cut off faces
* do not crop people awkwardly at the shoulders, knees, or sides
* do not force portrait photos into aggressive cover crops

Use safer framing. Prefer contain-style placement inside a designed layout, or use a gentler crop with generous safe margins.

Priority: preserve the full person over filling the frame aggressively.

## 6. White cards need more content

Each white card should include:

1. Prominent Shield's logo at top
2. Red tag/category line
3. Strong headline (large, bold, black)
4. Short emotional subline
5. Supporting descriptive caption
6. Footer/tagline at bottom

Do not leave the card sparse or empty.

## 7. Use a strict brand system

Every slideshow must use a consistent brand language:

* white cards (never black)
* black typography on white cards
* Shield's red (#e31837) accents
* bold condensed Montserrat for headlines
* Inter for body copy
* clean red divider lines
* real Shield's logo asset only
* warm restaurant photo grading

---

# Brand Asset Protection Rules

## Logo Handling

The logo is a locked brand asset.

Never recreate, redraw, reinterpret, recolor, trace, regenerate, or replace the logo.

Never run the logo through:

* background removal
* luma key / color key
* AI masking
* style transfer
* blend modes
* opacity effects (must be 1)
* multiply / overlay / darken
* CSS filters

The logo must be imported directly as an image asset:

```tsx
<Img
  src={staticFile("slideshow/shields_logo.png")}
  style={{
    opacity: 1,
    filter: "none",
    mixBlendMode: "normal",
    objectFit: "contain",
  }}
/>
```

## Logo visibility

On white cards: place the logo directly at the top, large and clear.

On dark backgrounds: place the logo on a white badge/backplate:

```tsx
<div style={{
  backgroundColor: "#ffffff",
  borderRadius: 8,
  padding: "10px 18px",
  display: "inline-flex",
}}>
  <Img src={staticFile("slideshow/shields_logo.png")} ... />
</div>
```

The logo must always be readable, full color, and full opacity.

---

# Required Slide Templates

## Template A: People / Event White Card Slide

Use for portrait guest photos, social photos, bar photos, event moments.

### Layout

* Photo occupies 55–60% of the frame
* White branded card occupies 40–45% of the frame
* Alternates image-left/image-right per slide
* White card contains: logo, tag, headline, subline, caption, footer

### Motion (all required)

* Photo: slow push-in (1.0 → 1.04 over 90 frames)
* Card: wipes/slides in from the opposite side (translateX with easing)
* Logo: fades in and scales from 96% to 100%
* Red divider line: draws from center outward (width 0 → 120px)
* Headline: reveals upward via translateY + opacity
* Subheading: fades in after headline
* Caption: fades in last
* Footer: slides up subtly

### Timing at 30fps (90-frame slide)

* frames 0–90: photo push-in continuous
* frames 0–24: card slides in
* frames 15–35: logo settles
* frames 22–42: red line draws
* frames 28–48: headline reveals
* frames 40–60: subheading appears
* frames 50–70: caption appears
* frames 60–75: footer slides up

---

## Template B: Full-Screen Hero Food Slide

Use for pizza, pasta, wings, burgers, drinks, plated food.

### Layout

Food MUST fill the screen. Do not shrink food. Do not split with a white card unless absolutely necessary.

Use:

* full-bleed food image with lower-third text overlay
* subtle dark gradient at bottom for text readability
* bold headline + short tagline
* small Shield's logo on white badge in corner

### Motion

* Slow push-in on food (1.0 → 1.05)
* Lower-third bar slides up
* Tag fades in
* Headline reveals upward
* Description fades in
* Logo badge fades in

### Text

Keep text concise:

* "CRISPY BUFFALO WINGS"
* "Bold flavor. Crowd favorite."

---

## Template C: Full-Screen Crowd / Atmosphere Slide

Use for room shots, bar shots, group shots, event energy.

### Layout

* Full-bleed image owns the frame
* Subtle dark overlay only where text appears (gradient, not full screen blackout)
* Large readable headline
* Small white logo badge
* Optional lower-third text bar

### Motion

* Slow pan or push-in on image
* Text reveals with stagger
* Logo badge fades in
* Accent line draws

Do NOT force these into a split-screen layout. Let the image breathe.

---

## Template D: Brand Banner Slide

Use for brand claims, logo slides, award slides, announcements.

### Layout

* Full-screen graphic
* Large real logo
* Clear headline
* Strong brand colors
* Readable from across a room

### Motion

* Headline kinetic reveal
* Logo scale/settle
* Subtle background motion
* Clean transition out

---

# Motion Design Standards

## Minimum motion per slide

Each slide must have all three:

1. Image motion (push-in, pan, parallax)
2. Graphic/card motion (wipe, slide, reveal)
3. Text motion (staggered reveals, line draws)

If a slide only fades in and sits still, it fails.

## Easing

Use easing curves. Do not use linear robotic motion.

* Card wipes: Easing.bezier(0.16, 1, 0.3, 1)
* Text reveals: Easing.out(Easing.quad)
* Logo settles: Easing.out(Easing.quad)
* Photo push-ins: Easing.out(Easing.quad)

## Avoid

* static posters
* random zooms
* chaotic spins
* excessive bouncing
* cheap generic fades only
* fast unreadable text
* motion that distracts from the photo

---

# Layout Rules for 1920×1080

## People / Event Split Layout

Photo side:

* width: 1080–1150px (55–60%)
* height: 1080px
* object-fit: cover (gentle, no aggressive crop)

White card side:

* width: 770–840px (40–45%)
* height: 1080px
* background: white or warm white (#faf8f5)
* padding: 60px 50px

Logo on card:

* height: 130–150px
* centered horizontally
* positioned near top

Headline:

* font-size: 34–42px
* font-weight: 900
* color: #000000
* font-family: Montserrat

## Food Hero Layout

Food image:

* width: 100% of frame
* height: 100% of frame
* object-fit: cover

Lower-third overlay:

* height: ~180px
* bottom-aligned
* semi-transparent dark gradient or solid with transparency
* contains tag, title, description, logo badge

---

# Text Rules

Text must be large enough to read on a venue screen.

Use short copy. Maximum 2 lines per text element.

Good:

* "MONDAY NIGHTS AT SHIELD'S"
* "Good vibes. Great people."

Bad:

* A paragraph of tiny text explaining everything.

---

# Quality Checklist

Before finishing, check every slide:

* Is the image large enough?
* Is there real motion on the image?
* Is the logo correct, readable, and the real asset?
* Is the card WHITE (not black)?
* Is the card animated (not static)?
* Does the text reveal with intention (staggered, not all at once)?
* Are the colors consistent?
* Is the typography readable from a distance?
* Is the slide branded?
* Does the slide look like a motion graphic, not a static poster?
* Are there any blurred filler panels?
* Are any food images too small?
* Is any logo disappearing into a dark background?
* Are people cropped badly?
* Is a full-screen image being forced to share space unnecessarily?
* Does the slide feel premium?

If any answer fails, revise the slide.

---

# Non-Negotiable Rules

* Do not create static slideshow cards
* Do not use black cards or black panels
* Do not use black Shield's interstitial screens
* Do not use fake logos
* Do not darken the logo
* Do not place logo on black without a white backplate
* Do not use blurred output blanking as a default layout
* Do not make food images small
* Do not reveal all text at once
* Do not use generic subtitle boxes
* Do not use random transitions
* Do not let AI reinterpret brand assets
* Do not crop people's heads or faces
* Do not force full-screen images into split layouts
* Do not create a "basic slideshow" — create a motion graphic promo
