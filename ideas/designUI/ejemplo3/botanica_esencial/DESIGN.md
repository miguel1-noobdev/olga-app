---
name: Botanica Esencial
colors:
  surface: '#fef9ef'
  surface-dim: '#dedad0'
  surface-bright: '#fef9ef'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3e9'
  surface-container: '#f2ede3'
  surface-container-high: '#ede8de'
  surface-container-highest: '#e7e2d8'
  on-surface: '#1d1c16'
  on-surface-variant: '#43493d'
  inverse-surface: '#32302a'
  inverse-on-surface: '#f5f0e6'
  outline: '#74796b'
  outline-variant: '#c3c8b9'
  surface-tint: '#466729'
  primary: '#426426'
  on-primary: '#ffffff'
  primary-container: '#5a7d3c'
  on-primary-container: '#f2ffe0'
  inverse-primary: '#abd287'
  secondary: '#675782'
  on-secondary: '#ffffff'
  secondary-container: '#dfccff'
  on-secondary-container: '#64547f'
  tertiary: '#715715'
  on-tertiary: '#ffffff'
  tertiary-container: '#8c6f2c'
  on-tertiary-container: '#fff9f4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c6efa1'
  primary-fixed-dim: '#abd287'
  on-primary-fixed: '#0c2000'
  on-primary-fixed-variant: '#2f4f13'
  secondary-fixed: '#ebdcff'
  secondary-fixed-dim: '#d1bef0'
  on-secondary-fixed: '#22133b'
  on-secondary-fixed-variant: '#4e3f69'
  tertiary-fixed: '#ffdf9c'
  tertiary-fixed-dim: '#e5c276'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5b4300'
  background: '#fef9ef'
  on-background: '#1d1c16'
  surface-variant: '#e7e2d8'
  earth: '#6B4423'
  coffee: '#8B5A2B'
  cream-light: '#FAF8F2'
  text-dark: '#3E2C22'
  sage-dark: '#46602E'
  lavender-soft: '#E8E3F0'
  gold-soft: '#E8DCC8'
typography:
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: '600'
    lineHeight: '1.1'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.7'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 32px
  margin-mobile: 16px
  margin-desktop: 48px
  section-padding-desktop: 120px
  section-padding-mobile: 80px
---

## Brand & Style
The brand personality is a harmonious blend of a **modern botanical apothecary** and an **artisan workshop**. It is defined by a sense of quiet elegance, transparency, and a deep-rooted connection to the earth. The target audience seeks high-quality, handmade natural skincare that feels both scientific in its efficacy and poetic in its presentation.

The design style is a sophisticated mix of **Minimalism** and **Tactile/Skeuomorphic** influences. It utilizes generous whitespace and a clean grid to ensure a premium, modern feel, while incorporating organic textures, botanical illustrations, and "physical" details (like subtle paper grain and gold-leaf dividers) to evoke the handmade nature of the products. The UI should feel airy, warm, and inviting, moving away from clinical "clean beauty" toward a more soulful, heritage-inspired aesthetic.

## Colors
The palette is grounded in a primary **Neutral Cream (#F5F0E6)** background, providing a warm, parchment-like canvas that feels more natural than a clinical pure white. 

- **Primary Sage (#5A7D3C)**: Used for primary calls to action and active states. It represents botanical life and growth.
- **Secondary Lavender (#8B7AA8)**: Used for accents, soft backgrounds, and decorative highlights. It adds a touch of artisanal softness.
- **Tertiary Gold (#C4A35A)**: Reserved for "fine jewelry" details—dividers, icons, and thin borders that signify quality and care.
- **Earth & Coffee**: These tones provide the structural backbone for typography and borders, ensuring readability while maintaining the organic theme.

Backgrounds should alternate between `cream` and `cream-light` to delineate sections without the need for harsh lines.

## Typography
The system uses a classic Serif/Sans-Serif pairing. **Playfair Display** provides the editorial authority and elegance required for headlines, echoing the typography found on the artisan product labels. **Inter** is used for body text and functional UI elements to ensure high readability and a modern, clean contrast.

Special attention is paid to **Label/Tag** styling: these are always in uppercase with generous letter spacing to evoke the feeling of stamped labels or high-end cosmetic packaging. Line heights are kept generous (1.6 - 1.7) for body text to maintain the "airy" feel of the brand.

## Layout & Spacing
The layout follows a **fixed-grid** philosophy with a maximum container width of 1280px. This ensures that on large screens, the content remains centered and readable, surrounded by the "breathable" cream background.

- **Desktop**: A 12-column grid with 32px gutters. 
- **Mobile**: A single-column layout with 16px side margins.
- **Rhythm**: Vertical section spacing is significant (120px on desktop) to emphasize the brand's calm, unhurried pace. 

Components within sections should use a base-8 spacing scale (8, 16, 24, 32, 48, 64) to maintain mathematical harmony.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows** rather than stark physical height.

- **Surface Layers**: Use `cream-light` on top of `cream` backgrounds to create subtle card-like depth.
- **Ambient Shadows**: Shadows are extremely soft and tinted with the `text-dark` color at low opacity (e.g., `rgba(62, 44, 34, 0.08)`). This avoids "gray" shadows that feel digital and instead creates a "natural lighting" effect.
- **Glassmorphism**: The Navbar utilizes a subtle backdrop blur (8px) when scrolling to maintain a sense of translucency and lightness.
- **Hover States**: Elevation is used sparingly to signal interactivity. A subtle "lift" (vertical translation) combined with a slightly deeper ambient shadow is the preferred interaction pattern for cards and buttons.

## Shapes
The shape language is **Rounded** to reflect the organic forms found in nature. 
- **Cards and Featured Images**: Use a 1rem (16px) radius to feel substantial yet soft.
- **Inputs**: Use a 0.75rem (12px) radius for a modern, accessible feel.
- **Interactive Elements**: Buttons and tags use a fully "pill-shaped" (9999px) radius to provide maximum contrast against the structured grid and evoke the shape of seeds or smooth river stones.

## Components

### Buttons
- **Primary**: Pill-shaped, `sage` background with `text-light`. High letter-spacing on text. On hover: `sage-dark` with a 2px lift.
- **Secondary (Outline)**: Pill-shaped, 2px `sage` border, `sage` text. Hover fills the button with `sage`.
- **Ghost/Tertiary**: No border, `coffee` text. Used for less prominent actions.

### Cards
- **Product/Blog Cards**: `cream-light` background, 16px corner radius. They should feature a subtle `gold-soft` 1px border. Shadows are applied only on hover to create a "lift from the table" effect.

### Input Fields
- **Standard**: 12px corner radius, `cream-light` background, 1px `gold-soft` border. Focus state shifts the border to `sage` with a soft outer glow.
- **Labels**: Always placed above the input in `label-caps` typography.

### Chips & Tags
- Used for categories (e.g., "Facial", "Eco-friendly"). Small pill-shaped containers with `lavender-soft` backgrounds and `lavender` text.

### Dividers
- **Floral Divider**: A decorative SVG line featuring botanical motifs (leaves/lavender) used to separate major homepage sections.
- **Structural Divider**: 1px solid `gold-soft` horizontal line for internal card or footer separation.

### Lists
- Use custom botanical icons (small leaf or flower) as bullet points instead of standard dots.