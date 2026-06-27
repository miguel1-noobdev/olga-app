# Botanica Esencial OB — Web Design Specification

> **Project type:** Natural cosmetics brand website  
> **Language:** Spanish (`lang=ES`)  
> **Target feel:** Modern botanical apothecary — warm, clean, organic, elegant  
> **Primary reference image:** `hero-botanical-frame.jpg` (botanical corner frame on cream background with gold border)

---

## 1. Project Overview

Botanica Esencial OB is a natural cosmetics brand website. The site must communicate:

- **Trust:** artisan-made, clean ingredients, transparent processes.
- **Nature:** botanical ingredients, sustainability, earth-friendly.
- **Community:** users can join, follow, and engage.
- **Commerce:** product discovery organized by body-care lines.

The design must be **fully responsive**, **accessible**, and **performance-conscious**. All user-facing text must be in Spanish.

---

## 2. Brand Identity

### 2.1 Name
- **Primary:** Botanica Esencial OB
- **Short form:** Botanica OB
- **Logo treatment:** elegant serif wordmark, possibly with a small botanical icon (leaf, flower, or monogram "OB").

### 2.2 Voice & Tone
- Warm, knowledgeable, welcoming.
- Confident but never pushy.
- Uses simple, clear Spanish. Avoids overly technical jargon.
- Sample tagline: *"Cosmética natural que cuida tu piel y el planeta."*

### 2.3 Visual Direction
- Soft, airy layouts with generous whitespace.
- Botanical illustrations and natural textures.
- Rounded, friendly UI elements.
- A balance between rustic/handmade and modern/minimal.

---

## 3. Color Palette

Extracted from the hero reference image and refined for digital use.

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-cream` | `#F5F0E6` | Primary page background |
| `--color-cream-light` | `#FAF8F2` | Cards, input backgrounds, light sections |
| `--color-sage` | `#5A7D3C` | Primary buttons, active nav, badges, accents |
| `--color-sage-dark` | `#46602E` | Button hover, emphasis text |
| `--color-lavender` | `#8B7AA8` | Section accents, links, decorative florals |
| `--color-lavender-soft` | `#E8E3F0` | Soft backgrounds, tags |
| `--color-earth` | `#6B4423` | Headings, body text, footer background |
| `--color-coffee` | `#8B5A2B` | Secondary text, borders, icons |
| `--color-gold` | `#C4A35A` | Borders, dividers, small decorative accents |
| `--color-gold-soft` | `#E8DCC8` | Subtle borders, card outlines |
| `--color-text-dark` | `#3E2C22` | Main body text |
| `--color-text-light` | `#FAF8F2` | Text on dark/green buttons |
| `--color-error` | `#B54A4A` | Form validation errors |
| `--color-success` | `#4A7C59` | Success states |

### Color Usage Rules
- Backgrounds alternate between `cream` and `cream-light` to create section rhythm.
- `sage` is the primary action color. Use it sparingly so it retains impact.
- `lavender` is the secondary accent; ideal for hover links and decorative elements.
- `earth` and `coffee` carry text and structure.
- `gold` is reserved for fine details: dividers, icon strokes, thin borders.

---

## 4. Typography

### Font Families
- **Headings:** `Playfair Display` or `Cormorant Garamond` (serif, elegant).
- **Body:** `Inter` or `Lato` (sans-serif, clean, readable).
- **Accent/Labels:** same sans-serif, uppercase, generous letter-spacing.

### Type Scale

| Element | Font | Size (desktop) | Weight | Line-height |
|---------|------|----------------|--------|-------------|
| H1 Hero | Serif | 56px / 3.5rem | 600 | 1.1 |
| H2 Section | Serif | 40px / 2.5rem | 600 | 1.2 |
| H3 Card | Serif | 28px / 1.75rem | 600 | 1.3 |
| H4 Subsection | Serif | 22px / 1.375rem | 600 | 1.3 |
| Body | Sans | 18px / 1.125rem | 400 | 1.7 |
| Body Small | Sans | 16px / 1rem | 400 | 1.6 |
| Label/Tag | Sans | 14px / 0.875rem | 500 | 1.4 |
| Button | Sans | 16px / 1rem | 600 | 1 |

### Mobile Type Scale
- H1 Hero: 36px
- H2 Section: 28px
- H3 Card: 22px
- Body: 16px

---

## 5. Layout & Spacing

### Container
- Max-width: `1280px`.
- Horizontal padding: `16px` mobile, `24px` tablet, `48px` desktop.
- Centered with auto margins.

