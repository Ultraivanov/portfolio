# Portfolio Architecture

## Overview
Personal portfolio site for Product Designer. Next.js App Router, deployed to Vercel.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI Library:** Gravity UI (@gravity-ui/uikit)
- **Styling:** CSS Modules
- **Deployment:** Vercel (auto-deploy from main branch)
- **Content:** Static JSON files in `/src/content/`

## Directory Structure

```
/Users/dmitryivanov/Documents/Portfolio/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── cases/[slug]/       # Case study dynamic routes
│   │   ├── contact/            # Contact page
│   │   ├── page.tsx            # Homepage
│   │   └── layout.tsx          # Root layout with providers
│   ├── components/
│   │   ├── case/               # Case study components
│   │   ├── case-list/          # Case list/grid components
│   │   ├── home/               # Homepage components
│   │   └── ClientProviders.tsx # Gravity UI theme provider
│   ├── content/
│   │   ├── cases/              # Case study JSON files
│   │   ├── templates/          # Content templates
│   │   ├── cases.ts            # Case loader utilities
│   │   ├── contact.ts          # Contact page content
│   │   └── home.json           # Homepage content
│   └── lib/
│       ├── content/              # Content parsing utilities
│       └── analytics.ts          # Analytics helpers
├── public/
│   ├── cases/                  # Case study images
│   │   ├── rzd/                # RZD case images
│   │   ├── megamod/            # Megamod case images
│   │   └── ...
│   └── home/                   # Homepage assets
├── next.config.ts              # Next.js config (no static export)
└── package.json
```

## Content System

### Case Studies
Location: `src/content/cases/[slug].json`

Structure:
```json
{
  "slug": "case-slug",
  "title": "Case Title",
  "subtitle": "Short description",
  "coverSrc": "/cases/[slug]/cover.png",
  "facts": [...],
  "sections": [
    {
      "title": "Section Name",
      "blocks": [
        { "discriminant": "paragraph", "value": { "text": "..." } },
        { "discriminant": "media", "value": { "src": "...", "alt": "...", "caption": "..." } },
        { "discriminant": "list", "value": { "items": [...] } }
      ]
    }
  ]
}
```

### Block Types
- `paragraph` — текстовый блок
- `media` — изображение/диаграмма (SVG/PNG)
- `list` — маркированный список

## Image Handling

### Formats
- **Diagrams:** SVG (16:9), responsive scaling
- **Screenshots:** PNG (16:9)
- **Mobile:** pinch-to-zoom, no separate 3:4 versions needed

### Location
All case images: `public/cases/[case-slug]/`

### Responsive Strategy
- CSS: `max-width: 100%`, `height: auto`
- Complex diagrams zoomable on mobile
- 16:9 aspect ratio maintained

## Deployment

### Platform: Vercel
- **Auto-deploy:** Push to `main` → automatic build & deploy
- **Preview:** Every PR gets preview URL
- **Production:** `ginzburg.work` (custom domain)

### Build Process
```bash
npm run build  # Next.js build (not static export)
```

### Environment
- No special env vars required for basic functionality
- Analytics optional

## Workflow

### Repository Protection
**Critical:** Project uses `Ultraivanov/portfolio` repository only.

**Local Protection:** Git pre-push hook automatically checks remote URL.
```bash
# If you see this error on push:
# ❌ ERROR: Wrong remote repository!
# Fix with:
git remote set-url origin https://github.com/Ultraivanov/portfolio.git
```

**CI Protection:** GitHub Action verifies repository on every push/PR.

### Adding Content
1. Add images to `public/cases/[slug]/`
2. Update `src/content/cases/[slug].json`
3. Commit & push to main
4. Vercel auto-deploys (~1-2 min)
5. Check `ginzburg.work`

### Content Updates
- JSON schema validated at runtime
- Images must exist before JSON references them
- Use `variant: "full"` for wide images, `"diagram"` for SVGs

## Key Conventions

### Design Principles (from AGENTS.md)
- Product-first, not visual-first
- Minimal/brutalist direction
- Gravity UI base with custom styling
- No over-animation
- Content-driven architecture

### Code Style
- Strict TypeScript
- Small composable components
- CSS Modules for styling
- No hardcoded large text blocks

## Snapshots

After major changes, update memory with:
- Current content state
- Recent image additions
- Deployment status
- Pending tasks
