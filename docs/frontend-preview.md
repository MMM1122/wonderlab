# Wonder Lab

*A personal experiment in curiosity.*

Wonder Lab is a bilingual personal website for thoughts, perspectives, discoveries, and recommendations that do not fit neatly into one category. It is a place to collect ideas, follow unexpected connections, and share the things that make everyday life feel a little stranger and more interesting.

This first upload is an **offline frontend preview**. It introduces the visual design, opening sequence, and browsing experience. The complete publishing and community experience is still in development.

## The idea

I wanted Wonder Lab to feel like stumbling into another world: curious, dreamlike, and a little psychedelic.

The entrance follows a long-haired young explorer into a forest. She approaches a cave, loses her footing, and falls into an unfamiliar world of glowing mushrooms and impossible scenery. That accidental discovery reflects the spirit of the project: an interesting thought often begins with an unexpected turn.

Beyond the entrance, mathematical geometry brings structure to the dreamlike setting. Torus wireframes, golden-angle patterns, and looping curves explore the relationship between imagination and order.

The site brings together three ideas:

- **Curiosity without a fixed category.** Personal reflections, unusual questions, and favorite discoveries belong in the same space.
- **Mathematics as a visual language.** Geometry becomes part of the reading experience, rather than a decorative background alone.
- **An atmosphere you can choose to enter.** Animation and optional ambient sound create a sense of place, with controls to skip the introduction or leave the sound off.

## What this preview includes

- A Chinese / English interface and bilingual sample articles.
- An animated forest entrance with a long-haired explorer.
- A fantasy mushroom landscape and a dark, luminous visual theme.
- Procedurally generated SVG geometry on article covers.
- Article categories and a reading dialog.
- Optional ambient audio with volume control.
- Responsive layouts and support for reduced-motion preferences.

The articles are placeholders for future writing. The preview does **not** store new posts, accounts, or visitor messages. Writing and sign-in links currently lead to the original hosted version; they are not a backend for this standalone file.

## Architecture

The wider project uses one shared interface with separate builds for the hosted application and the static preview.

```text
Shared frontend — React + TypeScript
│
├── Main page
│   ├── Language and category controls
│   ├── Article cards and reading dialog
│   └── Writing and guestbook interfaces
│
├── Opening sequence — scene state + CSS animation
├── Mathematical artwork — computed SVG paths and points
├── Ambient sound — Web Audio API
│
└── Build targets
    ├── Static export — Vite
    │   ├── Standalone HTML with embedded resources
    │   └── GitHub Pages files with separate assets
    │
    └── Hosted application — Vinext + Vite
        └── Cloudflare Worker
            ├── /api/lab — article and guestbook operations
            ├── Platform-provided sign-in identity
            └── Cloudflare D1 — posts, comments, and owner records
```

### Frontend

React manages the interface and interaction state. TypeScript describes the data and component contracts. Tailwind CSS, reusable UI primitives, and custom styles provide the layout and visual treatment.

The main page coordinates language selection, article filtering, reading, and editing. The opening sequence, geometry, and audio are separate components.

### Motion, geometry, and sound

The explorer uses an eight-frame sprite sheet. CSS switches between poses while moving the character through the scene. Timed scene changes coordinate the forest, cave, fall, and arrival. This is a 2D animated sequence; it does not use a 3D character or physics engine.

The geometric covers are generated from mathematical coordinates and rendered as SVG. Ambient audio is synthesized in the browser with oscillators, volume envelopes, and delay effects, rather than streamed from a recorded song.

The illustrated forest, mushroom world, and character artwork were generated with AI image tools. The character sheet was processed to remove its background.

### Data and publishing

The hosted edition has an API and a D1 database for articles, guestbook messages, and the site owner's identity. Drizzle defines the database schema and migrations; the current API uses parameterized SQL for its operations.

Articles have separate Chinese and English fields. Translation is manually authored, with a fallback to the original text. The guestbook is currently site-wide, rather than attached to individual articles.

These server capabilities are **not included in the offline preview**. Connecting an independently deployed frontend to authentication and persistent content is part of the remaining work.

## Opening the preview

Download the HTML file from this repository and open it in a modern browser. Its scripts, styles, and images are embedded, so no installation or local server is required.

The introduction starts after its images load. You can skip it, replay it from the page header, switch languages, browse the sample entries, and turn on the ambient sound.

GitHub's file viewer displays HTML source rather than running the website. To publish the preview as a website, use GitHub Pages with an `index.html` entry file. The separate Pages export uses relative asset paths so it can also run under a repository subdirectory.

The source architecture above describes the wider project; this initial upload may contain only the compiled preview and this README.

## Still working on...

- Smoother character movement and more expressive transitions.
- Refining the forest-to-fantasy-world opening sequence.
- Replacing sample entries with original bilingual writing.
- Connecting the independently deployed site to a secure publishing workflow.
- Persistent visitor messages and guestbook moderation.
- Further mobile, accessibility, and performance improvements.

**Still working on the story, the movement, and the little details that make this world feel alive.**
