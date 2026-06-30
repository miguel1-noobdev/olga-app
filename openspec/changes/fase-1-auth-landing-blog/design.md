# Design: Fase 1 — Auth + Landing + Blog

## Technical Approach

Bootstrap a Next.js 14 App Router monolith (TypeScript + Tailwind) on the VPS. Auth gates everything behind NextAuth.js (JWT session strategy, credentials + Google providers) with a file-based adapter for Fase 1 — MongoDB is deferred. The landing is a server-rendered `/` route composed of nine section components built sequentially with user validation. The blog lives behind auth as MDX/JSON static content rendered by server components, with comments persisted to the Fase 1 file store. A single `middleware.ts` enforces protected routes and role-aware redirects.

## Architecture Decisions

### Decision: Auth session strategy = JWT (stateless)
| Option | Tradeoff | Verdict |
|--------|----------|--------|
| Database sessions | Requires adapter + DB on every request | Rejected — Mongo deferred |
| JWT in NextAuth | Stateless, no store writes, works with file adapter | Chosen |
**Rationale**: Fase 1 has no Mongo. JWT keeps sessions viable without a session collection; switching to database sessions in Fase 2 is a one-line adapter swap.

### Decision: Fase 1 persistence = file-based JSON store
| Option | Tradeoff | Verdict |
|--------|----------|--------|
| MongoDB from day 1 | Premature — no business collections yet | Rejected |
| In-memory | Lost on restart, fails multi-process | Rejected |
| JSON file store (`src/lib/db/json-store.ts`) | Atomic writes, survives restarts, swappable | Chosen |
**Rationale**: PM2 restarts and Nginx multi-worker demand durability without a DB. The store exposes an async `UserRepository`/`CommentRepository` interface so Fase 2 swaps the implementation for Mongo without touching callers.

### Decision: Articles = static MDX + frontmatter JSON (no DB)
| Option | Tradeoff | Verdict |
|--------|----------|--------|
| MDX files in `content/articles/` | First-class Next MDX, great SEO | Chosen |
**Rationale**: Articles are curated by Olga/Miguel, not user-generated. MDX with frontmatter gives SSG, zero DB cost, and is trivially authored. Comments (user-generated) go to the JSON store, not MDX.

### Decision: One middleware for all protection
| Option | Tradeoff | Verdict |
|--------|----------|--------|
| Per-route guards | Duplicated logic | Rejected |
| `middleware.ts` matcher on `/blog/:path*` and `/login` redirect logic | Single chokepoint, easy audit | Chosen |
**Rationale**: Spec risk "role-based redirects become complex" is mitigated by keeping every auth decision in `src/lib/auth/guard.ts` consumed by middleware.

### Decision: Glassmorphism tokens in Tailwind theme, not inline
**Rationale**: Spec mandates palette `#334537` / `#e9c349` / `#f4fbf2`, blur and rounded corners. Defining them once in `tailwind.config.ts` + CSS variables keeps sections consistent and enables section-by-section builds to share tokens automatically.

## Data Flow

    Browser ──> middleware.ts ──> App Router page ──> Server Component
                       │                │
                  guard.canVisit()      reads session (next-auth)
                       │                │
                  redirect or pass      calls lib/auth, lib/db, content/articles

Registration: `/api/auth/...` (NextAuth) + `/api/register` → `UserRepository.create` → first-user check → role assigned → NextAuth signIn.

Comments: `/blog/[slug]` form POST → `/api/comments` → `CommentRepository.add` → revalidate article page.

