# Blog Platform Specification

## Purpose

Define the registered-only blog for Botánica Esencial OB: article listing, article view, and admin-authored MongoDB-backed articles for Fase 1. Category filtering and comments are explicitly deferred and out of scope for this phase by product decision.

## Requirements

### Requirement: Registered-only access

The blog MUST be accessible only to authenticated users.

#### Scenario: Anonymous user blocked

- GIVEN an unauthenticated user requests `/blog`
- WHEN the request is processed
- THEN the user is redirected to `/login` with a return URL

#### Scenario: Authenticated user granted access

- GIVEN an authenticated user requests `/blog`
- WHEN the request is processed
- THEN the blog listing page is rendered

### Requirement: Static seed articles

The system MUST provide at least four static seed articles for Fase 1, distributed across the `Recursos` and `Blog` categories.

#### Scenario: Seed content loaded

- GIVEN the blog is initialized
- WHEN the article list is requested
- THEN at least four articles are available with title, featured image, category, author, date, and content

### Requirement: Article listing

The blog listing page MUST display article cards with title, featured image, category, author, date, and excerpt.

#### Scenario: Listing renders

- GIVEN an authenticated user visits `/blog`
- WHEN the page loads
- THEN all seed articles are displayed as cards

### Requirement: Category filter deferred for Fase 1

The system MUST NOT expose category filtering UI or behaviour in Fase 1. The article listing page renders all published articles regardless of category. Filtering by `Recursos` / `Blog` is explicitly deferred to a future blog enhancement.

#### Scenario: Article listing renders without category filter

- GIVEN articles exist in both categories
- WHEN an authenticated user visits `/blog/articulos`
- THEN all published articles are displayed and no category filter UI is present

### Requirement: Article view

The system MUST render a complete article page for each article slug.

#### Scenario: Open article

- GIVEN an authenticated user navigates to `/blog/{slug}`
- WHEN the page loads
- THEN the title, featured image, content, author, date, category, and tags are displayed

### Requirement: Comments deferred for Fase 1

The Fase 1 blog MUST remain comment-free. Comment submission, display, and moderation are explicitly out of scope until a future change reopens them.

#### Scenario: Article renders without comments UI

- GIVEN an authenticated user opens a blog article
- WHEN the page is rendered
- THEN the article content is shown without comment form, comment list, or moderation controls

### Requirement: Landing blog preview

The landing page Journal section MUST display the three latest blog article previews.

#### Scenario: Preview populated

- GIVEN seed articles exist
- WHEN the landing page is rendered
- THEN the Journal section shows the three most recent articles
- AND anonymous visitors see a registration prompt instead of direct links to `/blog`
