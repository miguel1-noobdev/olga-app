---
name: Botanical Ether
colors:
  surface: '#f7faf3'
  surface-dim: '#d8dbd4'
  surface-bright: '#f7faf3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f5ed'
  surface-container: '#ecefe7'
  surface-container-high: '#e6e9e2'
  surface-container-highest: '#e0e4dc'
  on-surface: '#191d18'
  on-surface-variant: '#434840'
  inverse-surface: '#2d312c'
  inverse-on-surface: '#eff2ea'
  outline: '#73796f'
  outline-variant: '#c3c8bd'
  surface-tint: '#496640'
  primary: '#334f2b'
  on-primary: '#ffffff'
  primary-container: '#4a6741'
  on-primary-container: '#c2e4b4'
  inverse-primary: '#afd0a1'
  secondary: '#5f5e5b'
  on-secondary: '#ffffff'
  secondary-container: '#e5e2dd'
  on-secondary-container: '#656461'
  tertiary: '#3c4c33'
  on-tertiary: '#ffffff'
  tertiary-container: '#546449'
  on-tertiary-container: '#cde0be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#caecbc'
  primary-fixed-dim: '#afd0a1'
  on-primary-fixed: '#062104'
  on-primary-fixed-variant: '#324e2a'
  secondary-fixed: '#e5e2dd'
  secondary-fixed-dim: '#c9c6c2'
  on-secondary-fixed: '#1c1c19'
  on-secondary-fixed-variant: '#474743'
  tertiary-fixed: '#d6e8c6'
  tertiary-fixed-dim: '#baccab'
  on-tertiary-fixed: '#111f0a'
  on-tertiary-fixed-variant: '#3c4b32'
  background: '#f7faf3'
  on-background: '#191d18'
  surface-variant: '#e0e4dc'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 20px
  margin-desktop: 64px
---

## Brand & Style
The design system is centered on "Botanical Ether"—a brand personality that merges the raw, grounding essence of natural cosmetics with a sophisticated, ethereal digital experience. The target audience values transparency, organic ingredients, and premium self-care. 

The visual style is a refined **Glassmorphism**. It utilizes multi-layered translucency to evoke the feeling of frosted glass containers and dew-covered botanicals. The emotional response is one of calm, purity, and modern luxury. High-quality whitespace and delicate textures are essential to prevent the glass effects from feeling cluttered, maintaining a lightweight and "airy" aesthetic.

## Colors
The palette is rooted in botanical realism.
- **Primary (Moss Green):** Used for key actions and brand presence. It represents the grounding nature of the products.
- **Secondary (Crema Beige):** The primary surface color for non-glass elements, providing a warm, tactile contrast to the cool glass effects.
- **Tertiary (Soft Sage):** Used for accents, secondary buttons, and subtle gradients.
- **Neutral (Deep Forest):** Reserved for high-contrast typography and essential iconography to ensure legibility.

Backgrounds should feature soft, organic linear gradients merging Crema Beige and white to create a canvas where glass layers can pop effectively.

## Typography
This design system employs a classic pairing to balance heritage and modern utility. **Playfair Display** provides an authoritative, editorial feel for headlines, evoking luxury fashion and apothecary traditions. **Inter** is used for all functional text, ensuring that even within complex translucent layers, the information remains highly legible and systematic.

Hierarchy is maintained through generous line height and tight letter-spacing on display headings. Labels always use a slightly heavier weight and increased tracking to differentiate them from body prose.

## Layout & Spacing
The layout follows a **fluid grid** philosophy with substantial breathing room. 
- **Desktop:** A 12-column grid with wide 64px outer margins to center the focus on the "glass" cards.
- **Mobile:** A 4-column grid with 20px margins.

Spacing is governed by an 8px base unit. Component internal padding should be generous (typically 24px or 32px) to support the "floating" nature of the glass panels. Elements are rarely crowded; instead, they are grouped into distinct, elevated islands of content.

## Elevation & Depth
Depth is the core of this design system, achieved through **Glassmorphism** and advanced layering:
1.  **Backdrop Blur:** All glass surfaces must apply a `backdrop-filter: blur(12px)`.
2.  **Translucency:** Surfaces use a white tint at 40% opacity.
3.  **Borders:** A 1px solid border (`glass_border`) is applied to define edges, using a lighter, more opaque white to catch "light" at the rim.
4.  **Shadows:** Shadows are deep and exceptionally soft (e.g., `box-shadow: 0 20px 40px rgba(0,0,0,0.04)`). These are not used to show "heaviness," but to lift the glass panels off the organic background gradients.

## Shapes
The shape language is organic yet structured. The "Rounded" setting (0.5rem base) is used to soften the geometric glass panels without making them appear toy-like.
- **Primary Surfaces:** 1rem (`rounded-lg`) for main content cards.
- **Interactive Elements:** 0.5rem for buttons and inputs.
- **Large Sections:** 1.5rem (`rounded-xl`) for main containers or hero image masks.
Consistent rounding across glass layers is critical to maintain the "stacked sheets" illusion.

## Components
- **Glass Cards:** The primary container. Must feature the backdrop blur, subtle white border, and soft shadow. 
- **Buttons:** 
  - *Primary:* Solid Moss Green with white Inter typography. No glass effect here to ensure a clear Call to Action.
  - *Secondary:* Transparent with a white glass border and a subtle blur on hover.
- **Inputs:** Semi-transparent white backgrounds with a 1px border that becomes Moss Green on focus. Labels sit clearly above the field in `label-sm` style.
- **Chips/Badges:** Small, pill-shaped elements with a soft Sage background and dark text, used for "Organic," "Vegan," or "New" labels.
- **Lists:** Separated by thin, semi-transparent horizontal lines (10% Deep Forest) rather than heavy boxes.
- **Featured Product Display:** A combination of a high-resolution botanical image with a glass card overlapping the corner, containing the product name and price.