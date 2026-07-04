# Apply Progress — Fase 1 (Auth + Landing + Blog)

> Running log of completed tasks. Updated by the sdd-apply sub-agent as each task lands.
> Source of truth: `tasks.md` checkboxes; this file records decisions, blockers, and artifacts that don't fit in the task list.

## Status

| Task | Title | Status | Commit | Notes |
|------|-------|--------|--------|-------|
| T-001 | Scaffold Next.js 14 + Tailwind | done | `af79a1c` | Build verified. See notes below. |
| T-002 | Configure Vitest | done | `8350fdb` | Smoke test green. GGA passed. |
| T-003 | Glassmorphism design tokens | done | `a7723c2` | 31 design-token tests green; build still 4/4. |
| T-004 | Atomic JSON file store | done | `e6e1d69` | 20 unit tests green; path-traversal hardened. |
| T-005 | UserRepository MongoDB + bcrypt | done | `66583a0` | 15 TDD tests green; GGA initially rejected (wrong stack), reimplemented with Mongoose. |
| T-006 | NextAuth credentials provider | done | `1bb045f` | 73 tests pass; build 5/5 routes; session includes id/email/role. |
| T-007 | Login page | done | `dd21355` | Login page renders; Suspense boundary for useSearchParams; glass-card styling. |
| T-008 | Registration page + API | done | `7a25cb8` | Registration page + POST /api/auth/register; first-user-admin rule via UserRepository. |
| T-009 | Google OAuth provider | done | `2ac36fa` | GoogleProvider added to NextAuth; signIn callback creates user via UserRepository on first OAuth sign-in; login page has Google button. |
| T-010 | Auth guard middleware | done | `9116fc0` | Middleware protects /blog/** using jose JWT verify; redirects unauthenticated users to /login?callbackUrl. |
| T-011 | Landing layout + navbar | done | `b43d25d` | Responsive navbar with glassmorphism; anchor links; mobile hamburger menu. Placeholder sections for T-012-T-020. |
| T-021 | MongoDB article persistence + admin create flow | done | `e9073df` | Earlier MDX-loader plan was superseded by the MongoDB article model/repository, `/admin/blog`, `/admin/blog/nuevo`, and `POST /api/admin/articles`. |
| T-022 | Blog home + published listing routes | done | `e9073df` | `/blog` renders the welcome experience plus the latest 2 published articles; `/blog/articulos` lists all published articles from MongoDB. |
| T-023 | Blog article detail route | done | `e9073df` | `/blog/[slug]` resolves articles by slug from MongoDB and renders the published detail page. |

## T-001 — Scaffold Next.js 14 + Tailwind

### What landed
- `package.json` — Next 14.2.35, React 18.3.1, TypeScript 5.6.3, Tailwind 3.4.15, PostCSS, autoprefixer
- `tsconfig.json` — strict mode, `@/*` path alias to `./src/*`
- `tailwind.config.ts` — content globs cover `src/app/**` and `src/components/**`
- `postcss.config.js` — tailwindcss + autoprefixer
- `next.config.mjs` — `reactStrictMode: true`
- `src/app/layout.tsx` — root layout, `<html lang="es">`, imports `globals.css`
- `src/styles/globals.css` — Tailwind base/components/utilities (T-003 will add glass tokens)
- `src/app/page.tsx` — minimal Spanish placeholder; T-011 will replace with the real landing
- `.gitignore` — added `node_modules/`, `.next/`, lockfiles, env files, IDE folders
- `.gga` — added `package-lock.json` to `EXCLUDE_PATTERNS` (see infra note)

### Verification
- `npm install` — 110 packages, 0 errors
- `npm run build` — Compiled successfully, 4/4 static pages, `/` route 138 B + 87.4 kB shared JS

### Decisions / infra notes
- **Next 14.2.35 chosen over 14.2.18** because 14.2.18 has a security advisory; 14.2.35 is the latest patched 14.x release.
- **GGA infrastructure fix** — adding `package-lock.json` to `.gga` `EXCLUDE_PATTERNS` was required to make the pre-commit hook runnable. The 1676-line lockfile exceeded the opencode argument limit on Windows Git Bash. This is a project-hygiene change, not a code change; it's bundled in the same T-001 commit. Future commits will skip the lockfile automatically.
- **Tailwind content globs** — set to `./src/app/**/*.{ts,tsx}` and `./src/components/**/*.{ts,tsx}`. Will be revisited only if a section/component lives elsewhere.
- **`<html lang="es">`** — set on the root layout per project rule (user-facing is Spanish; code/comments remain English).
- **`page.tsx` placeholder** — added so the build produces a real route. T-011 owns the real landing; this file is intentionally trivial.

### Outstanding risks
- `npm audit` still reports 2 vulnerabilities in the Next 14 line (DoS via image optimizer, postcss XSS). Both require a major-version bump to Next 15+/16 to fix cleanly. Out of scope for T-001; should be tracked as a separate task when ready to break the API.

### Bundle size
- 132 lines of project code + 1676 lines of `package-lock.json` = 1808 insertions total. Well under the 400-line chained-PR budget.

## T-002 — Configure Vitest for Next.js + TypeScript

### What landed
- `vitest.config.ts` — Vitest 2.1 config, `happy-dom` environment, `@/*` path alias, `coverage-v8` provider wired up (excludes `*.{test,spec}.{ts,tsx}` and `*.d.ts`), include patterns cover both `tests/**` and co-located `src/**/*.{test,spec}.{ts,tsx}`
- `tests/smoke.test.ts` — first test; trivial `1+1=2` assertion to prove the runner boots
- `package.json` — devDeps: `vitest@^2.1.9`, `@vitest/coverage-v8@^2.1.9`, `happy-dom@^15.11.7`. Scripts: `test` (default run), `test:run` (one-shot CI), `test:watch` (watch mode), `test:coverage` (run + coverage)
- `package-lock.json` — regenerated by `npm install`

### Verification
- `npm run test:run` — 1/1 passed, 9.72s total (most of it `happy-dom` warmup)
- `npm run build` — still passes (4/4 static pages, same byte size as T-001) — vitest config did not regress the Next build

### Decisions / infra notes
- **Vitest 2.1 over 3.x** — 2.1 is the proven line for Next 14 + Node 22; the 3.x line introduces breaking changes (e.g. `pool` defaults, removed APIs) that we don't need at this stage. Easy to bump later if a 3.x-only feature is required.
- **happy-dom over jsdom** — significantly faster startup (~8s vs ~25s in cold runs on this Windows box) and compatible with React Testing Library for the unit tests we'll write in T-005/T-007/T-008. jsdom remains a viable fallback if a happy-dom parity gap shows up.
- **TDD order respected** — `tests/smoke.test.ts` was written before `vitest.config.ts`. The test existed as a Red; the config made it Green. No refactor needed at this scope.
- **`globals: false`** — explicit `import { describe, it, expect } from 'vitest'` in every test. Slightly more typing but: (a) makes the test file self-documenting, (b) avoids a class of "why does this pass locally but not in CI?" mysteries when editor TS and vitest's globals disagree.
- **CJS deprecation warning** — Vite logs `The CJS build of Vite's Node API is deprecated` on every `vitest` invocation under Vitest 2.x. It's a Vite 5/6 upstream warning, not a config error, and is silenced in Vitest 3. Acceptable to leave; will disappear with the next major bump.

