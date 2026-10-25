---
name: clean-dashboard-typography-and-micro-design
description: A practical design skill for creating clean, premium SaaS dashboards with refined typography and micro-design.
---

# Typography & Micro-Design Skill: Clean SaaS Dashboard

## 1. Visual Direction
Create a calm, modern analytics interface with a premium product feel:
- **Overall mood:** minimal, polished, friendly, data-rich, and easy to scan.
- **Canvas:** warm off-white or very light cool gray (`#F2F3F0`).
- **Surfaces:** white cards (`#FFFFFF`) with generous rounding (`24--32 px`) and subtle separation from the background.
- **Accent:** vivid lime/leaf green (`#A8F000`, `#28B900`) for key metrics, charts, active states, and highlights.
- **Contrast:** near-black primary text (`#171917`), soft gray secondary text (`#858A85`), restrained borders (`#E7E9E5`).
- **Density:** show useful information without crowding; leave deliberate breathing room.

Use the reference as inspiration, not as a pixel-perfect template. Prioritize legibility and hierarchy.

## 2. Typography System

### Recommended Font Families
Choose one family and use it consistently across the product:
- **Primary:** Inter — crisp, neutral, highly legible UI typography.
- **Alternatives:** Manrope for a slightly friendlier geometric feel; Geist for a contemporary product interface; Plus Jakarta Sans for a polished, rounded tone.
- **Fallback:** `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.

Avoid mixing several expressive fonts in a data-heavy dashboard. Use a single sans-serif family for most UI text.

### Type Scale

| Role | Desktop size | Weight | Line height | Usage |
|---|---|---|---|---|
| **Page title** | 32–40 px | 650–750 | 1.1–1.2 | Main page heading |
| **Section** | 20–24 px | 600–700 | 1.25 | Card or section heading |
| **Card title** | 15–18 px | 550–650 | 1.3 | Widget headings |
| **Body** | 14–16 px | 400–500 | 1.45–1.6 | Main interface copy |
| **UI label** | 12–14 px | 450–550 | 1.3–1.4 | Tabs, filters, chart labels |
| **Caption / helper** | 11–12 px | 400–500 | 1.35–1.45 | Metadata and hints |
| **KPI value** | 28–40 px | 600–700 | 1.0–1.15 | Important figures |
| **Table value** | 13–14 px | 450–550 | 1.4 | Dense data |

### Typography Rules
- Establish hierarchy with size, weight, and color, not with many different typefaces.
- Use near-black (`#171917`) for primary text and muted gray (`#858A85`) for secondary text.
- Keep paragraph and interface copy comfortable to read; avoid tiny text for essential information.
- Use tabular numerals for aligned metrics and financial values: `font-variant-numeric: tabular-nums`.
- Use medium weights for compact labels; reserve bold weights for headings and important values.
- Use sentence case for navigation and labels. Avoid unnecessary all-caps.
- Keep letter spacing close to neutral. Use only subtle negative tracking on large headings if the font benefits.
- For chart labels, prefer clarity over decoration and maintain sufficient contrast.

## 3. Color Tokens

| Token | Suggested value | Purpose |
|---|---|---|
| `App background` | `#F2F3F0` | Soft neutral canvas |
| `Card surface` | `#FFFFFF` | Main content cards |
| `Primary text` | `#171917` | Titles and important content |
| `Secondary text` | `#858A85` | Supporting labels |
| `Subtle border` | `#E7E9E5` | Dividers and outlines |
| `Accent lime` | `#A8F000` | Highlights and chart accents |
| `Deep green` | `#28B900` | Active data visualization |
| `Pale green` | `#EAF8D7` | Soft badges and backgrounds |
| `Black control` | `#080908` | Strong icon buttons or selected controls |

Keep green purposeful. Do not use it for every element; reserve it for selected states, growth, and important data. Check contrast for text placed over bright green.

## 4. Layout, Spacing, and Shape
Use a simple spacing scale based on 4 px:
- `4 px`: icon-to-label micro-gap
- `8 px`: tight control spacing
- `12 px`: compact internal spacing
- `16 px`: standard content gap
- `24 px`: card padding or section gap
- `32 px`: major grouping gap
- `40–48 px`: page-level breathing room

Suggested shapes:
- **Cards:** 24–32 px corner radius for large dashboard panels.
- **Pills and chips:** fully rounded ends (`border-radius: 999px`); 12–16 px horizontal padding.
- **Icon buttons:** 40–48 px square hit area, with a clear hover/focus state.
- **Inputs and tabs:** consistent heights and alignment.
- **Borders:** use thin, low-contrast lines only where they improve structure.

