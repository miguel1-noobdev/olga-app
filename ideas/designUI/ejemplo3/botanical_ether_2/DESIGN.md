---
name: Botanical Ether
colors:
  surface: '#f4fbf2'
  surface-dim: '#d5dcd3'
  surface-bright: '#f4fbf2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef6ec'
  surface-container: '#e9f0e7'
  surface-container-high: '#e3eae1'
  surface-container-highest: '#dde4db'
  on-surface: '#161d18'
  on-surface-variant: '#434843'
  inverse-surface: '#2b322c'
  inverse-on-surface: '#ecf3ea'
  outline: '#737872'
  outline-variant: '#c3c8c1'
  surface-tint: '#506354'
  primary: '#334537'
  on-primary: '#ffffff'
  primary-container: '#4a5d4e'
  on-primary-container: '#c0d5c2'
  inverse-primary: '#b7ccb9'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#3f423f'
  on-tertiary: '#ffffff'
  tertiary-container: '#575956'
  on-tertiary-container: '#ced0cc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d3e8d5'
  primary-fixed-dim: '#b7ccb9'
  on-primary-fixed: '#0e1f13'
  on-primary-fixed-variant: '#394b3d'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e2e3df'
  tertiary-fixed-dim: '#c5c7c3'
  on-tertiary-fixed: '#1a1c1a'
  on-tertiary-fixed-variant: '#454745'
  background: '#f4fbf2'
  on-background: '#161d18'
  surface-variant: '#dde4db'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 32px
  section-padding-desktop: 120px
  section-padding-mobile: 64px
---

## Brand & Style
The design system embodies a "Botanical Ether" aesthetic—a fusion of organic luxury and modern digital transparency. It is designed for a premium skincare audience that values transparency, purity, and clinical efficacy wrapped in a high-end sensory experience. 

The style utilizes **Glassmorphism** as a metaphor for clarity and pure ingredients, layered over **Airy Minimalism**. The visual language relies on multi-layered, ambient shadows to create a sense of physical presence, as if UI elements are floating glass panes over a lush, botanical landscape. The emotional response is one of calm, indulgence, and trust.

## Colors
The palette is rooted in the natural world. **Sage Green** (#4A5D4E) serves as the primary brand color, representing botanical life. **Subtle Gold** (#D4AF37) is used sparingly for accents, iconography, and high-level calls to action to denote premium quality. 

The background is a vertical gradient transitioning from a pure **Off-White** (#F8F9F5) to a misty sage, creating depth. The footer uses a deep, immersive transition into **Deep Green** (#1A201B) to anchor the page. Glass elements utilize a white semi-transparent stroke to define edges against the organic background.

## Typography
The typographic scale emphasizes contrast between the traditional authority of a serif and the contemporary clarity of a geometric sans. **Playfair Display** is used for all headings to evoke editorial luxury and heritage. **Plus Jakarta Sans** provides a soft, approachable, and highly readable counterpoint for functional text and navigation. 

Large display type should be set with tight letter-spacing to feel cohesive, while labels use increased letter-spacing and uppercase styling to maintain a sophisticated, "botanical shop" architectural feel.

## Layout & Spacing
The layout follows an **Airy Fixed Grid** philosophy. Content is contained within a 1280px max-width container to ensure high-end readability on large displays. We prioritize "white space" (or rather, "breathable space") to allow the glassmorphic effects to stand out.

Vertical rhythm is generous; sections are separated by large 120px gaps to prevent the UI from feeling cluttered. Elements should feel uncrowded, often centered or asymmetrically balanced to mimic high-end editorial layouts. On mobile, the 12-column grid collapses to 4, with horizontal margins increasing to 24px to maintain the luxurious framing.

## Elevation & Depth
Depth is the cornerstone of this design system. It is achieved through two primary methods:
1.  **Backdrop Blur:** All primary containers (cards, modals, navigation bars) use a 20px to 40px backdrop-filter blur with a 60% opacity white fill.
2.  **Multi-Layered Shadows:** Instead of a single shadow, we use three-tier ambient shadows:
    *   *Layer 1:* A sharp, low-opacity shadow for base definition.
    *   *Layer 2:* A mid-spread shadow to lift the element.
    *   *Layer 3:* A very soft, wide-spread shadow tinted with a hint of Sage Green to simulate light passing through botanical ingredients.

Interactive elements "lift" higher on hover by increasing the spread of the third shadow layer.

## Shapes
The shape language is organic and soft. All primary containers and UI components use a minimum radius of 24px. Larger sections or "hero" glass panes use the `rounded-xl` token (48px) to feel like polished river stones. Pill-shapes are mandatory for all interactive buttons and tags to eliminate sharp corners, echoing the soft curves of leaves and petals.

## Components
-   **Buttons:** Fully pill-shaped. Primary buttons are solid Sage Green with white text; secondary buttons are glass-morphic with a Gold (#D4AF37) border.
-   **Glass Cards:** Used for product listings. Features a subtle 1px white internal stroke (top and left edges) to simulate light catching on a glass edge.
-   **Input Fields:** Ghost-style with a soft 1px border. On focus, the background gains a slight glass blur and the border transitions to Gold.
-   **Lists:** Items are separated by soft, low-opacity horizontal rules. Bullet points are replaced with custom gold botanical icons.
-   **Navigation:** A "floating" glass bar that sits at the top of the viewport with a high backdrop-blur and 32px rounded corners.
-   **Product Chips:** Small, pill-shaped glass elements used for categories (e.g., "Organic," "Vegan"), featuring a light Sage text color.