# PPT repository

This repository is both a runnable Vite presentation engine and the source of a self-contained skill distributed through skills.sh. Keep the root project independently runnable and keep `skills/ppt` installable without its parent directory.

## Commands

- `pnpm dev` - local preview on 127.0.0.1:4173
- `pnpm check` - lint, tests, and production build
- `pnpm export` - PNG, PDF, and PPTX export
- `pnpm create-ppt -- --title "Title"` - create an independent project
- `pnpm sync-skill` - refresh the template bundled inside `skills/ppt`

## Invariants

- Treat `src/deck/**`, export scripts, and base runtime behavior as stable infrastructure. Change them only for an explicit runtime task
- Author deck content in `src/slides/`, `src/assets/`, theme tokens, and topic-specific components
- Never fabricate real-world facts, numbers, people, clients, quotes, results, or sources
- Preserve the fixed 1280x720 canvas, deterministic print branch, stable `meta.id`, local assets, and reproducible export
- Final delivery must contain no template slides, Todo, overflow, missing assets, console errors, or build failures
- Do not reskin starter slides or leave sample data, personal signatures, or demo-specific copy in generated projects

## Creative defaults

- Read `skills/ppt/references/design-process.md` for new decks and redesigns
- Use task modes and design references as starting points, not universal style rules
- Let the user's materials, audience, brand, and chosen visual direction override house-style defaults
- Components are a floor, not a ceiling; build topic-specific visuals when the story needs them
- Use NumberFlow, shared elements, characters, plum backgrounds, cards, serif typography, and other specialty treatments only when they serve the current deck
- Ask only consequential questions; continue low-risk drafts with visible assumptions instead of blocking unnecessarily

## Maintenance

- Bind local preview to 127.0.0.1 unless explicitly asked otherwise
- Do not add authentication, a talk list, SSR, a router, or deployment to the template
- Run `pnpm sync-skill` after changing root runtime, components, styles, scripts, or tests
- Never install dependencies or build inside `skills/ppt/assets/template`; validate through a fresh generated project under `/tmp`
