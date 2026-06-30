# Skill Registry — Botánica Esencial OB

> Index of available skills for this project. SKILL.md files are the source of truth; this file is only an index.

## Project Convention Files

| File | Purpose |
|------|---------|
| `C:\IA_Solutions\proyectos\todoApp\olga-app\AGENTS.md` | Agent rules, stack, workflow, commit conventions |
| `C:\IA_Solutions\proyectos\todoApp\olga-app\README.md` | Project overview and next steps |
| `C:\IA_Solutions\proyectos\todoApp\olga-app\ideas\designUI\CONTEXTO_PLATAFORMA.md` | Source of truth for product context |

## Available Skills

| Skill | Trigger / Description | Scope | Path |
|-------|----------------------|-------|------|
| branch-pr | Create Gentle AI pull requests with issue-first checks | user | `C:\Users\migue\.config\opencode\skills\branch-pr\SKILL.md` |
| chained-pr | PRs over 400 lines, stacked PRs, review slices | user | `C:\Users\migue\.config\opencode\skills\chained-pr\SKILL.md` |
| cognitive-doc-design | Writing guides, READMEs, RFCs, onboarding, architecture docs | user | `C:\Users\migue\.config\opencode\skills\cognitive-doc-design\SKILL.md` |
| comment-writer | PR feedback, issue replies, reviews, Slack messages | user | `C:\Users\migue\.config\opencode\skills\comment-writer\SKILL.md` |
| go-testing | Go tests, coverage, Bubbletea teatest, golden files | user | `C:\Users\migue\.config\opencode\skills\go-testing\SKILL.md` |
| issue-creation | Create GitHub issues, bug reports, feature requests | user | `C:\Users\migue\.config\opencode\skills\issue-creation\SKILL.md` |
| judgment-day | Dual review, adversarial review, juzgar | user | `C:\Users\migue\.config\opencode\skills\judgment-day\SKILL.md` |
| openpencil-design | Designing UI with OpenPencil / PenNode DSL | user | `C:\Users\migue\.config\opencode\skills\openpencil-design\SKILL.md` |
| skill-creator | New skills, agent instructions, AI usage patterns | user | `C:\Users\migue\.config\opencode\skills\skill-creator\SKILL.md` |
| skill-improver | Audit and upgrade existing LLM-first skills | user | `C:\Users\migue\.config\opencode\skills\skill-improver\SKILL.md` |
| work-unit-commits | Plan commits as reviewable work units | user | `C:\Users\migue\.config\opencode\skills\work-unit-commits\SKILL.md` |

## Skipped Skills

- `sdd-*` skills (managed by SDD orchestration)
- `_shared` (shared references, not a runtime skill)
- `skill-registry` (this index itself)

## Registry Contract

- Read the full `SKILL.md` before applying a skill.
- Prefer project-level skills over user-level skills when names collide.
- This registry was generated from the first matching source in the standard scan order.