JSON store writes are atomic (`fs.writeFile` to temp + `rename`), single-process safe under PM2 (1 instance for Fase 1).

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.mjs` | Create | Next 14 App Router + TS + Tailwind scaffold |
| `src/app/layout.tsx` | Create | Root layout, `<SessionProvider>`, global styles |
| `src/app/page.tsx` | Create | Landing: composes 9 section components in order |
| `src/app/(auth)/login/page.tsx` | Create | Login form (client component) |
| `src/app/(auth)/register/page.tsx` | Create | Registration form (client component) |
| `src/app/blog/page.tsx` | Create | Article listing + category filter (server) |
| `src/app/blog/[slug]/page.tsx` | Create | Article view + comments (server + client form) |
| `src/app/blog/page.tsx.spec`, etc. | Create | Co-located tests (TDD) |
| `src/app/api/auth/[...nextauth]/route.ts` | Create | NextAuth config |
| `src/app/api/register/route.ts` | Create | Registration endpoint |
| `src/app/api/comments/route.ts` | Create | Comment POST + delete endpoints |
| `src/lib/auth/options.ts` | Create | Providers, callbacks, session enrichment with role |
| `src/lib/auth/guard.ts` | Create | `canVisit(path, session)` + first-user-admin helper |
| `src/lib/auth/roles.ts` | Create | Role type + constants |
| `src/lib/db/json-store.ts` | Create | Atomic JSON file store |
| `src/lib/db/repository/user.ts` | Create | `UserRepository` (register, findByEmail, count, verifyPassword) |
| `src/lib/db/repository/comment.ts` | Create | `CommentRepository` (add, listFor, delete) |
| `src/lib/content/articles.ts` | Create | Loads MDX + frontmatter, list/filter/bySlug |
| `middleware.ts` | Create | Protects `/blog/**`, redirect-to-login with callback URL |
| `content/articles/*.mdx` | Create | 4 seed articles (Recursos + Blog categories) |
| `src/components/landing/sections/*.tsx` | Create | One file per section (9 files) |
| `src/components/ui/glass-card.tsx` | Create | Shared glassmorphism primitive |
| `src/components/blog/article-card.tsx`, `comment-form.tsx`, `comment-list.tsx` | Create | Blog UI |
| `src/styles/globals.css` | Create | Tailwind directives + glass utilities |
| `tests/unit/**`, `tests/integration/**` | Create | Jest or Vitest per AGENTS.md TDD |

## Interfaces / Contracts

```ts
type Role = 'suscriptora' | 'productora' | 'admin';
interface SessionUser { id: string; email: string; role: Role; name?: string; }
interface UserRecord { id: string; email: string; passwordHash: string; role: Role; createdAt: string; }
interface UserRepository {
  create(data: { email: string; password: string }): Promise<UserRecord>; // assigns first-user-admin
  findByEmail(email: string): Promise<UserRecord | null>;
  count(): Promise<number>;
}
interface CommentRecord { id: string; articleSlug: string; authorId: string; authorName: string; body: string; createdAt: string; }
interface CommentRepository { add(c): Promise<CommentRecord>; listFor(slug): Promise<CommentRecord[]>; delete(id, byUser): Promise<void>; }
interface Article { slug: string; title: string; category: 'Recursos'|'Blog'; author: string; date: string; excerpt: string; image: string; tags: string[]; }
```

First-user-admin rule enforced inside `UserRepository.create`: `role = (await count() === 0) ? 'admin' : 'suscriptora'`. Password hashing via `bcryptjs`. Google OAuth user create mirrored through the same repository on `signIn` callback when no existing user matches the email.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `guard.canVisit`, first-user-admin rule, password length validation, comment empty rejection, category filter, article loader | Jest/Vitest, pure functions, mock repositories |
| Integration | Registration → login → session role, OAuth callback user creation, comment post/delete flow, JSON store atomicity | Test API routes with supertest/`next/test` against temp data dir |
| E2E | Anonymous redirected from `/blog`, registered can `/blog`, first-user-admin, 9 sections render in order, category filter | Playwright (deferred if timeline; AGENTS.md allows UI-static exception only for pure visual sections) |

## Migration / Rollout

No data migration (greenfield). Rollback per proposal: remove `middleware.ts` matcher to make landing public while disabling blog links; revert a single section component per commit if user rejects it. JWT session needs no migration when Mongo arrives — adapter swap only.

## Open Questions

- [ ] Testing runner: Jest or Vitest? (config.yaml leaves it open; recommend Vitest for Next + ESM speed)
- [ ] Google OAuth client credentials availability — start with credentials-only until provided
- [ ] Comment spam protection for suscriptora users (rate limit?) — out of scope unless user requests