### Section Spacing
- Vertical padding: `80px` mobile, `120px` desktop.
- Between subsections inside a section: `48px`.

### Spacing Scale
- `4, 8, 12, 16, 24, 32, 48, 64, 96, 128` px.

### Border Radius
- Cards: `16px`.
- Buttons: `9999px` (pill shape) or `12px`.
- Inputs: `12px`.
- Images: `16px` or `24px` for featured images.

### Shadows
- Card shadow: `0 4px 20px rgba(62, 44, 34, 0.08)`.
- Elevated hover shadow: `0 8px 30px rgba(62, 44, 34, 0.12)`.

---

## 6. Global Components

### 6.1 Navbar
- **Position:** fixed or absolute, overlaid on the hero image.
- **Background:** transparent on hero; becomes `cream-light` with subtle blur (`backdrop-filter: blur(8px)`) after scroll.
- **Height:** `80px` desktop, `64px` mobile.
- **Content:**
  - Left: logo.
  - Right: nav links `Inicio`, `Productos`, `Conóceme`, `Blog`, `Contacto`.
  - Far right: "Unirme" button (outline style).
- **Mobile:** hamburger menu. Menu slides in from right with cream background.
- **Active link:** `sage` color or underline in `gold`.

### 6.2 Buttons

**Primary Button**
- Background: `sage`.
- Text: `text-light`, uppercase, letter-spacing `0.05em`.
- Padding: `16px 32px`.
- Border-radius: `9999px`.
- Hover: background `sage-dark`, slight lift (`translateY(-2px)`), shadow.

**Secondary Button (Outline)**
- Background: transparent.
- Border: `2px solid sage`.
- Text: `sage`.
- Hover: background `sage`, text `text-light`.

**Social/Ghost Button**
- Background: `cream-light`.
- Icon centered.
- Hover: background `lavender-soft`.

### 6.3 Cards
- Background: `cream-light`.
- Border: `1px solid gold-soft` optional.
- Border-radius: `16px`.
- Padding: `24px`.
- Shadow: card shadow.
- Hover: lift + elevated shadow.

### 6.4 Forms / Inputs
- Background: `cream-light`.
- Border: `1px solid gold-soft`.
- Border-radius: `12px`.
- Padding: `14px 16px`.
- Focus: border `sage`, subtle shadow.
- Label: sans-serif, `text-dark`, `14px`, above input.
- Error: border `error`, error text below.

### 6.5 Dividers
- Decorative floral divider between sections (SVG line with leaves/flowers).
- Alternative: thin `gold` line `1px`.

### 6.6 Footer
- Background: `earth`.
- Text: `text-light` and `gold-soft`.
- Four-column layout desktop, stacked mobile:
  1. Logo + tagline + newsletter.
  2. Quick links.
  3. Product lines.
  4. Contact + social icons.
- Social icons: Facebook, YouTube, TikTok, Instagram.
- Copyright at bottom, centered, `gold-soft` text.

---

## 7. Section Specifications

### 7.1 Hero Section

**Layout**
- Full viewport height (`100vh` or `min-height: 100vh`).
- Background image: full-cover botanical frame image (cream center, plants in corners, gold border).
- Content centered both vertically and horizontally.
- Navbar overlays the top.

**Content**
- Eyebrow text (label, uppercase, `gold`): "Cosmética Artesanal"
- Headline (H1, serif, `text-dark`):  
  "Cosmética Natural que Cuida tu Piel y el Planeta"
- Subheadline (body, max-width `640px`):  
  "Fórmulas hechas a mano con ingredientes botánicos seleccionados. Sin químicos agresivos, sin crueldad animal."
- CTA Primary: "Descubrir Productos" → scrolls to `#productos`.
- CTA Secondary: "Conocer la Marca" → scrolls to `#conoceme`.

**Visual Notes**
- Text should have a very subtle text-shadow or semi-transparent overlay if needed for readability, but the reference image has a clean cream center so text should sit directly on it.
- Use generous letter-spacing on the eyebrow.

---

### 7.2 Productos Section (`#productos`)

**Layout**
- Section title centered.
- Intro paragraph centered, max-width `720px`.
- Three-column grid desktop, one column mobile.
- Gap: `32px`.

**Category Cards**
1. **Línea Facial**
   - Icon/illustration: soft face outline or botanical leaf.
   - Title: "Línea Facial"
   - Description: "Limpieza, hidratación y cuidado delicado para tu rostro."
   - Link: "Ver productos →"
