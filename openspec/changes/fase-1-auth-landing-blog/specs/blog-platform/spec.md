# Blog Platform Specification

## Purpose

Define the registered-only blog for Botánica Esencial OB: article listing, category filtering, article view, comments, and static seed content for Fase 1.

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

### Requirement: Category filter

The system MUST allow filtering the article list by the categories `Recursos` and `Blog`.

#### Scenario: Filter by one category

- GIVEN articles exist in both categories
- WHEN the user selects the `Recursos` filter
- THEN only articles with category `Recursos` are displayed

#### Scenario: Show all categories

- GIVEN a category filter is active
- WHEN the user clears the filter
- THEN all articles are displayed again

### Requirement: Article view

The system MUST render a complete article page for each article slug.

#### Scenario: Open article

- GIVEN an authenticated user navigates to `/blog/{slug}`
- WHEN the page loads
- THEN the title, featured image, content, author, date, category, and tags are displayed

### Requirement: Comments for registered users

Authenticated users MUST be able to add comments to an article.

#### Scenario: Post a comment

- GIVEN an authenticated user views an article
- WHEN the user submits a non-empty comment
- THEN the comment is saved and displayed with the author's name and timestamp

#### Scenario: Empty comment rejected

- GIVEN an authenticated user submits an empty comment
- WHEN the form is validated
- THEN the comment is rejected and an error message is shown

### Requirement: Comment moderation

The author of a comment or an admin MUST be able to delete it.

#### Scenario: Delete own comment

- GIVEN an authenticated user has previously posted a comment
- WHEN the user chooses to delete it
- THEN the comment is marked as deleted and no longer rendered

### Requirement: Landing blog preview

The landing page Journal section MUST display the three latest blog article previews.

#### Scenario: Preview populated

- GIVEN seed articles exist
- WHEN the landing page is rendered
- THEN the Journal section shows the three most recent articles
- AND anonymous visitors see a registration prompt instead of direct links to `/blog`
