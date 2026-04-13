```markdown
# Design System Specification

## 1. Overview & Creative North Star: "The Modernist Gallery"

This design system is a digital translation of mid-century Swiss design principles, distilled through a contemporary editorial lens. Our Creative North Star is **The Modernist Gallery**. Like a high-end exhibition space, the interface serves as a sophisticated vessel for content—prioritizing mathematical precision, immense negative space, and the purposeful intersection of geometry and color.

We break the "standard template" look by rejecting the container-heavy web. Instead, we utilize **Tonal Layering** and **Intentional Asymmetry**. Structure is defined by the juxtaposition of solid color blocks and translucent overlapping circles. The result is a system that feels structured yet breathable, rooted in the Bauhaus philosophy that "form follows function," but elevated by a palette of muted earths and soft pastels.

---

## 2. Colors & Surface Architecture

The palette is a dialogue between the archival "primary" tones (deep ochres and muted reds) and modern "lifestyle" pastels (sage green and dusty pink).

### The "No-Line" Rule
**Sectioning with 1px solid borders is strictly prohibited.** In this system, boundaries are architectural. To separate content, use shifts in background color. For example:
- A hero section uses the base `background` (`#fcf9f3`).
- The following feature section shifts to `surface_container_low` (`#f6f3ed`).
- A focused sidebar uses `surface_container` (`#f0eee8`).

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine paper sheets. Depth is achieved through the relationship between containers:
- **Level 0 (Base):** `background`
- **Level 1 (Section):** `surface_container_low`
- **Level 2 (Interaction):** `surface_container_lowest` (White) to provide a "pop" of clarity for high-priority cards or inputs.

### The "Glass & Gradient" Rule
To add soul to the Bauhaus rigidity, utilize **Glassmorphism** for floating navigational elements or modal overlays. Use semi-transparent versions of `surface` with a `backdrop-blur` of 12px to 20px. 
*Signature Polish:* Main CTAs should utilize a subtle linear gradient from `primary` (#a0220b) to `primary_container` (#c23b22) at a 135° angle to create a sense of tactile depth.

---

## 3. Typography: The IBM Plex Sans Scale

We utilize **IBM Plex Sans** (Public Sans as the token fallback) for its grotesque technicality and humanist warmth—the perfect bridge for a Swiss-inspired system.

| Level | Token | Size | Character |
| :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | 3.5rem | Heavy weight, tight tracking (-0.02em). The "Art" level. |
| **Headline** | `headline-lg` | 2rem | Bold, used for section titles. High contrast against body. |
| **Title** | `title-md` | 1.125rem | Medium weight, used for card headings and navigation. |
| **Body** | `body-lg` | 1rem | Regular weight. Use generous line-height (1.6) for readability. |
| **Label** | `label-md` | 0.75rem | Uppercase with +0.05em tracking for metadata and tags. |

**Editorial Contrast:** Combine a `display-lg` heading with a `label-md` sub-header. The massive gap in scale creates a sophisticated, "magazine" feel that standard UIs lack.

---

## 4. Elevation & Depth: Tonal Layering

Traditional drop shadows are largely replaced by tonal shifts. When elevation is required for floating components (e.g., Popovers, Tooltips), follow these rules:

*   **Layering Principle:** Place a `surface_container_lowest` (#ffffff) card on a `surface_container` (#f0eee8) background. The subtle 1% shift in value creates natural, soft containment.
*   **Ambient Shadows:** If a shadow is required for a floating Modal, use a highly diffused blur (24px - 40px) with 6% opacity. Use a tint of `on_surface` (#1c1c18) to ensure the shadow feels like a natural obstruction of light.
*   **The "Ghost Border" Fallback:** For accessibility in form fields, use a `outline_variant` (#e1bfb8) at 20% opacity. It should be felt, not seen.
*   **Signature Patterning:** Use overlapping circular motifs in the background with 10% - 15% opacity using `secondary` or `tertiary` tokens. These circles should intersect content, creating a sense of movement.

---

## 5. Components

### Buttons
*   **Primary:** Rectangular (`0px` radius), `primary` background, `on_primary` text. No border.
*   **Secondary:** `secondary_container` background. Rectangular.
*   **Tertiary:** Ghost style. Text-only in `primary` with a 2px underline that appears on hover.

### Cards & Lists
*   **Rule:** Forbid 1px dividers.
*   **Implementation:** Separate list items with 16px of vertical whitespace or a subtle toggle of background color (`surface_container_low` vs `surface_container_lowest`). Cards should have 0px corner radius to maintain the Bauhaus geometric integrity.

### Input Fields
*   **Style:** Filled style using `surface_container`. Bottom border only (2px) using `primary` when focused. Labels must use `label-md` and sit above the field, never inside.

### Signature Component: The "Bauhaus Orb"
*   **Floating Action Button (FAB):** A perfect circle using `tertiary`. When hovered, it expands into a rectangle using a "spring" animation, revealing a text label.

---

## 6. Do’s and Don’ts

### Do
*   **Do** embrace the `0px` border radius. Geometry should be sharp and uncompromising.
*   **Do** use asymmetric layouts. Align a heading to the far left and the body text to a column on the right.
*   **Do** use `tertiary` (pink) and `secondary` (sage) as architectural color blocks to highlight specific content zones.

### Don’t
*   **Don’t** use "Standard Blue" for links. Use `primary` (#a0220b) or `tertiary` (#784351).
*   **Don’t** use rounded corners. Even a 2px radius breaks the Swiss/Bauhaus aesthetic.
*   **Don’t** crowd the screen. If you feel you need a border to separate elements, you likely need more whitespace instead.
*   **Don’t** use centered text for body copy. Stick to left-aligned (ragged right) for an editorial feel.

---
*Director's Final Note: Precision is your best friend. Every element must feel like it was placed on a mathematical grid, then intentionally shifted to create tension. Avoid the default; seek the essential.*```