Use a consistent grid and align card edges, headings, metrics, and chart baselines. Avoid arbitrary spacing values unless the layout requires them.

## 5. Small Design Elements (Micro-UI)

### Navigation Pills
- Use compact rounded pills for top-level navigation and filters.
- **Selected pill:** near-black background with white text and a simple icon.
- **Unselected pill:** white or pale neutral surface with dark text.
- Keep icon size around 14–16 px and align icon and label optically.

### Metric Chips and Status Badges
- Use pale green for positive or selected states, not as a default for every badge.
- Pair a small icon or dot with a short label.
- Keep labels concise and use 11–13 px type.
- Never rely on color alone to communicate status.

### Avatars and Collaborator Tags
- Use small circular portraits (roughly 24–32 px) beside a short name label.
- Place the avatar and name inside a subtle pill where collaboration context matters.
- Keep these tags secondary so they do not compete with the card title or KPI.

### Icon Buttons
- Prefer simple, consistent line icons.
- Use 16–20 px glyphs in a 40–48 px click target.
- A dark circular button can create emphasis, but use it sparingly.
- Provide accessible labels, visible keyboard focus, and hover feedback.

### Cards
- Use a white surface, generous padding, and a clear title-to-content hierarchy.
- Prefer subtle contrast or a very soft shadow over heavy borders.
- Keep the card title and controls in a stable header row.
- Avoid excessive shadows, gradients, and decorative effects.

### Charts and Data Labels
- Use thin, clean axes and lightly drawn guide lines.
- Highlight one key series or value in green; use neutrals for supporting data.
- Put the metric and its context close together, for example a large value plus a small comparison label.
- Avoid overly small labels, ambiguous symbols, and unnecessary chart ornament.
- For funnel charts, show each stage label and value clearly, with consistent alignment.
- Do not use green alone to signal good performance if the data meaning is not actually positive.

### Tables
- Keep table headings small and muted but readable.
- Use comfortable row height and aligned numeric columns.
- Use tabular numerals for amounts and right-align numeric values.
- Use a pale pill for a meaningful attachment, ID, or status—not for every cell.
- Use separators sparingly.

### Tiny Decorative Details
- Use small dots, thin connector lines, understated dividers, and minimal chart markers.
- Keep decorative details at low contrast so content remains the focus.
- Use one consistent icon style throughout.
- Avoid random ornaments that do not communicate hierarchy, state, or relationships.

## 6. Interaction and Accessibility
- Provide visible hover, pressed, selected, disabled, and keyboard-focus states.
- Keep interactive targets comfortably large, even when the visible icon is small.
- Maintain readable contrast for text and icons.
- Do not communicate status through color alone; add labels, symbols, or accessible text.
- Respect reduced-motion preferences if using transitions.
- Use animation only to clarify a state change; keep it short and subtle.

## 7. Responsive Behavior
- Reduce page-title size and card padding on narrow screens.
- Stack dashboard cards into a single column when a multi-column layout becomes cramped.
- Keep KPI values prominent but prevent them from overflowing.
- Allow navigation pills to scroll or wrap rather than shrinking labels to unreadable sizes.
- Preserve a clear hierarchy between headings, values, labels, and metadata at every breakpoint.

## 8. Implementation Starter Tokens
```css
:root {
  --color-bg: #F2F3F0;
  --color-surface: #FFFFFF;
  --color-text: #171917;
  --color-muted: #858A85;
  --color-border: #E7E9E5;
  --color-accent: #A8F000;
  --color-green: #28B900;
  --color-green-soft: #EAF8D7;
  --color-black-ctrl: #080908;

  --font-sans: Inter, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;

  --radius-card: 28px;
  --radius-control: 999px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

## 9. Quality Checklist
Before shipping a design, check:
- [ ] One coherent sans-serif family is used consistently.
- [ ] Headings, labels, body copy, and KPIs have distinct hierarchy.
- [ ] Text remains readable at normal zoom and on smaller screens.
- [ ] Cards share consistent radii, padding, and alignment.
- [ ] Green is an accent, not a substitute for hierarchy.
- [ ] Pills, badges, avatars, and icon buttons are visually consistent.
- [ ] Numbers align cleanly and use tabular numerals where useful.
- [ ] Charts remain understandable without decorative effects.
- [ ] Contrast, focus states, and touch targets are accessible.
- [ ] Every small design element serves a purpose.
