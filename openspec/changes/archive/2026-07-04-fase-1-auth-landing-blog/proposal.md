# Proposal: Fase 1 — Auth + Landing + Blog

## Intent

Establish the public face and subscriber layer of Botánica Esencial OB. Deliver a glassmorphism landing page, role-based authentication, and a registered-only blog so visitors can subscribe and Olga/Miguel can start building the audience before the business dashboards arrive.

## Scope

### In Scope
- NextAuth.js auth with email/password and Google OAuth
- Role model: `suscriptora`, `productora`, `admin`; first registered user becomes `admin`
- Landing page with 9 sections built section-by-section
- Blog pages (list, article) restricted to authenticated users
- Static article seed for blog preview and layout validation

### Out of Scope
- MongoDB business collections (Fase 2)
- Glosario full page (Fase 3)
- Laboratorio and admin dashboards (Fase 3-4)
- Blog comments and moderation (explicitly deferred by product decision for Fase 1)
- Blog search and category filtering (deferred to a future blog enhancement)
- Email sending infrastructure
- Payment, cart, checkout

## Capabilities

### New Capabilities
- `user-auth`: registration, login, logout, OAuth, role assignment, first-user-admin rule
- `landing-page`: 9-section public landing with glassmorphism design system
- `blog-platform`: article listing and article view for registered users

### Modified Capabilities
- None

## Approach

Bootstrap a Next.js 14 App Router project with TypeScript and Tailwind. Build auth first because it gates the blog. Then construct the landing page one section at a time, validating with the user. Finally wire the blog behind auth using static seed content.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/` | New | App router pages, layouts, API routes |
| `src/components/` | New | Reusable UI and section components |
| `src/lib/auth/` | New | NextAuth configuration and role helpers |
| `src/styles/` | New | Tailwind config and global styles |
| `src/lib/db/` | New | User/session persistence for Fase 1 |
| `tests/` | New | Unit and integration tests (TDD) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Google OAuth credentials delay | Medium | Start with email/password; add OAuth credentials later |
| Role-based redirects become complex | Medium | Keep role checks in a single middleware/helper |
| Landing scope creep | High | Strict section-by-section validation with user |

## Rollback Plan

- Auth: disable protected routes by removing middleware guard; landing remains public.
- Blog: hide navigation links; keep pages unreachable without login.
- Landing section: revert single component file to previous commit.

## Dependencies

- Google Cloud OAuth client credentials
- VPS server block + SSL (deferred to deploy)
- MongoDB connection string for user storage (can defer to Fase 2 if using local storage temporarily)

## Success Criteria

- [x] First registered user is assigned `admin` role automatically
- [x] Registered users can log in and access `/blog`
- [x] Anonymous users see full landing but are redirected when accessing `/blog`
- [x] Landing renders all 9 sections matching the glassmorphism reference
- [x] Blog shows articles without comments, search, or category filtering in Fase 1
