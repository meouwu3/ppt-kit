# Architecture

## Product boundary

One repository template produces one standalone deck per conversation. The generated deck has no login, talk registry, list page, SSR, router, worker, or deployment dependency.

The distributable unit is the self-contained `skills/ppt` directory. Its generator copies `assets/template`; it never reaches into the repository parent, so a skills.sh installation works by itself.

## Layers

1. `deck.config.ts` defines metadata and eagerly discovers slide modules
2. `DeckPlayer` owns page, click, keyboard, overview, presenter sync, and export state
3. `SlideShell` maps a fixed 1280x720 coordinate system into the current viewport
4. `ClickScope` accounts for ordered and explicit click steps
5. components consume semantic theme tokens and expose a deterministic print branch
6. `DeckOverlayHost` keeps shared elements outside the keyed page transition while staying inside the fixed canvas
7. the export CLI loads the SPA once per worker and switches pages through an explicit browser API

## Slide contract

Each module exports a default React component plus optional `meta` and `notes`. `meta.id` is the durable identity used by automation and cross-page overlays. `meta.section` drives section ranges. Generated starter slides use `meta.template = true`; final export rejects them until the author replaces or removes them. File order is presentation order; page numbers are derived and never used as identity.

## Overlay contract

`deck.overlay` receives page and print state. The host is mounted after the page content but outside the keyed page transition, so the same DOM element can animate between canvas coordinates without being recreated. `SharedElement` maps stable slide IDs to deterministic frames; `SharedElementPlaceholder` reserves page layout without drawing a duplicate; `SharedTitleFlight` packages the common section-title-to-content-title route. The built-in section and content layouts use fixed title tracks so those frames do not drift with local font metrics. Overview and presenter previews render separate print-mode instances at their exact static targets.

## Export protocol

`?print=1` exposes `window.__PPT_EXPORT__`:

- `manifest` returns deck and slide metadata
- `show(page)` switches the rendered slide, waits for fonts, images, and two frames, then returns an audit
- `audit()` inspects the current slide without changing it

Playwright pages reuse that one loaded application and process slide batches concurrently. PNG files are the source of both PDF and PPTX, so every delivery format has the same pixels. Every export also writes `contact-sheet.html` from the selected PNG pages for visual-sequence review.

## Security

Preview binds to `127.0.0.1`, not all network interfaces. Generated decks and internal assets remain local unless the user explicitly chooses a deployment destination. Removing the old password gate does not imply public hosting.
