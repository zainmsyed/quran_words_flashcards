# Design System Document: The Editorial Zen Experience

## 1. Overview & Creative North Star: "The Digital Scholar"
This design system moves away from the cluttered, gamified nature of traditional flashcard apps. Our North Star is **The Digital Scholar**—an experience that feels less like software and more like an open, sunlit library. 

We break the "template" look by rejecting the rigid grid in favor of **Intentional Asymmetry**. By utilizing generous whitespace (the "Zen" factor) and overlapping elements, we create a sense of breath. The layout is driven by high-contrast typography scales: large, authoritative headlines paired with delicate, high-legibility body text. This isn't just a tool; it’s a focused sanctuary for memory.

---

## 2. Colors: Tonal Depth & The Emerald Core
The palette is rooted in a "Paper & Ink" philosophy, utilizing soft grays and a deep, intellectual emerald.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts. For instance, a `surface-container-low` section should sit on a `surface` background to define its edge.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. 
- **Base Layer:** `surface` (#f8f9fa)
- **Secondary Depth:** `surface-container-low` (#f1f4f5) for subtle sidebars.
- **Interactive Focus:** `surface-container-lowest` (#ffffff) for the flashcards themselves, creating a "lifted" paper effect.

### The "Glass & Gradient" Rule
Floating elements (like navigation bars or "Success" modals) must use **Glassmorphism**. Use semi-transparent `surface` colors with a `backdrop-blur` of 12px to 20px. 

### Signature Textures
Main Call-to-Actions (CTAs) should not be flat. Use a subtle linear gradient from `primary` (#006d4b) to `primary-container` (#7ff3be) at a 135-degree angle to provide "visual soul."

---

## 3. Typography: The Calligraphic Balance
We pair the modern structuralism of **Manrope** and **Inter** with the classical elegance of **Amiri** for Arabic script.

*   **Display & Headlines (Manrope):** Large scale (`display-lg` at 3.5rem) to create editorial impact. This anchors the user’s focus.
*   **The Arabic Core (Amiri):** Used for all flashcard content. Amiri’s calligraphic roots provide the "Zen" aesthetic. Ensure a minimum `line-height` of 1.6 for Arabic to prevent diacritic crowding.
*   **Body & Labels (Inter):** Inter handles the "UI machinery"—metadata, settings, and instructions. Its neutrality allows the Arabic content to remain the hero.

---

## 4. Elevation & Depth: Tonal Layering
We do not use structural lines. We use light.

*   **The Layering Principle:** Stacking defines importance. A `surface-container-lowest` card placed on a `surface-container-high` background creates a natural, soft lift without a single drop shadow.
*   **Ambient Shadows:** If an element must "float" (e.g., a floating action button), use an extra-diffused shadow: `box-shadow: 0 10px 30px rgba(0, 109, 75, 0.06)`. Note the use of the `primary` hue in the shadow to mimic natural light refraction.
*   **The "Ghost Border" Fallback:** If accessibility requires a container boundary, use the `outline-variant` token (#adb3b5) at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components

### The Zen Flashcard (Custom Component)
The centerpiece. Forbid all dividers.
- **Surface:** `surface-container-lowest` (#ffffff).
- **Corner Radius:** `xl` (1.5rem) for a soft, approachable feel.
- **Padding:** `10` (3.5rem) to ensure the text has "room to breathe."

### Buttons
- **Primary:** Gradient from `primary` to `primary-dim`. `full` roundedness. No shadow.
- **Secondary:** `secondary-container` background with `on-secondary-container` text.
- **Tertiary:** No background. Uses `primary` text with an underline that only appears on hover.

### Input Fields
- **Background:** `surface-container-low`.
- **Active State:** Change background to `surface-container-lowest` and apply a "Ghost Border" of `primary` at 20% opacity. Forbid the standard "blue focus ring."

### Chips
- Use `secondary-container` for unselected and `primary` for selected.
- Sizing: `3` (1rem) vertical padding for a more luxurious, tactile touch.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use the Spacing Scale `16` (5.5rem) for top-level page margins to enforce the Zen experience.
*   **Do** allow the Amiri font to be significantly larger than the English translation (e.g., `headline-lg` for Arabic vs `title-md` for English).
*   **Do** use `surface-bright` for hover states on white cards to create a "glow" effect.

### Don’t:
*   **Don’t** use black (#000000) for text. Use `on-surface` (#2d3335) to maintain a soft, professional contrast.
*   **Don’t** use divider lines in lists. Use a `spacing-2` gap and a slight `surface-container-low` background on every second item (zebra striping) if necessary.
*   **Don’t** use "vibrant" or "neon" greens. Stick strictly to the Emerald `primary` (#006d4b) to keep the study environment calm.