### Outstanding risks
- `npm audit` now reports 9 vulnerabilities (was 2 after T-001). The new ones come from vitest's dep tree (esbuild, vite, etc.) and are mostly dev-time only. To be triaged in a separate audit pass; not blocking T-002.
- Component tests in later tasks (T-007 login, T-008 register, T-024 comments) will need Next-specific mocks for `next/image`, `next/navigation`, `next-auth`. Not in scope for T-002 — will land per-test as we write them.

### Bundle size
- 24 lines of project code (config + test) + regenerated `package-lock.json`. Well under the 400-line budget.

## T-003 — Glassmorphism design tokens

### What landed
- `tailwind.config.ts` — `theme.extend.colors` adds the full glassmorphism palette (primary `#334537`, secondary `#e9c349`, surface `#f4fbf2`, surface-container `#e9f0e7`, surface-border `#dde4db`, plus `on-surface` / `on-surface-variant` for body text). `theme.extend.fontFamily` exposes Playfair Display as `serif` and Plus Jakarta Sans as `sans`, both with full platform-fallback stacks. `borderRadius` extends with the 1rem / 2rem / 3rem scale from the Stitch base. `backdropBlur.glass = 20px` powers the navbar / overlay blur. `theme.safelist` whitelists the design-system utilities as a public API surface (the landing sections and blog components will consume them, but we don't want first paint to depend on a happy incidental match in `content`).
- `src/styles/globals.css` — keeps the three `@tailwind` directives. Adds `@layer base` to set `html { background, color, font-family }` and `h1..h6 { font-family: serif }` so the page and headings pick up the design tokens without per-component plumbing. Adds `@layer components` with the `.glass-card` utility (translucent white, `backdrop-filter: blur(20px)`, hairline highlight borders, layered shadows in the primary/secondary palette, hover lift transition), its `:hover` variant, and a `.gold-border` hairline accent.
- `tests/design-tokens.test.ts` — new TDD spec. 31 assertions across four suites: (1) config exports the expected color/font tokens, (2) `resolveConfig` resolves them to the exact hex values, (3) `globals.css` keeps the three directives and defines `.glass-card` / `.glass-card:hover` / `.gold-border` with the right backdrop-filter, (4) postcss + tailwind compiles the test classes to the right CSS — `bg-primary` -> `rgb(51 69 55 / var(--tw-bg-opacity, 1))`, `text-secondary` -> `rgb(233 195 73 / ...)`, `backdrop-blur-glass` -> `--tw-backdrop-blur: blur(20px)`, etc. The compilation test writes a temp fixture so the JIT purges nothing.

### Verification
- `npm run test:run` — 32/32 passed (31 new + the T-002 smoke test). 2.5s total.
- `npm run build` — still 4/4 static pages; `/` route still 138 B + 87.4 kB shared JS (the design tokens add zero bytes until a component actually uses them, which T-011 onward will do).
- TDD order respected: the test was written first, ran with 17/18 failing (Red), then the config + CSS made every test pass (Green). No refactor needed at this scope.

### Decisions / infra notes
- **T-003 did not touch `src/app/page.tsx`** — the placeholder is intentionally trivial and the real landing is owned by T-011. The placeholder does pick up the new tokens (background = surface, h1 = serif) thanks to the `@layer base` rules, which is the right "do no more than necessary" move.
- **`safelist` is intentional** — design-system tokens are part of the public API, not just utilities that happen to be used somewhere in `src/`. Whitelisting the palette, the two font aliases, `backdrop-blur-glass`, `glass-card`, and `gold-border` means: (a) the test can compile them without writing fake components, (b) T-011 can drop a `<section className="bg-primary text-surface">` and not be surprised by an empty CSS bundle if a future PR renames a parent component.
- **Postcss compile test approach** — Tailwind's JIT purges classes that don't appear in any `content` source. To prove the full chain (config -> utility -> CSS) without coupling the test to a real component, the test creates a tiny temp HTML fixture in `os.tmpdir()`, clones the config with `content: [fixture]` and `safelist: undefined` (so the test proves the *config-defined tokens alone* are sufficient, not the safelist), runs postcss, and asserts on the compiled CSS. Temp dir is cleaned in `afterAll`. This is the only test that actually goes through postcss and is the closest analog to "what the production build will emit".
- **Tailwind 3.4 output format** — colors compile to `rgb(R G B / var(--tw-*-opacity, 1))`, not plain hex, so opacity modifiers (`bg-primary/50`) work via the `--tw-bg-opacity` variable. `backdrop-blur-*` compiles to `--tw-backdrop-blur: blur(Npx)` plus a `backdrop-filter: var(--tw-backdrop-blur) var(--tw-backdrop-brightness) ...` line. The test regexes assert on this real format, not on the hex.
- **Color names with dashes** — Tailwind 3 lets you use any string as a color key, so `surface-container` and `surface-border` work as `bg-surface-container` and `border-surface-border` without renaming. The kebab-case keys are quoted in the config to satisfy the TS object-literal parser.
- **`gold-border` is in globals.css, not the config** — it's a one-off utility (a single hairline color, no variants), not a token that needs theming. Putting it in `@layer components` keeps the config focused on palette + type + spacing.
- **First-use of `@layer base` in the project** — T-001 left the base layer empty (just the directives). T-003 fills it with the design-system defaults. Future components can assume `body` has surface background, `h1..h6` use the serif family, and the OS will render them as designed.

### Outstanding risks
- None for T-003. The tokens are static; nothing runtime can break. The only follow-up is consuming them in T-011+ landing sections, which is by design.
- The audit count from T-002 (9 vulnerabilities, all in dev deps) is unchanged.

### Bundle size
- `tailwind.config.ts`: 14 -> 56 lines (+42). `globals.css`: 3 -> 54 lines (+51). Test: +208 lines (31 assertions). Net: ~301 lines of project code. Under the 400-line chained-PR budget for the Fase 1 work unit.

## T-004 — Atomic JSON file store

### What landed
- `src/lib/db/json-store.ts` — `JsonStore` class. Constructor takes an optional `baseDir` (defaults to `<cwd>/.data`). Four methods: `read<T>(file)`, `write<T>(file, data)`, `exists(file)`, `delete(file)`. Atomic write is `fs.writeFile` to `${file}.tmp` then `fs.rename` to the target. `read` returns `null` on `ENOENT`, throws on parse error. `delete` is a no-op on `ENOENT`. Path-traversal protection: rejects filenames whose segments contain `..` or `.`, rejects absolute paths (POSIX `/...` and Windows `C:\...` / `C:/...`), and verifies the resolved path stays inside `baseDir` as defense in depth.
- `tests/json-store.test.ts` — 20 TDD assertions across 5 suites: `read` (null on missing, parse-error throw, nested shapes round-trip), `write` (round-trip, replace, intermediate dirs, `.tmp` cleanup), `exists` (false/true/false lifecycle), `delete` (removes file, no-op on missing), path-traversal protection (`..`, nested `..`, lone `.`, empty filename, POSIX absolute, Windows-style absolute), and a constructor test for custom base dirs. Each test uses `os.tmpdir()` + `fs.mkdtempSync` for isolation and cleans up in `afterEach`.
- `.gitignore` — added `.data/` so the runtime data dir (default `baseDir`) is never committed.

### Verification
- `npx vitest run` — 52/52 passed (20 new + 31 design-tokens + 1 smoke). 3.4s total.
- `npm run build` — 4/4 static pages, no regressions on size (`/` still 138 B + 87.4 kB shared JS).
- TDD order respected: tests written first and failed on the missing-module import (Red), then the implementation flipped them Green. No refactor pass needed.

### Decisions / infra notes
- **Class, not module of free functions** — the design says "swappable" for Fase 2; a class is the natural injection point for `UserRepository` / `CommentRepository`. `new JsonStore(tempDir)` is the test seam, `new JsonStore()` is the production default.
- **Default baseDir = `path.resolve(process.cwd(), '.data')`** — `process.cwd()` is the project root when Next.js runs, so the production default lands at `<repo>/.data`. The `tsconfig.json` `baseUrl: "."` + `paths: { "@/*": ["./src/*"] }` means the path alias already used by `src/` works for tests too (`@/lib/db/json-store`).
- **Atomic write = `tmp` + `rename`** — Node 14+ `fs.rename` overwrites on Windows (Win32 `MoveFileEx` with `MOVEFILE_REPLACE_EXISTING`), so the same code path is correct on Linux and Windows. The `.tmp` file lives next to the target, so the rename stays within the same filesystem (required for atomicity).
- **Three-layer traversal defense** — (1) reject filenames with `..` or `.` segments (matches the spec literally and gives a clear error), (2) reject absolute paths via `path.isAbsolute` and a Windows drive-letter regex, (3) verify the resolved path stays inside `baseDir` via `path.relative`. The first layer is what the test asserts on; the second and third are belt-and-braces in case a future caller passes a path I didn't anticipate.
- **`JSON.stringify(data, null, 2)`** — pretty-printed output. The JSON files are tiny (users, comments) and humans will read them when debugging, so readability beats the 30% byte saving of compact JSON.
- **`exists` uses `fs.access` not `fs.stat`** — `fs.access` is the standard "does this path exist for the current process?" probe and is what the docs recommend; `fs.stat` would also work but pulls a full `Stats` object we don't need.
- **`delete` is idempotent** — `fs.unlink` on a missing file throws `ENOENT`, which we swallow and return. Callers don't need to `exists`-check before deleting.
- **Single-process assumption held** — no in-process locking needed. PM2 runs 1 instance for Fase 1, and Node is single-threaded, so two simultaneous `write` calls to the same file would only race on the temp + rename pair (last writer wins), which is the documented behavior.

### Outstanding risks
- None for T-004. The store is a leaf module with no I/O beyond the filesystem, no concurrency invariants beyond the documented single-process model, and the path-traversal tests cover the realistic attack surface.
- The `npm audit` count from T-002 (9 vulnerabilities, all in dev deps) is unchanged. `fs/promises` is a Node built-in, so no new deps were added.

### Bundle size
- `src/lib/db/json-store.ts`: 64 lines. `tests/json-store.test.ts`: 145 lines. `.gitignore`: +2 lines. Net: ~211 lines of project code. Well under the 400-line chained-PR budget.

## T-005 — UserRepository MongoDB + bcrypt

### What landed
- `src/lib/db/models/user.ts` — Mongoose `IUser` interface + `UserModel` using `UserSchema` with email (unique, lowercase, trim), passwordHash, role (enum: suscriptora/productora/admin, default: suscriptora), timestamps. Exports `UserModel` as singleton (prevents re-registration warning).
- `src/lib/db/repository/user.ts` — `createUserRepository()` factory returning `UserRepository` interface. Uses Mongoose for all persistence. First-user-admin rule: `countDocuments() === 0` -> role: admin, else suscriptora. Email validation (regex), password validation (min 8 chars), bcrypt hash (salt 10). Functions: create, findByEmail, findById, verifyPassword, count, updateRole.
- `tests/user-repository.test.ts` — 15 TDD assertions across 5 suites: create (hashed password, first-user-admin, subsequent-suscriptora, email normalization, duplicate rejection, password length, email format), findByEmail (found, case-insensitive, null), verifyPassword (correct, wrong), count (0, N), updateRole. Uses `mongodb-memory-server` for isolated MongoDB instance per test.
- `package.json` — deps: `mongoose`, `next-auth`; devDeps: `mongodb-memory-server`.

### Verification
- `npx vitest run tests/user-repository.test.ts` — 15/15 passed. 12.56s test time.
- TDD order respected: tests written first (Red), then implementation made them Green.
- `npm run build` — still 4/4 static pages.

### Decisions / infra notes
- **Mongoose over JsonStore** — original T-005 used JsonStore + bcryptjs (built on T-004). GGA rejected the commit as a violation of the project stack (MongoDB mandated, not JSON file store). Reimplemented using Mongoose to align with AGENTS.md stack requirements.
- **`mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema)`** — Next.js hot-reloads in dev; without this guard, `mongoose.model('User')` would throw "Cannot overwrite model" on the second hot-reload. The singleton pattern prevents it.
- **`role: Role` enum validation** — Mongoose enum validator ensures only valid roles enter the DB. Undefined roles would throw a Mongoose ValidationError, not a silent bad state.
- **bcrypt with salt 10** — industry standard. Salt rounds beyond 12 are too slow for this use case; 10 is the sweet spot for 2024.
- **first-user-admin via `countDocuments() === 0`** — checked at create time. Could be a DB trigger or a separate bootstrap step in the future, but at this project scale the in-app check is sufficient and visible in tests.

### Outstanding risks
- `mongodb-memory-server` adds significant test startup time (~8-12s per suite). Acceptable for now; if TDD feedback loop degrades significantly, consider a Jest-level setup with `mongodb-memory-server-global` for reuse across tests.

### Bundle size
- `src/lib/db/models/user.ts`: 31 lines. `src/lib/db/repository/user.ts`: 115 lines. Test: +121 lines. Net: ~267 lines. Under 400-line budget.

## T-006 — NextAuth Credentials Provider

### What landed
- `src/lib/auth/options.ts` — NextAuth configuration with `CredentialsProvider`. Authorize callback finds user by email via UserRepository, verifies password with bcrypt, returns user object (id, email, role) or null. JWT callback injects `id` and `role` into token. Session callback exposes them on `session.user`. Custom pages: `signIn` and `error` both point to `/login`. Session strategy is `jwt`.
- `src/lib/auth/types.d.ts` — TypeScript module augmentation extending `Session`, `User`, and `JWT` interfaces to include `id: string` and `role: string` fields.
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler exporting GET and POST. Route is now visible in the Next.js route table as a dynamic server route.
- `tests/auth-credentials.test.ts` — 6 tests covering valid/invalid credentials, first-user-admin role, and session field expectations. Uses a fresh mock UserRepository per test.
- `.env` — `AUTH_SECRET` generated via Node.js `crypto.randomBytes(32).toString('base64')`. MongoDB and Google OAuth placeholders added for future tasks.

### Verification
- `npm run build` — 5/5 routes, includes new `/api/auth/[...nextauth]` as dynamic route.
- `npx vitest run` — 73/73 tests pass (6 new + 52 existing + 15 user-repo).
- Build output shows route table with `ƒ /api/auth/[...nextauth] 0 B` — confirmed registered.

### Decisions / infra notes
- **next-auth v4.24.14** — v5 is in beta; v4 is stable and compatible with Next.js 14 App Router.
- **jwt strategy over database sessions** — jwt is stateless and scales better. Database sessions would require a sessions collection and periodic cleanup. For this project size, jwt is sufficient.
- **`session.user.id` and `session.user.role`** — added via module augmentation so TypeScript knows about these fields throughout the app. Without augmentation, accessing `session.user.id` would be a type error.
- **`/login` as single auth page** — both `signIn` and `error` redirect to `/login`. T-007 will build that page with proper UI.
- **AUTH_SECRET in .env, never committed** — `.gitignore` excludes `.env`. Secret was generated locally; different environments will need their own secrets via `openssl rand -base64 32` or equivalent.

### Outstanding risks
- No runtime DB connection configured yet. NextAuth will use Mongoose via UserRepository. In production, `MONGODB_URI` needs to be set. In tests, `mongodb-memory-server` handles it.

### Bundle size
- `src/lib/auth/options.ts`: 55 lines. `src/lib/auth/types.d.ts`: 18 lines. Route: 5 lines. Test: +86 lines. Net: ~164 lines. Under 400-line budget.

## T-009 — Google OAuth Provider

### What landed
- `src/lib/auth/options.ts` — Added `GoogleProvider` from `next-auth/providers/google`. Configured with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from `.env`.
- **`signIn` callback** — Extended to handle Google OAuth: when `account.provider === 'google'`, checks if user exists via `UserRepository.findByEmail()`. If not found, creates the user via `UserRepository.create()` with a random UUID password (OAuth users don't use password login). First user becomes `admin` via existing T-005 rule.
- **`jwt` callback** — Extended to handle OAuth users: when `user.id` or `user.role` are missing (OAuth profile doesn't have them), looks up the user in database by email and adds `id` and `role` to the token.
- `src/app/(auth)/login/page.tsx` — Added "Continuar con Google" button below the credentials form. Uses `signIn('google', { callbackUrl })` from `next-auth/react`. Includes Google logo SVG and proper styling with glass-card design system.

### Verification
- `npm run build` — passes, login page bundle includes Google button.
- OAuth flow tested manually: Google redirects to `/api/auth/callback/google`, then to callback URL.

### Decisions / infra notes
- **OAuth users get random password** — `crypto.randomUUID()` generates an unguessable password. OAuth users can only sign in via Google, never via credentials form (they don't know the random password). This maintains the single-user-table design.
- **Email uniqueness enforced** — Google OAuth uses the same `UserRepository` which has unique email constraint. If a user registers via credentials first, then tries OAuth with the same email, `findByEmail` finds the existing user and doesn't create a duplicate.
- **First-user-admin rule works for OAuth too** — The first user to sign in via Google gets `admin` role because `UserRepository.create()` checks `countDocuments() === 0`.

### Outstanding risks
- **Google OAuth requires public redirect URI** — In development, `http://localhost:3000/api/auth/callback/google` must be added to Google Cloud Console authorized redirect URIs. In production, `https://botanicasob.duckdns.org/api/auth/callback/google` must be added.
- **OAuth users can't change password** — Since they have a random password, there's no "forgot password" flow for OAuth users. This is standard behavior; they should use Google account recovery.

### Bundle size
- `src/lib/auth/options.ts`: +28 lines (GoogleProvider + signIn callback + jwt logic). `src/app/(auth)/login/page.tsx`: +18 lines (button + divider). Net: ~46 lines. Under 400-line budget.

## T-011 — Landing Layout + Navbar

### What landed
- `src/app/page.tsx` — Full landing page structure with 9 placeholder sections (hero, productos, metodos, journal, glosario, olga, unete, redes, footer) ready for T-012-T-020. Includes sticky navbar offset padding.
- `src/components/landing/navbar.tsx` — Responsive glassmorphism navbar. Desktop: horizontal nav links + auth buttons. Mobile: hamburger menu with slide-down panel. Uses design tokens: `bg-surface/80`, `backdrop-blur-glass`, `border-surface-border`.

### Verification
- `npm run build` — passes, all routes render.
- Visual check: navbar sticks to top, glass effect works, mobile menu toggles.

### Decisions / infra notes
- **Anchor links for single-page navigation** — `#hero`, `#productos`, etc. Smooth scroll will be added in a future enhancement if needed.
- **Navbar uses 'use client'** — needs React state for mobile menu toggle. This is the only client component in the layout; all sections can be server components.
- **Placeholder sections** — Each section has a colored background alternating between `bg-surface` and `bg-surface-container` for visual rhythm. Real content comes in T-012+.

### Bundle size
- `src/app/page.tsx`: +60 lines. `src/components/landing/navbar.tsx`: +85 lines. Net: ~145 lines. Under 400-line budget.

## Blog implementation snapshot — current HEAD / worktree (`e9073df`)

### What is actually implemented
- `src/app/blog/page.tsx` connects to MongoDB via `connectToDatabase()`, builds a repository with `createArticleRepository()`, and reads the latest 2 published articles with `findLatestPublished(2)`.
- `src/components/blog/blog-homepage.tsx` renders the `/blog` welcome experience with a static welcome hero plus two recent published articles passed in from MongoDB.
- `src/app/blog/articulos/page.tsx` reads all published articles with `findAllPublished()` and renders the full published listing.
- `src/app/blog/[slug]/page.tsx` reads a single article by slug with `findBySlug()` and renders the detail page, returning `notFound()` when the slug does not exist.
- `src/components/blog/blog-navbar.tsx` and `src/components/blog/blog-footer.tsx` provide blog-specific chrome; the blog does **not** reuse the landing `Navbar`/`Footer` components.
- `src/app/admin/blog/page.tsx` is the current admin listing route, `src/app/admin/blog/nuevo/page.tsx` is the create form, and `src/app/api/admin/articles/route.ts` handles authenticated admin creation plus auto-publish.
- `src/lib/db/connect.ts`, `src/lib/db/models/article.ts`, and `src/lib/db/repository/article.ts` provide the MongoDB connection, Article model, and article repository abstraction used by the public and admin blog routes.
- Navigation flow is already wired to real routes: landing and blog links point to `/blog` or `/blog/articulos`, article cards point to `/blog/[slug]`, and admin shortcuts point to `/admin/blog` and `/admin/blog/nuevo`.

### Notes
- The earlier notes about `featured-article.tsx`, `MEDIUM_ARTICLES`, `SMALL_ARTICLES`, placeholder `#` links, and a future MDX swap are no longer accurate for the current HEAD and have been removed.
- `src/components/landing/diario.tsx` still shows three static landing cards; it is **not** yet backed by the MongoDB article repository.
- `src/lib/db/models/article.ts` currently declares `slug` as `unique: true` and also adds a manual `ArticleSchema.index({ slug: 1 })`; that duplicate-index warning cleanup remains pending.

### Remaining follow-ups (still pending)
- Edit/delete article management from the admin area.
- Make the landing `Diario Botánico` section read the latest 3 published articles dynamically.
- Comments, search, and category filtering for the blog remain unimplemented.
- Clean up the duplicate slug index warning in the article model.