2. **Para el Cabello**
   - Icon/illustration: hair strand or herbal branch.
   - Title: "Para el Cabello"
   - Description: "Shampoos, acondicionadores y tratamientos naturales."
   - Link: "Ver productos →"
3. **Línea Corporal**
   - Icon/illustration: body silhouette or cocoa beans.
   - Title: "Línea Corporal"
   - Description: "Aceites, cremas y exfoliantes para cuidar tu piel."
   - Link: "Ver productos →"

**Card Anatomy**
- Top: circular or rounded-square illustration container (`lavender-soft` background).
- Middle: title + description.
- Bottom: text link in `sage` with arrow.

---

### 7.3 Redes Sociales Section (`#redes`)

**Layout**
- Background: `cream-light`.
- Section title centered.
- Four social media cards in a row (2x2 on mobile).
- Each card has the platform icon, platform name, and a short call to action.

**Platforms**
| Platform | Label | CTA |
|----------|-------|-----|
| Facebook | Facebook | "Síguenos en Facebook" |
| YouTube | YouTube | "Mira nuestros videos" |
| TikTok | TikTok | "Únete a nuestra comunidad" |
| Instagram | Instagram | "Descubre nuestro día a día" |

**Card Style**
- Square or rounded rectangle.
- Icon size: `40px`.
- Background: `cream`.
- Hover: `lavender-soft` background, icon scales slightly.

---

### 7.4 Conóceme Section (`#conoceme`)

**Layout**
- Two-column grid desktop (image left, text right), stacked mobile.
- Image: portrait/placeholder of the founder, rounded corners (`24px`), subtle shadow.
- Text column divided into three subsections.

**Content Blocks**
1. **Quién soy**
   - Heading: "Quién soy"
   - Text: founder introduction, background, and personal connection to natural cosmetics.
2. **Qué hago**
   - Heading: "Qué hago"
   - Text: product philosophy, commitment to clean ingredients, sustainability.
3. **Cómo lo hago**
   - Heading: "Cómo lo hago"
   - Text: artisan process, small batches, botanical sourcing, handmade detail.

**Visual Notes**
- Use a small decorative icon (leaf, drop, hand) next to each heading.
- Keep paragraphs short and scannable.

---

### 7.5 Comunidad Section (`#comunidad`)

**Layout**
- Background: `sage` with `text-light` text OR `cream-light` with sage accents.
- Two-column layout: left text, right signup form.

**Content (left)**
- Heading: "Únete a nuestra comunidad"
- Text: "Recibe tips de cuidado natural, lanzamientos exclusivos y descuentos especiales."
- Bullet list of benefits:
  - "Acceso anticipado a nuevos productos"
  - "Guías de rutinas naturales"
  - "Descuentos solo para miembros"

**Signup Form (right)**
- "Continuar con Google" button (white background, Google colors icon).
- Divider: "o" with horizontal lines.
- Fields:
  - Nombre completo
  - Correo electrónico
  - Contraseña
- Checkbox: "Acepto la política de privacidad y recibir comunicaciones."
- Submit button: "Crear cuenta".
- Helper link: "¿Ya tenés cuenta? Iniciar sesión."

---

### 7.6 Blog Section (`#blog`)

**Layout**
- Section title + intro centered.
- Three-column grid of article cards.
- "Ver todos los artículos" link below the grid.

**Article Card Anatomy**
- Featured image placeholder, `16px` top radius.
- Category tag (pill, `lavender-soft` background, `lavender` text).
- Title (H4, serif).
- Excerpt, 2–3 lines.
- "Leer más →" link in `sage`.

**Sample Articles**
1. "5 ingredientes naturales para una piel radiante"
2. "Cómo hacer tu rutina capilar con productos botánicos"
3. "El poder del aloe vera en la cosmética artesanal"

---

### 7.7 Contacto Section (`#contacto`)

**Layout**
- Two-column grid: form left, info right.

**Contact Form**
- Heading: "Envianos un mensaje"
- Fields: Nombre, Correo electrónico, Mensaje.
- Submit: "Enviar mensaje".
- Success message: "Gracias por escribirnos. Te responderemos pronto."

**Contact Info (right)**
- Heading: "Información de contacto"
- Items:
  - Email: hola@botanicaesencialob.com
  - WhatsApp: +54 9 11 0000 0000
  - Ubicación: Ciudad Autónoma de Buenos Aires, Argentina
- Map placeholder (rounded, `16px`, `gold-soft` border).

---

