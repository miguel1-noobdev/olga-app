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
| 3 | Blog platform + integration | PR 3 | base: PR 2; MDX, comments, final tests |

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

- [ ] **T-011** Create landing layout and navbar in src/app/page.tsx and src/components/landing/navbar.tsx; verify navigation renders; commit `feat: add landing layout and navbar`.
- [ ] **T-012** Build Hero section in src/components/landing/sections/hero.tsx with full-viewport /img/hero image, headline, CTA; verify render; commit `feat: add Hero section`.
- [ ] **T-013** Build Productos preview section with 3-4 cards from /img/prd and collection link; verify render; commit `feat: add Productos preview section`.
- [ ] **T-014** Build Nuestros métodos section showing process steps; verify render; commit `feat: add Nuestros metodos section`.
- [ ] **T-015** Build Journal preview section with 3 latest blog entries and registration prompt for anonymous users; verify content; commit `feat: add Journal preview section`.
- [ ] **T-016** Build Glosario botánico preview section with 3-4 ingredient cards and glossary link; verify render; commit `feat: add Glosario preview section`.
- [ ] **T-017** Build Presentación de Olga section with circular photo, intro, highlighted quote; verify render; commit `feat: add Presentacion de Olga section`.
- [ ] **T-018** Build Únete section with registration CTA; verify render and CTA link; commit `feat: add Unete section`.
- [ ] **T-019** Build Acceso a redes section with large social-media links; verify links; commit `feat: add Acceso a redes section`.
- [ ] **T-020** Build Footer section with navigation, contact, social, and legal placeholders; verify render; commit `feat: add Footer section`.

## Phase 4: Blog Platform

- [ ] **T-021** Set up MDX loader in src/lib/content/articles.ts and create 4 seed articles in content/articles/; verify list/filter/bySlug; commit `feat: add MDX article loader and seed articles`.
- [ ] **T-022** Build blog listing page at src/app/blog/page.tsx with article cards and category filter; verify Recursos/Blog filter; commit `feat: add blog listing page`.
- [ ] **T-023** Build article page at src/app/blog/[slug]/page.tsx rendering title, image, content, author, date, category, tags; verify slug routing; commit `feat: add blog article page`.
- [ ] **T-024** Implement comments in src/components/blog/comment-form.tsx, comment-list.tsx, and src/app/api/comments/route.ts; verify post/delete and empty rejection; commit `feat: add comments API and UI`.
- [ ] **T-025** Run integration tests for anonymous redirect, registered /blog access, first-user-admin, 9 landing sections order; verify build; commit `test: add Fase 1 integration tests`.
