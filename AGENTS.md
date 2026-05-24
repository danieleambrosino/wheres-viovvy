# AGENTS.md — Where's Viovvy?

## Commands
- **Dev:** `npm run dev`
- **Build:** `npm run build`
- **Preview:** `npm run preview`
- **No lint/typecheck scripts exist yet** — do not add them unless asked

## Style
- TypeScript only, no `any`, no `as` casts unless unavoidable
- Strict interfaces, use `type` for unions
- `camelCase` for variables/functions, `PascalCase` for types
- Arrow functions, no `function` keyword
- Explicit returns (no implicit undefined)
- No JSDoc/comments unless the user asks for them
- Use `const` for constants/objects, `let` only for mutating primitives

## Architecture
- `main.ts` — app entry, state machine, DOM refs, click handler
- `engine.ts` — asset loading, scene generation, collision, hit regions
- `interaction.ts` — panzoom wrapper, pointer events, resize handling
- `assetsConfig.ts` — constants, layer types, asset manifest
- `utils.ts` — generic utilities (randomInt, randomChoice, loadImage)
- **Don't cross module boundaries.** Scene logic stays in engine, UI stays in main.
- **No frameworks.** The app uses vanilla TS + canvas.

## State Management
- Module-level mutable variables in `main.ts` (`currentState`, `currentHitRegions`, etc.)
- Use the `STATE` const-object pattern for state enum — `{ loading, playing, victory, error }`
- Always `setState()` through the helper, never mutate refs directly

## Accessibility
- Use `aria-live="polite"` on status regions
- Use `aria-label` on interactive areas
- Always toggle `hidden` attribute, not just CSS display
- Use semantic HTML elements

## Scene Generation
- Always call `clearScene()` before generating a new round
- Always call `currentInteraction.destroy()` before replacing the canvas
- Always set `isGenerating = true` guard at start of `startRound()`

## Assets
- New SVGs must be 120×150px in `public/assets/`
- Register in `ASSET_MANIFEST` under the correct `PaperDollLayer`
- Use `randomChoice()` to pick assets — never select manually
- Use `import.meta.env.BASE_URL` for all asset paths
- Layer order: background → bodies → heads → hairs → faceAccessories → headwear

## Variable/id naming
- DOM IDs: `kebab-case` (e.g. `#regenerate-button`, `#hit-feedback-template`)
- CSS classes: `kebab-case` (e.g. `hit-feedback--below`, `is-dragging`)
- Ref object keys: `camelCase` matching the stripped ID (e.g. `regenerateButton`, `hitFeedbackTemplate`)

## Module Layout
- "Newspaper style" ordering: setup first (imports, types, constants, module-level state), then functions in top-down dependency order — most public/abstract at the top, internal helpers below
- This means each module reads like an article: the reader learns what it does upfront, then digs into details progressively
