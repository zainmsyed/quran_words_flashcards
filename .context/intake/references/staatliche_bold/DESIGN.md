# Design System Document

## 1. Overview & Creative North Star

### Creative North Star: "The Graphic Manifesto"
This design system is a digital revival of early 20th-century functionalism. It rejects the soft, blurred, and depth-heavy trends of modern SaaS in favor of **The Graphic Manifesto**: a philosophy where structure is the ornament and bold geometry provides the hierarchy. 

We break the "template" look by treating the screen as a high-end exhibition poster. By leveraging intentional asymmetry, heavy grid lines that occasionally bleed into the margins, and massive, structured typography, we create an experience that feels curated and authoritative. This is not just an interface; it is a statement of intent. Every pixel is intentional, and every shape is a building block of a larger architectural whole.

---

## 2. Colors

The palette is a strict adherence to primary theory, grounded by a warm, historic cream that prevents the high-contrast red and blue from feeling digitally "vibrant" or cheap.

*   **Primary (#C61A20):** Our "Signal Red." Used for high-impact calls to action and critical brand moments.
*   **Secondary (#2E5DCD):** Our "Structural Blue." Used for secondary actions and to balance the warmth of the red.
*   **Tertiary (#796200 / #FDD014):** Our "Emphasis Yellow." Used sparingly to draw the eye to specific data points or small selection states.
*   **Background (#FDFFDA):** A sophisticated cream that acts as the "paper" stock for our digital poster.

### The "No-Line" Rule
Traditional 1px grey borders are strictly prohibited. In this system, boundaries are defined by high-contrast shifts in surface color. To separate a section, transition from `surface` to `surface-container-low` (#FCF9F1) or create a hard geometric break using a primary-colored block.

### Surface Hierarchy & Nesting
Treat the UI as stacked sheets of heavy cardstock.
*   **Nesting:** Place a `surface-container-highest` (#EBE8DF) card inside a `surface` background to create a "recessed" feel. 
*   **Glass & Gradient Rule:** While the system is predominantly flat, premium "Signature Textures" are permitted for hero sections. Use a subtle linear gradient from `primary` (#C61A20) to `primary-container` (#FF766B) at a 45-degree angle to give a "printed ink" depth to large buttons or headers.

---

## 3. Typography

Typography is the primary driver of our brand identity. We use two weights of a geometric sans-serif to achieve an editorial feel.

*   **Display & Headlines (Space Grotesk):** These must be set in **bold, uppercase, and with tight letter-spacing**. The goal is to make the words feel like solid blocks of color.
*   **Body & Titles (Work Sans):** Used for readability. While the display text is rigid, the body text remains open and legible to ensure the system remains functional.

**Hierarchy as Identity:**
Large `display-lg` (3.5rem) type should be used as a graphic element itself, often overlapping with geometric shapes or running to the very edge of the container to break the traditional "centered" layout.

---

## 4. Elevation & Depth

In a system inspired by Bauhaus posters, **shadows are the enemy.** We achieve depth through **Tonal Layering** and geometric overlap.

*   **The Layering Principle:** Depth is purely 2D. To "lift" an element, change its background color to a lighter or darker tier. A `surface-container-lowest` card sitting on a `surface-dim` background creates a clear hierarchy of importance without a single drop shadow.
*   **Ghost Borders:** If accessibility requires a border, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism:** For floating navigation or modals, use the `surface` color with a 70% opacity and a `20px` backdrop-blur. This mimics the effect of a semi-translucent piece of acrylic laid over the poster.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` (#C61A20), `0px` radius, white uppercase text. No shadows. On hover, shift to `primary-dim`.
*   **Secondary:** Solid `secondary` (#2E5DCD), `0px` radius, white uppercase text.
*   **Tertiary:** A `2px` stroke using the `primary` color with no fill.

### Cards
Cards must never have shadows or dividers. Use a "Color Block" header—a solid red or blue bar at the top of the card—to categorize content visually.

### Input Fields
*   **Style:** A simple bottom-border of `2px` using `on-surface`. No rounded corners.
*   **Focus State:** The bottom border thickens to `4px` and shifts to `secondary`.

### Geometric Accents (Unique Component)
*   **The "Bauhaus Ornament":** Use the `primary`, `secondary`, and `tertiary` colors to create non-functional circles and semi-circles in the corners of containers. These act as visual anchors and reinforce the 1920s aesthetic.

---

## 6. Do's and Don'ts

### Do
*   **Use 0px Border Radius:** Everything must be sharp, square, and architectural.
*   **Embrace Whitespace:** Use large gaps (32px, 64px, 128px) to let the bold shapes breathe.
*   **Align to a Heavy Grid:** Every element should feel locked into a vertical and horizontal axis.
*   **Use Uppercase for Labels:** All `label-md` and `label-sm` should be uppercase with `0.05em` letter spacing.

### Don't
*   **Don't Use Shadows:** Not even "ambient" ones. The system must remain strictly flat.
*   **Don't Use Dividers:** Use a change in background color or a `32px` vertical margin instead of a 1px line.
*   **Don't Use Soft Colors:** Avoid pastels. If it’s not primary, cream, or black/grey, it doesn't belong here.
*   **Don't Center Everything:** Lean into asymmetrical layouts. Try placing a headline on the far left and the body text on the far right.