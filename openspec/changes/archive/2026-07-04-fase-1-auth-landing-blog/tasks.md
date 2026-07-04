# Tasks: Fase 1 — Auth + Landing + Blog

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | 2500–3500 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: scaffold+auth, PR 2: landing, PR 3: blog |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|---|---|---|---|
| 1 | Auth + middleware + guards | PR 1 | base: main; includes tests |
| 2 | Landing page 9 sections | PR 2 | base: PR 1; section-by-section validation |
| 3 | Blog platform + integration | PR 3 | base: PR 2; MongoDB-backed blog, admin authoring, remaining follow-ups |

Dependencies are implicit: tasks within a phase run top-to-bottom; later phases depend on earlier phases.

## Phase 1: Project Foundation

- [x] **T-001** Scaffold Next.js 14 + Tailwind; create package.json, tsconfig.json, tailwind.config.ts, postcss.config.js, next.config.mjs, src/app/layout.tsx; verify `npm run build`; commit `chore: scaffold Next.js project`.
- [x] **T-002** Configure Vitest for Next.js + TypeScript; add smoke test; verify `npm test`; commit `chore: add Vitest test runner`.
- [x] **T-003** Add glassmorphism tokens to tailwind.config.ts and src/styles/globals.css; verify color/utility classes; commit `feat: add glassmorphism design tokens`.

## Phase 2: Auth System

- [x] **T-004** Implement atomic JSON file store in src/lib/db/json-store.ts; verify atomic writes; commit `feat: add atomic JSON file store`.
- [x] **T-005** Implement UserRepository in src/lib/db/repository/user.ts with first-user-admin rule and bcrypt hashing; verify create/find/count; commit `feat: adapt UserRepository to MongoDB + bcrypt (T-005)`.
- [x] **T-006** Configure NextAuth in src/lib/auth/options.ts and src/app/api/auth/[...nextauth]/route.ts with credentials provider; verify session has id/email/role; commit `feat: add NextAuth credentials provider`.
- [x] **T-007** Build login page at src/app/(auth)/login/page.tsx with client form and errors; verify valid/invalid flows; commit `feat: add login page`.
- [x] **T-008** Build registration page at src/app/(auth)/register/page.tsx with password validation and duplicate email handling; verify first user becomes admin; commit `feat: add registration page`.
- [x] **T-009** Add Google OAuth provider to NextAuth options; create user via UserRepository on first OAuth sign-in; verify callback; commit `feat: add Google OAuth provider`.
- [x] **T-010** Implement guard.ts and middleware.ts protecting /blog/** with redirect to /login?callbackUrl; verify anonymous redirect; commit `feat: add auth guard and middleware`.

## Phase 3: Landing Page

- [x] **T-011** Create landing layout and navbar in src/app/page.tsx and src/components/landing/navbar.tsx; verify navigation renders; commit `feat: add landing layout and navbar`.
- [x] **T-012** Build Hero section in src/components/landing/hero.tsx with full-viewport hero image, headline, and landing presentation; verify render; commit `feat: add Hero section`.
- [x] **T-013** Build Productos preview section with line cards and collection affordances in src/components/landing/products.tsx; verify render; commit `feat: add Productos preview section`.
- [x] **T-014** Build Nuestros métodos section in src/components/landing/metodos.tsx showing the artisanal process; verify render; commit `feat: add Nuestros metodos section`.
- [x] **T-015** Build Diario Botánico preview section in src/components/landing/diario.tsx with 3 landing cards and `/blog` CTA; verify content; commit `feat: add Journal preview section`.
- [x] **T-016** Build Glosario botánico preview section in src/components/landing/glosario.tsx with ingredient cards and glossary CTA placeholder; verify render; commit `feat: add Glosario preview section`.
- [x] **T-017** Build Presentación de Olga section in src/components/landing/olga.tsx with circular photo, intro, and highlighted quote; verify render; commit `feat: add Presentacion de Olga section`.
- [x] **T-018** Build Únete section in src/components/landing/unete.tsx with registration-style CTA layout; verify render; commit `feat: add Unete section`.
- [x] **T-019** Build Acceso a redes section in src/components/landing/redes.tsx with large social-media cards; verify render; commit `feat: add Acceso a redes section`.
- [x] **T-020** Build Footer section in src/components/landing/footer.tsx with navigation, contact details, copyright, and creator credit; verify render; commit `feat: add Footer section`.

## Phase 4: Blog Platform

- [x] **T-021** Implement MongoDB-backed article persistence with `src/lib/db/connect.ts`, `src/lib/db/models/article.ts`, `src/lib/db/repository/article.ts`, and admin create flow at `/admin/blog`, `/admin/blog/nuevo`, and `POST /api/admin/articles`; this superseded the earlier MDX-loader plan.
- [x] **T-022** Build `/blog` welcome page plus `/blog/articulos` published listing using MongoDB article data; verify `/blog` reads the latest 2 published articles and `/blog/articulos` reads all published articles.
- [x] **T-023** Build `/blog/[slug]` article detail page reading article content from MongoDB by slug and rendering the published detail view; verify slug routing.
- [x] **T-024** Defer blog comments by explicit product decision; comments are out of scope for Fase 1 and the blog remains comment-free for now. No comment UI/API implementation in this phase.
- [x] **T-025** Run integration tests for anonymous redirect, registered /blog access, first-user-admin, 9 landing sections order; verify build; commit `test: add Fase 1 integration tests`.
