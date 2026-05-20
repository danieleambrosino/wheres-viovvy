# 🕵️ Where's Viovvy?

> **Find Viovvy hidden in a crowd of 350+ characters.** A "Where's Waldo?" style browser game built with vanilla TypeScript and Canvas.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellowgreen)](LICENSE)
![Game Map Size](https://img.shields.io/badge/Map-2400×2400px-blue)

## 🎮 Play Online

**Live Demo:** [here](https://danieleambrosino.github.io/wheres-viovvy/)

Or run locally:

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Procedural Scene Generation** | Each game creates a unique crowd with 350+ characters |
| **Pan & Zoom Navigation** | Drag to explore, pinch/scroll to zoom (0.14× – 4.8×) |
| **Paper Doll Characters** | Mix-and-match bodies, heads, hair, accessories, headwear |
| **Hit Detection** | Precise click detection on characters |
| **Visual Feedback** | Success/error overlays with positioned labels |
| **Responsive** | Scales to fit any viewport |
| **Subpath Deploy Support** | Works on GitHub Pages, Netlify, any base URL |

## 🏗️ Architecture

```
src/
├── main.ts          # App entry, state management, UI logic
├── engine.ts        # Scene generation, asset loading, collision
├── interaction.ts   # Panzoom wrapper, click handling
├── assetsConfig.ts  # Constants, manifest, layer definitions
├── style.css        # All styles
└── types/           # TypeScript declarations
```

### How It Works

1. **Asset Loading** — Load all SVG assets (background, target, paper doll parts) asynchronously
2. **Scene Generation** — Place target + 350 distractors with collision avoidance (38% max overlap)
3. **Z-Sorting** — Split distractors into foreground/background layers for proper depth
4. **Canvas Rendering** — Draw everything to a single `<canvas>` element
5. **Panzoom** — Wrap the canvas in `panzoom` for smooth navigation
6. **Hit Detection** — On click, find topmost character under cursor using bounds checking

## 🎨 Character Customization

The game generates characters from these layers:

```
┌─────────────┐
│  Headwear   │  ← none, red beanie, teal cap
├─────────────┤
│   Hair      │  ← black wave, brown curl, blonde bob, silver buzz
├─────────────┤
│    Head     │  ← fair, olive, deep skin tones
├─────────────┤
│   Face      │  ← none, round glasses, beard
├─────────────┤
│    Body     │  ← blue overall, green hoodie, orange cardigan, cream jacket
└─────────────┘
```

Add new assets by placing SVG files in `public/assets/` and updating `assetsConfig.ts`.

## 🛠️ Development

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |

### Adding New Character Parts

1. Create SVG at `120×150px` in `public/assets/`
2. Add path to `assetsConfig.ts` under appropriate layer
3. The engine automatically picks up new assets

### Deployment

The game uses `import.meta.env.BASE_URL` for all asset paths, making it work under any subpath:

```bash
# GitHub Pages example
npm run build
# Deploy dist/ to gh-pages branch
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires Pointer Events and Canvas API.

## 🤝 Contributing

Contributions welcome! Areas to help:

- [ ] Add unit tests (`engine.ts` has pure functions ideal for testing)
- [ ] Integration tests for click detection
- [ ] Accessibility audit (screen reader testing)
- [ ] New character assets
- [ ] Sound effects
- [ ] Difficulty levels (more/fewer distractors)

## 🙏 Acknowledgments

- [panzoom](https://github.com/timmywil/panzoom) — Smooth pan/zoom for the game map
- [Vite](https://vitejs.dev/) — Fast dev experience and optimized builds
- All the SVG artists who created the character parts

---

<div align="center">

**Made with ☕ and TypeScript**

_"She's somewhere in this crowd..."_

</div>