### 7.8 Footer

See section 6.6 for full footer spec.

---

## 8. Interactions & Animations

### Scroll Behavior
- Smooth scroll for all anchor links.
- Navbar gains background on scroll after `50px`.

### Reveal Animations
- Sections fade in + translate Y (`20px → 0`) as they enter viewport.
- Use `IntersectionObserver` or CSS scroll-driven animations.
- Stagger delay for grid items: `100ms` between items.
- Duration: `600ms`, easing: `cubic-bezier(0.22, 1, 0.36, 1)`.

### Hover Effects
- Buttons: lift `2px`, shadow increase.
- Cards: lift `4px`, shadow increase, border may shift to `gold`.
- Links: color transition to `lavender` or `sage-dark`.
- Images: subtle scale (`1.03`) inside overflow-hidden containers.

### Form Interactions
- Input focus: border color change + subtle glow.
- Button loading state: spinner, disabled style.
- Validation messages slide in below fields.

### Mobile Menu
- Hamburger icon animates to X.
- Menu panel slides in from right with `cream-light` background.
- Links stack vertically with divider lines.

---

## 9. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Single column, hamburger menu, stacked sections |
| Tablet | 640px – 1024px | Two-column grids, adjusted spacing |
| Desktop | > 1024px | Full layout, max-width container, hover effects |

### Mobile-Specific Notes
- Hero headline reduces to `36px`.
- Navbar height reduces to `64px`.
- Product grid becomes single column.
- Social cards become 2x2 grid.
- Community section stacks vertically.
- Footer stacks into accordion or simple vertical list.

---

## 10. Accessibility

- Color contrast ratio minimum `4.5:1` for body text.
- Focus rings visible on all interactive elements (`2px solid sage` or `gold`).
- All images have descriptive `alt` text in Spanish.
- Form labels explicitly associated with inputs.
- Semantic HTML: `header`, `nav`, `main`, `section`, `article`, `footer`.
- Skip-to-content link for keyboard users.
- Buttons have accessible names; icons hidden from screen readers with `aria-hidden`.

---

## 11. Assets Required

### Images
1. **Hero background** — provided botanical frame image (`hero-botanical-frame.jpg`).
2. **Founder portrait** — photo for Conóceme section (to be provided).
3. **Product category illustrations** — three botanical/line-art illustrations (facial, hair, body).
4. **Blog featured images** — three natural-cosmetics lifestyle photos.
5. **Logo** — wordmark + icon version (light and dark variants).

### Icons
- Navigation: menu, close.
- Social: Facebook, YouTube, TikTok, Instagram.
- UI: arrow-right, check, email, phone, map-pin, lock, eye (password toggle).
- Decorative: leaf, flower, drop, hand, cocoa bean.

### Fonts
- Google Fonts: `Playfair Display` (weights 400, 600, 700) + `Inter` (weights 400, 500, 600).

---

## 12. Technical Notes

### Recommended Stack
- **Static site:** HTML + Tailwind CSS + vanilla JavaScript.
- **Framework option:** Astro, Next.js, or Nuxt for content/blog scalability.
- **Authentication:** Firebase Auth, Auth0, or Supabase for Google/email signup.
- **Form handling:** Netlify Forms, Formspree, or backend endpoint.

### Performance
- Lazy-load images below the fold.
- Use `srcset` for responsive images.
- Hero image should be optimized (WebP with JPG fallback).
- Minimize JavaScript; use CSS transitions where possible.

### SEO (Spanish)
- Title: "Botanica Esencial OB — Cosmética Natural Artesanal"
- Meta description: "Descubre cosmética natural hecha a mano con ingredientes botánicos. Línea facial, capilar y corporal. Unite a nuestra comunidad."
- OG tags for social sharing.

---

## 13. Navigation Map

| Link | Target | Notes |
|------|--------|-------|
| Inicio | `#inicio` / top | Hero section |
| Productos | `#productos` | Product lines grid |
| Conóceme | `#conoceme` | Founder story |
| Blog | `#blog` | Latest articles |
| Contacto | `#contacto` | Contact form + info |
| Unirme | `#comunidad` | Signup section |

---

## 14. Open Questions / Decisions Pending

- Final logo file and variant formats.
- Founder photo for Conóceme section.
- Exact product names and prices (for future product-detail expansion).
- Blog platform or CMS choice.
- E-commerce backend if checkout is added later.

---

*Document version: 1.0*  
*Created for: Botanica Esencial OB website project*  
*Location: `/ideas/design.md`*
