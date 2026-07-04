# Landing Page Specification

## Purpose

Define the public landing page for Botánica Esencial OB: a glassmorphism, nine-section page that introduces the brand and invites registration.

## Requirements

### Requirement: Public access

The landing page MUST be accessible without authentication.

#### Scenario: Anonymous visit

- GIVEN an unauthenticated visitor navigates to `/`
- WHEN the page loads
- THEN all public sections render without requiring login

### Requirement: Section order

The landing page MUST render exactly nine sections in order:

1. Hero
2. Productos preview
3. Nuestros métodos
4. Journal preview
5. Glosario botánico preview
6. Presentación de Olga
7. Únete
8. Acceso a redes
9. Footer

#### Scenario: Verify sequence

- GIVEN the landing page is loaded
- WHEN sections are inspected in document order
- THEN they MUST appear in the order listed above

### Requirement: Glassmorphism style

The landing page MUST use a glassmorphism design system.

#### Scenario: Visual style applied

- GIVEN the page is rendered
- WHEN a glass panel is inspected
- THEN it MUST use translucent backgrounds with blur, rounded corners, and palette `#334537`, `#e9c349`, `#f4fbf2`

### Requirement: Section content

Each section MUST display its defined content.

#### Scenario: All sections render correctly

- GIVEN the landing page is loaded
- WHEN each section is inspected
- THEN the Hero shows a full-viewport `/img/hero` image, headline, and primary CTA
- AND the Productos preview shows 3-4 cards from `/img/prd` plus a "Ver colección completa" link
- AND Nuestros métodos shows the process steps
- AND the Journal preview shows 3 latest blog entries with a registration prompt for anonymous visitors
- AND the Glosario preview shows 3-4 ingredient cards with a link to the full glossary
- AND Presentación de Olga shows her circular photo, introduction, and highlighted quote
- AND Únete shows a registration call-to-action
- AND Acceso a redes shows large social-media links
- AND the Footer shows navigation, contact, social, and legal placeholders

### Requirement: Section-by-section validation

Each landing section MUST be approved by the user before the next section is built.

#### Scenario: Build process

- GIVEN section N is complete
- WHEN the user validates section N
- THEN implementation of section N+1 MAY begin
